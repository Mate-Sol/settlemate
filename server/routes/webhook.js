const express = require('express');
const router = express.Router();
const ExternalPSPUser = require('../models/ExternalPSPUser');
const OrderBook = require('../models/OrderBook');
const PSPProfile = require('../models/PSPProfile');
const FinancingRequest = require('../models/FinancingRequest');
const axios = require('axios');

// External PSP API service to validate order data
const validateExternalOrder = async (apiKey, orderId) => {
  try {
    const externalApiUrl = process.env.EXTERNAL_PSP_API_URL || 'http://localhost:5000/api/external-psp';
    
    const response = await axios.get(`${externalApiUrl}/orderbook/${orderId}`, {
      headers: {
        'X-API-Key': apiKey
      }
    });

    return {
      success: true,
      orderData: response.data
    };
  } catch (error) {
    console.error('External order validation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to validate order with external PSP'
    };
  }
};

// @route   POST /api/webhook/loan-request
// @desc    Receive loan request from external PSP
// @access  Public (verified by API key)
router.post('/loan-request', async (req, res) => {
  try {
    const apiKey = req.header('X-API-Key');
    const apiSecret = req.header('X-API-Secret');

    if (!apiKey || !apiSecret) {
      return res.status(401).json({ message: 'API credentials required' });
    }

    // Verify API credentials
    const externalPspUser = await ExternalPSPUser.findOne({ apiKey });
    
    if (!externalPspUser || !externalPspUser.verifyApiCredentials(apiKey, apiSecret)) {
      return res.status(403).json({ message: 'Invalid API credentials' });
    }

    const {
      orderReference,
      orderId,
      customerName,
      amount,
      orderDate,
      settlementDate,
      companyName
    } = req.body;

    // Validate required fields
    if (!orderReference || !orderId || !customerName || !amount) {
      return res.status(400).json({ 
        message: 'Order reference, order ID, customer name, and amount are required' 
      });
    }

    console.log('[Webhook] Loan request received from external PSP:', companyName);
    console.log('[Webhook] Order Reference:', orderReference);
    console.log('[Webhook] Amount:', amount);

    // Step 1: Validate order data with external PSP API
    const validationResult = await validateExternalOrder(apiKey, orderId);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Order validation failed',
        error: validationResult.error
      });
    }

    const externalOrderData = validationResult.orderData;

    // Step 2: Verify data matches
    if (externalOrderData.orderReference !== orderReference) {
      return res.status(400).json({ 
        message: 'Order reference mismatch',
        provided: orderReference,
        actual: externalOrderData.orderReference
      });
    }

    if (externalOrderData.customerName !== customerName) {
      return res.status(400).json({ 
        message: 'Customer name mismatch',
        provided: customerName,
        actual: externalOrderData.customerName
      });
    }

    if (externalOrderData.amount < amount) {
      return res.status(400).json({ 
        message: 'Requested amount exceeds order amount',
        requested: amount,
        orderAmount: externalOrderData.amount
      });
    }

    console.log('[Webhook] Order validation successful');

    // Step 3: Find or create PSP profile for external PSP
    // First, check if there's a User account for this external PSP
    const User = require('../models/User');
    let pspUser = await User.findOne({ email: externalPspUser.email });
    
    if (!pspUser) {
      // Create a user account for the external PSP
      console.log('[Webhook] Creating user account for external PSP');
      pspUser = new User({
        email: externalPspUser.email,
        name:externalPspUser.companyName,
        passwordHash:externalPspUser.password,
        role: 'PSP'
      });
      await pspUser.save();
    }

    let pspProfile = await PSPProfile.findOne({ userId: pspUser._id });

    if (!pspProfile) {
      // Create PSP profile
      console.log('[Webhook] Creating PSP profile for external PSP');
      pspProfile = new PSPProfile({
        userId: pspUser._id,
        companyName: companyName || externalPspUser.companyName,
        creditLineStatus: 'Active', // Auto-approve for external PSPs
        approvedAmount: 1000000, // Default credit line
        currentlyUtilized: 0
      });
      await pspProfile.save();
    }

    // Step 4: Save order to main system's OrderBook
    let orderBook = await OrderBook.findOne({ referenceId: orderReference });
    
    if (!orderBook) {
      console.log('[Webhook] Creating order book entry in main system');
      orderBook = new OrderBook({
        pspId: pspProfile._id,
        referenceId: orderReference,
        customerName: externalOrderData.customerName,
        amount: externalOrderData.amount,
        settlementDate: externalOrderData.settlementDate || settlementDate,
        status: 'Pending'
      });
      await orderBook.save();
    }

    // Step 5: Create financing request
    console.log('[Webhook] Creating financing request');
    const financingRequest = new FinancingRequest({
      pspId: pspProfile._id,
      amount: amount,
      orderReference: orderReference,
      status: 'Pending',
      isExternalPSP: true, // Flag to identify external PSP requests
      externalOrderId: orderId,
      externalPspApiKey: externalPspUser.apiKey,
      externalPspApiSecret: externalPspUser.apiSecret
    });

    await financingRequest.save();

    // Step 6: Trigger validation workflow (async)
    const { validateFinancingRequest } = require('../workers/financingValidationAgent');
    validateFinancingRequest(financingRequest._id.toString()).catch(err => {
      console.error('[Webhook] Async validation error:', err);
    });

    // Note: External PSP will be notified via webhook when loan is approved/disbursed
    // See disbursementAgent.js for webhook notification logic

    console.log('[Webhook] Loan request processed successfully');

    res.json({
      message: 'Loan request received and processing',
      requestId: financingRequest._id,
      orderBookId: orderBook._id,
      status: 'Pending',
      validationStatus: 'Processing'
    });
  } catch (error) {
    console.error('[Webhook] Error processing loan request:', error);
    res.status(500).json({ 
      message: 'Server error processing loan request',
      error: error.message 
    });
  }
});

module.exports = router;
