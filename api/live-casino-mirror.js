import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Hardcode the exact filename so Vercel includes it in the build
    const exactFileName = 'Khelo24bet _ Live Fun Arena for Online Challenges.mht';
    
    // 2. Point directly to the file in the root directory
    const filePath = path.join(process.cwd(), exactFileName);

    // 3. Check that Vercel successfully bundled it
    if (!fs.existsSync(filePath)) {
       return res.status(404).json({ 
         success: false,
         error: 'File stripped by Vercel.', 
         message: `Vercel could not find the file. Ensure the name matches exactly: ${exactFileName}` 
       });
    }

    // 4. Read the raw data directly from the file system
    let rawArchiveData = fs.readFileSync(filePath, 'utf-8');

    // 5. Clean up the MHT encoding so Cheerio can read it
    let cleanHtml = rawArchiveData.replace(/=3D/g, '=');
    cleanHtml = cleanHtml.replace(/=\r?\n/g, '');

    // 6. Load the cleaned HTML into Cheerio
    const $ = cheerio.load(cleanHtml);

    // 7. Extract the data
    const extractedData = {
      source: exactFileName,
      balance: $('.balance, .account-balance, [class*="balance"]').first().text().trim() || '0.00',
      liveGames: []
    };

    // Extract game list based on generic wrapper classes
    $('.game-card, .casino-game, [class*="game"]').each((index, element) => {
      extractedData.liveGames.push({
        title: $(element).find('h3, .title, [class*="title"]').text().trim() || `Game ${index + 1}`
      });
    });

    // 8. Return the payload instantly
    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process offline MHT file',
      details: error.message
    });
  }
}

// Reverting to the reliable offline .mht file to populate the frontend UI instantly.
