"use client";

import { useAdminAuth } from '@/hooks/useAdminAuth';
import AWSTrackingDashboard from '../components/AWSTrackingDashboard';

export default function AWSTrackingPage() {
  const { isAdmin, loading: authLoading, error: authError } = useAdminAuth();

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">Access Denied</div>
          <p className="mt-2 text-gray-600">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                ☁️ AWS Infrastructure Tracking
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor AWS costs, activity, and resource utilization across all services
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AWSTrackingDashboard autoRefresh={true} refreshInterval={300000} />
      </main>
    </div>
  );
}
