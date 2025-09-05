#!/usr/bin/env node

/**
 * Google Places Photo Fetcher
 * 
 * This script fetches photos for establishments from Google Places API
 * and saves them locally using UUID filenames.
 * 
 * Usage:
 *   node scripts/fetch-google-photos.js --limit 10 --force
 *   node scripts/fetch-google-photos.js --place-id ChIJxxx --verbose
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { Client } = require('pg');

// Configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const IMAGES_DIR = path.join(__dirname, '../../storage/uploads/establishments');

// Command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.findIndex(arg => arg === `--${name}`);
  return index !== -1 ? args[index + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit')) || 50;
const SPECIFIC_PLACE_ID = getArg('place-id');
const FORCE_REFETCH = hasFlag('force');
const VERBOSE = hasFlag('verbose');

// Ensure images directory exists
async function ensureImagesDir() {
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log(`📁 Created images directory: ${IMAGES_DIR}`);
  }
}

// Database connection
async function createDbConnection() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });
  await client.connect();
  return client;
}

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath);
    
    https.get(url, (response) => {
      // Handle redirects (302, 301, etc.)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        require('fs').unlink(filepath, () => {}); // Clean up
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        require('fs').unlink(filepath, () => {}); // Clean up on error
        reject(err);
      });
    }).on('error', reject);
  });
}

// Get photo URL from Google Places API
async function getPhotoUrl(photoReference, maxWidth = 800) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?` +
    `photoreference=${photoReference}&` +
    `maxwidth=${maxWidth}&` +
    `key=${GOOGLE_PLACES_API_KEY}`;
  
  return url;
}

// Get place details with photos from Google Places API
async function getPlacePhotos(placeId) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=photos&` +
      `key=${GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK' && result.result?.photos) {
            resolve(result.result.photos);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Process a single establishment
async function processEstablishment(client, establishment) {
  const { id, name, place_id, uuid, local_image_url } = establishment;
  
  if (local_image_url && !FORCE_REFETCH) {
    if (VERBOSE) console.log(`⏭️  Skipping ${name} - already has image`);
    return { success: false, reason: 'already_has_image' };
  }
  
  try {
    console.log(`\n🔍 Processing: ${name}`);
    console.log(`   📍 Place ID: ${place_id}`);
    console.log(`   🆔 UUID: ${uuid}`);
    
    // Get photos from Google Places API
    const photos = await getPlacePhotos(place_id);
    
    if (!photos || photos.length === 0) {
      console.log(`   ❌ No photos found`);
      return { success: false, reason: 'no_photos' };
    }
    
    console.log(`   📸 Found ${photos.length} photos`);
    
    // Use the first photo
    const firstPhoto = photos[0];
    const photoUrl = await getPhotoUrl(firstPhoto.photo_reference);
    
    // Determine file extension (default to .jpg)
    const extension = '.jpg';
    const filename = `${uuid}${extension}`;
    const filepath = path.join(IMAGES_DIR, filename);
    const relativeUrl = `/images/establishments/${filename}`;
    
    console.log(`   ⬇️  Downloading to: ${filename}`);
    
    // Download the image
    await downloadImage(photoUrl, filepath);
    
    // Update database
    await client.query(
      'UPDATE public.establishments SET local_image_url = $1, image_fetched_at = NOW() WHERE id = $2',
      [relativeUrl, id]
    );
    
    console.log(`   ✅ Success: ${relativeUrl}`);
    
    return { 
      success: true, 
      filename, 
      relativeUrl,
      photoCount: photos.length 
    };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${name}:`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Main execution
async function main() {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required');
    process.exit(1);
  }
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  console.log('🚀 Google Places Photo Fetcher');
  console.log(`📊 Settings:`);
  console.log(`   🎯 Limit: ${SPECIFIC_PLACE_ID ? '1 (specific place)' : LIMIT}`);
  console.log(`   🔄 Force refetch: ${FORCE_REFETCH}`);
  console.log(`   📝 Verbose: ${VERBOSE}`);
  console.log(`   📁 Images directory: ${IMAGES_DIR}`);
  
  await ensureImagesDir();
  
  const client = await createDbConnection();
  console.log('✅ Database connected');
  
  try {
    let query;
    let params = [];
    
    if (SPECIFIC_PLACE_ID) {
      query = `
        SELECT id, name, place_id, uuid, local_image_url 
        FROM public.establishments 
        WHERE place_id = $1
      `;
      params = [SPECIFIC_PLACE_ID];
    } else {
      const whereClause = FORCE_REFETCH ? '' : 'WHERE local_image_url IS NULL';
      query = `
        SELECT id, name, place_id, uuid, local_image_url 
        FROM public.establishments 
        ${whereClause}
        ORDER BY rating DESC NULLS LAST, user_ratings_total DESC NULLS LAST
        LIMIT $1
      `;
      params = [LIMIT];
    }
    
    const result = await client.query(query, params);
    const establishments = result.rows;
    
    console.log(`\n📋 Found ${establishments.length} establishments to process`);
    
    if (establishments.length === 0) {
      console.log('✅ No establishments need photo fetching');
      return;
    }
    
    // Process each establishment
    const results = {
      success: 0,
      alreadyHasImage: 0,
      noPhotos: 0,
      errors: 0
    };
    
    for (let i = 0; i < establishments.length; i++) {
      const establishment = establishments[i];
      console.log(`\n[${i + 1}/${establishments.length}]`);
      
      const result = await processEstablishment(client, establishment);
      
      if (result.success) {
        results.success++;
      } else {
        switch (result.reason) {
          case 'already_has_image':
            results.alreadyHasImage++;
            break;
          case 'no_photos':
            results.noPhotos++;
            break;
          default:
            results.errors++;
        }
      }
      
      // Rate limiting: wait 100ms between requests
      if (i < establishments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully fetched: ${results.success}`);
    console.log(`   ⏭️  Already had images: ${results.alreadyHasImage}`);
    console.log(`   📷 No photos available: ${results.noPhotos}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    
  } finally {
    await client.end();
    console.log('\n🎯 Complete!');
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main().catch(console.error);
