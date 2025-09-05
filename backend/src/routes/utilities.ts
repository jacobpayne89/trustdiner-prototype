import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Image discovery and utility endpoints
 */

/**
 * Discover image for a restaurant/establishment
 */
router.get('/discover-image', async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Restaurant name is required',
        message: 'Please provide a restaurant name parameter'
      });
    }

    console.log(`🖼️ Discovering image for: ${name}`);

    // For now, return a placeholder response
    // In the future, this could integrate with image APIs or serve local images
    const imageData = {
      restaurantName: name,
      imageUrl: `/images/placeholder-restaurant.jpg`,
      source: 'placeholder',
      discovered: true,
      timestamp: new Date().toISOString()
    };

    res.json(imageData);

  } catch (error) {
    console.error('❌ Image discovery error:', error);
    res.status(500).json({
      error: 'Image discovery failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Find specific image by ID
 */
router.get('/find-image', async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Image ID is required',
        message: 'Please provide an image ID parameter'
      });
    }

    console.log(`🖼️ Finding image by ID: ${id}`);

    // Return placeholder image data
    const imageData = {
      id,
      imageUrl: `/images/placeholder-restaurant.jpg`,
      alt: 'Restaurant image',
      width: 400,
      height: 300,
      format: 'jpg'
    };

    res.json(imageData);

  } catch (error) {
    console.error('❌ Find image error:', error);
    res.status(500).json({
      error: 'Find image failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Photo proxy for Google Photos API
 */
router.get('/photo-proxy', async (req: Request, res: Response) => {
  try {
    const { photo_reference, maxwidth = '400' } = req.query;

    if (!photo_reference || typeof photo_reference !== 'string') {
      return res.status(400).json({
        error: 'Photo reference is required',
        message: 'Please provide a photo_reference parameter'
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured'
      });
    }

    // Proxy request to Google Photos API
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photo_reference}&key=${apiKey}`;
    
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch photo from Google');
    }

    // Set appropriate headers with longer cache for chain photos
    const isChainPhoto = req.get('X-Chain-Photo') === 'true';
    res.set({
      'Content-Type': response.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': isChainPhoto ? 'public, max-age=604800' : 'public, max-age=86400' // 7 days for chains, 24 hours for others
    });

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('❌ Photo proxy error:', error);
    res.status(500).json({
      error: 'Photo proxy failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as utilitiesRouter };