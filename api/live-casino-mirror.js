import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Pull secure keys from Vercel
    const scraperApiKey = process.env.SCRAPER_API_KEY; 
    const targetUrl = process.env.TARGET_CASINO_URL; 

    if (!scraperApiKey || !targetUrl) {
      return res.status(500).json({ error: 'Missing Environment Variables in Vercel' });
    }

    // 2. The Speed Fix: We removed '&render=true' to prevent the 30-second timeout.
    // This grabs the raw HTML instantly via the proxy network.
    const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;

    // Set a strict 10-second timeout so Vercel doesn't crash blindly
    const { data: html } = await axios.get(apiUrl, { timeout: 10000 }); 
    const $ = cheerio.load(html);
    
    // 3. Extract the data using our generic selectors
    const liveGames = [];
    
    $('.game-card, .casino-game, [class*="game"]').each((index, element) => {
      liveGames.push({
        title: $(element).find('h3, .title, [class*="title"]').text().trim() || `Game ${index + 1}`
      });
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      balance: $('.balance, .account-balance, [class*="balance"]').first().text().trim() || 'Hidden',
      data: liveGames
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Live Scraping Pipeline Failed',
      details: error.message 
    });
  }
}

// Triggering a fresh build for the live Fast Fetch pipeline
