const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Account = require('../models/Account');  // Import Account model to fetch account details
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    const { username, password, accountName } = req.body;

    try {
        // Check if the user already exists in the database
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Find the account by name (or handle account assignment as necessary)
        const account = await Account.findOne({ name: accountName });
        if (!account) {
            return res.status(400).json({ message: 'Account not found' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document and save it to MongoDB
        user = new User({
            username,
            password: hashedPassword,
            account: account._id,  // Link user to the account
            totalTokens: 20000  // Set default token value when registering
        });
        await user.save();

        // Add the user to the account's user list
        account.users.push(user._id);
        await account.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists in the database
        const user = await User.findOne({ username }).populate('account');  // Populate account to get the ID
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token with account ID in the payload
        const tokenPayload = {
            id: user._id,
            username: user.username,
            account: user.account ? user.account._id : null,  // Include account ID if it exists
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
