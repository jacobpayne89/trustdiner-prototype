import { Request, Response, NextFunction } from 'express';

// Helper function to convert Google Places photo reference to actual image URL
function convertPhotoReferenceToUrl(photoReference: string | null): string | null {
  if (!photoReference) return null;
  
  // Check if it's already a full URL (Unsplash, S3, etc.)
  if (photoReference.startsWith('http')) {
    return photoReference;
  }
  
  // Check if it's a Google Places photo reference (starts with ATKogp...)
  if (photoReference.startsWith('ATKogp')) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Google Places API key not found, cannot convert photo reference');
      return null;
    }
    
    // Convert to Google Places Photo API URL
    // Max width 400px for card images, high quality
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
  }
  
  // For demo:// URLs or other formats, return as-is (will fallback to placeholder)
  return photoReference;
}

// Middleware to convert photo references in establishment responses
export const photoConverterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Only process establishment responses
    if (body && body.data && Array.isArray(body.data)) {
      console.log('🔄 Converting photo references for', body.data.length, 'establishments');
      
      body.data = body.data.map((establishment: any) => {
        if (establishment.local_image_url) {
          const originalUrl = establishment.local_image_url;
          const convertedUrl = convertPhotoReferenceToUrl(originalUrl);
          
          if (convertedUrl !== originalUrl) {
            console.log('🎯 Converted photo for', establishment.name, ':', originalUrl.substring(0, 30) + '... → Google Photos URL');
            establishment.local_image_url = convertedUrl;
          }
        }
        return establishment;
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

