// utils/queryRetrieval.js
const pinecone = require('./pineconeClient');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  
// Function to query Pinecone for relevant document chunks
async function queryPinecone(query) {
  // Generate an embedding for the query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
  });
  
  const queryEmbedding = response.data.data[0].embedding;

  // Query Pinecone with the generated embedding
  const index = pinecone.Index('paai-sou-document-klimat');
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 5,  // Retrieve the top 5 most relevant chunks
    includeMetadata: true,
  });

  // Return the relevant metadata from Pinecone
  return queryResponse.matches.map(match => match.metadata);
}

module.exports = { queryPinecone };
