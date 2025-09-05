import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DashboardStats {
  establishments: number;
  reviews: number;
  users: number;
  apiUsage: {
    dailyCalls: number;
    dailyLimit: number;
    monthlyCalls: number;
    monthlyLimit: number;
    costEstimate: number;
    lastUpdated: string;
  };
}

interface UseDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

