const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const FinancingRequest = require('../models/FinancingRequest');
const RepaymentRecord = require('../models/RepaymentRecord');
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

// @route   GET /api/cfo/yield-analytics
// @desc    Get yield analytics comparing expected vs realized yield
// @access  Private (CFO only)
router.get('/yield-analytics', async (req, res) => {
  try {
    // Get all disbursed financings for accrued (expected) yield
    const activeFinancings = await FinancingRequest.find({ status: 'Disbursed' });
    
    // Calculate total accrued yield (expected)
    let accruedUtilized = 0;
    let accruedUnutilized = 0;
    
    activeFinancings.forEach(financing => {
      const interest = financing.accruedInterest;
      accruedUtilized += interest.utilized || 0;
      accruedUnutilized += interest.unutilized || 0;
    });
    
    const totalAccruedYield = accruedUtilized + accruedUnutilized;
    
    // Get all completed repayments for realized yield
    const repayments = await RepaymentRecord.find({ status: 'Completed' });
    
    const totalInterestReceived = repayments.reduce((sum, r) => sum + (r.actualInterestPaid || 0), 0);
    const totalRepayments = repayments.length;
    const averageInterestPerRepayment = totalRepayments > 0 ? totalInterestReceived / totalRepayments : 0;
    
    // Calculate variance
    const variance = totalInterestReceived - totalAccruedYield;
    const variancePercentage = totalAccruedYield > 0 
      ? (variance / totalAccruedYield) * 100 
      : 0;
    
    const revenueRate = totalAccruedYield > 0 
      ? (totalInterestReceived / totalAccruedYield) * 100 
      : 0;
    
    let varianceStatus = 'on_target';
    if (variancePercentage > 5) varianceStatus = 'over_target';
    if (variancePercentage < -5) varianceStatus = 'under_target';
    
    res.json({
      accruedYield: {
        utilized: Math.round(accruedUtilized * 100) / 100,
        unutilized: Math.round(accruedUnutilized * 100) / 100,
        total: Math.round(totalAccruedYield * 100) / 100
      },
      realizedYield: {
        totalInterestReceived: Math.round(totalInterestReceived * 100) / 100,
        totalRepayments,
        averageInterestPerRepayment: Math.round(averageInterestPerRepayment * 100) / 100
      },
      variance: {
        amount: Math.round(variance * 100) / 100,
        percentage: Math.round(variancePercentage* 100) / 100,
        status: varianceStatus
      },
      revenueRate: Math.round(revenueRate * 100) / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cfo/repayment-history
// @desc    Get repayment history with filters
// @access  Private (CFO only)
router.get('/repayment-history', async (req, res) => {
  try {
    const { startDate, endDate, pspId } = req.query;
    
    let query = { status: 'Completed' };
    
    // Apply date filters
    if (startDate || endDate) {
      query.repaymentDate = {};
      if (startDate) query.repaymentDate.$gte = new Date(startDate);
      if (endDate) query.repaymentDate.$lte = new Date(endDate);
    }
    
    // Apply PSP filter
    if (pspId) {
      query.pspId = pspId;
    }
    
    const repayments = await RepaymentRecord.find(query)
      .populate('pspId', 'companyName')
      .populate('financingRequestId', 'orderReference')
      .sort({ repaymentDate: -1 });
    
    // Calculate summary
    const totalPrincipal = repayments.reduce((sum, r) => sum + (r.principalAmount || 0), 0);
    const totalInterestCollected = repayments.reduce((sum, r) => sum + (r.actualInterestPaid || 0), 0);
    
    const formattedRepayments = repayments.map(r => ({
      _id: r._id,
      psp: r.pspId?.companyName || 'Unknown',
      orderReference: r.financingRequestId?.orderReference || 'N/A',
      principal: r.principalAmount,
      expectedInterest: r.expectedInterest,
      actualInterest: r.actualInterestPaid,
      variance: r.interestVariance,
      variancePercentage: r.variancePercentage,
      repaymentDate: r.repaymentDate,
      txHash: r.txHash
    }));
    
    res.json({
      repayments: formattedRepayments,
      summary: {
        totalRepayments: repayments.length,
        totalPrincipal: Math.round(totalPrincipal * 100) / 100,
        totalInterestCollected: Math.round(totalInterestCollected * 100) / 100
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
