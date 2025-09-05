/**
 * Image validation middleware for TrustDiner Backend
 * Handles image 404s by serving fallback images
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../services/logger';

const STORAGE_PATH = path.join(__dirname, '../../storage');
const PLACEHOLDER_IMAGE = path.join(__dirname, '../../../public/images/placeholder-restaurant.jpg');

/**
 * Middleware to validate image existence and serve fallbacks
 */
export const imageValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only apply to image requests
  if (!req.path.startsWith('/images/')) {
    return next();
  }

  const requested = req.path.replace('/images/', '');
  const resolved = path.resolve(STORAGE_PATH, requested);
  // Prevent path traversal by ensuring resolved is under STORAGE_PATH
  if (!resolved.startsWith(path.resolve(STORAGE_PATH) + path.sep)) {
    logger.warn('Blocked path traversal attempt for image request', {
      requestedPath: req.path,
    });
    return res.status(400).json({ success: false, error: 'Invalid image path' });
  }
  
  try {
    // Check if the requested image exists
    await fs.access(resolved, fs.constants.F_OK);
    
    // Image exists, continue to serve it
    next();
  } catch (error) {
    // Image doesn't exist, log and serve placeholder
    logger.warn('Image not found, serving placeholder', {
      requestedPath: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    try {
      // Try to serve placeholder image
      await fs.access(PLACEHOLDER_IMAGE, fs.constants.F_OK);
      res.sendFile(PLACEHOLDER_IMAGE);
    } catch (placeholderError) {
      // Placeholder doesn't exist either, return 404
      logger.error('Placeholder image not found', {
        placeholderPath: PLACEHOLDER_IMAGE,
        error: placeholderError instanceof Error ? placeholderError.message : 'Unknown error',
      });
      
      res.status(404).json({
        success: false,
        error: 'Image not found',
        message: 'The requested image is not available',
      });
    }
  }
};

/**
 * Get the appropriate placeholder image based on image type
 */
export const getPlaceholderForImageType = (imagePath: string): string => {
  if (imagePath.includes('/establishments/')) {
    return path.join(__dirname, '../../../public/images/placeholder-restaurant.jpg');
  } else if (imagePath.includes('/avatars/')) {
    return path.join(__dirname, '../../../public/images/placeholder-avatar.png');
  } else {
    return path.join(__dirname, '../../../public/images/placeholder-general.jpg');
  }
};

/**
 * Enhanced image validation with type-specific placeholders
 * Now handles static file serving directly
 */
export const enhancedImageValidation = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/images/')) {
    return next();
  }

  const imagePath = path.join(STORAGE_PATH, req.path.replace('/images/', ''));
  
  try {
    // Check if the requested image exists
    await fs.access(imagePath, fs.constants.F_OK);
    
    // Image exists, serve it directly
    logger.debug('Serving existing image', {
      requestedPath: req.path,
      imagePath: imagePath,
    });
    res.sendFile(imagePath);
  } catch (error) {
    // Image doesn't exist, serve placeholder
    const placeholder = getPlaceholderForImageType(req.path);
    
    logger.debug('Image not found, serving type-specific placeholder', {
      requestedPath: req.path,
      placeholderPath: placeholder,
    });

    try {
      await fs.access(placeholder, fs.constants.F_OK);
      res.sendFile(placeholder);
    } catch (placeholderError) {
      // Generate a simple SVG placeholder as last resort
      logger.debug('No placeholder image found, generating SVG', {
        requestedPath: req.path,
      });
      
      const svgPlaceholder = generateSVGPlaceholder(req.path);
      res.set('Content-Type', 'image/svg+xml');
      res.send(svgPlaceholder);
    }
  }
};

/**
 * Generate a simple SVG placeholder when no image files are available
 */
const generateSVGPlaceholder = (imagePath: string): string => {
  const isEstablishment = imagePath.includes('/establishments/');
  const isAvatar = imagePath.includes('/avatars/');
  
  const color = isEstablishment ? '#4f46e5' : isAvatar ? '#06b6d4' : '#6b7280';
  const icon = isEstablishment ? '🍽️' : isAvatar ? '👤' : '📷';
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="${color}" opacity="0.1"/>
      <rect x="150" y="100" width="100" height="100" fill="${color}" opacity="0.2" rx="10"/>
      <text x="200" y="160" text-anchor="middle" font-family="system-ui" font-size="40" fill="${color}">${icon}</text>
      <text x="200" y="220" text-anchor="middle" font-family="system-ui" font-size="14" fill="${color}">Image not available</text>
    </svg>
  `.trim();
};
