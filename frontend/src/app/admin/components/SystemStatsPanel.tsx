"use client";

interface SystemStats {
  establishments: number;
  reviews: number;
  users: number;
  apiUsage?: {
    dailyCalls: number;
    monthlyCalls: number;
    costEstimate: number;
  };
}

interface SystemStatsPanelProps {
  stats: SystemStats | null;
  loading: boolean;
  error?: string | null;
}

export default function SystemStatsPanel({ stats, loading, error }: SystemStatsPanelProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading dashboard stats: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-gray-500 text-center">Unable to load system statistics</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Establishments',
      value: stats.establishments?.toLocaleString() || '0',
      icon: '🏪',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Reviews',
      value: stats.reviews?.toLocaleString() || '0',
      icon: '⭐',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Users',
      value: stats.users?.toLocaleString() || '0',
      icon: '👤',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'API Calls Today',
      value: stats.apiUsage?.dailyCalls?.toLocaleString() || '0',
      icon: '📡',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center text-lg`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </div>
                  <div className={`text-2xl font-semibold ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
