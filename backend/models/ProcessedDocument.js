const mongoose = require('mongoose');

// Define the schema for each section
const SectionSchema = new mongoose.Schema({
  sectionIndex: { type: Number, required: true },
  text: { type: String, required: true },
});

// Main schema for processed documents
const processedDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // Document title
  link: { type: String, required: true, unique: true }, // PDF link
  pdfFileId: { type: mongoose.Schema.Types.ObjectId, required: false }, // Optional file reference
  processedAt: { type: Date, default: Date.now }, // Timestamp for when the document was processed
  sections: { type: [SectionSchema], required: false }, // Array of document sections
});

// Create the Mongoose model
const ProcessedDocument = mongoose.model('ProcessedDocument', processedDocumentSchema, 'processeddocuments');

module.exports = ProcessedDocument;
