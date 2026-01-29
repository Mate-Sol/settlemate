const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const OrderBook = require('../models/OrderBook');
const FinancingRequest = require('../models/FinancingRequest');
const User = require('../models/User');

// Apply authentication to all PSP routes
router.use(authMiddleware);
router.use(authorizeRoles('PSP'));

// @route   GET /api/psp/profile
// @desc    Get PSP profile
// @access  Private (PSP only)
router.get('/profile', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/psp/profile
// @desc    Update PSP profile
// @access  Private (PSP only)
router.put('/profile', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update fields
    const allowedUpdates = [
      'companyName', 'registrationNo', 'country', 'yearEstablished',
      'keyContact', 'uboDetails', 'pepExposure', 'sector', 'keyProducts',
      'topCustomers', 'topSuppliers', 'transactionVolume', 'annualRevenue',
      'outstandingLoans', 'bankAccount', 'defaultHistory'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/psp/apply-limit
// @desc    Apply for financing limit
// @access  Private (PSP only)
router.post('/apply-limit', async (req, res) => {
  try {
    const { requestedAmount, requestedDuration } = req.body;

    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (profile.creditLineStatus === 'Pending' || profile.creditLineStatus === 'UnderReview') {
      return res.status(400).json({ message: 'Application already pending' });
    }

    // Update profile with application
    profile.requestedAmount = requestedAmount;
    profile.requestedDuration = requestedDuration;
    profile.creditLineStatus = 'Pending';

    await profile.save();

    res.json({ message: 'Application submitted successfully', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/psp/order-book
// @desc    Get PSP order book
// @access  Private (PSP only)
router.get('/order-book', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const orders = await OrderBook.find({ pspId: profile._id }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/psp/request-financing
// @desc    Request financing (drawdown) - ASYNC WORKFLOW
// @access  Private (PSP only)
router.post('/request-financing', async (req, res) => {
  try {
    const { amount, orderReference } = req.body;

    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Basic validation - don't check credit availability here (validation agent does that)
    if (!amount || !orderReference) {
      return res.status(400).json({ message: 'Amount and order reference are required' });
    }

    // Create financing request with Pending status
    const financingRequest = new FinancingRequest({
      pspId: profile._id,
      amount,
      orderReference,
      status: 'Pending'
    });

    await financingRequest.save();

    // Trigger validation agent in background (DON'T AWAIT!)
    const { validateFinancingRequest } = require('../workers/financingValidationAgent');
    validateFinancingRequest(financingRequest._id.toString()).catch(err => {
      console.error('Async validation error:', err);
    });

    // Return immediately with request ID
    res.json({
      message: 'Financing request submitted successfully',
      requestId: financingRequest._id,
      status: 'Pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/psp/financing-requests/:id
// @desc    Get financing request status (polling endpoint)
// @access  Private (PSP only)
router.get('/financing-requests/:id', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const request = await FinancingRequest.findOne({
      _id: req.params.id,
      pspId: profile._id
    });

    if (!request) {
      return res.status(404).json({ message: 'Financing request not found' });
    }

    // Return request with calculated interest
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/psp/active-financings
// @desc    Get all active financings for PSP with interest calculations
// @access  Private (PSP only)
router.get('/active-financings', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const financings = await FinancingRequest.find({
      pspId: profile._id,
      status: { $in: ['Pending', 'Validated', 'Disbursed'] }
    }).sort({ createdAt: -1 });

    // Return with virtual fields (interest calculated)
    res.json(financings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/psp/pool-status
// @desc    Get credit pool status from blockchain
// @access  Private (PSP only)
router.get('/pool-status', async (req, res) => {
  try {
    const profile = await PSPProfile.findOne({ userId: req.user.userId });
    
    if (!profile || !profile.assignedPoolAddress) {
      return res.status(404).json({ message: 'No credit pool assigned' });
    }

    const contractService = require('../services/contractService');
    const result = await contractService.getPoolStatus(profile.assignedPoolAddress);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to fetch pool status', error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
