/**
 * Financing Validation Agent (Background Worker)
 * Validates financing requests asynchronously without blocking user
 */

const FinancingRequest = require('../models/FinancingRequest');
const PSPProfile = require('../models/PSPProfile');
const OrderBook = require('../models/OrderBook');
const { disburseFinancing } = require('./disbursementAgent');

/**
 * Validate a financing request in the background
 * @param {String} requestId - FinancingRequest ID
 */
async function validateFinancingRequest(requestId) {
  try {
    console.log(`[Validation Agent] Starting validation for request: ${requestId}`);

    // Get the financing request
    const request = await FinancingRequest.findById(requestId).populate('pspId');
    if (!request) {
      console.error(`[Validation Agent] Request not found: ${requestId}`);
      return;
    }

    const psp = request.pspId;

    // Validation checks
    const validationResults = {
      hasCreditLine: false,
      orderExists: false,
      sufficientCredit: false,
      notAlreadyFinanced: false
    };

    // Check 1: PSP has approved credit line
    if (psp.creditLineStatus !== 'Approved' || !psp.approvedAmount) {
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason: 'No approved credit line available'
      });
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
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason: `Order reference '${request.orderReference}' not found in your order book`
      });
      console.log(`[Validation Agent] REJECTED - Order not found`);
      return;
    }
    validationResults.orderExists = true;

    // Check 3: Order not already financed
    if (order.status === 'Financed') {
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason: `Order '${request.orderReference}' is already financed`
      });
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
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Rejected',
        rejectionReason: `Insufficient credit. Requested: $${request.amount.toLocaleString()}, Available: $${availableCredit.toLocaleString()}`
      });
      console.log(`[Validation Agent] REJECTED - Insufficient credit`);
      return;
    }
    validationResults.sufficientCredit = true;

    // All checks passed - Mark as validated
    await FinancingRequest.findByIdAndUpdate(requestId, {
      status: 'Validated',
      validatedAt: new Date()
    });

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
