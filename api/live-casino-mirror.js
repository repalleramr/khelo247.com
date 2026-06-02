import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const exactFileName = 'Khelo24bet _ Live Fun Arena for Online Challenges.mht';
    const filePath = path.join(process.cwd(), exactFileName);

    if (!fs.existsSync(filePath)) {
       return res.status(404).json({ success: false, error: 'File stripped by Vercel.' });
    }

    let rawArchiveData = fs.readFileSync(filePath, 'utf-8');
    let cleanHtml = rawArchiveData.replace(/=3D/g, '=').replace(/=\r?\n/g, '');
    const $ = cheerio.load(cleanHtml);

    const extractedData = {
      source: exactFileName,
      balance: $('.balance, .account-balance, [class*="balance"]').first().text().trim() || '0.00',
      liveGames: []
    };

    // Filter strictly for Evolution and Ezugi AND extract the link
    $('.game-card, .casino-game, [class*="game"]').each((index, element) => {
      const cardText = $(element).text().toLowerCase();
      
      if (cardText.includes('evolution') || cardText.includes('ezugi')) {
        const providerName = cardText.includes('evolution') ? 'Evolution' : 'Ezugi';
        
        // Attempt to find the link. It might be on the main element, or inside an <a> tag.
        // Fallback to '#' if the site uses Javascript routers instead of real HTML links.
        let gameLink = $(element).attr('href') || $(element).find('a').attr('href') || $(element).attr('data-url') || '#';

        // If the link is relative (e.g., "/play/123"), append the base casino URL
        if (gameLink.startsWith('/')) {
            gameLink = `https://khelo24bet88.com${gameLink}`;
        }
        
        extractedData.liveGames.push({
          title: $(element).find('h3, .title, [class*="title"]').first().text().trim() || `Live Game ${index + 1}`,
          provider: providerName,
          link: gameLink
        });
      }
    });

    // Safety Fallback (Updated to include dummy links)
    if (extractedData.liveGames.length === 0) {
      extractedData.liveGames = [
        { title: 'Lightning Roulette', provider: 'Evolution', link: 'https://khelo24bet88.com/live-casino' },
        { title: 'Crazy Time', provider: 'Evolution', link: 'https://khelo24bet88.com/live-casino' },
        { title: 'Baccarat Lobby', provider: 'Ezugi', link: 'https://khelo24bet88.com/live-casino' }
      ];
    }

    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: 'Pipeline failed', details: error.message });
  }
}
