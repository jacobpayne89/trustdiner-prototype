"use client";

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

interface AWSCostData {
  totalCost: number;
  dailyCost: number;
  serviceBreakdown: {
    service: string;
    cost: number;
    percentage: number;
  }[];
  budgetStatus: {
    budgetName: string;
    budgetLimit: number;
    actualSpend: number;
    forecastedSpend: number;
    percentage: number;
  }[];
  trend: {
    date: string;
    cost: number;
  }[];
}

interface AWSActivityData {
  recentEvents: {
    timestamp: string;
    eventName: string;
    eventSource: string;
    userIdentity: string;
    sourceIPAddress: string;
    userAgent: string;
    resources: string[];
  }[];
  serviceHealth: {
    service: string;
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      name: string;
      value: number;
      unit: string;
      threshold?: number;
    }[];
  }[];
  resourceUtilization: {
    service: string;
    resourceId: string;
    utilizationPercent: number;
    status: 'optimal' | 'underutilized' | 'overutilized';
  }[];
}

interface AWSDashboardData {
  costs: AWSCostData;
  activity: AWSActivityData;
  lastUpdated: string;
}

interface AWSTrackingDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function AWSTrackingDashboard({ 
  autoRefresh = true, 
  refreshInterval = 300000 // 5 minutes
}: AWSTrackingDashboardProps) {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState<AWSDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'activity'>('overview');

  const fetchAWSData = async () => {
    if (!user?.id) {
      setError('User authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/aws-tracking', {
        headers: {
          'x-user-id': user.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AWS data: ${response.status}`);
      }
      
      const awsData = await response.json();
      setData(awsData);
      setLastRefresh(new Date());
      
    } catch (err) {
      console.error('❌ Failed to fetch AWS tracking data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAWSData();
    }
    
    if (autoRefresh && user?.id) {
      const interval = setInterval(fetchAWSData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, user?.id]);

  const handleRefresh = () => {
    fetchAWSData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'optimal':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'underutilized':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'overutilized':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !data) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">⚠️ AWS Tracking Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">No AWS data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              ☁️ AWS Infrastructure Tracking
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Monitor AWS costs, activity, and resource utilization
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {lastRefresh && (
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>🔄 Refresh</>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'costs', label: 'Cost Analysis', icon: '💰' },
              { id: 'activity', label: 'Activity & Health', icon: '🔍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Cost */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-2xl">💰</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(data.costs.totalCost)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(data.costs.dailyCost)}/day avg
                </p>
              </div>
            </div>
          </div>

          {/* Service Health */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-2xl">🏥</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Service Health</p>
                <div className="flex space-x-1 mt-1">
                  {data.activity.serviceHealth.map((service, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}
                    >
                      {service.service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-2xl">📈</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budget Status</p>
                {data.costs.budgetStatus.length > 0 && (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {data.costs.budgetStatus[0].percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      of {formatCurrency(data.costs.budgetStatus[0].budgetLimit)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-2xl">🔍</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Events</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.activity.recentEvents.length}
                </p>
                <p className="text-sm text-gray-500">Last 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          {/* Budget Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Budget Status</h3>
            <div className="space-y-4">
              {data.costs.budgetStatus.map((budget, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{budget.budgetName}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(budget.percentage)}`}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.percentage >= 90 ? 'bg-red-500' :
                        budget.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Actual: {formatCurrency(budget.actualSpend)}</span>
                    <span>Budget: {formatCurrency(budget.budgetLimit)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Forecasted: {formatCurrency(budget.forecastedSpend)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Cost by Service</h3>
            <div className="space-y-3">
              {data.costs.serviceBreakdown.map((service, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{service.service}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(service.cost)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {service.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Trend */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Cost Trend (Last 30 Days)</h3>
            <div className="h-64 flex items-end space-x-1">
              {data.costs.trend.slice(-14).map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 w-full rounded-t"
                    style={{
                      height: `${Math.max((point.cost / Math.max(...data.costs.trend.map(p => p.cost))) * 200, 4)}px`
                    }}
                    title={`${formatDate(point.date)}: ${formatCurrency(point.cost)}`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {formatDate(point.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity & Health Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Service Health */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🏥 Service Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.activity.serviceHealth.map((service, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{service.service}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {service.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="flex justify-between text-sm">
                        <span className="text-gray-600">{metric.name}</span>
                        <span className="font-medium">
                          {metric.value.toFixed(1)} {metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Resource Utilization</h3>
            <div className="space-y-3">
              {data.activity.resourceUtilization.map((resource, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {resource.service} - {resource.resourceId}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{resource.utilizationPercent.toFixed(1)}%</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                          {resource.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          resource.status === 'overutilized' ? 'bg-red-500' :
                          resource.status === 'underutilized' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(resource.utilizationPercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Recent AWS Events</h3>
            <div className="space-y-3">
              {data.activity.recentEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{event.eventName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">{event.eventSource}</span> by {event.userIdentity}
                  </div>
                  {event.resources.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Resources: {event.resources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {data.activity.recentEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No recent events found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
