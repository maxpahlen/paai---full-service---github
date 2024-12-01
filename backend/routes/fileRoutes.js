const express = require('express');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const ProcessedDocument = require('../models/ProcessedDocument'); 
const OpenAI = require('openai');

const router = express.Router();

// Function to split long text into smaller chunks
function splitText(text, maxChunkLength = 12000) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxChunkLength;
        // Ensure we split at the last space to avoid breaking words
        if (end < text.length) {
            end = text.lastIndexOf(' ', end);
        }
        // Push the chunk to the array
        chunks.push(text.slice(start, end));
        // Move the start position forward
        start = end;
    }

    return chunks;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateSummary(text) {
    try {
        // Split the text into smaller chunks if needed
        const textChunks = splitText(text);

        // Summarize each chunk individually
        const chunkSummaries = [];
        for (const chunk of textChunks) {
            const chunkSummaryResponse = await openai.chat.completions.create({
                model: 'gpt-4', 
                messages: [{ role: 'user', content: `Summarize the following text: ${chunk}` }],
                max_tokens: 1000, // Adjust based on the desired summary length for each chunk
            });

            const chunkSummary = chunkSummaryResponse.choices[0].message.content;
            chunkSummaries.push(chunkSummary);
        }

        // Now, summarize the combined summaries of each chunk
        const finalSummaryResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: `Combine the following summaries into one cohesive summary: ${chunkSummaries.join(' ')}` }],
            max_tokens: 1000, // Adjust based on the desired final summary length
        });

        const finalSummary = finalSummaryResponse.choices[0].message.content;
        return finalSummary;

    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary");
    }
}

// Initialize GridFSBucket
const connection = mongoose.connection;
let gfsBucket;
connection.once('open', () => {
    gfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
        bucketName: 'documentssou' // Ensure this matches the bucketName used in GridFS
    });
});

// Route to fetch and serve PDF by its ID
router.get('/file/pdf/:id', async (req, res) => {
    try {
        const documentId = req.params.id;

        // Find the document to get its pdfFileId
        const doc = await ProcessedDocument.findById(documentId);
        if (!doc || !doc.pdfFileId) {
            return res.status(404).json({ message: 'Document or PDF not found' });
        }

        // Use GridFSBucket to open a download stream by pdfFileId
        const downloadStream = gfsBucket.openDownloadStream(doc.pdfFileId);

        downloadStream.on('error', (err) => {
            console.error('GridFSBucket Error:', err);
            return res.status(500).json({ message: 'Error retrieving PDF' });
        });

        res.set('Content-Type', 'application/pdf');
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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

// Route to extract text from PDF by document ID
router.get('/extract-text/:id', async (req, res) => {
    try {
        const documentId = req.params.id;

        // Find the document to get its pdfFileId
        const doc = await ProcessedDocument.findById(documentId);
        if (!doc || !doc.pdfFileId) {
            return res.status(404).json({ message: 'Document or PDF not found' });
        }

        // Use GridFSBucket to open a download stream by pdfFileId
        const downloadStream = gfsBucket.openDownloadStream(doc.pdfFileId);

        // Convert stream to buffer and extract text
        const buffer = await new Promise((resolve, reject) => {
            const chunks = [];
            downloadStream.on('data', (chunk) => chunks.push(chunk));
            downloadStream.on('error', reject);
            downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Extract and clean text from PDF buffer
        const data = await pdfParse(buffer);
        const rawText = data.text;
        const cleanedText = cleanText(rawText);  // Apply the cleanup function

        // Generate a summary of the cleaned text
        const summary = await generateSummary(cleanedText);

        console.log('Extracted and summarized text');  // Optional: Log for debugging
        res.json({
            extractedText: cleanedText,
            summary: summary,
        });
    } catch (error) {
        console.error('Error extracting text and generating summary:', error);
        res.status(500).json({ message: 'Failed to extract text and generate summary', error });
    }
});

module.exports = router;
