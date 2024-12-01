const mongoose = require('mongoose');

const TurnSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    userMessage: {
        type: String,
        required: true,
    },
    assistantMessage: {
        type: String,
        required: true,
    },
    userTimestamp: {
        type: Date,
        default: Date.now,
    },
    assistantTimestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Turn', TurnSchema);
