import { Router, Request, Response } from 'express';

const router = Router();

// Helper function to convert Google Places photo reference to actual image URL
function convertPhotoReferenceToUrl(photoReference: string | null): string | null {
  console.log('🔄 Converting photo reference:', photoReference?.substring(0, 50) + '...');
  
  if (!photoReference) {
    console.log('❌ No photo reference provided');
    return null;
  }
  
  // Check if it's already a full URL (Unsplash, S3, etc.)
  if (photoReference.startsWith('http')) {
    console.log('✅ Already a full URL, returning as-is');
    return photoReference;
  }
  
  // Check if it's a Google Places photo reference (starts with ATKogp...)
  if (photoReference.startsWith('ATKogp')) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    console.log('🔑 API Key available:', !!apiKey);
    if (!apiKey) {
      console.warn('⚠️ Google Places API key not found, cannot convert photo reference');
      return null;
    }
    
    // Convert to Google Places Photo API URL
    // Max width 400px for card images, high quality
    const convertedUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
    console.log('🎯 Converted Google Places photo reference to URL:', convertedUrl.substring(0, 100) + '...');
    return convertedUrl;
  }
  
  // For demo:// URLs or other formats, return as-is (will fallback to placeholder)
  console.log('🔄 Unknown format, returning as-is');
  return photoReference;
}

// Test endpoint for photo conversion
router.get('/debug/test-photo', (req: Request, res: Response) => {
  const photoRef = req.query.ref as string;
  console.log('🧪 Testing photo conversion for:', photoRef?.substring(0, 50) + '...');
  
  const convertedUrl = convertPhotoReferenceToUrl(photoRef);
  
  res.json({
    original: photoRef,
    converted: convertedUrl,
    apiKeyAvailable: !!process.env.GOOGLE_PLACES_API_KEY
  });
});

export default router;
