import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Pull sensitive data from Vercel's secure Environment Variables, NOT the code.
    const scraperApiKey = process.env.SCRAPER_API_KEY; 
    const targetUrl = process.env.TARGET_CASINO_URL; 

    if (!scraperApiKey || !targetUrl) {
      return res.status(500).json({ error: 'Missing Environment Variables in Vercel' });
    }

    // 2. Route the request through ScraperAPI to bypass WAF blocks
    // Added &render=true because the casino uses JavaScript to load the games
    const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;

    const { data: html } = await axios.get(apiUrl, { timeout: 30000 }); // Render requests take longer
    const $ = cheerio.load(html);
    
    // 3. Extract the data (You will need to inspect the target site's HTML to find these exact class names)
    const liveGames = [];
    
    // Example: Replace '.game-card-class' with the actual HTML class used by the site
    $('.game-card-class').each((index, element) => {
      liveGames.push({
        title: $(element).find('.title-class').text().trim(),
        provider: $(element).find('.provider-class').text().trim(),
      });
    });

    return res.status(200).json({
      success: true,
      data: liveGames
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Scraping pipeline failed',
      details: error.message 
    });
  }
}
