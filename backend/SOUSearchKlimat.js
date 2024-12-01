const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ProcessedDocument = require('./models/ProcessedDocument');
let GridFSBucket;

const uri = process.env.MONGODB_URI || 'mongodb+srv://maxpahlen:RYGBQ0RWPdJKauIR@paai.hc8il.mongodb.net/paai?retryWrites=true&w=majority';

mongoose.connect(uri, {
  dbName: 'paai'
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', () => {
  GridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'documentssou' });
});

async function downloadPdf(url, title) {
  // Check if the document with the same URL or title already exists
  const existingDocument = await ProcessedDocument.findOne({ link: url });
  
  if (existingDocument) {
    // console.log(`Document with link ${url} already exists. Skipping download.`);
    return null;  // Indicate that the document was skipped
  }

  // If not found, proceed with download
  const filename = title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
  const pdfPath = path.resolve(__dirname, filename);
  const writer = fs.createWriteStream(pdfPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(pdfPath));
    writer.on('error', reject);
  });
}

async function storePdfInMongoDB(pdfPath, title) {
  const pdfStream = fs.createReadStream(pdfPath);

  return new Promise((resolve, reject) => {
    const uploadStream = GridFSBucket.openUploadStream(title);
    pdfStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
}

async function handleCookiePopup(page) {
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const consentButton = buttons.find(btn =>
        btn.innerText.includes('Acceptera alla') ||
        btn.innerText.includes('Endast nödvändiga') ||
        btn.innerText.includes('Godkänn alla')
      );
      if (consentButton) {
        consentButton.click();
        console.log('Accepted cookie consent.');
      } else {
        console.log('No cookie consent popup found.');
      }
    });
  } catch (error) {
    console.log('Failed to handle cookie consent popup:', error);
  }
}

async function searchClimateLawsSOU() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the main search page
  await page.goto('https://www.sou.gov.se/sok/?query=klimat');

  // Handle cookies on the main page
  await handleCookiePopup(page);

  await page.waitForSelector('.list--block');

  // Click the button to load all results
  await page.evaluate(() => {
    const button = document.evaluate(
      "//button[contains(text(), 'Visa alla avslutade utredningar')]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (button) {
      button.click();
    } else {
      console.log('Button not found!');
    }
  });

  await page.waitForSelector('.list--block');

  // Get the list of documents
  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.list--block a')).map(item => {
      const title = item.innerText || null;
      const link = item.href;

      if (link && !link.startsWith('mailto:') && link.includes('regeringen.se')) {
        return { title, link };
      }
      return null;
    }).filter(result => result !== null);
  });

  // console.log('Results found:', results);

  const newDocuments = [];
  for (const doc of results) {
    const existingDoc = await ProcessedDocument.findOne({ link: doc.link });
    if (!existingDoc) {
      newDocuments.push(doc);
    }
  }

  // console.log('New documents to process:', newDocuments);

 // Process each new document
if (newDocuments.length > 0) {
  for (const doc of newDocuments) {
    try {
      // If it's a direct PDF link, handle it
      if (doc.link.endsWith('.pdf')) {
        // console.log(`Found direct PDF link for '${doc.title}'`);
        
        // Check if the document already exists before downloading
        const existingDocument = await ProcessedDocument.findOne({ link: doc.link });
        if (existingDocument) {
          // console.log(`Document with link ${doc.link} already exists. Skipping download.`);
          continue;  // Skip further processing for this document
        }

        const filename = doc.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
        const pdfPath = await downloadPdf(doc.link, filename);
        
        const pdfFileId = await storePdfInMongoDB(pdfPath, doc.title);
        await ProcessedDocument.create({
          title: doc.title,
          link: doc.link,
          pdfFileId,
          processedAt: new Date(),
        });

        console.log(`New document '${doc.title}' saved to MongoDB`);
        fs.unlinkSync(pdfPath);  // Remove the file after saving to MongoDB

      } else {
        // console.log(`Navigating to document page: '${doc.link}'`);
        await page.goto(doc.link);

        // Handle cookies on the new document page
        await handleCookiePopup(page);

        // Find links that either contain "pdf" in their href or in the text content
        const pdfUrls = await page.evaluate(() => {
          const downloadLinks = Array.from(document.querySelectorAll('a')).filter(link =>
            link.href.includes('.pdf') || link.textContent.toLowerCase().includes('pdf')
          );
          return downloadLinks.map(link => link.href);
        });

        // console.log(`Found ${pdfUrls.length} PDF(s) on page '${doc.title}'`);

        if (pdfUrls.length > 0) {
          let pdfCounter = 1;  // To differentiate between multiple PDFs

          for (const pdfUrl of pdfUrls) {
            // console.log(`Processing PDF: ${pdfUrl}`);

            // Check if the document part already exists before downloading
            const existingPartDocument = await ProcessedDocument.findOne({ link: pdfUrl });
            if (existingPartDocument) {
              // console.log(`PDF part with link ${pdfUrl} already exists. Skipping download.`);
              continue;  // Skip if this part has already been processed
            }

            // Append counter to the file and title if multiple PDFs exist
            const filename = doc.title.replace(/[^a-zA-Z0-9]/g, '_') + `_part_${pdfCounter}.pdf`;
            const uniqueLink = pdfUrl; // Use the PDF URL as the unique link
            const uniqueTitle = `${doc.title} (part ${pdfCounter})`;
            const pdfPath = await downloadPdf(pdfUrl, filename);

            const pdfFileId = await storePdfInMongoDB(pdfPath, uniqueTitle);
            await ProcessedDocument.create({
              title: uniqueTitle,  // Use the unique title for each part
              link: uniqueLink,    // Use the PDF URL as the unique link
              pdfFileId,
              processedAt: new Date(),
            });

            console.log(`Saved PDF '${uniqueTitle}' to MongoDB`);
            fs.unlinkSync(pdfPath);

            pdfCounter++;
          }
        } else {
          // console.log(`No PDFs found for document '${doc.title}'`);
        }
      }
    } catch (err) {
      console.error(`Failed to process document '${doc.title}':`, err);
    }
  }
} else {
  console.log('No new documents to process');
}

await browser.close();
mongoose.connection.close();
}

searchClimateLawsSOU();
