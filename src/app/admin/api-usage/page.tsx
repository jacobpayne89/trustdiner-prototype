"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useAdminMessages } from '@/hooks/useAdminMessages';

// Components
import AdminMessage from '../components/AdminMessage';

interface APICall {
  endpoint: string;
  method: string;
  timestamp: string;
  costImpact: number;
  responseTime?: number;
  statusCode?: number;
}

interface APIUsageStats {
  dailyCalls: number;
  dailyLimit: number;
  monthlyCalls: number;
  monthlyLimit: number;
  costEstimate: number;
  lastUpdated: string;
}

interface APIUsageData {
  stats: APIUsageStats;
  recentCalls: APICall[];
  breakdown: {
    textSearch: number;
    placeDetails: number;
    photos: number;
    maps: number;
  };
}

interface BillingCycleData {
  billingCycleUsage: number;
  billingCycleCost: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  daysInCycle: number;
  daysRemaining: number;
  costPerThousand: number;
  usageBreakdown: {
    textSearch: number;
    placeDetails: number;
    photos: number;
    maps: number;
  };
  lastUpdated: string;
}

export default function APIUsagePage() {
  const { isAdmin, loading: authLoading, error: authError } = useAdminAuth();
  const { message, showMessage } = useAdminMessages();
  
  const [apiData, setApiData] = useState<APIUsageData | null>(null);
  const [billingCycleData, setBillingCycleData] = useState<BillingCycleData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [billingCycleLoading, setBillingCycleLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [billingCycleError, setBillingCycleError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch real Google API usage data
  const fetchAPIUsage = async () => {
    try {
      setDataLoading(true);
      setDataError(null);
      
      const response = await fetch('/api/admin/google-usage', {
        headers: {
          'x-user-id': '1' // Use the admin user ID
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API usage data');
      }
      
      const data = await response.json();
      
      // Transform the real API data into the expected format
      const apiUsageData: APIUsageData = {
        stats: {
          dailyCalls: data.dailyUsage,
          dailyLimit: 1000, // Set reasonable limits
          monthlyCalls: data.monthlyUsage,
          monthlyLimit: 25000,
          costEstimate: data.estimatedCost,
          lastUpdated: data.lastUpdated
        },
        recentCalls: [], // Could be enhanced with real recent calls data
        breakdown: data.usageBreakdown || {
          textSearch: 0,
          placeDetails: 0,
          photos: 0,
          maps: 0
        }
      };
      setApiData(apiUsageData);
    } catch (error) {
      console.error('Failed to fetch API usage:', error);
      setDataError('Failed to load API usage data');
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch billing cycle data
  const fetchBillingCycleData = async () => {
    try {
      setBillingCycleLoading(true);
      setBillingCycleError(null);
      
      const response = await fetch('/api/admin/google-usage-billing-cycle', {
        headers: {
          'x-user-id': '1' // Use the admin user ID
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing cycle data');
      }
      
      const data = await response.json();
      
      // Transform the data to match our interface
      const billingCycleUsageData: BillingCycleData = {
        billingCycleUsage: data.billingCycleUsage,
        billingCycleCost: data.billingCycleCost,
        billingCycleStart: data.billingCycleStart,
        billingCycleEnd: data.billingCycleEnd,
        daysInCycle: data.daysInCycle,
        daysRemaining: data.daysRemaining,
        costPerThousand: data.costPerThousand,
        usageBreakdown: data.usageBreakdown || {
          textSearch: 0,
          placeDetails: 0,
          photos: 0,
          maps: 0
        },
        lastUpdated: data.lastUpdated
      };
      setBillingCycleData(billingCycleUsageData);
    } catch (error) {
      console.error('Failed to fetch billing cycle data:', error);
      setBillingCycleError('Failed to load billing cycle data');
    } finally {
      setBillingCycleLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAdmin) {
      fetchAPIUsage();
      fetchBillingCycleData();
    }
  }, [isAdmin]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;

    const interval = setInterval(() => {
      fetchAPIUsage();
      fetchBillingCycleData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin]);

  const calculateUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'border-red-500 bg-red-50';
    if (percentage >= 75) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const handleRefresh = () => {
    fetchAPIUsage();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">{authError}</div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                      Admin
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400 mx-2">/</span>
                      <span className="text-gray-900 font-medium">API Usage</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Google API Usage Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                  autoRefresh ? 'text-blue-700 bg-blue-50' : 'text-gray-700 bg-white'
                } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {autoRefresh ? '⏸️' : '▶️'} Auto-refresh
              </button>
              <button
                onClick={handleRefresh}
                disabled={dataLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        <AdminMessage message={message} />
        
        {dataLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : apiData ? (
          <div className="space-y-6">
            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Usage */}
              <div className={`bg-white border-l-4 shadow rounded-lg p-6 ${getUsageColor(calculateUsagePercentage(apiData.stats.dailyCalls, apiData.stats.dailyLimit))}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Used</span>
                    <span>{calculateUsagePercentage(apiData.stats.dailyCalls, apiData.stats.dailyLimit)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getProgressBarColor(calculateUsagePercentage(apiData.stats.dailyCalls, apiData.stats.dailyLimit))}`}
                      style={{ width: `${Math.min(calculateUsagePercentage(apiData.stats.dailyCalls, apiData.stats.dailyLimit), 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {apiData.stats.dailyCalls.toLocaleString()} / {apiData.stats.dailyLimit.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">API calls today</div>
              </div>

              {/* Monthly Usage */}
              <div className={`bg-white border-l-4 shadow rounded-lg p-6 ${getUsageColor(calculateUsagePercentage(apiData.stats.monthlyCalls, apiData.stats.monthlyLimit))}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Usage</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Used</span>
                    <span>{calculateUsagePercentage(apiData.stats.monthlyCalls, apiData.stats.monthlyLimit)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getProgressBarColor(calculateUsagePercentage(apiData.stats.monthlyCalls, apiData.stats.monthlyLimit))}`}
                      style={{ width: `${Math.min(calculateUsagePercentage(apiData.stats.monthlyCalls, apiData.stats.monthlyLimit), 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {apiData.stats.monthlyCalls.toLocaleString()} / {apiData.stats.monthlyLimit.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">API calls this month</div>
              </div>
            </div>

            {/* Cost Estimate */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Estimate</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${apiData.stats.costEstimate.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated monthly cost</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    ${(apiData.stats.costEstimate / apiData.stats.monthlyCalls * 1000).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Cost per 1,000 calls</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {new Date(apiData.stats.lastUpdated).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">Last updated</div>
                </div>
              </div>
            </div>

            {/* API Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Breakdown (Today)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{apiData.breakdown.textSearch}</div>
                  <div className="text-sm text-gray-600">Text Search</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{apiData.breakdown.placeDetails}</div>
                  <div className="text-sm text-gray-600">Place Details</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{apiData.breakdown.photos}</div>
                  <div className="text-sm text-gray-600">Photos</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{apiData.breakdown.maps}</div>
                  <div className="text-sm text-gray-600">Maps</div>
                </div>
              </div>
            </div>

            {/* Billing Cycle Breakdown */}
            {billingCycleLoading ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Breakdown (Current Billing Cycle)</h3>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : billingCycleError ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Breakdown (Current Billing Cycle)</h3>
                <div className="text-red-600 text-center py-4">{billingCycleError}</div>
              </div>
            ) : billingCycleData ? (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">API Breakdown (Current Billing Cycle)</h3>
                  <div className="text-sm text-gray-500">
                    {new Date(billingCycleData.billingCycleStart).toLocaleDateString()} - {new Date(billingCycleData.billingCycleEnd).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Billing Cycle Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{billingCycleData.billingCycleUsage.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total API Calls</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">${billingCycleData.billingCycleCost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Estimated Cost</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{billingCycleData.daysRemaining}</div>
                    <div className="text-sm text-gray-600">Days Remaining</div>
                  </div>
                </div>

                {/* API Service Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{billingCycleData.usageBreakdown.textSearch || 0}</div>
                    <div className="text-sm text-gray-600">Text Search</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{billingCycleData.usageBreakdown.placeDetails || 0}</div>
                    <div className="text-sm text-gray-600">Place Details</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{billingCycleData.usageBreakdown.photos || 0}</div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">{billingCycleData.usageBreakdown.maps || 0}</div>
                    <div className="text-sm text-gray-600">Maps</div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Recent API Calls */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent API Calls</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Impact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiData.recentCalls.length > 0 ? apiData.recentCalls.map((call, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {call.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {call.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(call.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(call.costImpact || 0.01).toFixed(4)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No recent API calls
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-gray-500 text-center">Unable to load API usage data</div>
          </div>
        )}
      </main>
    </div>
  );
}
