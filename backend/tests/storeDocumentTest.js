const initializePinecone = require('../utils/pineconeClient');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const testUpsert = async () => {
  try {
    const index = await initializePinecone();

    // Sample text to embed
    const texts = [
      'This is a sample text for drama genre.',
      'This is a sample text for action genre.',
    ];

    // Generate embeddings using OpenAI
    const embeddingResponses = await Promise.all(
      texts.map(async (text) => {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-large', // Use OpenAI embedding model
          input: text,
        });
        return response.data[0].embedding;
      })
    );

    // Prepare vectors for upsert
    const vectors = embeddingResponses.map((embedding, index) => ({
      id: `vec${index + 1}`,
      values: embedding,
      metadata: { genre: index === 0 ? 'drama' : 'action' }, // Add metadata
    }));

    // Perform the upsert operation
    await index.namespace('test-namespace').upsert(vectors);
    console.log('Upsert completed successfully.');
  } catch (error) {
    console.error('Error during upsert operation:', error);
  }
};

testUpsert();
