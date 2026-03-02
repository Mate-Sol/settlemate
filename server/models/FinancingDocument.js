const mongoose = require('mongoose');

const financingDocumentSchema = new mongoose.Schema({
    pspId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PSPProfile',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Company Identity & Legal',
            'Financials & Banking',
            'Operational Settlement Data',
            'Risk & Legal'
        ]
    },
    name: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        required: true
    },
    fileContent: {
        type: String, // Store as Base64 string
        required: true
    },
    fileType: String,
    fileSize: Number, // In bytes
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FinancingDocument', financingDocumentSchema);
