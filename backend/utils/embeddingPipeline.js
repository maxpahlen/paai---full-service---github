const initializePinecone = require('./pineconeClient');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chunkText = (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Invalid text input to chunkText. Expected a non-empty string.');
  }
  const chunkSize = 500; // Adjust chunk size as needed
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};


const embedAndStoreInPinecone = async (textChunks, metadata) => {
  try {
    console.log('Initializing Pinecone client...');
    const pineconeClient = await initializePinecone();
    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME);

    const chunkedTexts = textChunks
      .filter(chunk => chunk.text && typeof chunk.text === 'string')
      .flatMap(chunk => chunkText(chunk.text));

    const validChunks = chunkedTexts.filter(text => typeof text === 'string' && text.trim().length > 0);

    if (validChunks.length === 0) {
      console.error('No valid text chunks to process. Ensure input text is correctly chunked.');
      throw new Error('No valid text chunks to process for embeddings.');
    }

    const embeddings = [];
    const skippedChunks = []; // Track skipped chunks

    for (let i = 0; i < validChunks.length; i++) {
      try {
        console.log(`Processing chunk ${i + 1}/${validChunks.length}: Length ${validChunks[i].length}`);
        const response = await openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL,
          input: validChunks[i],
        });
        if (response.data?.data?.[0]?.embedding) {
          embeddings.push({
            embedding: response.data.data[0].embedding,
            chunk: validChunks[i],
            index: i,
          });
        } else {
          console.warn(`No embedding returned for chunk at index ${i}`);
          skippedChunks.push(validChunks[i]);
        }
      } catch (err) {
        console.error(`Error embedding chunk at index ${i}:`, err.message);
        skippedChunks.push(validChunks[i]);
      }
    }

    if (embeddings.length === 0) {
      throw new Error('Failed to retrieve embeddings for all chunks.');
    }

    console.log('Upserting vectors to Pinecone...');
    const vectors = embeddings.map(({ embedding, chunk, index }) => ({
      id: `${metadata.documentId}-chunk-${index}`,
      values: embedding,
      metadata: {
        ...metadata,
        chunkIndex: index,
        text: chunk, // Save the chunk text for context
      },
    }));

    await index.upsert({ vectors });
    console.log('Vectors upserted successfully.');

    if (skippedChunks.length > 0) {
      console.warn('The following chunks were skipped due to errors:', skippedChunks);
    }
  } catch (error) {
    console.error('Error in embedAndStoreInPinecone:', error);
    throw error;
  }
};

module.exports = { embedAndStoreInPinecone };
