#!/usr/bin/env node

/**
 * S3 Image Upload Script
 * 
 * Uploads local establishment images to S3 and updates database with S3 URLs
 * 
 * Usage:
 *   node scripts/upload-to-s3.js --bucket trustdiner-images --limit 100
 *   node scripts/upload-to-s3.js --uuid e106d712-58f9-4293-9e01-5dde818ec9ac --verbose
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Client } = require('pg');

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const IMAGES_DIR = path.join(__dirname, '../../storage/uploads/establishments');

// Command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.findIndex(arg => arg === `--${name}`);
  return index !== -1 ? args[index + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const BUCKET_NAME = getArg('bucket') || 'trustdiner-images';
const LIMIT = parseInt(getArg('limit')) || 100;
const SPECIFIC_UUID = getArg('uuid');
const FORCE_REUPLOAD = hasFlag('force');
const VERBOSE = hasFlag('verbose');
const USE_SIGNED_URLS = hasFlag('signed-urls');

// S3 Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Database connection
async function createDbConnection() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });
  await client.connect();
  return client;
}

// Check if file exists in S3
async function fileExistsInS3(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Upload file to S3
async function uploadToS3(filepath, key, contentType = 'image/jpeg') {
  const fileContent = await fs.readFile(filepath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
    Metadata: {
      'uploaded-by': 'trustdiner-upload-script',
      'upload-date': new Date().toISOString(),
    },
  });
  
  const result = await s3Client.send(command);
  return result;
}

// Generate S3 URL (public or signed)
function generateS3Url(key, useSignedUrl = false) {
  if (useSignedUrl) {
    // For signed URLs, you would use getSignedUrl with GetObjectCommand
    // For now, return the structure
    return `s3-signed://${BUCKET_NAME}/${key}`;
  } else {
    // Public URL format
    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }
}

// Get content type from file extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return types[ext] || 'image/jpeg';
}

// Process a single establishment
async function processEstablishment(client, establishment) {
  const { id, name, uuid, local_image_url, s3_image_url } = establishment;
  
  if (!local_image_url) {
    if (VERBOSE) console.log(`⏭️  Skipping ${name} - no local image`);
    return { success: false, reason: 'no_local_image' };
  }
  
  if (s3_image_url && !FORCE_REUPLOAD) {
    if (VERBOSE) console.log(`⏭️  Skipping ${name} - already uploaded to S3`);
    return { success: false, reason: 'already_uploaded' };
  }
  
  try {
    console.log(`\n🔍 Processing: ${name}`);
    console.log(`   🆔 UUID: ${uuid}`);
    console.log(`   📁 Local: ${local_image_url}`);
    
    // Construct local file path
    const filename = path.basename(local_image_url);
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Check if local file exists
    try {
      await fs.access(filepath);
    } catch (error) {
      console.log(`   ❌ Local file not found: ${filepath}`);
      return { success: false, reason: 'local_file_not_found' };
    }
    
    // S3 key (path in bucket)
    const s3Key = `establishments/${filename}`;
    
    // Check if already exists in S3 (unless forcing reupload)
    if (!FORCE_REUPLOAD) {
      const existsInS3 = await fileExistsInS3(s3Key);
      if (existsInS3) {
        console.log(`   ⏭️  File already exists in S3`);
        // Update database even if file exists
        const s3Url = generateS3Url(s3Key, USE_SIGNED_URLS);
        await client.query(
          'UPDATE public.establishments SET s3_image_url = $1 WHERE id = $2',
          [s3Url, id]
        );
        console.log(`   ✅ Database updated with existing S3 URL`);
        return { success: true, reason: 'already_existed' };
      }
    }
    
    // Get file stats and content type
    const stats = await fs.stat(filepath);
    const contentType = getContentType(filename);
    
    console.log(`   📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   🏷️  Content type: ${contentType}`);
    console.log(`   ⬆️  Uploading to S3: ${s3Key}`);
    
    // Upload to S3
    await uploadToS3(filepath, s3Key, contentType);
    
    // Generate final URL
    const s3Url = generateS3Url(s3Key, USE_SIGNED_URLS);
    
    // Update database
    await client.query(
      'UPDATE public.establishments SET s3_image_url = $1 WHERE id = $2',
      [s3Url, id]
    );
    
    console.log(`   ✅ Success: ${s3Url}`);
    
    return { 
      success: true, 
      s3Key,
      s3Url,
      fileSize: stats.size 
    };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${name}:`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Main execution
async function main() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials required: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  console.log('🚀 S3 Image Upload Script');
  console.log(`📊 Settings:`);
  console.log(`   🪣 S3 Bucket: ${BUCKET_NAME}`);
  console.log(`   🌍 AWS Region: ${AWS_REGION}`);
  console.log(`   🎯 Limit: ${SPECIFIC_UUID ? '1 (specific UUID)' : LIMIT}`);
  console.log(`   🔄 Force reupload: ${FORCE_REUPLOAD}`);
  console.log(`   🔗 Use signed URLs: ${USE_SIGNED_URLS}`);
  console.log(`   📝 Verbose: ${VERBOSE}`);
  
  const client = await createDbConnection();
  console.log('✅ Database connected');
  
  try {
    let query;
    let params = [];
    
    if (SPECIFIC_UUID) {
      query = `
        SELECT id, name, uuid, local_image_url, s3_image_url 
        FROM public.establishments 
        WHERE uuid = $1
      `;
      params = [SPECIFIC_UUID];
    } else {
      const whereClause = FORCE_REUPLOAD 
        ? 'WHERE local_image_url IS NOT NULL' 
        : 'WHERE local_image_url IS NOT NULL AND s3_image_url IS NULL';
      query = `
        SELECT id, name, uuid, local_image_url, s3_image_url 
        FROM public.establishments 
        ${whereClause}
        ORDER BY rating DESC NULLS LAST, user_ratings_total DESC NULLS LAST
        LIMIT $1
      `;
      params = [LIMIT];
    }
    
    const result = await client.query(query, params);
    const establishments = result.rows;
    
    console.log(`\n📋 Found ${establishments.length} establishments to upload`);
    
    if (establishments.length === 0) {
      console.log('✅ No establishments need S3 upload');
      return;
    }
    
    // Process each establishment
    const results = {
      success: 0,
      alreadyUploaded: 0,
      alreadyExisted: 0,
      noLocalImage: 0,
      localFileNotFound: 0,
      errors: 0,
      totalSize: 0
    };
    
    for (let i = 0; i < establishments.length; i++) {
      const establishment = establishments[i];
      console.log(`\n[${i + 1}/${establishments.length}]`);
      
      const result = await processEstablishment(client, establishment);
      
      if (result.success) {
        if (result.reason === 'already_existed') {
          results.alreadyExisted++;
        } else {
          results.success++;
          results.totalSize += result.fileSize || 0;
        }
      } else {
        switch (result.reason) {
          case 'already_uploaded':
            results.alreadyUploaded++;
            break;
          case 'no_local_image':
            results.noLocalImage++;
            break;
          case 'local_file_not_found':
            results.localFileNotFound++;
            break;
          default:
            results.errors++;
        }
      }
      
      // Rate limiting: wait 50ms between uploads
      if (i < establishments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully uploaded: ${results.success}`);
    console.log(`   📊 Total uploaded size: ${(results.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🔄 Already existed in S3: ${results.alreadyExisted}`);
    console.log(`   ⏭️  Already uploaded: ${results.alreadyUploaded}`);
    console.log(`   📁 No local image: ${results.noLocalImage}`);
    console.log(`   ❓ Local file not found: ${results.localFileNotFound}`);
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

