import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getPool } from '../services/database';

const router = express.Router();

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'storage', 'avatars');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId || req.params.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// POST /api/uploads/avatar - Upload avatar directly to local storage
router.post('/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('📤 Avatar upload request:', { userId, file: req.file?.filename });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;
    const processedFilename = `${userId}-${Date.now()}.jpg`;
    const processedPath = path.join(path.dirname(originalPath), processedFilename);

    console.log('📸 Processing avatar image...');

    // Process image with sharp - resize and optimize
    await sharp(originalPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Remove original file
    fs.unlinkSync(originalPath);

    // Generate public URL
    const publicUrl = `/images/avatars/${processedFilename}`;

    // Update user's avatar_url in database
    try {
      const updateQuery = `
        UPDATE users.accounts 
        SET avatar_url = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, avatar_url
      `;
      
      const pool = getPool();
      const result = await pool.query(updateQuery, [publicUrl, userId]);
      
      if (result.rows.length === 0) {
        console.warn('⚠️ User not found for avatar update:', userId);
      } else {
        console.log('✅ User avatar_url updated in database:', result.rows[0]);
      }
    } catch (dbError) {
      console.error('❌ Failed to update user avatar_url in database:', dbError);
      // Continue anyway - the file was uploaded successfully
    }

    console.log('✅ Avatar uploaded and processed successfully:', publicUrl);

    res.json({
      success: true,
      publicUrl,
      fileName: processedFilename
    });

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload avatar'
    });
  }
});

// DELETE /api/uploads/avatar/:userId - Delete user's avatar from local storage
router.delete('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatarUrl } = req.body;

    console.log('🗑️ Avatar deletion request:', { userId, avatarUrl });

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    // Extract filename from URL (e.g., /images/avatars/1-1234567890.jpg -> 1-1234567890.jpg)
    const filename = avatarUrl.split('/').pop();
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Invalid avatar URL'
      });
    }

    const filePath = path.join(process.cwd(), 'storage', 'avatars', filename);

    console.log('🗑️ Deleting local file:', filePath);

    // Delete file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Avatar deleted from local storage successfully');
    } else {
      console.log('⚠️ Avatar file not found, but continuing...');
    }

    // Clear user's avatar_url in database
    try {
      const updateQuery = `
        UPDATE users.accounts 
        SET avatar_url = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;
      
      const pool = getPool();
      const result = await pool.query(updateQuery, [userId]);
      
      if (result.rows.length === 0) {
        console.warn('⚠️ User not found for avatar deletion:', userId);
      } else {
        console.log('✅ User avatar_url cleared in database');
      }
    } catch (dbError) {
      console.error('❌ Failed to clear user avatar_url in database:', dbError);
      // Continue anyway - the file was deleted successfully
    }

    res.json({
      success: true,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar'
    });
  }
});

export default router;
