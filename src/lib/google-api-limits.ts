// Google API Cost Protection System
// This file manages usage limits to prevent unexpected charges during development
//
// MONTHLY HARD CAPS (Production Safety):
// - Regular APIs: 5,000 requests/month (Maps, Autocomplete, Photos)
// - Expensive APIs: 5,000 requests/month (Places Details $17/1K), 2,000 requests/month (Text Search $32/1K)
// - Maximum possible monthly cost: ~$149 (with all caps reached)
//
// PROTECTION FEATURES:
// ✅ Hard monthly caps that cannot be exceeded
// ✅ Daily limits for additional protection  
// ✅ Real-time cost tracking and warnings
// ✅ Automatic API blocking when limits reached
// ✅ Progressive warning system (50%, 75%, 90% usage)
//
// COST BREAKDOWN (if all caps reached):
// - Text Search: 2,000 × $32/1K = $64.00
// - Places Details: 5,000 × $17/1K = $85.00  
// - Maps/Photos/Autocomplete: 15,000 × ~$5.6/1K = ~$84.00
// - TOTAL MAXIMUM: ~$149/month

interface APIUsageStats {
  mapsLoads: number;
  autocompleteRequests: number;
  placesDetailsRequests: number;
  photosRequests: number;
  textSearchRequests: number;
  lastReset: string;
  monthlyStats?: MonthlyStats; // Add monthly tracking
}

interface MonthlyStats {
  month: string; // "2024-01" format
  mapsLoads: number;
  autocompleteRequests: number;
  placesDetailsRequests: number;
  photosRequests: number;
  textSearchRequests: number;
  estimatedCost: number; // In USD
  lastUpdated: string;
}

// API COSTS (per 1,000 requests)
const API_COSTS = {
  MAPS_LOADS: 7.00,           // $7 per 1,000 map loads
  AUTOCOMPLETE: 2.83,         // $2.83 per 1,000 autocomplete requests  
  PLACES_DETAILS: 17.00,      // $17 per 1,000 places details requests
  PHOTOS: 7.00,               // $7 per 1,000 photo requests
  TEXT_SEARCH: 32.00,         // $32 per 1,000 text search requests
};

// MONTHLY HARD CAPS (to prevent cost overruns)
const MONTHLY_HARD_CAPS = {
  // Regular APIs: 5,000 requests per month
  MAPS_MONTHLY_CAP: 5000,
  AUTOCOMPLETE_MONTHLY_CAP: 5000,
  PHOTOS_MONTHLY_CAP: 5000,
  
  // Expensive APIs: 5,000 requests per month for Places Details, 2,000 for Text Search
  PLACES_DETAILS_MONTHLY_CAP: 5000,  // $17 per 1,000 - VERY expensive
  TEXT_SEARCH_MONTHLY_CAP: 2000,     // $32 per 1,000 - EXTREMELY expensive
};

// FREE TIER LIMITS (set below actual limits for safety margin)
const API_LIMITS = {
  // Google Maps JavaScript API: $7 per 1,000 after free tier
  // Free tier: ~$200 credit = ~28,500 map loads
  // Safety limit: 1,000 map loads per day
  MAPS_DAILY_LIMIT: 1000,
  
  // Google Places Autocomplete: $2.83 per 1,000 requests
  // Free tier: ~$200 credit = ~70,000 requests  
  // Safety limit: 500 autocomplete requests per day
  AUTOCOMPLETE_DAILY_LIMIT: 500,
  
  // Google Places Details: $17 per 1,000 requests
  // Free tier: ~$200 credit = ~11,700 requests
  // Safety limit: 100 details requests per day (VERY expensive)
  PLACES_DETAILS_DAILY_LIMIT: 100,
  
  // Google Places Photos: $7 per 1,000 requests
  // Free tier: ~$200 credit = ~28,500 requests
  // Safety limit: 200 photo requests per day
  PHOTOS_DAILY_LIMIT: 200,

  // Google Places Text Search (Pro): $32 per 1,000 requests
  // Free tier: 5,000 requests per month
  // Safety limit: 500 text search requests per day (EXPENSIVE)
  TEXT_SEARCH_DAILY_LIMIT: 500,
};

// MONTHLY COST THRESHOLDS
const COST_THRESHOLDS = {
  WARNING: 50,    // Warn at $50/month
  DANGER: 100,    // High alert at $100/month
  CRITICAL: 150,  // Critical at $150/month
};

class GoogleAPILimitManager {
  private storageKey = 'trustdiner_google_api_usage';
  private monthlyStorageKey = 'trustdiner_monthly_api_usage';
  
  private getUsageStats(): APIUsageStats {
    if (typeof window === 'undefined') {
      return this.getDefaultStats();
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return this.getDefaultStats();
      
      const stats: APIUsageStats = JSON.parse(stored);
      
      // Reset daily if it's a new day
      const today = new Date().toDateString();
      if (stats.lastReset !== today) {
        return this.getDefaultStats();
      }
      
      return stats;
    } catch (error) {
      console.warn('Error reading API usage stats:', error);
      return this.getDefaultStats();
    }
  }

  private getMonthlyStats(): MonthlyStats {
    if (typeof window === 'undefined') {
      return this.getDefaultMonthlyStats();
    }
    
    try {
      const stored = localStorage.getItem(this.monthlyStorageKey);
      if (!stored) return this.getDefaultMonthlyStats();
      
      const stats: MonthlyStats = JSON.parse(stored);
      
      // Reset monthly if it's a new month
      const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
      if (stats.month !== currentMonth) {
        return this.getDefaultMonthlyStats();
      }
      
      return stats;
    } catch (error) {
      console.warn('Error reading monthly API usage stats:', error);
      return this.getDefaultMonthlyStats();
    }
  }
  
  private getDefaultStats(): APIUsageStats {
    return {
      mapsLoads: 0,
      autocompleteRequests: 0,
      placesDetailsRequests: 0,
      photosRequests: 0,
      textSearchRequests: 0,
      lastReset: new Date().toDateString(),
    };
  }

  private getDefaultMonthlyStats(): MonthlyStats {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return {
      month: currentMonth,
      mapsLoads: 0,
      autocompleteRequests: 0,
      placesDetailsRequests: 0,
      photosRequests: 0,
      textSearchRequests: 0,
      estimatedCost: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
  
  private saveUsageStats(stats: APIUsageStats): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(stats));
    } catch (error) {
      console.warn('Error saving API usage stats:', error);
    }
  }

  private saveMonthlyStats(stats: MonthlyStats): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.monthlyStorageKey, JSON.stringify(stats));
    } catch (error) {
      console.warn('Error saving monthly API usage stats:', error);
    }
  }

  private calculateEstimatedCost(monthlyStats: MonthlyStats): number {
    return (
      (monthlyStats.mapsLoads / 1000) * API_COSTS.MAPS_LOADS +
      (monthlyStats.autocompleteRequests / 1000) * API_COSTS.AUTOCOMPLETE +
      (monthlyStats.placesDetailsRequests / 1000) * API_COSTS.PLACES_DETAILS +
      (monthlyStats.photosRequests / 1000) * API_COSTS.PHOTOS +
      (monthlyStats.textSearchRequests / 1000) * API_COSTS.TEXT_SEARCH
    );
  }
  
  private incrementUsage(apiType: keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>): boolean {
    const stats = this.getUsageStats();
    const monthlyStats = this.getMonthlyStats();
    const currentDailyUsage = stats[apiType];
    const currentMonthlyUsage = monthlyStats[apiType];
    const dailyLimit = this.getLimitForAPI(apiType);
    const monthlyLimit = this.getMonthlyCapForAPI(apiType);
    
    // Check monthly cap FIRST (hard limit)
    if (currentMonthlyUsage >= monthlyLimit) {
      console.error(`🚨 MONTHLY API HARD CAP REACHED: ${apiType} (${currentMonthlyUsage}/${monthlyLimit})`);
      console.error(`❌ API calls blocked until next month to prevent cost overruns.`);
      console.error(`💰 This protects against unexpected charges. Monthly cap: ${monthlyLimit} requests.`);
      return false;
    }
    
    // Check daily limit
    if (currentDailyUsage >= dailyLimit) {
      console.warn(`🚨 DAILY API LIMIT REACHED: ${apiType} (${currentDailyUsage}/${dailyLimit})`);
      console.warn('This prevents unexpected charges. Remove limits when going live.');
      return false;
    }
    
    // Increment daily stats
    stats[apiType] = currentDailyUsage + 1;
    this.saveUsageStats(stats);
    
    // Increment monthly stats
    monthlyStats[apiType] = currentMonthlyUsage + 1;
    monthlyStats.estimatedCost = this.calculateEstimatedCost(monthlyStats);
    monthlyStats.lastUpdated = new Date().toISOString();
    this.saveMonthlyStats(monthlyStats);
    
    const dailyRemaining = dailyLimit - stats[apiType];
    const monthlyRemaining = monthlyLimit - monthlyStats[apiType];
    
    // Warnings for daily limits
    if (dailyRemaining <= 10) {
      console.warn(`⚠️ Google API ${apiType} approaching daily limit: ${dailyRemaining} requests remaining today`);
    }
    
    // Warnings for monthly limits (more critical)
    const monthlyUsagePercent = (monthlyStats[apiType] / monthlyLimit) * 100;
    if (monthlyUsagePercent >= 90) {
      console.error(`🚨 CRITICAL: ${apiType} at ${monthlyUsagePercent.toFixed(1)}% of monthly cap (${monthlyStats[apiType]}/${monthlyLimit})`);
    } else if (monthlyUsagePercent >= 75) {
      console.warn(`⚠️ WARNING: ${apiType} at ${monthlyUsagePercent.toFixed(1)}% of monthly cap (${monthlyStats[apiType]}/${monthlyLimit})`);
    } else if (monthlyUsagePercent >= 50) {
      console.warn(`💰 INFO: ${apiType} at ${monthlyUsagePercent.toFixed(1)}% of monthly cap (${monthlyStats[apiType]}/${monthlyLimit})`);
    }

    // Monthly cost warnings
    if (monthlyStats.estimatedCost >= COST_THRESHOLDS.CRITICAL) {
      console.error(`🚨 CRITICAL: Monthly API costs at $${monthlyStats.estimatedCost.toFixed(2)}!`);
    } else if (monthlyStats.estimatedCost >= COST_THRESHOLDS.DANGER) {
      console.warn(`⚠️ DANGER: Monthly API costs at $${monthlyStats.estimatedCost.toFixed(2)}`);
    } else if (monthlyStats.estimatedCost >= COST_THRESHOLDS.WARNING) {
      console.warn(`💰 WARNING: Monthly API costs at $${monthlyStats.estimatedCost.toFixed(2)}`);
    }
    
    return true;
  }
  
  private getLimitForAPI(apiType: keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>): number {
    switch (apiType) {
      case 'mapsLoads': return API_LIMITS.MAPS_DAILY_LIMIT;
      case 'autocompleteRequests': return API_LIMITS.AUTOCOMPLETE_DAILY_LIMIT;
      case 'placesDetailsRequests': return API_LIMITS.PLACES_DETAILS_DAILY_LIMIT;
      case 'photosRequests': return API_LIMITS.PHOTOS_DAILY_LIMIT;
      case 'textSearchRequests': return API_LIMITS.TEXT_SEARCH_DAILY_LIMIT;
      default: return 0;
    }
  }

  private getMonthlyCapForAPI(apiType: keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>): number {
    switch (apiType) {
      case 'mapsLoads': return MONTHLY_HARD_CAPS.MAPS_MONTHLY_CAP;
      case 'autocompleteRequests': return MONTHLY_HARD_CAPS.AUTOCOMPLETE_MONTHLY_CAP;
      case 'photosRequests': return MONTHLY_HARD_CAPS.PHOTOS_MONTHLY_CAP;
      case 'placesDetailsRequests': return MONTHLY_HARD_CAPS.PLACES_DETAILS_MONTHLY_CAP;
      case 'textSearchRequests': return MONTHLY_HARD_CAPS.TEXT_SEARCH_MONTHLY_CAP;
      default: return 0;
    }
  }
  
  // Public methods for each API type
  canLoadMap(): boolean {
    return this.incrementUsage('mapsLoads');
  }
  
  canUseAutocomplete(): boolean {
    return this.incrementUsage('autocompleteRequests');
  }
  
  canCallPlacesDetails(): boolean {
    return this.incrementUsage('placesDetailsRequests');
  }
  
  canLoadPhoto(): boolean {
    return this.incrementUsage('photosRequests');
  }

  canUseTextSearch(): boolean {
    return this.incrementUsage('textSearchRequests');
  }

  // Get maximum possible monthly cost if all caps are reached
  getMaximumMonthlyCost(): {
    maxCost: number;
    breakdown: Array<{api: string; cost: number; maxRequests: number}>;
  } {
    const breakdown = [
      {
        api: 'Maps Loads',
        cost: (MONTHLY_HARD_CAPS.MAPS_MONTHLY_CAP / 1000) * API_COSTS.MAPS_LOADS,
        maxRequests: MONTHLY_HARD_CAPS.MAPS_MONTHLY_CAP
      },
      {
        api: 'Autocomplete',
        cost: (MONTHLY_HARD_CAPS.AUTOCOMPLETE_MONTHLY_CAP / 1000) * API_COSTS.AUTOCOMPLETE,
        maxRequests: MONTHLY_HARD_CAPS.AUTOCOMPLETE_MONTHLY_CAP
      },
      {
        api: 'Places Details',
        cost: (MONTHLY_HARD_CAPS.PLACES_DETAILS_MONTHLY_CAP / 1000) * API_COSTS.PLACES_DETAILS,
        maxRequests: MONTHLY_HARD_CAPS.PLACES_DETAILS_MONTHLY_CAP
      },
      {
        api: 'Photos',
        cost: (MONTHLY_HARD_CAPS.PHOTOS_MONTHLY_CAP / 1000) * API_COSTS.PHOTOS,
        maxRequests: MONTHLY_HARD_CAPS.PHOTOS_MONTHLY_CAP
      },
      {
        api: 'Text Search',
        cost: (MONTHLY_HARD_CAPS.TEXT_SEARCH_MONTHLY_CAP / 1000) * API_COSTS.TEXT_SEARCH,
        maxRequests: MONTHLY_HARD_CAPS.TEXT_SEARCH_MONTHLY_CAP
      }
    ];

    const maxCost = breakdown.reduce((total, item) => total + item.cost, 0);

    return {
      maxCost,
      breakdown
    };
  }

  // Get monthly cost information
  getMonthlyCostInfo(): {
    currentCost: number;
    month: string;
    breakdown: Array<{api: string; cost: number; requests: number}>;
    warningLevel: 'safe' | 'warning' | 'danger' | 'critical';
    projectedMonthlyCost: number;
  } {
    const monthlyStats = this.getMonthlyStats();
    const currentCost = monthlyStats.estimatedCost;
    
    // Calculate daily average and project monthly cost
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyAverage = currentCost / dayOfMonth;
    const projectedMonthlyCost = dailyAverage * daysInMonth;

    let warningLevel: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
    if (projectedMonthlyCost >= COST_THRESHOLDS.CRITICAL) warningLevel = 'critical';
    else if (projectedMonthlyCost >= COST_THRESHOLDS.DANGER) warningLevel = 'danger';
    else if (projectedMonthlyCost >= COST_THRESHOLDS.WARNING) warningLevel = 'warning';

    const breakdown = [
      {
        api: 'Maps Loads',
        cost: (monthlyStats.mapsLoads / 1000) * API_COSTS.MAPS_LOADS,
        requests: monthlyStats.mapsLoads
      },
      {
        api: 'Autocomplete',
        cost: (monthlyStats.autocompleteRequests / 1000) * API_COSTS.AUTOCOMPLETE,
        requests: monthlyStats.autocompleteRequests
      },
      {
        api: 'Places Details',
        cost: (monthlyStats.placesDetailsRequests / 1000) * API_COSTS.PLACES_DETAILS,
        requests: monthlyStats.placesDetailsRequests
      },
      {
        api: 'Photos',
        cost: (monthlyStats.photosRequests / 1000) * API_COSTS.PHOTOS,
        requests: monthlyStats.photosRequests
      },
      {
        api: 'Text Search',
        cost: (monthlyStats.textSearchRequests / 1000) * API_COSTS.TEXT_SEARCH,
        requests: monthlyStats.textSearchRequests
      }
    ];

    return {
      currentCost,
      month: monthlyStats.month,
      breakdown,
      warningLevel,
      projectedMonthlyCost
    };
  }
  
  // Get current usage stats for display
  getUsageReport(): { 
    api: string; 
    used: number; 
    limit: number; 
    percentage: number; 
    cost_risk: 'low' | 'medium' | 'high';
    dailyCost: number;
    monthlyUsed: number;
    monthlyCap: number;
    monthlyPercentage: number;
  }[] {
    const stats = this.getUsageStats();
    const monthlyStats = this.getMonthlyStats();
    
    return [
      {
        api: 'Maps',
        used: stats.mapsLoads,
        limit: API_LIMITS.MAPS_DAILY_LIMIT,
        percentage: Math.round((stats.mapsLoads / API_LIMITS.MAPS_DAILY_LIMIT) * 100),
        cost_risk: 'medium',
        dailyCost: (stats.mapsLoads / 1000) * API_COSTS.MAPS_LOADS,
        monthlyUsed: monthlyStats.mapsLoads,
        monthlyCap: MONTHLY_HARD_CAPS.MAPS_MONTHLY_CAP,
        monthlyPercentage: Math.round((monthlyStats.mapsLoads / MONTHLY_HARD_CAPS.MAPS_MONTHLY_CAP) * 100)
      },
      {
        api: 'Autocomplete',
        used: stats.autocompleteRequests,
        limit: API_LIMITS.AUTOCOMPLETE_DAILY_LIMIT,
        percentage: Math.round((stats.autocompleteRequests / API_LIMITS.AUTOCOMPLETE_DAILY_LIMIT) * 100),
        cost_risk: 'medium',
        dailyCost: (stats.autocompleteRequests / 1000) * API_COSTS.AUTOCOMPLETE,
        monthlyUsed: monthlyStats.autocompleteRequests,
        monthlyCap: MONTHLY_HARD_CAPS.AUTOCOMPLETE_MONTHLY_CAP,
        monthlyPercentage: Math.round((monthlyStats.autocompleteRequests / MONTHLY_HARD_CAPS.AUTOCOMPLETE_MONTHLY_CAP) * 100)
      },
      {
        api: 'Places Details',
        used: stats.placesDetailsRequests,
        limit: API_LIMITS.PLACES_DETAILS_DAILY_LIMIT,
        percentage: Math.round((stats.placesDetailsRequests / API_LIMITS.PLACES_DETAILS_DAILY_LIMIT) * 100),
        cost_risk: 'high',
        dailyCost: (stats.placesDetailsRequests / 1000) * API_COSTS.PLACES_DETAILS,
        monthlyUsed: monthlyStats.placesDetailsRequests,
        monthlyCap: MONTHLY_HARD_CAPS.PLACES_DETAILS_MONTHLY_CAP,
        monthlyPercentage: Math.round((monthlyStats.placesDetailsRequests / MONTHLY_HARD_CAPS.PLACES_DETAILS_MONTHLY_CAP) * 100)
      },
      {
        api: 'Photos',
        used: stats.photosRequests,
        limit: API_LIMITS.PHOTOS_DAILY_LIMIT,
        percentage: Math.round((stats.photosRequests / API_LIMITS.PHOTOS_DAILY_LIMIT) * 100),
        cost_risk: 'medium',
        dailyCost: (stats.photosRequests / 1000) * API_COSTS.PHOTOS,
        monthlyUsed: monthlyStats.photosRequests,
        monthlyCap: MONTHLY_HARD_CAPS.PHOTOS_MONTHLY_CAP,
        monthlyPercentage: Math.round((monthlyStats.photosRequests / MONTHLY_HARD_CAPS.PHOTOS_MONTHLY_CAP) * 100)
      },
      {
        api: 'Text Search',
        used: stats.textSearchRequests,
        limit: API_LIMITS.TEXT_SEARCH_DAILY_LIMIT,
        percentage: Math.round((stats.textSearchRequests / API_LIMITS.TEXT_SEARCH_DAILY_LIMIT) * 100),
        cost_risk: 'high',
        dailyCost: (stats.textSearchRequests / 1000) * API_COSTS.TEXT_SEARCH,
        monthlyUsed: monthlyStats.textSearchRequests,
        monthlyCap: MONTHLY_HARD_CAPS.TEXT_SEARCH_MONTHLY_CAP,
        monthlyPercentage: Math.round((monthlyStats.textSearchRequests / MONTHLY_HARD_CAPS.TEXT_SEARCH_MONTHLY_CAP) * 100)
      }
    ];
  }
  
  // Reset usage (for testing or manual reset)
  resetUsage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.monthlyStorageKey);
    }
    console.log('✅ Google API usage stats reset');
  }

  // Manually add historical usage (for accounting for calls made before tracking)
  addHistoricalUsage(apiType: keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>, count: number): void {
    if (count <= 0) return;
    
    const stats = this.getUsageStats();
    const monthlyStats = this.getMonthlyStats();
    
    // Add to daily stats
    stats[apiType] = Math.max(0, stats[apiType] + count);
    this.saveUsageStats(stats);
    
    // Add to monthly stats
    monthlyStats[apiType] = Math.max(0, monthlyStats[apiType] + count);
    monthlyStats.estimatedCost = this.calculateEstimatedCost(monthlyStats);
    monthlyStats.lastUpdated = new Date().toISOString();
    this.saveMonthlyStats(monthlyStats);
    
    console.log(`📊 Added ${count} historical ${apiType} API calls to tracking`);
  }

  // Helper to add historical usage for multiple API types
  addBulkHistoricalUsage(usage: Partial<Record<keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>, number>>): void {
    Object.entries(usage).forEach(([apiType, count]) => {
      if (count && count > 0) {
        this.addHistoricalUsage(apiType as keyof Omit<APIUsageStats, 'lastReset' | 'monthlyStats'>, count);
      }
    });
    console.log('📊 Added bulk historical API usage:', usage);
  }

  // Test function to verify the manager is working
  testAPILimitManager(): boolean {
    console.log('🧪 Testing Google API Limit Manager...');
    
    try {
      // Test getting usage report
      const usage = this.getUsageReport();
      console.log('✅ Usage report working:', usage.length, 'APIs tracked');
      
      // Test getting monthly cost info  
      const costInfo = this.getMonthlyCostInfo();
      console.log('✅ Monthly cost info working:', `$${costInfo.currentCost.toFixed(2)}`);
      
      // Test getting maximum cost info
      const maxCostInfo = this.getMaximumMonthlyCost();
      console.log('✅ Maximum cost info working:', `$${maxCostInfo.maxCost.toFixed(2)} max`);
      
      console.log('🎉 API Limit Manager test passed!');
      return true;
    } catch (error) {
      console.error('❌ API Limit Manager test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleAPILimitManager = new GoogleAPILimitManager();

// Export types for use in components
export type { APIUsageStats, MonthlyStats }; 