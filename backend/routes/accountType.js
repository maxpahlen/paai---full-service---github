// routes/accountType.js
const express = require('express');
const AccountType = require('../models/AccountType');
const router = express.Router();

// Create a new account type (e.g., Bronze, Silver)
router.post('/create', async (req, res) => {
  const { name, tokensAllowed, memoryLimit, maxUsers } = req.body;

  try {
    // Check if the account type already exists
    const existingType = await AccountType.findOne({ name });
    if (existingType) {
      return res.status(400).json({ message: 'Account type already exists' });
    }

    // Create and save a new account type
    const accountType = new AccountType({
      name,
      tokensAllowed,
      memoryLimit,
      maxUsers,
    });

    await accountType.save();
    res.status(201).json({ message: 'Account type created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
