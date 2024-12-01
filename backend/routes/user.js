// routes/user.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Account = require('../models/Account');
const router = express.Router();

// Create a new user and assign them to an account
router.post('/create', async (req, res) => {
  const { username, password, role, accountName } = req.body;

  try {
    // Check if the account exists
    const account = await Account.findOne({ name: accountName });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user and link them to the account
    const user = new User({
      username,
      password: hashedPassword,
      role,
      account: account._id,  // Link the user to the account
    });

    await user.save();

    // Add the user to the account's user list
    account.users.push(user._id);
    await account.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
