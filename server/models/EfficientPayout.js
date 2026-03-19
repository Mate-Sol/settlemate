const mongoose = require('mongoose');

const EfficientPayoutSchema = new mongoose.Schema({
  // Use Mixed type to store any JSON structure received
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    headers: mongoose.Schema.Types.Mixed,
    ip: String,
    receivedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { 
  strict: false,
  collection: 'efficent_payouts'
});

module.exports = mongoose.model('EfficientPayout', EfficientPayoutSchema);
