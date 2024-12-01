const processAndStoreDocument = require('../utils/processDocument'); 
const mongoose = require('mongoose');
require('dotenv').config();

async function runTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB.');

    // Simulated raw text (replace with actual text for a realistic test)
    const rawText = `
      This is a sample document.
      Section 1: Environment laws are important.
      Section 2: Climate change policies affect various sectors.
    `;
    const documentId = 'test-doc-001'; // Simulated document ID
    const link = 'http://example.com/sample.pdf'; // Simulated PDF link
    const title = 'Sample Document'; // Simulated title

    console.log(`Starting process for document: ID=${documentId}, Title=${title}`);

    // Run the process and store function
    await processAndStoreDocument(documentId, rawText, link, title);

    console.log('Test completed successfully.');
  } catch (error) {
    console.error(`Error during test: ${error.message}`);
    console.error(error.stack);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTest();
