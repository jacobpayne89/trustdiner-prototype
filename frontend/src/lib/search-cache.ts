// Search Result Caching System for TrustDiner
// Reduces Google API calls and costs by caching search results

interface CacheEntry {
  results: any[];
  timestamp: number;
  query: string;
  location?: { lat: number; lng: number };
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalQueries: number;
  cacheSize: number;
  costSaved: number; // Estimated cost saved in USD
}

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalQueries: 0,
    cacheSize: 0,
    costSaved: 0
  };
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 1000;     // Max cached queries
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly TEXT_SEARCH_COST = 0.032;  // $32 per 1,000 requests
  
  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    console.log('🗄️ Search cache initialized with cost optimization');
  }

  // Generate cache key from search parameters
  private generateCacheKey(
    query: string, 
    location?: { lat: number; lng: number },
    additionalParams?: Record<string, any>
  ): string {
    const normalizedQuery = query.toLowerCase().trim();
    const locationStr = location ? `${location.lat.toFixed(4)},${location.lng.toFixed(4)}` : '';
    const paramsStr = additionalParams ? JSON.stringify(additionalParams) : '';
    
    return `${normalizedQuery}|${locationStr}|${paramsStr}`;
  }

  // Check if we have a valid cached result
  get(
    query: string, 
    location?: { lat: number; lng: number },
    additionalParams?: Record<string, any>
  ): any[] | null {
    this.stats.totalQueries++;
    
    const key = this.generateCacheKey(query, location, additionalParams);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.cacheSize = this.cache.size;
      return null;
    }
    
    // Cache hit!
    this.stats.hits++;
    this.stats.costSaved += this.TEXT_SEARCH_COST;
    
    console.log(`💰 Cache HIT for "${query}" - Saved $${this.TEXT_SEARCH_COST.toFixed(3)}`);
    return [...entry.results]; // Return copy to prevent mutation
  }

  // Store search results in cache
  set(
    query: string,
    results: any[],
    location?: { lat: number; lng: number },
    additionalParams?: Record<string, any>
  ): void {
    // Don't cache empty results or very small result sets
    if (!results || results.length === 0) {
      return;
    }
    
    const key = this.generateCacheKey(query, location, additionalParams);
    const now = Date.now();
    
    const entry: CacheEntry = {
      results: [...results], // Store copy to prevent mutation
      timestamp: now,
      query: query.toLowerCase().trim(),
      location: location ? { ...location } : undefined,
      expiresAt: now + this.CACHE_TTL_MS
    };
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    this.cache.set(key, entry);
    this.stats.cacheSize = this.cache.size;
    
    console.log(`🗄️ Cached search results for "${query}" (${results.length} results)`);
  }

  // Remove oldest cache entries (LRU eviction)
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Evicted oldest cache entry: ${oldestKey.substring(0, 50)}...`);
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.stats.cacheSize = this.cache.size;
      console.log(`🧹 Cleaned up ${removedCount} expired cache entries`);
    }
  }

  // Get cache statistics
  getStats(): CacheStats & {
    hitRate: number;
    avgResultsPerQuery: number;
    estimatedMonthlySavings: number;
  } {
    const hitRate = this.stats.totalQueries > 0 
      ? (this.stats.hits / this.stats.totalQueries) * 100 
      : 0;
    
    // Estimate monthly savings based on current hit rate
    const estimatedMonthlySavings = this.stats.costSaved * (30 * 24); // Extrapolate daily to monthly
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      avgResultsPerQuery: 0, // Would need more tracking
      estimatedMonthlySavings: Math.round(estimatedMonthlySavings * 100) / 100
    };
  }

  // Clear entire cache (for testing/debugging)
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalQueries: 0,
      cacheSize: 0,
      costSaved: 0
    };
    console.log('🗑️ Search cache cleared');
  }

  // Get cache size and memory usage info
  getInfo(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    let oldestTime = Date.now();
    let newestTime = 0;
    let oldestQuery = '';
    let newestQuery = '';
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestQuery = entry.query;
      }
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
        newestQuery = entry.query;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttlMinutes: this.CACHE_TTL_MS / (60 * 1000),
      oldestEntry: oldestQuery || undefined,
      newestEntry: newestQuery || undefined
    };
  }

  // Preload common searches (for popular queries)
  async preloadCommonSearches(commonQueries: string[]): Promise<void> {
    console.log(`🚀 Preloading ${commonQueries.length} common search queries...`);
    
    // This would typically make actual API calls to populate cache
    // For now, we'll just mark the intent
    for (const query of commonQueries) {
      console.log(`📋 Would preload: "${query}"`);
    }
  }
}

// Export singleton instance
export const searchCache = new SearchCache();

// Wrapper function for cached search operations
export async function getCachedSearchResults(
  query: string,
  searchFunction: () => Promise<any[]>,
  location?: { lat: number; lng: number },
  additionalParams?: Record<string, any>
): Promise<any[]> {
  // Try to get from cache first
  const cachedResults = searchCache.get(query, location, additionalParams);
  if (cachedResults) {
    return cachedResults;
  }
  
  // Cache miss - perform actual search
  console.log(`🔍 Cache MISS for "${query}" - Making API call`);
  const results = await searchFunction();
  
  // Store in cache for future use
  searchCache.set(query, results, location, additionalParams);
  
  return results;
}

// Common London searches that should be preloaded
export const COMMON_LONDON_SEARCHES = [
  'pizza',
  'indian restaurant',
  'chinese restaurant', 
  'italian restaurant',
  'burger',
  'sushi',
  'thai restaurant',
  'mexican restaurant',
  'coffee shop',
  'bakery',
  'pub',
  'vegan restaurant',
  'gluten free restaurant',
  'japanese restaurant',
  'french restaurant'
];

console.log('🗄️ Search caching system initialized with cost optimization'); 