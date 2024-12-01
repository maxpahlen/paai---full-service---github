require('dotenv').config(); // Load environment variables from .env file
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const testChunk = "This is a test chunk for embedding.";

async function testEmbedding() {
    try {
        const response = await openai.embeddings.create({
            model: process.env.OPENAI_EMBEDDING_MODEL,
            input: testChunk,
        });
        console.log('Embedding received:', response.data);
    } catch (error) {
        console.error('Error during embedding:', error.response?.data || error.message);
    }
}

testEmbedding();
