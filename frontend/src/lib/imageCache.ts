/**
 * Image cache manager for TrustDiner
 * Handles image preloading, caching, and optimization
 */

interface CachedImage {
  url: string;
  blob?: Blob;
  loadTime: number;
  accessTime: number;
  size?: number;
}

class ImageCacheManager {
  private cache = new Map<string, CachedImage>();
  private maxCacheSize = 50; // Maximum number of images to cache
  private maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Check if image exists without downloading it
   */
  private async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Handle CORS issues
      });
      return response.ok || response.type === 'opaque';
    } catch {
      // If HEAD fails, try a quick GET with range to minimize download
      try {
        const response = await fetch(url, {
          headers: { 'Range': 'bytes=0-0' }
        });
        return response.ok || response.status === 206;
      } catch {
        return false;
      }
    }
  }

  /**
   * Preload an image and add it to cache
   */
  async preloadImage(url: string, skipExistenceCheck = false): Promise<string> {
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      cached.accessTime = Date.now();
      return cached.blob ? URL.createObjectURL(cached.blob) : url;
    }

    // Check if image exists first to avoid 404 spam
    if (!skipExistenceCheck && !(await this.checkImageExists(url))) {
      // Cache the failed URL to avoid retrying immediately
      this.cache.set(url, {
        url,
        loadTime: Date.now(),
        accessTime: Date.now()
      });
      return url;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const cachedImage: CachedImage = {
        url,
        blob,
        loadTime: Date.now(),
        accessTime: Date.now(),
        size: blob.size
      };

      this.cache.set(url, cachedImage);
      this.cleanupCache();
      
      return objectUrl;
    } catch (error) {
      // Only log if we didn't already check existence
      if (skipExistenceCheck) {
        console.warn('Failed to preload image:', url, error);
      }
      // Cache the failed URL to avoid retrying immediately
      this.cache.set(url, {
        url,
        loadTime: Date.now(),
        accessTime: Date.now()
      });
      return url;
    }
  }

  /**
   * Get cached image URL
   */
  getCachedImage(url: string): string | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    // Check if cache entry is still valid
    if (Date.now() - cached.loadTime > this.maxAge) {
      this.cache.delete(url);
      if (cached.blob) {
        URL.revokeObjectURL(URL.createObjectURL(cached.blob));
      }
      return null;
    }

    cached.accessTime = Date.now();
    return cached.blob ? URL.createObjectURL(cached.blob) : url;
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.slice(0, 10).map(url => 
      this.preloadImage(url, false).catch(() => url) // Use existence check, ignore failures
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Clear expired cache entries and maintain size limit
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    for (const [url, cached] of entries) {
      if (now - cached.loadTime > this.maxAge) {
        this.cache.delete(url);
        if (cached.blob) {
          URL.revokeObjectURL(URL.createObjectURL(cached.blob));
        }
      }
    }

    // If still over limit, remove least recently accessed
    if (this.cache.size > this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessTime - b.accessTime);

      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxCacheSize);
      for (const [url, cached] of toRemove) {
        this.cache.delete(url);
        if (cached.blob) {
          URL.revokeObjectURL(URL.createObjectURL(cached.blob));
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, cached) => sum + (cached.size || 0), 0);

    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    for (const [, cached] of this.cache) {
      if (cached.blob) {
        URL.revokeObjectURL(URL.createObjectURL(cached.blob));
      }
    }
    this.cache.clear();
  }

  /**
   * Prefetch images for places that are likely to be viewed
   */
  prefetchPlaceImages(places: Array<{ localImageUrl?: string; s3ImageUrl?: string }>): void {
    const imageUrls = places
      .slice(0, 20) // Only prefetch first 20 places to avoid overwhelming
      .map(place => place.localImageUrl || place.s3ImageUrl)
      .filter((url): url is string => Boolean(url))
      .filter(url => !this.cache.has(url)); // Skip already cached images

    if (imageUrls.length > 0) {
      // Prefetch in background without blocking, with reduced console spam
      this.preloadImages(imageUrls).catch(() => {
        // Ignore prefetch failures silently
      });
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCacheManager();

/**
 * Hook for using image cache in components
 */
export function useImageCache() {
  return {
    preloadImage: imageCache.preloadImage.bind(imageCache),
    getCachedImage: imageCache.getCachedImage.bind(imageCache),
    preloadImages: imageCache.preloadImages.bind(imageCache),
    prefetchPlaceImages: imageCache.prefetchPlaceImages.bind(imageCache),
    getStats: imageCache.getStats.bind(imageCache),
    clearCache: imageCache.clearCache.bind(imageCache)
  };
}
