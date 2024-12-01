// utils/fetchData.js
const axios = require('axios');

/**
 * Fetch data from an external source (API or RSS).
 * @param {string} url - The API or RSS feed URL to fetch data from.
 * @returns {object} The fetched data.
 */
async function fetchDataFromSource(url) {
  try {
    const response = await axios.get(url);
    return response.data;  // Return the data fetched from the source
  } catch (error) {
    console.error('Error fetching data from source:', error);
    throw new Error('Failed to fetch data from source');
  }
}

module.exports = { fetchDataFromSource };
