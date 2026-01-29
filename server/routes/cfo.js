const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const FinancingRequest = require('../models/FinancingRequest');
const { calculateTotalExposure } = require('../services/interestCalculator');

// Apply authentication and authorization
router.use(authMiddleware);
router.use(authorizeRoles('CFO'));

// @route   GET /api/cfo/dashboard-stats
// @desc    Get CFO dashboard statistics
// @access  Private (CFO only)
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Get all PSP profiles with approved credit lines
    const approvedProfiles = await PSPProfile.find({ creditLineStatus: 'Approved' });
    
    // Calculate total exposure and stats
    const stats = {
      totalPSPs: approvedProfiles.length,
      totalApprovedCredit: approvedProfiles.reduce((sum, p) => sum + (p.approvedAmount || 0), 0),
      totalActiveCredit: 0,
      totalFinancings: 0,
      pendingApplications: 0,
      totalInterestRevenue: 0
    };

    // Get all active financings
    const activeFinancings = await FinancingRequest.find({ status: 'Disbursed' });
    stats.totalFinancings = activeFinancings.length;
    stats.totalActiveCredit = activeFinancings.reduce((sum, f) => sum + f.amount, 0);

    // Calculate total interest revenue
    activeFinancings.forEach(f => {
      const interest = f.accruedInterest;
      stats.totalInterestRevenue += interest.total;
    });

    // Get pending applications
    const pendingCount = await PSPProfile.countDocuments({ creditLineStatus: 'Pending' });
    stats.pendingApplications = pendingCount;

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/all-financings
// @desc    Get all financings across all PSPs with calculations
// @access  Private (CFO only)
router.get('/all-financings', async (req, res) => {
  try {
    const financings = await FinancingRequest.find({
      status: { $in: ['Pending', 'Validated', 'Disbursed'] }
    })
    .populate('pspId', 'companyName')
    .sort({ createdAt: -1 });

    // Calculate exposure summary
    const exposure = calculateTotalExposure(financings);

    res.json({
      financings,
      summary: exposure
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/exposure
// @desc    Get exposure distribution by PSP
// @access  Private (CFO only)
router.get('/exposure', async (req, res) => {
  try {
    const financings = await FinancingRequest.find({ status: 'Disbursed' })
      .populate('pspId', 'companyName');

    // Group by PSP
    const exposureByPSP = {};
    financings.forEach(f => {
      const pspName = f.pspId?.companyName || 'Unknown';
      if (!exposureByPSP[pspName]) {
        exposureByPSP[pspName] = { amount: 0, count: 0, interest: 0 };
      }
      exposureByPSP[pspName].amount += f.amount;
      exposureByPSP[pspName].count += 1;
      exposureByPSP[pspName].interest += f.accruedInterest.total;
    });

    // Convert to array for frontend
    const distribution = Object.keys(exposureByPSP).map(psp => ({
      psp,
      ...exposureByPSP[psp]
    }));

    res.json(distribution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/yield-history
// @desc    Get historical yield data (monthly aggregation)
// @access  Private (CFO only)
router.get('/yield-history', async (req, res) => {
  try {
    // Get last 12 months of financings
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const financings = await FinancingRequest.find({
      status: 'Disbursed',
      disbursedAt: { $gte: twelveMonthsAgo }
    });

    // Group by month
    const monthlyYield = {};
    financings.forEach(f => {
      if (!f.disbursedAt) return;
      
      const month = f.disbursedAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyYield[month]) {
        monthlyYield[month] = { utilized: 0, unutilized: 0, total: 0 };
      }
      
      const interest = f.accruedInterest;
      monthlyYield[month].utilized += interest.utilized;
      monthlyYield[month].unutilized += interest.unutilized;
      monthlyYield[month].total += interest.total;
    });

    // Convert to array sorted by month
    const history = Object.keys(monthlyYield)
      .sort()
      .map(month => ({
        month,
        ...monthlyYield[month]
      }));

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
