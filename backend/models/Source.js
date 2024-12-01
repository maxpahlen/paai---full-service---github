// models/Source.js
const mongoose = require('mongoose');

const SourceSchema = new mongoose.Schema({
  sourceName: { type: String, required: true },  // Name of the source, e.g., 'Tech News API'
  sourceType: { type: String, required: true },  // Type of source, e.g., 'API', 'RSS'
  apiUrl: { type: String, required: true },      // The URL or endpoint of the source
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Source', SourceSchema);
