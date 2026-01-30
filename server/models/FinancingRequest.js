const mongoose = require('mongoose');

const financingRequestSchema = new mongoose.Schema({
  pspId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PSPProfile',
    required: true
  },
  orderReference: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  
  // Status tracking (async workflow)
  status: {
    type: String,
    enum: ['Pending', 'Validated', 'Disbursed', 'Repaid', 'Rejected', 'Failed'],
    default: 'Pending'
  },
  
  // Timeline
  validatedAt: Date,
  disbursedAt: Date,
  dueDate: Date,
  repaidAt: Date,
  
  // Interest tracking (copied from PSPProfile at disbursement)
  utilizedBips: Number,
  unutilizedBips: Number,
  approvedAmount: Number, // Total credit line at time of financing
  
  // Repayment tracking
  repaymentTxHash: String,
  actualInterestPaid: Number,
  expectedInterestAtRepayment: Number,
  
  // Blockchain
  txHash: String,
  contractAddress: String,
  
  // External PSP tracking
  isExternalPSP: {
    type: Boolean,
    default: false
  },
  externalOrderId: {
    type: String,
    default: null
  },
  
  // Error handling
  rejectionReason: String,
  failureReason: String
}, {
  timestamps: true
});

// Virtual: Days elapsed since disbursement
financingRequestSchema.virtual('daysElapsed').get(function() {
  if (!this.disbursedAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.disbursedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: Accrued interest calculation
financingRequestSchema.virtual('accruedInterest').get(function() {
  if (!this.disbursedAt || !this.utilizedBips || !this.unutilizedBips) {
    return { utilized: 0, unutilized: 0, total: 0, days: 0 };
  }
  
  const days = this.daysElapsed;
  const utilized = (this.amount * this.utilizedBips * days) / (10000 * 365);
  const unutilized = ((this.approvedAmount - this.amount) * this.unutilizedBips * days) / (10000 * 365);
  
  return {
    utilized: Math.round(utilized * 100) / 100,
    unutilized: Math.round(unutilized * 100) / 100,
    total: Math.round((utilized + unutilized) * 100) / 100,
    days
  };
});

// Ensure virtuals are included in JSON
financingRequestSchema.set('toJSON', { virtuals: true });
financingRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinancingRequest', financingRequestSchema);
