// Custom image loader for static export
// This handles image optimization for S3/CloudFront deployment

export default function imageLoader({ src, width, quality }) {
  // Environment-aware base URL with CDN support
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_CDN_URL || 
       process.env.NEXT_PUBLIC_ASSETS_DOMAIN || 
       'https://app.trustdiner.com')
    : (process.env.NEXT_PUBLIC_ASSETS_DOMAIN || 
       'http://localhost:3000');
  
  // Handle external images (Google Maps, etc.)
  if (src.startsWith('http') || src.startsWith('//')) {
    return src;
  }
  
  // Handle local images
  if (src.startsWith('/')) {
    return `${baseUrl}${src}`;
  }
  
  return `${baseUrl}/${src}`;
}