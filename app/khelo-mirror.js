import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Expecting the session cookie or token to be sent via custom headers from your client
  const sessionCookie = req.headers['x-session-cookie'];

  if (!sessionCookie) {
    return res.status(401).json({ 
      success: false, 
      error: 'Missing Authentication', 
      message: 'Please provide an active session cookie or token in the x-session-cookie header.' 
    });
  }

  try {
    const targetUrl = 'https://khelo24bet88.com/'; // Replace with the specific evaluation or game dashboard link

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Pass the user's active session cookie directly to the target platform
        'Cookie': sessionCookie, 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 8000 // Prevent serverless function timeout hanging
    });

    const $ = cheerio.load(response.data);
    
    // NOTE: You will need to inspect the network tab on the site to find the exact selectors or API endpoints used.
    // This is a generic extraction template to isolate data points:
    const extractedData = {
      mirroredAt: new Date().toISOString(),
      pageTitle: $('title').text().trim(),
      // Example targets (Adjust these selectors based on the site's profile/game HTML structure)
      userGreeting: $('.user-profile-name, #username, .account-balance').text().trim() || "Authenticated (Selector missing)",
      gamesAvailable: []
    };

    // Example loop for active games or listing sections
    $('.game-item, .card, .lobby-item').each((idx, el) => {
      extractedData.gamesAvailable.push({
        id: idx + 1,
        name: $(el).find('.title, h3, h4').text().trim(),
        link: $(el).find('a').attr('href')
      });
    });

    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('Mirroring Error:', error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to access authenticated mirror target',
      details: error.message,
      hint: 'The session cookie may have expired, or the platform is blocking the Vercel data center IP.'
    });
  }
}
