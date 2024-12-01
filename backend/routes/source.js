// routes/source.js
const express = require('express');
const Source = require('../models/Source');

const router = express.Router();

// POST route to create a new source
router.post('/create', async (req, res) => {
  const { sourceName, sourceType, apiUrl } = req.body;

  try {
    // Create and save the new source
    const newSource = new Source({ sourceName, sourceType, apiUrl });
    await newSource.save();

    res.status(201).json({ message: 'Source created successfully', source: newSource });
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({ error: 'Failed to create source' });
  }
});

module.exports = router;
