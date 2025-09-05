"use client";

import { useState } from 'react';
import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminReviews, type Review } from '@/hooks/useAdminReviews';
import { useAdminMessages } from '@/hooks/useAdminMessages';

// Components
import AdminMessage from '../components/AdminMessage';

export default function ReviewModerationPage() {
  const { isAdmin, loading: authLoading, error: authError } = useAdminAuth();
  const { message, showSuccess, showError } = useAdminMessages();
  const { 
    reviews, 
    pagination, 
    loading: dataLoading, 
    error: dataError,
    filters,
    setFilters,
    moderateReview,
    deleteReview,
    processingIds
  } = useAdminReviews();
  
  // UI state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Handle moderation with message feedback
  const handleModerateReview = async (reviewId: number, updates: Partial<Review>) => {
    const result = await moderateReview(reviewId, updates);
    if (result.success) {
      showSuccess('Review moderated successfully');
      setShowModerationModal(false);
      setSelectedReview(null);
    } else {
      showError(result.error || 'Failed to moderate review');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    const result = await deleteReview(reviewId);
    if (result.success) {
      showSuccess('Review deleted successfully');
    } else {
      showError(result.error || 'Failed to delete review');
    }
  };

  const formatAllergenScores = (scores: any) => {
    if (!scores) return 'N/A';
    const allergens = ['gluten', 'milk', 'tree_nuts', 'eggs', 'soybeans', 'fish', 'crustaceans', 'sesame'];
    return allergens
      .filter(allergen => scores[allergen] !== undefined)
      .map(allergen => `${allergen}: ${scores[allergen]}/5`)
      .join(', ');
  };

  const getStatusBadge = (review: Review) => {
    if (review.is_hidden) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Hidden</span>;
    }
    if (review.is_flagged) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Flagged</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
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
                      <span className="text-gray-900 font-medium">Review Moderation</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Review Moderation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Moderate user reviews and manage content quality
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        <AdminMessage message={message} />

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Reviews
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by review text or establishment name..."
              />
            </div>
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="filter"
                value={filters.filter}
                onChange={(e) => setFilters({ filter: e.target.value as 'all' | 'flagged' | 'hidden' })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="flagged">Flagged Reviews</option>
                <option value="hidden">Hidden Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {dataLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review & User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Establishment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating & Scores
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-900 max-w-md">
                            {review.review_text ? (
                              review.review_text.length > 100 
                                ? `${review.review_text.substring(0, 100)}...`
                                : review.review_text
                            ) : 'No review text'}
                          </div>
                          <div className="text-xs text-gray-500">
                            By: {review.user_name} ({review.user_email})
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{review.establishment_name}</div>
                        <div className="text-xs text-gray-500">{review.establishment_address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Overall: {review.overall_rating}/5
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatAllergenScores(review.allergen_scores)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(review)}
                        {review.admin_response && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Has Response
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setShowModerationModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Moderate
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={processingIds.has(review.id)}
                            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                          >
                            {processingIds.has(review.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reviews.length === 0 && !dataLoading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setFilters({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setFilters({ page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Moderation Modal */}
      {showModerationModal && selectedReview && (
        <ModerationModal
          review={selectedReview}
          onSave={(updates) => handleModerateReview(selectedReview.id, updates)}
          onCancel={() => {
            setShowModerationModal(false);
            setSelectedReview(null);
          }}
          processing={processingIds.has(selectedReview.id)}
        />
      )}
    </div>
  );
}

// Moderation Modal Component
interface ModerationModalProps {
  review: Review;
  onSave: (updates: Partial<Review>) => void;
  onCancel: () => void;
  processing: boolean;
}

function ModerationModal({ review, onSave, onCancel, processing }: ModerationModalProps) {
  const [isFlagged, setIsFlagged] = useState(review.is_flagged);
  const [isHidden, setIsHidden] = useState(review.is_hidden);
  const [adminResponse, setAdminResponse] = useState(review.admin_response || '');

  const handleSave = () => {
    onSave({
      is_flagged: isFlagged,
      is_hidden: isHidden,
      admin_response: adminResponse.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Moderate Review</h3>
          
          {/* Review Details */}
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="text-sm text-gray-900 mb-2">
              <strong>Review:</strong> {review.review_text || 'No review text'}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>User:</strong> {review.user_name} ({review.user_email})
            </div>
            <div className="text-sm text-gray-600">
              <strong>Establishment:</strong> {review.establishment_name}
            </div>
          </div>

          {/* Moderation Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isFlagged}
                  onChange={(e) => setIsFlagged(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Flag for review</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Hide from public</span>
              </label>
            </div>

            <div>
              <label htmlFor="adminResponse" className="block text-sm font-medium text-gray-700 mb-2">
                TrustDiner Response (Optional)
              </label>
              <textarea
                id="adminResponse"
                rows={3}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional response from TrustDiner team..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onCancel}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={processing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
