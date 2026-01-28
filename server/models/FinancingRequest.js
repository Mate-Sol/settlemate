const mongoose = require('mongoose');

const financingRequestSchema = new mongoose.Schema({
  pspId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PSPProfile',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  orderBookReferenceIds: [String],
  status: {
    type: String,
    enum: ['Pending', 'Validated', 'Approved', 'Disbursed', 'Settled', 'Rejected'],
    default: 'Pending'
  },
  transactionHash: String,  // Blockchain transaction hash
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FinancingRequest', financingRequestSchema);
