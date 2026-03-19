/**
 * Disbursement Agent (Background Worker)
 * Disburses funds via smart contract without blocking user requests
 */

const FinancingRequest = require('../models/FinancingRequest');
const PSPProfile = require('../models/PSPProfile');
const OrderBook = require('../models/OrderBook');
const ExternalOrderBook = require('../models/ExternalOrderBook');
const contractService = require('../services/contractService');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const User = require('../models/User'); // Required for admin notifications

/**
 * Disburse financing via smart contract
 * @param {String} requestId - FinancingRequest ID
 */
async function disburseFinancing(requestId) {
  try {
    console.log(`[Disbursement Agent] Starting disbursement for request: ${requestId}`);

    // Get the financing request with populated PSP and User data
    const request = await FinancingRequest.findById(requestId).populate({
      path: 'pspId',
      populate: { path: 'userId' }
    });
    
    if (!request || request.status !== 'Validated') {
      console.error(`[Disbursement Agent] Invalid request status: ${request?.status}`);
      return;
    }

    const psp = request.pspId;

    // Ensure PSP has deployed contract and wallet address
    if (!psp.assignedPoolAddress) {
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Failed',
        failureReason: 'PSP does not have deployed contract or wallet address'
      });
      console.log(`[Disbursement Agent] FAILED - No contract/wallet`);
      return;
    }

    // Call smart contract drawdown function
    console.log(`[Disbursement Agent] Calling contract drawdown...`);
    console.log(`  Contract: ${psp.poolAddress}`);
    console.log(`  Amount: $${request.amount}`);
    console.log(`  Recipient: ${psp.walletAddress}`);

    try {
      // Call the smart contract service to execute drawdown
      const receipt = await contractService.drawdownFunds(
        psp.assignedPoolAddress,
        request.amount,
        psp.walletAddress
      );

      console.log(`[Disbursement Agent] ✓ Drawdown successful! TxHash: ${receipt.transactionHash}`);

      // Calculate due date (using approved duration, default 90 days)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (psp.approvedDuration || 90));

      // Update financing request as disbursed
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Disbursed',
        disbursedAt: new Date(),
        dueDate,
        txHash: receipt.transactionHash,
        contractAddress: psp.contractAddress,
        utilizedBips: psp.utilizedBips,
        unutilizedBips: psp.unutilizedBips,
        approvedAmount: psp.approvedAmount
      });

      // Update order book status to Financed (Internal)
      await OrderBook.findOneAndUpdate(
        { pspId: psp._id, referenceId: request.orderReference },
        { status: 'Financed' }
      );

      // Update External PSP orderbook if applicable
      if (request.isExternalPSP && (request.externalOrderId || request.orderReference)) {
        await ExternalOrderBook.findOneAndUpdate(
          { 
            $or: [
              { _id: request.externalOrderId },
              { orderReference: request.orderReference }
            ]
          },
          { 
            loanStatus: 'Disbursed',
            notes: `Loan disbursed successfully. TxHash: ${receipt.transactionHash.substring(0, 10)}...`
          }
        );
        console.log(`[Disbursement Agent] Updated External PSP orderbook: ${request.orderReference || request.externalOrderId} -> Disbursed`);
      }

      // If this is an external PSP request, notify them via webhook
      if (request.isExternalPSP && request.externalOrderId && request.externalPspApiKey) {
        try {
          const axios = require('axios');
          
          const webhookUrl = process.env.EXTERNAL_PSP_WEBHOOK_URL || 
            'http://localhost:5000/api/external-psp/webhook/loan-approved';
          
          console.log(`[Disbursement Agent] Calling external PSP webhook: ${webhookUrl}`);
          
          const webhookResponse = await axios.post(webhookUrl, {
            orderId: request.externalOrderId,
            credmateLoanId: requestId,
            status: 'Approved',
            approvedAmount: request.amount,
            message: 'Loan has been approved and disbursed successfully'
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': request.externalPspApiKey,
              'X-API-Secret': request.externalPspApiSecret
            },
            timeout: 5000
          });
          
          console.log(`[Disbursement Agent] ✓ External PSP notified: ${webhookResponse.data.message}`);
        } catch (webhookError) {
          // Log error but don't fail the disbursement
          console.error(`[Disbursement Agent] Failed to notify external PSP:`, webhookError.message);
          console.log(`[Disbursement Agent] Continuing with disbursement despite webhook failure`);
        }
      }

      // Update PSP's currentlyUtilized amount (revolving credit tracking)
      psp.currentlyUtilized = (psp.currentlyUtilized || 0) + request.amount;
      await psp.save();

      console.log(`[Disbursement Agent] Updated PSP currentlyUtilized: ${psp.currentlyUtilized} / ${psp.approvedAmount}`);
      console.log(`[Disbursement Agent] Available credit: ${psp.approvedAmount - psp.currentlyUtilized}`);

      console.log(`[Disbursement Agent] ✓ DISBURSED successfully`);

      // Trigger Success Notification & Email
      try {
        if (psp && psp.userId) {
          await createNotification(psp.userId._id, {
            title: 'Funds Disbursed!',
            message: `Disbursement of $${request.amount.toLocaleString()} for order ${request.orderReference} was successful.`,
            type: 'success'
          });

          await sendEmail({
            to: psp.userId.email,
            subject: 'Funds Disbursed Successfully!',
            title: 'Funds Disbursed',
            body: `<p>Great news! The drawdown request for order <strong>${request.orderReference}</strong> has been executed successfully on-chain.</p>
                   <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                     <p style="margin: 5px 0;"><strong>Amount:</strong> $${request.amount.toLocaleString()}</p>
                     <p style="margin: 5px 0;"><strong>Transaction Hash:</strong> <span style="font-family: monospace;">${receipt.transactionHash}</span></p>
                   </div>
                   <p>Please check your wallet address: <strong>${psp.walletAddress}</strong></p>`
          });
        }
      } catch (notifyError) {
        console.error('[Disbursement Agent] Success notification error:', notifyError);
      }

    } catch (contractError) {
      console.error(`[Disbursement Agent] Contract error:`, contractError);
      
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Failed',
        failureReason: `Smart contract error: ${contractError.message}`
      });
      
      console.log(`[Disbursement Agent] FAILED - Contract error`);

      // Trigger Failure Notification to CFO/CRO
      try {
        const admins = await User.find({ role: { $in: ['CRO', 'CFO'] } });
        for (const admin of admins) {
          await createNotification(admin._id, {
            title: 'Disbursement FAILED',
            message: `Disbursement failed for request ${requestId} (PSP: ${psp.companyName}). Error: ${contractError.message || 'Unknown error'}`,
            type: 'danger'
          });
          
          await sendEmail({
            to: admin.email,
            subject: 'CRITICAL: Disbursement Failure Alert',
            title: 'CRITICAL: Disbursement Failed',
            body: `<p>On-chain disbursement has failed for request ID <strong>${requestId}</strong>.</p>
                   <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                     <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">PSP:</p>
                     <p style="margin: 0; color: #ebdffc;">${psp.companyName}</p>
                     <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Error Message:</p>
                     <p style="margin: 0; color: #ebdffc;">${contractError.message || 'Check logs'}</p>
                   </div>
                   <p>Manual review and funding intervention might be required immediately.</p>`
          });
        }
      } catch (notifyError) {
        console.error('[Disbursement Agent] Failure notification error:', notifyError);
      }
    }

  } catch (error) {
    console.error(`[Disbursement Agent] Error disbursing request ${requestId}:`, error);
    await FinancingRequest.findByIdAndUpdate(requestId, {
      status: 'Failed',
      failureReason: 'Disbursement error: ' + error.message
    });
  }
}

module.exports = {
  disburseFinancing
};
