// routes/gpt.js
const express = require('express');
const authenticateToken = require('../middleware/auth');
const { processAIInteraction, getTotalTokensMonth, getConversationHistory } = require('../utils/gpt');
const Account = require('../models/Account');
const router = express.Router();

// Endpoint to get total tokens used for the month
router.get('/total-tokens-month', authenticateToken, async (req, res) => {
  try {
    const tokensInfo = await getTotalTokensMonth(req.user.id);
    res.json(tokensInfo);
  } catch (error) {
    console.error('Error fetching total tokens for the month:', error);
    res.status(500).json({ message: 'Error fetching total tokens' });
  }
});

// Chat endpoint to process AI interaction with memory
router.post('/chat', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  try {
    // Retrieve account and memory limit information
    const account = await Account.findById(req.user.account).populate('accountType');
    const memoryLimit = account.accountType.memoryLimit;

    // Fetch the last 'n' messages based on memory limit
    const conversationHistory = await getConversationHistory(req.user.id, 1, memoryLimit);

    // Prepare memory context
    const memoryContext = conversationHistory.map(message => ({
      role: message.role,
      content: message.content
    }));

    // Pass the memory context to the AI interaction
    const aiResponse = await processAIInteraction(req.user.account, req.user.id, prompt, memoryContext);

    res.json(aiResponse);
  } catch (error) {
    console.error('Error communicating with GPT API:', error);
    res.status(500).json({ message: 'Error communicating with GPT API' });
  }
});

// Endpoint to get conversation history
router.get('/history', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  try {
    const history = await getConversationHistory(req.user.id, page, limit, startDate, endDate);
    res.json(history);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ message: 'Error fetching conversation history' });
  }
});

module.exports = router;
