const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Regular'], default: 'Regular' },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  invitedBy: { type: String },
  memoryLimit: { type: Number, default: 10 },  // Message memory limit for conversations
  totalTokens: { type: Number, default: 20000 },  // Token limit per month
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
