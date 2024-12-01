const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },  // Account name (e.g., organization name)
  accountType: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountType', required: true },  // Reference to AccountType
  tokensUsed: { type: Number, default: 0 },  // Tokens used so far by this account
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // References to users connected to this account
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProcessedDocument' }],  // Dynamic reference to documents
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }],  // Array of sources the account is linked to
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Account', AccountSchema);
