const FinancingRequest = require('../models/FinancingRequest');
const RepaymentRecord = require('../models/RepaymentRecord');
const PSPProfile = require('../models/PSPProfile');
const contractService = require('../services/contractService');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

/**
 * Repayment Agent - Processes PSP repayments and restores credit lines
 * Triggered when PSP repays a financing request
 */

/**
 * Process a repayment for a financing request
 * @param {string} requestId - FinancingRequest ID
 * @param {object} repaymentData - Repayment details from blockchain or manual input
 */
async function processRepayment(requestId, repaymentData) {
  try {
    console.log(`[Repayment Agent] Processing repayment for request: ${requestId}`);
    
    // 1. Find and validate financing request
    const financing = await FinancingRequest.findById(requestId).populate({
      path: 'pspId',
      populate: { path: 'userId' }
    });
    
    if (!financing) {
      throw new Error(`Financing request ${requestId} not found`);
    }
    
    if (financing.status !== 'Disbursed') {
      throw new Error(`Financing request ${requestId} is not in Disbursed status (current: ${financing.status})`);
    }
    
    const psp = financing.pspId;
    
    if (!psp) {
      throw new Error(`PSP not found for financing request ${requestId}`);
    }
    
    // 2. Extract repayment data
    const {
      principalAmount = financing.amount,
      actualInterestPaid,
      txHash,
      blockNumber
    } = repaymentData;
    
    // 3. Calculate expected interest at time of repayment
    const expectedInterest = financing.accruedInterest.total;
   
    console.log(`[Repayment Agent] Principal: ${principalAmount}, Expected Interest: ${expectedInterest}, Actual Interest: ${actualInterestPaid}`);
    
    // 4. Update financing request status
    financing.status = 'Repaid';
    financing.repaidAt = new Date();
    financing.repaymentTxHash = txHash;
    financing.actualInterestPaid = actualInterestPaid;
    financing.expectedInterestAtRepayment = expectedInterest;
    
    await financing.save();
    
    console.log(`[Repayment Agent] Updated FinancingRequest ${requestId} to Repaid status`);
    
    // 5. Create repayment record for audit trail
    const repaymentRecord = new RepaymentRecord({
      financingRequestId: financing._id,
      pspId: psp._id,
      principalAmount,
      expectedInterest,
      actualInterestPaid,
      totalRepayment: principalAmount + actualInterestPaid,
      repaymentDate: new Date(),
      txHash,
      blockNumber,
      creditLineRestored: principalAmount,
      status: 'Completed'
    });
    
    await repaymentRecord.save();
    
    console.log(`[Repayment Agent] Created RepaymentRecord ${repaymentRecord._id}`);
    
    // 6. Restore PSP credit line (revolving credit model)
    // Reduce currently utilized amount by principal
    if (psp.currentlyUtilized >= principalAmount) {
      psp.currentlyUtilized -= principalAmount;
      await psp.save();
      
      console.log(`[Repayment Agent] Restored ${principalAmount} to PSP ${psp.companyName}'s available credit`);
      console.log(`[Repayment Agent] New available credit: ${psp.approvedAmount - psp.currentlyUtilized}`);
    } else {
      console.warn(`[Repayment Agent] Warning: PSP currentlyUtilized (${psp.currentlyUtilized}) is less than principal (${principalAmount})`);
      psp.currentlyUtilized = 0;
      await psp.save();
    }
    
    // Trigger Repayment Notification
    try {
      if (psp && psp.userId) {
        await createNotification(psp.userId._id, {
          title: 'Repayment Successful!',
          message: `Repayment of $${(principalAmount + actualInterestPaid).toLocaleString()} for order ${financing.orderReference} was successful.`,
          type: 'success'
        });

        await sendEmail({
          to: psp.userId.email,
          subject: 'Repayment Received - Confirmation',
          title: 'Repayment Received',
          body: `<p>We have successfully processed your repayment for order <strong>${financing.orderReference}</strong>.</p>
                 <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                   <p style="margin: 5px 0;"><strong>Principal:</strong> $${principalAmount.toLocaleString()}</p>
                   <p style="margin: 5px 0;"><strong>Interest Paid:</strong> $${actualInterestPaid.toLocaleString()}</p>
                   <p style="margin: 5px 0;"><strong>Total Repaid:</strong> $${(principalAmount + actualInterestPaid).toLocaleString()}</p>
                 </div>
                 <p>Your available credit line has been restored by $${principalAmount.toLocaleString()}.</p>`
        });
      }
    } catch (notifyError) {
      console.error('[Repayment Agent] Success notification error:', notifyError);
    }

    // 7. Return success result
    return {
      success: true,
      financing,
      repaymentRecord,
      creditRestored: principalAmount,
      variance: actualInterestPaid - expectedInterest,
      variancePercentage: expectedInterest > 0 
        ? ((actualInterestPaid - expectedInterest) / expectedInterest) * 100 
        : 0
    };
    
  } catch (error) {
    console.error(`[Repayment Agent] Error processing repayment for ${requestId}:`, error);
    
    // Create failed repayment record
    try {
      const failedRecord = new RepaymentRecord({
        financingRequestId: requestId,
        pspId: repaymentData.pspId,
        principalAmount: repaymentData.principalAmount || 0,
        expectedInterest: 0,
        actualInterestPaid: repaymentData.actualInterestPaid || 0,
        totalRepayment: 0,
        repaymentDate: new Date(),
        txHash: repaymentData.txHash || 'FAILED',
        creditLineRestored: 0,
        status: 'Failed'
      });
      
      await failedRecord.save();
    } catch (recordError) {
      console.error('[Repayment Agent] Failed to create failed repayment record:', recordError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get repayment quote for a financing request
 * @param {string} requestId - FinancingRequest ID
 */
async function getRepaymentQuote(requestId) {
  try {
    const financing = await FinancingRequest.findById(requestId).populate('pspId');
    
    if (!financing) {
      throw new Error('Financing request not found');
    }
    
    if (financing.status !== 'Disbursed') {
      throw new Error(`Cannot repay request with status: ${financing.status}`);
    }
    
    const principal = financing.amount;
    const expectedInterest = financing.accruedInterest.total;
    const totalDue = principal + expectedInterest;
    const daysElapsed = financing.daysElapsed;
    
    return {
      success: true,
      quote: {
        requestId: financing._id,
        orderReference: financing.orderReference,
        principal,
        expectedInterest,
        totalDue,
        daysElapsed,
        utilizedBips: financing.utilizedBips,
        poolAddress: financing.pspId.assignedPoolAddress,
        disbursedAt: financing.disbursedAt,
        dueDate: financing.dueDate
      }
    };
  } catch (error) {
    console.error('[Repayment Agent] Error generating quote:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processRepayment,
  getRepaymentQuote
};
