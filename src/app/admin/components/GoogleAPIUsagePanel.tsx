"use client";

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import Link from 'next/link';

interface APIUsageData {
  dailyUsage: number;
  monthlyUsage: number;
  estimatedCost: number;
  costPerThousand: number;
  usageBreakdown: {
    textSearch: number;
    placeDetails: number;
    photos: number;
    maps: number;
  };
  lastUpdated: string;
}

interface GoogleAPIUsagePanelProps {
  preview?: boolean;
}

interface BillingCycleData {
  billingCycleUsage: number;
  billingCycleCost: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  daysInCycle: number;
  daysRemaining: number;
  usageBreakdown: Record<string, number>;
  lastUpdated: string;
}

export default function GoogleAPIUsagePanel({ preview = false }: GoogleAPIUsagePanelProps) {
  const { user } = useContext(AuthContext);
  const [apiUsage, setApiUsage] = useState<APIUsageData | null>(null);
  const [billingCycleData, setBillingCycleData] = useState<BillingCycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycleLoading, setBillingCycleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycleError, setBillingCycleError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAPIUsage = async () => {
    if (!user?.id) {
      setError('User authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/google-usage', {
        headers: {
          'x-user-id': user.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch API usage data');
      }
      
      const data = await response.json();
      setApiUsage(data);
    } catch (error) {
      console.error('Failed to fetch API usage:', error);
      setError('Failed to load API usage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingCycleData = async () => {
    if (!user?.id) {
      setBillingCycleError('User authentication required');
      setBillingCycleLoading(false);
      return;
    }

    try {
      setBillingCycleLoading(true);
      setBillingCycleError(null);
      
      const response = await fetch('/api/admin/google-usage-billing-cycle', {
        headers: {
          'x-user-id': user.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch billing cycle data');
      }
      
      const data = await response.json();
      setBillingCycleData(data);
    } catch (error) {
      console.error('Failed to fetch billing cycle data:', error);
      setBillingCycleError('Failed to load billing cycle data');
    } finally {
      setBillingCycleLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAPIUsage();
      fetchBillingCycleData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (autoRefresh && user?.id) {
      const interval = setInterval(() => {
        fetchAPIUsage();
        fetchBillingCycleData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user?.id]);

  const handleRefresh = () => {
    fetchAPIUsage();
    fetchBillingCycleData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading && !apiUsage) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={handleRefresh}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!apiUsage) return null;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Google API Usage
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoRefresh}
              className={`px-3 py-1 rounded text-sm font-medium ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            {!preview && (
              <Link
                href="/admin/api-usage"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium"
              >
                View Details →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Usage Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {apiUsage.dailyUsage.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Daily Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {apiUsage.monthlyUsage.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Monthly Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${apiUsage.estimatedCost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Estimated Cost</div>
          </div>
        </div>

        {/* Usage Breakdown */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {apiUsage.usageBreakdown.textSearch}
              </div>
              <div className="text-xs text-gray-500">Text Search</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {apiUsage.usageBreakdown.placeDetails}
              </div>
              <div className="text-xs text-gray-500">Place Details</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {apiUsage.usageBreakdown.photos}
              </div>
              <div className="text-xs text-gray-500">Photos</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {apiUsage.usageBreakdown.maps}
              </div>
              <div className="text-xs text-gray-500">Maps</div>
            </div>
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900">
                Cost per 1,000 requests: ${apiUsage.costPerThousand.toFixed(2)}
              </div>
              <div className="text-xs text-blue-700">
                Last updated: {new Date(apiUsage.lastUpdated).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-700">
                Total requests: {(apiUsage.dailyUsage + apiUsage.monthlyUsage).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Cycle Summary */}
        {billingCycleLoading ? (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Billing Cycle</h4>
            <div className="animate-pulse">
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : billingCycleError ? (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Billing Cycle</h4>
            <div className="text-red-600 text-sm text-center py-2">{billingCycleError}</div>
          </div>
        ) : billingCycleData ? (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Billing Cycle</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-indigo-600">
                  {billingCycleData.billingCycleUsage.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Calls</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">
                  ${billingCycleData.billingCycleCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Cost</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {billingCycleData.daysRemaining}
                </div>
                <div className="text-xs text-gray-500">Days Left</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {new Date(billingCycleData.billingCycleStart).toLocaleDateString()} - {new Date(billingCycleData.billingCycleEnd).toLocaleDateString()}
            </div>
          </div>
        ) : null}

        {preview && (
          <div className="mt-4 text-center">
            <Link
              href="/admin/api-usage"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Full API Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}