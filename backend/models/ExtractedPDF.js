const mongoose = require('mongoose');

const ExtractedPDFSchema = new mongoose.Schema({
    originalDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcessedDocument',
        required: true,
    },
    sectionIndex: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    metadata: {
        type: Object,
    },
}, { timestamps: true });

module.exports = mongoose.model('ExtractedPDF', ExtractedPDFSchema);
