/**
 * Financing Validation Agent (Background Worker)
 * Validates financing requests asynchronously without blocking user
 */

const FinancingRequest = require('../models/FinancingRequest');
const PSPProfile = require('../models/PSPProfile');
const OrderBook = require('../models/OrderBook');
const ExternalOrderBook = require('../models/ExternalOrderBook');
const { disburseFinancing } = require('./disbursementAgent');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

/**
 * Send notification to PSP about rejection
 */
async function notifyRejection(request, reason) {
  try {
    const psp = request.pspId;
    if (psp && psp.userId) {
      await createNotification(psp.userId._id, {
        title: 'Financing Request Rejected',
        message: `Your request for order ${request.orderReference} was rejected. Reason: ${reason}`,
        type: 'danger'
      });
      
      await sendEmail({
        to: psp.userId.email,
        subject: 'Financing Request Rejected',
        title: 'Financing Request Rejected',
        body: `<p>Your financing request for order <strong>${request.orderReference}</strong> has been rejected.</p>
               <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                 <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Reason:</p>
                     <p style="margin: 0; color: #ebdffc;">${reason}</p>
               </div>`
      });
    }
  } catch (err) {
    console.error('[Validation Agent] Notification error:', err);
  }
}

/**
 * Validate a financing request in the background
 * @param {String} requestId - FinancingRequest ID
 */
async function validateFinancingRequest(requestId) {
  try {
    console.log(`[Validation Agent] Starting validation for request: ${requestId}`);

    // Get the financing request with nested user population
    const request = await FinancingRequest.findById(requestId).populate({
      path: 'pspId',
      populate: { path: 'userId' }
    });
    
    if (!request) {
      console.error(`[Validation Agent] Request not found: ${requestId}`);
      return;
    }

    const psp = request.pspId;
    console.log(`[Validation Agent] Validating request for PSP: ${psp}`);

    // Validation checks
    const validationResults = {
      hasCreditLine: false,
      orderExists: false,
      sufficientCredit: false,
      notAlreadyFinanced: false
    };

    // Check 1: PSP has approved credit line
    if (psp.creditLineStatus !== 'Approved' || !psp.approvedAmount) {
      const rejectionReason = 'No approved credit line available';
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason
      });
      
      await notifyRejection(request, rejectionReason);
      
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
            loanStatus: 'Rejected',
            notes: rejectionReason
          }
        );
        console.log(`[Validation Agent] Updated External PSP orderbook: ${request.orderReference || request.externalOrderId} -> Rejected`);
      }
      
      console.log(`[Validation Agent] REJECTED - No credit line`);
      return;
    }
    validationResults.hasCreditLine = true;

    // Check 2: Order reference exists in OrderBook for this PSP
    const order = await OrderBook.findOne({
      pspId: psp._id,
      referenceId: request.orderReference
    });
    if (!order) {
      const rejectionReason = `Order reference '${request.orderReference}' not found in your order book`;
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason
      });
      
      await notifyRejection(request, rejectionReason);
      
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
            loanStatus: 'Rejected',
            notes: rejectionReason
          }
        );
        console.log(`[Validation Agent] Updated External PSP orderbook: ${request.orderReference || request.externalOrderId} -> Rejected`);
      }
      
      console.log(`[Validation Agent] REJECTED - Order not found`);
      return;
    }
    validationResults.orderExists = true;

    // Check 3: Order not already financed
    if (order.status === 'Financed') {
      const rejectionReason = `Order '${request.orderReference}' is already financed`;
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason
      });
      
      await notifyRejection(request, rejectionReason);
      
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
            loanStatus: 'Rejected',
            notes: rejectionReason
          }
        );
        console.log(`[Validation Agent] Updated External PSP orderbook: ${request.orderReference || request.externalOrderId} -> Rejected`);
      }
      
      console.log(`[Validation Agent] REJECTED - Order already financed`);
      return;
    }
    validationResults.notAlreadyFinanced = true;

    // Check 4: Requested amount ≤ available credit
    // Calculate current drawdown from active financings
    const activeFinancings = await FinancingRequest.find({
      pspId: psp._id,
      status: 'Disbursed'
    });
    const currentDrawdown = activeFinancings.reduce((sum, f) => sum + f.amount, 0);
    const availableCredit = psp.approvedAmount - currentDrawdown;

    if (request.amount > availableCredit) {
      const rejectionReason = `Insufficient credit. Requested: $${request.amount.toLocaleString()}, Available: $${availableCredit.toLocaleString()}`;
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason
      });
      
      await notifyRejection(request, rejectionReason);
      
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
            loanStatus: 'Rejected',
            notes: rejectionReason
          }
        );
        console.log(`[Validation Agent] Updated External PSP orderbook: ${request.orderReference || request.externalOrderId} -> Rejected`);
      }
      
      console.log(`[Validation Agent] REJECTED - Insufficient credit`);
      return;
    }
    validationResults.sufficientCredit = true;

    // All checks passed - Mark as validated
    await FinancingRequest.findByIdAndUpdate(requestId, {
      status: 'Validated',
      validatedAt: new Date()
    });

    // Trigger Success Notification
    try {
      const psp = request.pspId;
      if (psp && psp.userId) {
        await createNotification(psp.userId._id, {
          title: 'Financing Request Validated',
          message: `Your request for order ${request.orderReference} has been validated and disbursement is underway.`,
          type: 'success'
        });
      }
    } catch (notifyError) {
      console.error('[Validation Agent] Success notification error:', notifyError);
    }

    console.log(`[Validation Agent] VALIDATED ✓ - Triggering disbursement`);

    // Trigger disbursement agent (also async, doesn't block)
    disburseFinancing(requestId).catch(err => {
      console.error(`[Validation Agent] Error triggering disbursement:`, err);
    });

  } catch (error) {
    console.error(`[Validation Agent] Error validating request ${requestId}:`, error);
    await FinancingRequest.findByIdAndUpdate(requestId, {
      status: 'Failed',
      failureReason: 'Validation error: ' + error.message
    });
  }
}

module.exports = {
  validateFinancingRequest
};
