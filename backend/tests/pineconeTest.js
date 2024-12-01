const initializePinecone = require('../utils/pineconeClient');

const testPinecone = async () => {
  try {
    const index = await initializePinecone();
    console.log('Pinecone client initialized successfully.');
    console.log('Index details:', index);
  } catch (error) {
    console.error('Error initializing Pinecone client:', error);
  }
};

testPinecone();
