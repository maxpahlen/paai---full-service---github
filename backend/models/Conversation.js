const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, required: true },  // 'user' or 'gpt'
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: false }, // Optional reference
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Ensure user association
  messages: [MessageSchema],  // Embed messages directly
  prompt: { type: String, required: false },  // Optional
  response: { type: String, required: false },  // Optional
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
