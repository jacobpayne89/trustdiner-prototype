"use client";

import { useState, useEffect, useContext } from 'react';
import { googleAPILimitManager } from '@/lib/google-api-limits';
import { AuthContext } from '../context/AuthContext';
import { isAdmin } from '../../lib/admin';

interface GoogleAPIUsageDashboardProps {
  inline?: boolean;
}

export default function GoogleAPIUsageDashboard({ inline = false }: GoogleAPIUsageDashboardProps) {
  const { user, loading } = useContext(AuthContext);
  const [usage, setUsage] = useState<any[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasHistoricalUsage, setHasHistoricalUsage] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;
      
      if (!user) {
        setIsAdminUser(false);
        setIsCheckingAdmin(false);
        console.log('🔍 API Dashboard: No user logged in');
        return;
      }

      try {
        console.log('🔍 API Dashboard: Checking admin status for user:', user.uid);
        const adminStatus = await isAdmin(user.uid);
        console.log('🔍 API Dashboard: Admin status result:', adminStatus);
        setIsAdminUser(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  // Data loading effect - must be called before any returns
  useEffect(() => {
    console.log('🚀 API Dashboard: Starting data loading...');
    
    updateUsage();
    // Initialize historical usage state from localStorage
    setHasHistoricalUsage(localStorage.getItem('trustdiner_historical_usage_added') === 'true');
    // Update usage every 10 seconds
    const interval = setInterval(updateUsage, 10000);
    return () => clearInterval(interval);
  }, []); // Empty dependencies array - only run once on mount

  const updateUsage = async () => {
    try {
      console.log('🔄 API Dashboard: Updating usage data...');
      setDashboardLoading(true);
      const usageData = await googleAPILimitManager.getUsageReport();
      const costData = await googleAPILimitManager.getMonthlyCostInfo();
      console.log('📊 API Dashboard: Usage data:', usageData);
      console.log('💰 API Dashboard: Cost data:', costData);
      setUsage(usageData);
      setMonthlyCost(costData);
      console.log('✅ API Dashboard: Usage data updated successfully');
    } catch (error) {
      console.error('❌ API Dashboard: Error updating usage data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // maxCostInfo not available in frontend - using static fallback
  const maxCostInfo = { maxCost: 100, warningThreshold: 80 };

  // Show for logged-in users in development, admins in production
  const shouldShowDashboard = process.env.NODE_ENV === 'development' 
    ? (user && !loading && !isCheckingAdmin)
    : (user && !loading && !isCheckingAdmin && isAdmin);
  console.log('🔍 API Dashboard render decision:', {
    user: !!user,
    loading,
    isCheckingAdmin,
    isAdminUser,
    shouldShowDashboard,
    inline
  });

  // Only show for logged-in users (temporarily allowing all users for development)
  if (loading || isCheckingAdmin) {
    console.log('🔍 API Dashboard: Hiding due to loading state');
    return null; // Hide while checking
  }

  if (!shouldShowDashboard) {
    console.log('🔍 API Dashboard: Hiding - user not logged in');
    return null; // Hide for non-logged-in users
  }

  // Only render when explicitly inline - no other modes supported
  if (!inline) {
    console.log('🔍 API Dashboard: Hiding - not inline mode');
    return null;
  }

  const toggleHistoricalUsage = () => {
    // Historical usage tracking not available in frontend
    console.log('📊 Historical usage tracking not available in frontend mode');
    
    if (hasHistoricalUsage) {
      // Remove historical usage tracking
      localStorage.removeItem('trustdiner_historical_usage_added');
      setHasHistoricalUsage(false);
      console.log('📊 Removed historical usage tracking');
    } else {
      // Add historical usage (frontend mode - simulation only)
      localStorage.setItem('trustdiner_historical_usage_added', 'true');
      setHasHistoricalUsage(true);
      console.log('📊 Simulated historical usage tracking (frontend mode)');
    }
    
    updateUsage();
  };

  const addSpecificUsage = (apiType: string, count: number) => {
    // Historical usage not available in frontend
    console.log('📊 Specific usage tracking not available in frontend mode');
    updateUsage();
  };

  const getColorForRisk = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'danger': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getWarningIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'danger': return '⚠️';
      case 'warning': return '💰';
      default: return '✅';
    }
  };

  // Get photo-specific information
  const photoUsage = usage.find(api => api.api === 'Photos');
  const photoRemaining = photoUsage ? photoUsage.limit - photoUsage.used : 0;

  // Helper to get API description and cost info
  const getAPIInfo = (apiName: string) => {
    const info = {
      'Maps': { cost: '$7/1K', description: 'Map loads' },
      'Autocomplete': { cost: '$2.83/1K', description: 'Search suggestions' },
      'Places Details': { cost: '$17/1K', description: 'Detailed place info' },
      'Photos': { cost: '$7/1K', description: 'Image downloads (auto-download active)' },
      'Text Search': { cost: '$32/1K', description: 'Place search queries' }
    };
    return info[apiName as keyof typeof info] || { cost: 'Unknown', description: 'API calls' };
  };

  // Inline mode - render content directly
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h4 className="font-semibold text-gray-900 mb-3">Google API Usage & Costs</h4>
      
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading API usage data...</span>
        </div>
      ) : (
        <>
          {/* Monthly Cost Overview */}
          {monthlyCost && (
        <div className={`mb-4 p-3 border rounded ${getWarningLevelColor(monthlyCost.warningLevel)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getWarningIcon(monthlyCost.warningLevel)}</span>
              <span className="font-semibold">Monthly Cost ({monthlyCost.month})</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${monthlyCost.currentCost.toFixed(2)}</div>
              <div className="text-xs opacity-75">Projected: ${monthlyCost.projectedMonthlyCost.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="space-y-1 text-xs">
            {monthlyCost.breakdown
              .filter((item: any) => item.cost > 0)
              .sort((a: any, b: any) => b.cost - a.cost)
              .map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{item.api}: {item.requests} requests</span>
                  <span className="font-medium">${item.cost.toFixed(2)}</span>
                </div>
              ))}
          </div>
          
          {monthlyCost.warningLevel !== 'safe' && (
            <div className="mt-2 text-xs font-medium">
              {monthlyCost.warningLevel === 'critical' && 'CRITICAL: Monthly costs are very high!'}
              {monthlyCost.warningLevel === 'danger' && 'DANGER: Approaching cost limit!'}
              {monthlyCost.warningLevel === 'warning' && 'WARNING: Monitor usage carefully.'}
            </div>
          )}
          
          {/* Maximum Cost Info */}
          <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Cap Protection:</span>
              <span className="font-bold text-green-700">Max ${maxCostInfo.maxCost.toFixed(2)}/month</span>
            </div>
            <div className="text-gray-500 mt-1">
              Hard caps prevent costs above $100/month (5K regular + 2K expensive APIs)
            </div>
          </div>
        </div>
      )}
      
                {/* Photo Download Alert */}
      {photoUsage && photoUsage.percentage > 75 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-yellow-800">
              <strong>Photo downloads:</strong> {photoRemaining} remaining this month. 
              Auto-download will be blocked when limit reached.
            </span>
          </div>
        </div>
      )}
      
      {/* Daily Usage */}
      <h5 className="font-medium text-gray-700 mb-2">Daily Usage</h5>
      <div className="space-y-3 mb-4">
        {usage.map((api, index) => {
          const apiInfo = getAPIInfo(api.api);
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getColorForRisk(api.cost_risk)}`}>
                    {api.api}
                  </span>
                  <span className="text-xs text-gray-500">
                    {apiInfo.cost}
                  </span>
                  {api.dailyCost > 0 && (
                    <span className="text-xs text-gray-600 font-medium">
                      ${api.dailyCost.toFixed(3)}
                    </span>
                  )}
                </div>
                <span className="text-gray-600">
                  {api.used}/{api.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(api.percentage)}`}
                  style={{ width: `${Math.min(api.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {apiInfo.description} • {api.percentage}% used today
                {api.percentage >= 90 && (
                  <span className="text-red-600 font-medium ml-2">⚠️ Near daily limit!</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Caps */}
      <h5 className="font-medium text-gray-700 mb-2">Monthly Caps (Hard Limits)</h5>
      <div className="space-y-3">
        {usage.map((api, index) => {
          const isExpensiveAPI = api.api === 'Places Details' || api.api === 'Text Search';
          const capWarningLevel = api.monthlyPercentage >= 90 ? 'critical' : 
                                 api.monthlyPercentage >= 75 ? 'danger' : 
                                 api.monthlyPercentage >= 50 ? 'warning' : 'safe';
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isExpensiveAPI ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {api.api}
                  </span>
                  <span className="text-xs font-medium">
                    {isExpensiveAPI ? '2K cap' : '5K cap'}
                  </span>
                  {capWarningLevel === 'critical' && (
                    <span className="text-xs bg-red-100 text-red-800 px-1 rounded font-bold">🚨 BLOCKED</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  capWarningLevel === 'critical' ? 'text-red-600' :
                  capWarningLevel === 'danger' ? 'text-orange-600' :
                  capWarningLevel === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {api.monthlyUsed}/{api.monthlyCap}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    capWarningLevel === 'critical' ? 'bg-red-500' :
                    capWarningLevel === 'danger' ? 'bg-orange-500' :
                    capWarningLevel === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(api.monthlyPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs">
                <span className={
                  capWarningLevel === 'critical' ? 'text-red-600 font-bold' :
                  capWarningLevel === 'danger' ? 'text-orange-600 font-medium' :
                  capWarningLevel === 'warning' ? 'text-yellow-600' : 'text-gray-500'
                }>
                  {api.monthlyPercentage}% of monthly cap used
                  {capWarningLevel === 'critical' && ' • API BLOCKED'}
                  {capWarningLevel === 'danger' && ' • Approaching limit!'}
                  {capWarningLevel === 'warning' && ' • Monitor usage'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Download Info */}
      {photoUsage && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="text-blue-800">
            <strong>📸 Auto Photo Downloads:</strong> {photoRemaining} downloads remaining this month
          </div>
          <div className="text-blue-600 text-xs mt-1">
            Photos are automatically downloaded when you add new places from map clicks or search results.
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">
          💰 Monthly tracking active. Limits: Maps/Autocomplete/Text Search: 2000, Places Details/Photos: 5000.
        </div>
        <div className="flex gap-2">
          <button
            onClick={updateUsage}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
          >
            🔄 Refresh
          </button>

          <button
            onClick={toggleHistoricalUsage}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              hasHistoricalUsage
                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
          >
            {hasHistoricalUsage 
              ? '🗑️ Remove Historical Usage' 
              : '📊 Add Historical Usage'
            }
          </button>
        </div>
        
        {/* Quick add buttons for specific API types */}
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => addSpecificUsage('placesDetailsRequests', 100)}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-1 py-0.5 rounded"
            title="Add 100 Places Details calls (database population)"
          >
            +100 Details
          </button>
          <button
            onClick={() => addSpecificUsage('photosRequests', 200)}
            className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-1 py-0.5 rounded"
            title="Add 200 Photos calls (photo downloads)"
          >
            +200 Photos
          </button>
          <button
            onClick={() => addSpecificUsage('textSearchRequests', 5)}
            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-1 py-0.5 rounded"
            title="Add 5 Search calls"
          >
            +5 Search
          </button>
          <button
            onClick={() => addSpecificUsage('mapsLoads', 10)}
            className="text-xs bg-teal-100 hover:bg-teal-200 text-teal-700 px-1 py-0.5 rounded"
            title="Add 10 Maps loads"
          >
            +10 Maps
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Remove limits when deploying to production
      </div>
        </>
      )}
    </div>
  );
} 