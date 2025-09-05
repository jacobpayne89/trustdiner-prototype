"use client";

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { AuthContext } from '@/app/context/AuthContext';

// Components
import AdminMessage from '../../components/AdminMessage';

interface DeletedUser {
  id: number;
  email: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  user_type: string;
  deleted_at: string;
  deleted_by_name: string | null;
  days_since_deletion: number;
  review_count: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DeletedUsersPage() {
  // Authentication
  const { isAdminUser, isCheckingAdmin, error: authError, loading: authLoading } = useAdminAuth();
  const { user } = useContext(AuthContext);
  
  // Messages
  const { message, showSuccess, showError } = useAdminMessages();
  
  // State
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringUserId, setRestoringUserId] = useState<number | null>(null);
  const [permanentDeletingUserId, setPermanentDeletingUserId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1
  });

  // Fetch deleted users
  const fetchDeletedUsers = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/admin/users/deleted?${params}`, {
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch deleted users');
      }

      const data = await response.json();
      setDeletedUsers(data.users || []);
      setPagination(data.pagination || pagination);
      
    } catch (error) {
      console.error('❌ Failed to fetch deleted users:', error);
      showError('Failed to load deleted users');
    } finally {
      setLoading(false);
    }
  };

  // Load data when admin status is confirmed
  useEffect(() => {
    if (isAdminUser && !isCheckingAdmin) {
      fetchDeletedUsers(1);
    }
  }, [isAdminUser, isCheckingAdmin]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchDeletedUsers(page);
  };

  // Restore user
  const handleRestoreUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to restore user "${userEmail}"?`)) {
      return;
    }

    try {
      setRestoringUserId(userId);
      
      const response = await fetch(`/api/admin/users/${userId}/restore`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore user');
      }

      const data = await response.json();
      showSuccess(data.message || 'User restored successfully');
      
      // Refresh the deleted users list
      fetchDeletedUsers(pagination.page);
      
    } catch (error) {
      console.error('❌ Failed to restore user:', error);
      showError(error instanceof Error ? error.message : 'Failed to restore user');
    } finally {
      setRestoringUserId(null);
    }
  };

  // Permanently delete user
  const handlePermanentDelete = async (userId: number, userEmail: string) => {
    if (!confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nThis will PERMANENTLY delete user "${userEmail}" and ALL their data including:\n- Account information\n- Reviews\n- Email verifications\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return;
    }

    // Double confirmation for permanent deletion
    if (!confirm(`Final confirmation: Type "DELETE" to permanently remove ${userEmail}`)) {
      return;
    }

    try {
      setPermanentDeletingUserId(userId);
      
      const response = await fetch(`/api/admin/users/${userId}/permanent`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to permanently delete user');
      }

      const data = await response.json();
      showSuccess(data.message || 'User permanently deleted');
      
      // Refresh the deleted users list
      fetchDeletedUsers(pagination.page);
      
    } catch (error) {
      console.error('❌ Failed to permanently delete user:', error);
      showError(error instanceof Error ? error.message : 'Failed to permanently delete user');
    } finally {
      setPermanentDeletingUserId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || isCheckingAdmin) {
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

  if (!isAdminUser) {
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
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <Link href="/admin" className="text-gray-400 hover:text-gray-500">
                      Admin
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400">/</span>
                      <Link href="/admin/users" className="ml-4 text-gray-400 hover:text-gray-500">
                        User Management
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-400">/</span>
                      <span className="ml-4 text-gray-500">Deleted Users</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900">
                Deleted Users
              </h1>
              <p className="mt-2 text-gray-600">
                View and restore users deleted within the last 30 days
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        {message && <AdminMessage message={message} />}

        {/* Deleted Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Warning Message */}
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Restore:</strong> Reactivates the user account. <strong>Delete Forever:</strong> Permanently removes all user data including reviews and verifications (cannot be undone).
                </p>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading deleted users...</p>
            </div>
          ) : deletedUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted users</h3>
              <p className="text-gray-500">There are no users that have been deleted within the last 30 days.</p>
              <div className="mt-4">
                <Link 
                  href="/admin/users"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to User Management
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deletedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 font-medium text-sm">
                                {(user.display_name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm text-gray-900">
                            Deleted: {formatDate(user.deleted_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            By: {user.deleted_by_name || 'System'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.review_count} reviews
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm text-gray-900">
                            {30 - Math.floor(user.days_since_deletion)} days left
                          </div>
                          <div className="text-xs text-gray-500">
                            Deleted {Math.floor(user.days_since_deletion)} days ago
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRestoreUser(user.id, user.email)}
                            disabled={restoringUserId === user.id || permanentDeletingUserId === user.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {restoringUserId === user.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-700 mr-1"></div>
                                Restoring...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Restore
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handlePermanentDelete(user.id, user.email)}
                            disabled={restoringUserId === user.id || permanentDeletingUserId === user.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {permanentDeletingUserId === user.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700 mr-1"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Forever
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Back to Users */}
        <div className="mt-8">
          <Link 
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to User Management
          </Link>
        </div>
      </main>
    </div>
  );
}
