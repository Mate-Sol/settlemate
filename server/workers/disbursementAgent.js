/**
 * Disbursement Agent (Background Worker)
 * Disburses funds via smart contract without blocking user requests
 */

const FinancingRequest = require('../models/FinancingRequest');
const PSPProfile = require('../models/PSPProfile');
const OrderBook = require('../models/OrderBook');
const ExternalOrderBook = require('../models/ExternalOrderBook');
const contractService = require('../services/contractService');

/**
 * Disburse financing via smart contract
 * @param {String} requestId - FinancingRequest ID
 */
async function disburseFinancing(requestId) {
  try {
    console.log(`[Disbursement Agent] Starting disbursement for request: ${requestId}`);

    // Get the financing request with populated PSP data
    const request = await FinancingRequest.findById(requestId).populate('pspId');
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

    } catch (contractError) {
      console.error(`[Disbursement Agent] Contract error:`, contractError);
      
      await FinancingRequest.findByIdAndUpdate(requestId, {
        status: 'Failed',
        failureReason: `Smart contract error: ${contractError.message}`
      });
      
      console.log(`[Disbursement Agent] FAILED - Contract error`);
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
