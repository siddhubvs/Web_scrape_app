const express = require('express');
const axios = require('axios');
const domino = require('domino');
require('dotenv').config();
const PORT = 4000;

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Google Custom Search API credentials
const api = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX;

// ScrapingBee API credentials
const scrape_api = process.env.SCRAPINGBEE_API_KEY;

// Route to handle the user input and return scraped text
app.post('/scrape', async (req, res) => {
  try {
    const query = req.body.query;

    //Google Custom Search API to get top 5 web page URLs
    const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      query
    )}&key=${api}&cx=${cx}&num=5`;

    const searchResults = await axios.get(googleSearchUrl);
    const urls = searchResults.data.items.map((item) => item.link);

    //ScrapingBee API to scrape text from each URL
    const scrapedTexts = await Promise.all(
      urls.map(async (url) => {
        const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrape_api}&url=${encodeURIComponent(
          url
        )}&render_js=true`;
        try{
        const response = await axios.get(scrapingBeeUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, 
        });
        
        // Create a DOM document object from the HTML content received from ScrapingBee
        const doc = domino.createDocument(response.data);
        
        // Extract the text content from the <body> element of the document
        const text = doc.body.textContent;

        console.log('ScrapingBee Response:', text);
        return text;
        
      }catch (error) {
        console.error('Error:', error.message);
        return 'Scraping failed for this URL';
      }
    })
    )
    
    res.json(scrapedTexts);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
