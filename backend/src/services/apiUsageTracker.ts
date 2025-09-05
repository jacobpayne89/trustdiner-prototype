import { getPool } from './database';

// Google API pricing (as of 2024 - these should be configurable)
const API_COSTS = {
  places_text_search: 0.032,      // $32 per 1000 requests
  places_nearby_search: 0.032,    // $32 per 1000 requests
  places_details: 0.017,          // $17 per 1000 requests (basic data)
  places_photos: 0.007,           // $7 per 1000 requests
  maps_static: 0.002,             // $2 per 1000 requests
  geocoding: 0.005,               // $5 per 1000 requests
  directions: 0.005,              // $5 per 1000 requests
  distance_matrix: 0.005,         // $5 per 1000 requests
} as const;

export interface APIUsageRecord {
  apiService: keyof typeof API_COSTS;
  endpoint: string;
  requestParams?: any;
  responseStatus: number;
  success: boolean;
  responseTimeMs?: number;
  userId?: number;
  establishmentId?: number;
  sessionId?: string;
}

export class APIUsageTracker {
  /**
   * Track a Google API call
   */
  static async trackAPICall(record: APIUsageRecord): Promise<void> {
    try {
      const pool = getPool();
      const costPerRequest = API_COSTS[record.apiService] || 0;
      
      await pool.query(`
        INSERT INTO google_api_usage (
          api_service,
          endpoint,
          request_params,
          response_status,
          success,
          cost_per_request,
          quota_consumed,
          response_time_ms,
          user_id,
          establishment_id,
          session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        record.apiService,
        record.endpoint,
        record.requestParams ? JSON.stringify(record.requestParams) : null,
        record.responseStatus,
        record.success,
        costPerRequest,
        1, // quota consumed (usually 1 per request)
        record.responseTimeMs || null,
        record.userId || null,
        record.establishmentId || null,
        record.sessionId || null
      ]);

      console.log(`📊 API Usage tracked: ${record.apiService} - $${costPerRequest.toFixed(4)} - ${record.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('❌ Failed to track API usage:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get daily usage summary
   */
  static async getDailyUsage(date?: Date): Promise<any> {
    try {
      const pool = getPool();
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      const result = await pool.query(`
        SELECT 
          api_service,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = true) as successful_requests,
          COUNT(*) FILTER (WHERE success = false) as failed_requests,
          SUM(cost_per_request) as total_cost,
          AVG(response_time_ms) as avg_response_time_ms,
          SUM(quota_consumed) as total_quota_consumed
        FROM google_api_usage
        WHERE DATE(request_timestamp) = $1
        GROUP BY api_service
        ORDER BY total_requests DESC
      `, [dateStr]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get daily usage:', error);
      return [];
    }
  }

  /**
   * Get monthly usage summary
   */
  static async getMonthlyUsage(year?: number, month?: number): Promise<any> {
    try {
      const pool = getPool();
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || (now.getMonth() + 1);

      const result = await pool.query(`
        SELECT 
          api_service,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = true) as successful_requests,
          COUNT(*) FILTER (WHERE success = false) as failed_requests,
          SUM(cost_per_request) as total_cost,
          AVG(response_time_ms) as avg_response_time_ms,
          SUM(quota_consumed) as total_quota_consumed
        FROM google_api_usage
        WHERE EXTRACT(YEAR FROM request_timestamp) = $1 
        AND EXTRACT(MONTH FROM request_timestamp) = $2
        GROUP BY api_service
        ORDER BY total_requests DESC
      `, [targetYear, targetMonth]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get monthly usage:', error);
      return [];
    }
  }

  /**
   * Get billing cycle usage (current month from 1st to last day)
   */
  static async getBillingCycleUsage(): Promise<{
    billingCycleUsage: number;
    billingCycleCost: number;
    billingCycleStart: string;
    billingCycleEnd: string;
    daysInCycle: number;
    daysRemaining: number;
    usageBreakdown: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      const pool = getPool();
      const now = new Date();
      
      // Google billing cycle: 1st to last day of current month
      const billingCycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const billingCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      
      const startDateStr = billingCycleStart.toISOString().split('T')[0];
      const endDateStr = billingCycleEnd.toISOString().split('T')[0];
      
      // Get billing cycle usage
      const billingResult = await pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(cost_per_request) as total_cost
        FROM google_api_usage
        WHERE DATE(request_timestamp) >= $1 
        AND DATE(request_timestamp) <= $2 
        AND success = true
      `, [startDateStr, endDateStr]);

      // Get usage breakdown by service (current billing cycle)
      const breakdownResult = await pool.query(`
        SELECT 
          api_service,
          COUNT(*) as requests
        FROM google_api_usage
        WHERE DATE(request_timestamp) >= $1 
        AND DATE(request_timestamp) <= $2 
        AND success = true
        GROUP BY api_service
      `, [startDateStr, endDateStr]);

      const usageBreakdown: Record<string, number> = {};
      breakdownResult.rows.forEach(row => {
        const friendlyNames: Record<string, string> = {
          places_text_search: 'textSearch',
          places_nearby_search: 'nearbySearch',
          places_details: 'placeDetails',
          places_photos: 'photos',
          maps_static: 'maps',
          geocoding: 'geocoding',
          directions: 'directions',
          distance_matrix: 'distanceMatrix'
        };
        
        const friendlyName = friendlyNames[row.api_service] || row.api_service;
        usageBreakdown[friendlyName] = parseInt(row.requests);
      });

      const daysInCycle = Math.ceil((billingCycleEnd.getTime() - billingCycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysRemaining = Math.max(0, Math.ceil((billingCycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        billingCycleUsage: parseInt(billingResult.rows[0]?.total_requests || '0'),
        billingCycleCost: parseFloat(billingResult.rows[0]?.total_cost || '0'),
        billingCycleStart: billingCycleStart.toISOString().split('T')[0],
        billingCycleEnd: billingCycleEnd.toISOString().split('T')[0],
        daysInCycle,
        daysRemaining,
        usageBreakdown,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get billing cycle usage:', error);
      return {
        billingCycleUsage: 0,
        billingCycleCost: 0,
        billingCycleStart: new Date().toISOString().split('T')[0],
        billingCycleEnd: new Date().toISOString().split('T')[0],
        daysInCycle: 0,
        daysRemaining: 0,
        usageBreakdown: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get overall usage statistics
   */
  static async getUsageStats(): Promise<{
    dailyUsage: number;
    monthlyUsage: number;
    dailyCost: number;
    monthlyCost: number;
    usageBreakdown: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      const pool = getPool();
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date();
      const year = thisMonth.getFullYear();
      const month = thisMonth.getMonth() + 1;

      // Get today's usage
      const dailyResult = await pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(cost_per_request) as total_cost
        FROM google_api_usage
        WHERE DATE(request_timestamp) = $1 AND success = true
      `, [today]);

      // Get this month's usage
      const monthlyResult = await pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(cost_per_request) as total_cost
        FROM google_api_usage
        WHERE EXTRACT(YEAR FROM request_timestamp) = $1 
        AND EXTRACT(MONTH FROM request_timestamp) = $2 
        AND success = true
      `, [year, month]);

      // Get usage breakdown by service (today)
      const breakdownResult = await pool.query(`
        SELECT 
          api_service,
          COUNT(*) as requests
        FROM google_api_usage
        WHERE DATE(request_timestamp) = $1 AND success = true
        GROUP BY api_service
      `, [today]);

      const usageBreakdown: Record<string, number> = {};
      breakdownResult.rows.forEach(row => {
        // Map API service names to user-friendly names
        const friendlyNames: Record<string, string> = {
          places_text_search: 'textSearch',
          places_nearby_search: 'nearbySearch',
          places_details: 'placeDetails',
          places_photos: 'photos',
          maps_static: 'maps',
          geocoding: 'geocoding',
          directions: 'directions',
          distance_matrix: 'distanceMatrix'
        };
        
        const friendlyName = friendlyNames[row.api_service] || row.api_service;
        usageBreakdown[friendlyName] = parseInt(row.requests);
      });

      return {
        dailyUsage: parseInt(dailyResult.rows[0]?.total_requests || '0'),
        monthlyUsage: parseInt(monthlyResult.rows[0]?.total_requests || '0'),
        dailyCost: parseFloat(dailyResult.rows[0]?.total_cost || '0'),
        monthlyCost: parseFloat(monthlyResult.rows[0]?.total_cost || '0'),
        usageBreakdown,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
      return {
        dailyUsage: 0,
        monthlyUsage: 0,
        dailyCost: 0,
        monthlyCost: 0,
        usageBreakdown: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Helper method to wrap Google API calls with tracking
   */
  static async trackAPIRequest<T>(
    apiService: keyof typeof API_COSTS,
    endpoint: string,
    requestFn: () => Promise<T>,
    options: {
      requestParams?: any;
      userId?: number;
      establishmentId?: number;
      sessionId?: string;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    let responseStatus = 200;
    let success = true;
    let result: T;

    try {
      result = await requestFn();
      return result;
    } catch (error: any) {
      success = false;
      responseStatus = error.response?.status || error.status || 500;
      throw error;
    } finally {
      const responseTimeMs = Date.now() - startTime;
      
      // Track the API call (don't await to avoid slowing down the response)
      this.trackAPICall({
        apiService,
        endpoint,
        requestParams: options.requestParams,
        responseStatus,
        success,
        responseTimeMs,
        userId: options.userId,
        establishmentId: options.establishmentId,
        sessionId: options.sessionId
      }).catch(err => {
        console.error('Failed to track API call:', err);
      });
    }
  }
}

export default APIUsageTracker;
