// routes/account.js
const express = require('express');
const Account = require('../models/Account');
const AccountType = require('../models/AccountType');
const { processAIInteraction } = require('../utils/gpt');  // Import AI interaction logic
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Source = require('../models/Source');
const { fetchDataFromSource } = require('../utils/fetchData');  // Import the fetch utility
const ProcessedDocument = require('../models/ProcessedDocument');  // Import the ProcessedDocument model
const authenticateToken = require('../middleware/auth');



// POST route to fetch data from a linked source
router.post('/fetch-data/:accountId/:sourceId', async (req, res) => {
  const { accountId, sourceId } = req.params;

  try {
    // Fetch the account and source from the database
    const account = await Account.findById(accountId).populate('sources');
    const source = account.sources.find(src => src._id.toString() === sourceId);

    if (!source) {
      return res.status(404).json({ message: 'Source not found for this account' });
    }

    // Fetch data from the external source
    const fetchedData = await fetchDataFromSource(source.apiUrl);

    // Here you could choose to store the fetched data in MongoDB under the account or source

    res.status(200).json({
      message: 'Data fetched successfully',
      source: source.sourceName,
      data: fetchedData
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data from source' });
  }
});

// POST route to link a source to an account
router.post('/link-source/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const { sourceId } = req.body;  // Source ID to link

  try {
    // Find the account and source in the database
    const account = await Account.findById(accountId);
    const source = await Source.findById(sourceId);

    if (!account || !source) {
      return res.status(404).json({ message: 'Account or Source not found' });
    }

    // Check if the source is already linked to the account
    if (account.sources.includes(sourceId)) {
      return res.status(400).json({ message: 'Source already linked to this account' });
    }

    // Add the source to the account's sources
    account.sources.push(sourceId);
    await account.save();

    res.status(200).json({ message: 'Source linked successfully', account });
  } catch (err) {
    console.error('Error linking source to account:', err);
    res.status(500).json({ error: 'Server error linking source to account' });
  }
});

// Route to add a document to an account
router.post('/add-document', async (req, res) => {
  try {
    const { accountId, documentId } = req.body;

    // Find the account by ID
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if the document is already associated with the account
    if (account.documents.includes(documentId)) {
      return res.status(400).json({ message: 'Document already added to account' });
    }

    // Add the document to the account
    account.documents.push(documentId);
    await account.save();

    res.status(200).json({ message: 'Document added to account', account });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding document to account' });
  }
});


// Create a new account with a specific account type
router.post('/create', async (req, res) => {
  const { accountName, accountTypeName } = req.body;

  try {
    // Check if the account type exists
    const accountType = await AccountType.findOne({ name: accountTypeName });
    if (!accountType) {
      return res.status(404).json({ message: 'Account type not found' });
    }

    // Create a new account with the selected account type
    const account = new Account({
      name: accountName,
      accountType: accountType._id,  // Reference to the AccountType
      tokensUsed: 0,
    });

    await account.save();
    res.status(201).json({ message: 'Account created successfully', account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST route to handle AI interaction
router.post('/ai-interaction/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId, userMessage } = req.body;

    // Fetch the account and user from the database
    const account = await Account.findById(accountId);
    const user = await User.findById(userId);

    // Check if the user is linked to the account
    if (!account || !user || !account.users.includes(user._id)) {
      return res.status(403).json({ error: 'User not linked to this account' });
    }

    // Process AI interaction and get the result (without sending the response)
    const result = await processAIInteraction(accountId, userId, userMessage);

    // Set headers and return the full response with tokens, memory, and AI response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(result))); // Explicitly set Content-Length

    // Send the response back to Postman
    res.status(200).json(result);

  } catch (error) {
    console.error('Error handling AI interaction:', error);
    res.status(500).json({ error: 'An error occurred while processing the interaction' });
  }
});

  

// Route to get full conversation history for an account
router.get('/conversation-history/:accountId', async (req, res) => {
  const { accountId } = req.params;

  try {
    // Fetch all conversation turns for the account, including the user who initiated each turn
    const conversationHistory = await Conversation.find({ account: accountId })
      .populate('user', 'username')  // Populate the user details (e.g., username)

    // Send back the full conversation history
    res.json(conversationHistory);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Server error fetching conversation history' });
  }
});


router.get('/token-info', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.user.account).populate('accountType');
    const tokensAllowed = account.accountType.tokensAllowed;
    const tokensUsed = account.tokensUsed;
    const tokensRemaining = tokensAllowed - tokensUsed;

    res.json({ tokensAllowed, tokensUsed, tokensRemaining });
  } catch (error) {
    console.error('Error fetching token info:', error);
    res.status(500).json({ message: 'Error fetching token info' });
  }
});

module.exports = router;
