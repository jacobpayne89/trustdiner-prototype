import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface ImageConfig {
  useS3: boolean;
  bucketName: string;
  region: string;
  cloudFrontDomain?: string;
  useSignedUrls: boolean;
  signedUrlTtl: number; // seconds
}

class ImageService {
  private config: ImageConfig;
  private s3Client?: S3Client;

  constructor() {
    this.config = {
      useS3: process.env.NODE_ENV === 'production' || process.env.FORCE_S3 === 'true',
      bucketName: process.env.S3_IMAGES_BUCKET || 'trustdiner-images-test',
      region: process.env.AWS_REGION || 'us-east-1',
      cloudFrontDomain: process.env.CLOUDFRONT_IMAGES_DOMAIN,
      useSignedUrls: process.env.USE_SIGNED_IMAGE_URLS === 'true',
      signedUrlTtl: parseInt(process.env.SIGNED_URL_TTL || '3600'), // 1 hour default
    };

    if (this.config.useS3) {
      // Only initialize S3 client if credentials are available
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.s3Client = new S3Client({
          region: this.config.region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });
        console.log('🔧 ImageService: S3 client initialized for production');
      } else {
        console.log('⚠️  ImageService: S3 credentials not found, falling back to local images');
        this.config.useS3 = false; // Disable S3 if no credentials
      }
    }
  }

  /**
   * Get the appropriate image URL for an establishment
   */
  async getImageUrl(establishment: {
    uuid: string;
    local_image_url?: string | null;
    s3_image_url?: string | null;
  }): Promise<string | null> {
    
    // Production: Use S3/CloudFront
    if (this.config.useS3) {
      if (establishment.s3_image_url) {
        // If we have a stored S3 URL, use it
        if (this.config.useSignedUrls && establishment.s3_image_url.startsWith('s3-signed://')) {
          // Generate fresh signed URL
          const key = establishment.s3_image_url.replace(`s3-signed://${this.config.bucketName}/`, '');
          return await this.generateSignedUrl(key);
        } else if (this.config.cloudFrontDomain) {
          // Use CloudFront distribution
          const key = this.extractS3Key(establishment.s3_image_url);
          return `https://${this.config.cloudFrontDomain}/${key}`;
        } else {
          // Use direct S3 URL
          return establishment.s3_image_url;
        }
      } else {
        // No S3 URL, try to generate from UUID
        const key = this.getEstablishmentImageKey(establishment.uuid);
        if (this.config.useSignedUrls) {
          return await this.generateSignedUrl(key);
        } else if (this.config.cloudFrontDomain) {
          return `https://${this.config.cloudFrontDomain}/${key}`;
        } else {
          return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;
        }
      }
    }
    
    // Development: Use local URLs
    else {
      if (establishment.local_image_url) {
        return establishment.local_image_url;
      } else {
        // Try UUID-based local image
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        for (const ext of extensions) {
          const localUrl = `/images/establishments/${establishment.uuid}${ext}`;
          // In a real implementation, you might check if the file exists
          // For now, just return the .jpg version
          if (ext === '.jpg') {
            return localUrl;
          }
        }
        return null;
      }
    }
  }

  /**
   * Get multiple image URLs efficiently
   */
  async getImageUrls(establishments: Array<{
    uuid: string;
    local_image_url?: string | null;
    s3_image_url?: string | null;
  }>): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};

    // Process in parallel for better performance
    const promises = establishments.map(async (establishment) => {
      const url = await this.getImageUrl(establishment);
      results[establishment.uuid] = url;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Generate a signed URL for private S3 access
   */
  private async generateSignedUrl(key: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: this.config.signedUrlTtl,
    });
  }

  /**
   * Extract S3 key from S3 URL
   */
  private extractS3Key(s3Url: string): string {
    // Handle different S3 URL formats
    if (s3Url.includes('.s3.')) {
      // https://bucket.s3.region.amazonaws.com/key
      return s3Url.split('/').slice(3).join('/');
    } else if (s3Url.includes('s3://')) {
      // s3://bucket/key
      return s3Url.replace(`s3://${this.config.bucketName}/`, '');
    } else {
      // Assume it's already a key
      return s3Url;
    }
  }

  /**
   * Get the expected S3 key for an establishment image
   */
  private getEstablishmentImageKey(uuid: string): string {
    // Default to .jpg extension
    return `establishments/${uuid}.jpg`;
  }

  /**
   * Get fallback/placeholder image URL
   */
  getFallbackImageUrl(placeName?: string): string {
    if (this.config.useS3 && this.config.cloudFrontDomain) {
      return `https://${this.config.cloudFrontDomain}/placeholders/restaurant-placeholder.jpg`;
    } else if (this.config.useS3) {
      return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/placeholders/restaurant-placeholder.jpg`;
    } else {
      // Local development
      const encodedName = placeName ? encodeURIComponent(placeName) : 'Restaurant';
      return `/images/placeholder-restaurant.jpg`;
    }
  }

  /**
   * Check service configuration
   */
  getConfig(): ImageConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const imageService = new ImageService();
export default imageService;

