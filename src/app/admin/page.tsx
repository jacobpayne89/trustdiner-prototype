"use client";

import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';

// Components
import GoogleAPIUsagePanel from './components/GoogleAPIUsagePanel';
import LiveMetrics from './components/LiveMetrics';
import AdminMessage from './components/AdminMessage';
import AWSTrackingDashboard from './components/AWSTrackingDashboard';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading, error: authError } = useAdminAuth();
  const { message } = useAdminMessages();

  // Debug logging
  console.log('🔍 Admin page render:', { isAdmin, authLoading, authError });

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
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                TrustDiner administration panel
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        <AdminMessage message={message} />
        
        {/* Live Metrics */}
        <LiveMetrics autoRefresh={true} refreshInterval={30000} />

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/places" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-green-600">
                      🏪
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600">
                      Place Editor
                    </h3>
                    <p className="text-sm text-gray-500">
                      Edit establishments & assign chains
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/chains" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-purple-600">
                      🔗
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600">
                      Chain Management
                    </h3>
                    <p className="text-sm text-gray-500">
                      Create & manage restaurant chains
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/api-usage" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-blue-600">
                      📊
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                      API Usage
                    </h3>
                    <p className="text-sm text-gray-500">
                      Monitor Google API usage & costs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/reviews" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-orange-600">
                      📝
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-600">
                      Review Management
                    </h3>
                    <p className="text-sm text-gray-500">
                      Moderate & manage user reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/aws-tracking" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-blue-600">
                      ☁️
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                      AWS Tracking
                    </h3>
                    <p className="text-sm text-gray-500">
                      Monitor AWS costs & infrastructure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* API Usage Preview */}
        <div className="mb-8">
          <GoogleAPIUsagePanel preview={true} />
        </div>

        {/* AWS Infrastructure Tracking */}
        <div className="mb-8">
          <AWSTrackingDashboard autoRefresh={true} refreshInterval={300000} />
        </div>
      </main>
    </div>
  );
}
