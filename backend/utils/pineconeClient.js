const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const initializePinecone = async () => {
  try {
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log('Pinecone client initialized successfully.');
    return pc; // Return the client
  } catch (error) {
    console.error('Error initializing Pinecone client:', error);
    throw error;
  }
};

module.exports = initializePinecone;
