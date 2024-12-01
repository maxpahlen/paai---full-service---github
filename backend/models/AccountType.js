// models/AccountType.js
const mongoose = require('mongoose');

const AccountTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },  // Account type name (e.g., Bronze, Silver)
  tokensAllowed: { type: Number, required: true },  // Tokens allowed for this account type
  memoryLimit: { type: Number, required: true },  // Memory limit (e.g., message storage)
  maxUsers: { type: Number, required: true },  // Maximum number of users allowed for this account type
});

module.exports = mongoose.model('AccountType', AccountTypeSchema);
