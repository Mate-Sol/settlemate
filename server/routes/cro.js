const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const contractService = require('../services/contractService');

// Apply authentication and CRO authorization to all routes
router.use(authMiddleware);
router.use(authorizeRoles('CRO'));

// @route   GET /api/cro/applications
// @desc    Get all pending applications
// @access  Private (CRO only)
router.get('/applications', async (req, res) => {
  try {
    const { status } = req.query;

    const query = status ? { creditLineStatus: status } : {};
    const applications = await PSPProfile.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cro/applications/:id
// @desc    Get application by ID
// @access  Private (CRO only)
router.get('/applications/:id', async (req, res) => {
  try {
    const application = await PSPProfile.findById(req.params.id)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/approve
// @desc    Approve application and deploy smart contract
// @access  Private (CRO only)
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const { approvedAmount, approvedDuration, walletAddress, notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (profile.creditLineStatus !== 'Pending' && profile.creditLineStatus !== 'UnderReview') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    // Deploy CreditLinePool contract
    console.log('Deploying CreditLinePool contract for PSP:', walletAddress);

    const utilizedBips = parseInt(process.env.DEFAULT_UTILIZED_BIPS) || 5;
    const unutilizedBips = parseInt(process.env.DEFAULT_UNUTILIZED_BIPS) || 1;

    // Send response immediately - don't wait for funding
    res.json({
      message: 'Application approved and contract deployed',
      profile,
    });

    const deployResult = await contractService.deployCreditLinePool(
      walletAddress,
      approvedAmount,
      approvedDuration,
      utilizedBips,
      unutilizedBips
    );

    // if (!deployResult.success) {
    //   return res.status(500).json({ 
    //     message: 'Failed to deploy contract', 
    //     error: deployResult.error 
    //   });
    // }

    // Update profile immediately
    profile.creditLineStatus = 'Approved';
    profile.approvedAmount = approvedAmount;
    profile.approvedDuration = approvedDuration;
    profile.utilizedBips = utilizedBips;
    profile.unutilizedBips = unutilizedBips;
    profile.walletAddress = walletAddress;
    profile.assignedPoolAddress = deployResult.contractAddress;

    await profile.save();



    // Fund the pool asynchronously (in background)
    console.log('Funding pool with USD-DF in background...');
    contractService.fundPool(
      deployResult.contractAddress,
      approvedAmount
    ).then(fundResult => {
      if (fundResult.success) {
        console.log('✅ Pool funded successfully:', fundResult.transactionHash);
      } else {
        console.error('❌ Failed to fund pool:', fundResult.error);
        console.log('Admin can fund manually later using fundPool function');
      }
    }).catch(error => {
      console.error('❌ Pool funding error:', error);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cro/applications/:id/reject
// @desc    Reject application
// @access  Private (CRO only)
router.post('/applications/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    profile.creditLineStatus = 'Rejected';
    await profile.save();

    res.json({ message: 'Application rejected', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/request-info
// @desc    Request additional information
// @access  Private (CRO only)
router.post('/applications/:id/request-info', async (req, res) => {
  try {
    const { notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    profile.creditLineStatus = 'NeedMoreInfo';
    profile.cadMessage = notes || 'Additional information required.';
    profile.approvedAmount = 0; // Reset credit line
    await profile.save();

    res.json({ message: 'Additional information requested', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cro/stats
// @desc    Get CRO dashboard statistics
// @access  Private (CRO only)
router.get('/stats', async (req, res) => {
  try {
    const pendingCount = await PSPProfile.countDocuments({ creditLineStatus: 'Pending' });
    const approvedCount = await PSPProfile.countDocuments({ creditLineStatus: 'Approved' });
    const rejectedCount = await PSPProfile.countDocuments({ creditLineStatus: 'Rejected' });

    res.json({
      pendingApplications: pendingCount,
      activeLines: approvedCount,
      rejectedApplications: rejectedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
