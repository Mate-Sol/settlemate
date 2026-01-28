const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const FinancingRequest = require('../models/FinancingRequest');

// Apply authentication and CFO authorization to all routes
router.use(authMiddleware);
router.use(authorizeRoles('CFO'));

// @route   GET /api/cfo/stats
// @desc    Get CFO dashboard statistics
// @access  Private (CFO only)
router.get('/stats', async (req, res) => {
  try {
    // Get approved credit lines
    const approvedProfiles = await PSPProfile.find({ creditLineStatus: 'Approved' });
    
    const totalCreditLimit = approvedProfiles.reduce((sum, profile) => sum + (profile.approvedAmount || 0), 0);
    const activeLoans = approvedProfiles.filter(p => p.assignedPoolAddress).length;
    
    // Calculate total disbursed (mock for now - would need to query blockchain)
    const totalDisbursed = approvedProfiles.length > 0 ? totalCreditLimit * 0.4 : 0;
    
    res.json({
      totalCreditLimit,
      totalDisbursed,
      poolBalance: totalCreditLimit - totalDisbursed,
      activeLoans,
      pendingClosure: 2, // Mock data
      monthlyYield: 12500, // Mock data
      annualizedReturn: 3.5 // Mock data (percentage)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/exposure
// @desc    Get exposure distribution
// @access  Private (CFO only)
router.get('/exposure', async (req, res) => {
  try {
    const approvedProfiles = await PSPProfile.find({ creditLineStatus: 'Approved' });
    
    const totalCreditLimit = approvedProfiles.reduce((sum, profile) => sum + (profile.approvedAmount || 0), 0);
    const totalDisbursed = totalCreditLimit * 0.4; // Mock calculation
    
    res.json({
      activeLoans: totalDisbursed,
      availableLiquidity: totalCreditLimit - totalDisbursed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/yield-history
// @desc    Get monthly yield history
// @access  Private (CFO only)
router.get('/yield-history', async (req, res) => {
  try {
    // Mock data - in production, this would query financing requests and calculate actual yields
    const yieldData = [
      { month: 'Jul', utilized: 165000, unutilized: 38000 },
      { month: 'Aug', utilized: 172500, unutilized: 38500 },
      { month: 'Sep', utilized: 168000, unutilized: 39200 },
      { month: 'Oct', utilized: 180000, unutilized: 37500 },
      { month: 'Nov', utilized: 175000, unutilized: 39800 },
      { month: 'Dec', utilized: 187500, unutilized: 39900 }
    ];
    
    res.json(yieldData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
