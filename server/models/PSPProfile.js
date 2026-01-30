const mongoose = require('mongoose');

const pspProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Company Information
  companyName: {
    type: String,
    required: true
  },
  registrationNo: String,
  country: String,
  yearEstablished: Number,
  keyContact: {
    name: String,
    email: String,
    phone: String
  },
  uboDetails: String,
  pepExposure: Boolean,
  
  // Business Operations
  sector: String,
  keyProducts: [String],
  topCustomers: [String],
  topSuppliers: [String],
  transactionVolume: String,
  
  // Financial Information
  annualRevenue: Number,
  outstandingLoans: Number,
  bankAccount: {
    bankName: String,
    accountNumber: String,
    swiftCode: String
  },
  defaultHistory: String,
  
  // KYC Documents
  kycDocuments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Approved credit line details
  approvedAmount: {
    type: Number,
    default: 0
  },
  currentlyUtilized: {
    type: Number,
    default: 0,
    min: 0
  },
  creditLineStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Suspended'],
    default: 'Pending'
  },
  requestedAmount: Number,
  requestedDuration: Number,
  
  // Approved Credit Line
  approvedDuration: Number,
  utilizedBips: Number,
  unutilizedBips: Number,
  
  // Blockchain Integration
  walletAddress: String,
  assignedPoolAddress: String,  // Deployed CreditLinePool contract address
  
  // Credit Maintenance Charges (Weekly)
  lastMaintenanceChargeDate: {
    type: Date,
    default: null
  },
  maintenanceChargeFrequency: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'weekly'
  },
  accumulatedMaintenanceFee: {
    type: Number,
    default: 0
  },
  nextMaintenanceDueDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
pspProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PSPProfile', pspProfileSchema);
