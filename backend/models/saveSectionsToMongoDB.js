const ProcessedDocument = require('./ProcessedDocument'); // Adjust path if necessary

/**
 * Save sections of a document to MongoDB.
 * @param {String} documentId - The unique identifier for the document.
 * @param {Array} sections - The array of sections to save.
 * @param {String} link - The link to the original PDF.
 * @param {String} title - The title of the document.
 */
async function saveSectionsToMongoDB(documentId, sections, link, title) {
  try {
    // Check if the document already exists
    const existingDocument = await ProcessedDocument.findOne({ link });
    if (existingDocument) {
      console.log(`Document with link ${link} already exists in MongoDB.`);
      return existingDocument;
    }

    // Create a new document with sections
    const newDocument = new ProcessedDocument({
      title,
      link,
      processedAt: new Date(),
      sections,
    });

    await newDocument.save();
    console.log(`Document with ID ${documentId} and sections saved successfully.`);
    return newDocument;
  } catch (error) {
    console.error(`Error saving sections to MongoDB: ${error.message}`);
    throw error;
  }
}

module.exports = saveSectionsToMongoDB;
