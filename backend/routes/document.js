const express = require('express');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const { embedAndStoreInPinecone } = require('../utils/embeddingPipeline');
const ProcessedDocument = require('../models/ProcessedDocument');
const ExtractedPDF = require('../models/ExtractedPDF'); // Add the new model


const router = express.Router();

// Initialize GridFSBucket
const connection = mongoose.connection;
let gfsBucket;
connection.once('open', () => {
    gfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
        bucketName: 'documentssou' // Ensure this matches the bucketName used in GridFS
    });
});

// Function to store a document's sections in MongoDB and Pinecone
// Fetch, clean, split, and store a document
const storeDocument = async (documentId) => {
    try {
        const doc = await ProcessedDocument.findById(documentId);
        if (!doc || !doc.pdfFileId) {
            throw new Error('Document or PDF not found');
        }

        const { title, link } = doc;

        // Fetch the PDF file
        const downloadStream = gfsBucket.openDownloadStream(doc.pdfFileId);
        const buffer = await new Promise((resolve, reject) => {
            const chunks = [];
            downloadStream.on('data', (chunk) => chunks.push(chunk));
            downloadStream.on('error', reject);
            downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Extract text
        const data = await pdfParse(buffer);
        const rawText = data.text;

        // Clean and split the text
        const cleanedText = cleanText(rawText);
        if (!cleanedText) throw new Error('Failed to clean text from PDF.');

        const sections = splitTextIntoSections(cleanedText);
        if (!sections || !sections.length) throw new Error('Failed to split text into sections.');

        // console.log('Cleaned Text:', cleanedText);
        // console.log('Sections:', sections);


        // Save extracted sections to the new "ExtractedPDFs" collection
        const extractedSections = await Promise.all(
            sections.map(async (section, index) => {
                const uniqueTitle = `${title} (Section ${index + 1})`;
                return await ExtractedPDF.create({
                    originalDocumentId: documentId,
                    sectionIndex: index,
                    text: section,
                    title: uniqueTitle,
                });
            })
        );

        // Store sections in Pinecone
        await embedAndStoreInPinecone(extractedSections);

        console.log('Document sections stored successfully in Pinecone and MongoDB.');
        return { message: 'Document stored successfully' };
    } catch (error) {
        console.error('Error storing document:', error);
        throw error;
    }
};



// Clean text function (if not already defined in another file)
function cleanText(text) {
  return text
      // Remove page numbers formatted as "2 (6)", "3 (6)", etc.
      .replace(/\n?\d+ \(\d+\)\n?/g, '\n') 
      // Remove lines starting with metadata patterns, like "Dir. 2024:31" or department names ending with "departementet"
      .replace(/^\s*(Dir\.\s+\d{4}:\d+|.*departementet|.*myndigheten|.*proposition)\s*$/gim, '')
      // Replace multiple newlines with a single newline
      .replace(/\n{2,}/g, '\n')  
      // Replace multiple spaces with a single space
      .replace(/[ \t]{2,}/g, ' ')
      .trim();  // Remove leading and trailing whitespace
}

// Split text into sections
const splitTextIntoSections = (text, maxTokens = 1000) => {
    const words = text.split(' ');
    const sections = [];
    let currentSection = [];
    let currentTokenCount = 0;

    for (const word of words) {
        currentSection.push(word);
        currentTokenCount += word.length + 1; // Approximate token count

        if (currentTokenCount >= maxTokens) {
            sections.push(currentSection.join(' '));
            currentSection = [];
            currentTokenCount = 0;
        }
    }

    if (currentSection.length > 0) {
        sections.push(currentSection.join(' '));
    }

    return sections;
};

// Route to trigger storing a document
router.post('/store/:documentId', async (req, res) => {
    const { documentId } = req.params;
    try {
        await storeDocument(documentId);
        res.status(200).send('Document stored successfully.');
    } catch (error) {
        res.status(500).send('Error storing document: ' + error.message);
    }
});

module.exports = router;
