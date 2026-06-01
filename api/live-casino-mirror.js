import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Get the root directory of your Vercel project
    const rootDir = process.cwd();

    // 2. Read all the files sitting in the root folder
    const files = fs.readdirSync(rootDir);

    // 3. Find the .mht file from your screenshot
    const targetFileName = files.find(file => file.endsWith('.mht'));

    if (!targetFileName) {
       return res.status(404).json({ 
         success: false,
         error: 'Offline MHT file not found.', 
         message: 'Could not find the .mht file in the GitHub repository.' 
       });
    }

    // 4. Read the raw data directly from the file system
    const filePath = path.join(rootDir, targetFileName);
    let rawArchiveData = fs.readFileSync(filePath, 'utf-8');

    // 5. CRITICAL FIX: Clean up the MHT "quoted-printable" encoding 
    // MHT files replace "=" with "=3D" and add random line breaks ("=\n"). 
    // We must reverse this before Cheerio can read the classes.
    let cleanHtml = rawArchiveData.replace(/=3D/g, '=');
    cleanHtml = cleanHtml.replace(/=\r?\n/g, '');

    // 6. Load the cleaned HTML into Cheerio
    const $ = cheerio.load(cleanHtml);

    // 7. Extract the data
    const extractedData = {
      source: targetFileName,
      // Grabs the first thing that looks like a balance
      balance: $('.balance, .account-balance, [class*="balance"]').first().text().trim() || 'Balance element not found',
      liveGames: []
    };

    // Extract game list based on generic wrapper classes
    $('.game-card, .casino-game, [class*="game"]').each((index, element) => {
      extractedData.liveGames.push({
        title: $(element).find('h3, .title, [class*="title"]').text().trim() || `Game ${index + 1}`
      });
    });

    // 8. Return the payload
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
