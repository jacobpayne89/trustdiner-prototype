"use client";

import { useState, useEffect } from 'react';
import { googleAPILimitManager } from '@/lib/google-api-limits';
// Note: GoogleAPILimitManager should be accessed via API calls, not direct import
// This is a frontend component and should not import backend utilities  
// import { googleAPILimitManager } from '@/lib/google-api-limits';

interface MonitoringData {
  apiUsage: {
    api: string;
    used: number;
    limit: number;
    percentage: number;
    cost_risk: 'low' | 'medium' | 'high';
  }[];
  systemHealth: {
    lastUpdate: string;
    status: 'healthy' | 'warning' | 'critical';
  };
}

export default function ProductionMonitoring() {
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or for admin users
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = window.location.search.includes('admin=true');
    
    if (isDev || isAdmin) {
      setIsVisible(true);
      updateMonitoringData();
      
      // Update every 30 seconds
      const interval = setInterval(updateMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const updateMonitoringData = async () => {
    try {
      const apiUsage = await googleAPILimitManager.getUsageReport();
      
      // Determine overall health
      const highUsage = apiUsage.some(api => api.percentage > 80);
      const criticalUsage = apiUsage.some(api => api.percentage > 95);
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalUsage) status = 'critical';
      else if (highUsage) status = 'warning';

      setMonitoring({
        apiUsage,
        systemHealth: {
          lastUpdate: new Date().toLocaleTimeString(),
          status
        }
      });
    } catch (error) {
      console.error('Error updating monitoring data:', error);
    }
  };

  if (!isVisible || !monitoring) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">System Monitoring</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(monitoring.systemHealth.status)}`}>
          {monitoring.systemHealth.status.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-2">
        {monitoring.apiUsage.map((api) => (
          <div key={api.api} className="text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium">{api.api}</span>
              <span className={`font-medium ${getRiskColor(api.cost_risk)}`}>
                {api.used}/{api.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  api.percentage > 90 ? 'bg-red-500' : 
                  api.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(api.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {api.percentage}% used
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        Last updated: {monitoring.systemHealth.lastUpdate}
      </div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
} 