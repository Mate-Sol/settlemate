/**
 * Credit Maintenance Worker
 * Runs daily to calculate and create weekly credit line maintenance charges
 */

const PSPProfile = require('../models/PSPProfile');
const CreditMaintenanceCharge = require('../models/CreditMaintenanceCharge');

/**
 * Calculate daily maintenance fee for a PSP
 * @param {Object} psp - PSPProfile document
 * @returns {Number} Daily maintenance fee
 */
function calculateDailyMaintenanceFee(psp) {
  // Available credit = approved - currently utilized
  const availableCredit = psp.approvedAmount - (psp.currentlyUtilized || 0);
  
  // If no available credit or no unutilized BIPS, no fee
  if (availableCredit <= 0 || !psp.unutilizedBips) {
    return 0;
  }
  
  // Daily fee = (availableCredit × unutilizedBips) / 10000
  const dailyFee = (availableCredit * psp.unutilizedBips) / 10000;
  
  return Math.round(dailyFee * 100) / 100; // Round to 2 decimals
}

/**
 * Check if it's time to create a maintenance charge
 * @param {Object} psp - PSPProfile document
 * @returns {Boolean}
 */
function shouldCreateMaintenanceCharge(psp) {
  // If never created, set initial date and return false
  if (!psp.lastMaintenanceChargeDate) {
    return false;
  }
  
  const now = new Date();
  const daysSinceLastCharge = Math.floor(
    (now - psp.lastMaintenanceChargeDate) / (1000 * 60 * 60 * 24)
  );
  
  // Weekly = 7 days, Monthly = 30 days
  const threshold = psp.maintenanceChargeFrequency === 'weekly' ? 7 : 30;
  
  return daysSinceLastCharge >= threshold;
}

/**
 * Create a maintenance charge for a PSP
 * @param {Object} psp - PSPProfile document
 */
async function createMaintenanceCharge(psp) {
  try {
    const now = new Date();
    const periodDays = psp.maintenanceChargeFrequency === 'weekly' ? 7 : 30;
    
    // Calculate period
    const periodEnd = now;
    const periodStart = new Date(psp.lastMaintenanceChargeDate || now);
    
    // Calculate average available credit (using current value as approximation)
    const avgAvailableCredit = psp.approvedAmount - (psp.currentlyUtilized || 0);
    
    // Use accumulated fee (which was calculated daily)
    const chargeAmount = psp.accumulatedMaintenanceFee || 0;
    
    // Due date is 3 days from now
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 3);
    
    // Create charge
    const charge = new CreditMaintenanceCharge({
      pspId: psp._id,
      periodStart,
      periodEnd,
      avgAvailableCredit,
      unutilizedBips: psp.unutilizedBips,
      chargeAmount,
      dueDate,
      status: 'Pending'
    });
    
    await charge.save();
    
    // Update PSP record
    psp.lastMaintenanceChargeDate = now;
    psp.nextMaintenanceDueDate = dueDate;
    psp.accumulatedMaintenanceFee = 0; // Reset accumulator
    await psp.save();
    
    console.log(`[Maintenance] Created charge ${charge._id} for PSP ${psp.companyName}: $${chargeAmount}`);
    
    return charge;
  } catch (error) {
    console.error(`[Maintenance] Error creating charge for PSP ${psp._id}:`, error);
    throw error;
  }
}

/**
 * Process daily maintenance calculations for all active PSPs
 */
async function processDailyMaintenance() {
  try {
    console.log('[Maintenance Worker] Starting daily maintenance calculation...');
    
    // Get all active PSPs with approved credit lines
    const psps = await PSPProfile.find({
      creditLineStatus: { $in: ['Active', 'Approved'] },
      approvedAmount: { $gt: 0 }
    });
    
    console.log(`[Maintenance Worker] Processing ${psps.length} PSPs`);
    
    let chargesCreated = 0;
    let totalFeesAccumulated = 0;
    
    for (const psp of psps) {
      // Calculate today's fee
      const dailyFee = calculateDailyMaintenanceFee(psp);
      
      // Accumulate the fee
      psp.accumulatedMaintenanceFee = (psp.accumulatedMaintenanceFee || 0) + dailyFee;
      totalFeesAccumulated += dailyFee;
      
      // Initialize if first time
      if (!psp.lastMaintenanceChargeDate) {
        psp.lastMaintenanceChargeDate = new Date();
        // Set next due date
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + (psp.maintenanceChargeFrequency === 'weekly' ? 7 : 30));
        psp.nextMaintenanceDueDate = nextDue;
      }
      
      // Check if it's time to create a charge
      if (shouldCreateMaintenanceCharge(psp)) {
        await createMaintenanceCharge(psp);
        chargesCreated++;
      } else {
        // Just save the accumulated fee
        await psp.save();
      }
    }
    
    console.log(`[Maintenance Worker] Daily calculation complete:`);
    console.log(`  - Total fees accumulated: $${totalFeesAccumulated.toFixed(2)}`);
    console.log(`  - Charges created: ${chargesCreated}`);
    
    return {
      success: true,
      pspsProcessed: psps.length,
      feesAccumulated: totalFeesAccumulated,
      chargesCreated
    };
    
  } catch (error) {
    console.error('[Maintenance Worker] Error in daily maintenance:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mark overdue charges
 */
async function markOverdueCharges() {
  try {
    const now = new Date();
    
    // Find all pending charges past due date
    const overdueCharges = await CreditMaintenanceCharge.find({
      status: 'Pending',
      dueDate: { $lt: now }
    });
    
    console.log(`[Maintenance Worker] Marking ${overdueCharges.length} charges as overdue`);
    
    for (const charge of overdueCharges) {
      await charge.markAsOverdue();
    }
    
    return {
      success: true,
      markedOverdue: overdueCharges.length
    };
    
  } catch (error) {
    console.error('[Maintenance Worker] Error marking overdue charges:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processDailyMaintenance,
  markOverdueCharges,
  calculateDailyMaintenanceFee,
  createMaintenanceCharge
};
