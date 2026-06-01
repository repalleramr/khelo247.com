import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Allow cross-origin requests from your evaluation game client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const targetUrl = 'https://quotes.toscrape.com/';
    
    // 1. Fetch raw HTML from the safe target site
    const { data: html } = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
      }
    });

    // 2. Load HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    const gameQuestions = [];

    // 3. Loop through each quote block on the page
    $('.quote').each((index, element) => {
      const quoteText = $(element).find('.text').text().replace(/[“”]/g, '').trim();
      const author = $(element).find('.author').text().trim();
      
      // Extract tags associated with the quote to use as game hints/categories
      const tags = [];
      $(element).find('.tags .tag').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      // Format the data structure to look like a trivia evaluation game asset
      gameQuestions.push({
        id: index + 1,
        question: `Who said: "${quoteText}"?`,
        correctAnswer: author,
        hints: tags
      });
    });

    // 4. Return the structured game data payload
    return res.status(200).json({
      success: true,
      source: targetUrl,
      mirroredAt: new Date().toISOString(),
      totalQuestions: gameQuestions.length,
      data: gameQuestions
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to extract evaluation assets', 
      message: error.message 
    });
  }
}
