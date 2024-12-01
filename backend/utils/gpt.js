// utils/gpt.js
const mongoose = require('mongoose');
const OpenAI = require('openai');
const Account = require('../models/Account');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const AccountType = require('../models/AccountType');
const Turn = require('../models/Turn');  // Import the Message model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to calculate tokens used (rough estimate)
function calculateTokens(text) {
  return Math.ceil(text.length / 4); // Rough approximation of tokens
}

async function saveTurn(userId, accountId, userMessage, assistantMessage) {
  try {
      const turn = new Turn({
          userId,
          accountId,
          userMessage,
          assistantMessage,
          userTimestamp: new Date(),
          assistantTimestamp: new Date()
      });
      await turn.save();
  } catch (error) {
      console.error('Error saving turn:', error);
  }
}


async function getLastNTurns(userId, memoryLimit) {
    try {
        // Fetch the last 'memoryLimit' turns for this user
        const turns = await Turn.find({ userId })
            .sort({ userTimestamp: -1 })  // Sort in reverse chronological order
            .limit(memoryLimit)  // Limit to the latest 'memoryLimit' turns
            .lean();  // Optional: Use lean() for faster queries if only reading data

        // Reverse the array to restore chronological order
        return turns.reverse();
    } catch (error) {
        console.error('Error fetching last N turns:', error);
        return [];
    }
}



// Function to process AI interaction with memory context
async function processAIInteraction(accountId, userId, userMessage) {
  try {
      // Fetch the user's account and related account type
      const account = await Account.findById(accountId).populate('accountType');
      if (!account) throw new Error('Account not found');

      // Retrieve memory limit from AccountType
      const memoryLimit = account.accountType.memoryLimit;
      const tokensAllowed = account.accountType.tokensAllowed;
      const tokensUsed = account.tokensUsed || 0;

      // Calculate tokens used for the user message
      const userMessageTokens = calculateTokens(userMessage);

      // Check if there are enough tokens available
      if (tokensUsed + userMessageTokens > tokensAllowed) {
          return { message: 'Out of tokens for the month', tokensRemaining: 0 };
      }
      // Fetch the latest 'memoryLimit' turns from the conversation history
      const previousTurns = await getLastNTurns(userId, memoryLimit);
      

      // Transform turns into the format expected by OpenAI
      const contextMessages = [];
      previousTurns.forEach(turn => {
          contextMessages.push({ role: 'user', content: turn.userMessage });
          contextMessages.push({ role: 'assistant', content: turn.assistantMessage });
      });

      // Add the current user message to the context
      contextMessages.push({ role: 'user', content: userMessage });

      // Send the context to OpenAI API and handle response
      const aiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: contextMessages,
          max_tokens: 150,  // Adjust as needed
      });

      const assistantMessage = aiResponse.choices[0].message.content;
      
      // Calculate tokens used for the assistant's response
      const assistantMessageTokens = calculateTokens(assistantMessage);
      const totalTokensUsed = userMessageTokens + assistantMessageTokens;

      // Update tokens used in the account
      account.tokensUsed = tokensUsed + totalTokensUsed;
      await account.save();

      // Save the conversation to the database
      await saveTurn(userId, accountId, userMessage, assistantMessage);

      return {
          response: assistantMessage,
          memory: contextMessages,
          tokensRemaining: tokensAllowed - account.tokensUsed,
          tokensUsed: account.tokensUsed
      };
  } catch (error) {
      console.error('Error in processAIInteraction:', error);
      throw new Error('Error processing AI interaction');
  }
}




async function getTotalTokensMonth(userId) {
  try {
    const user = await User.findById(userId).populate('account');
    if (!user || !user.account) throw new Error('User or account not found');

    const account = await Account.findById(user.account).populate('accountType');
    if (!account) throw new Error('Account not found');

    const tokensAllowed = account.accountType.tokensAllowed;
    const tokensUsed = account.tokensUsed || 0;
    const tokensRemaining = tokensAllowed - tokensUsed;

    return { tokensAllowed, tokensUsed, tokensRemaining };
  } catch (error) {
    console.error('Error in getTotalTokensMonth:', error);
    throw new Error('Error fetching total tokens');
  }
}

async function getConversationHistory(userId, page = 1, limit = 10, startDate, endDate) {
  try {
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const conversations = await Conversation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return conversations;
  } catch (error) {
    console.error('Error in getConversationHistory:', error);
    throw new Error('Error fetching conversation history');
  }
}

module.exports = { processAIInteraction, getTotalTokensMonth, getConversationHistory };
