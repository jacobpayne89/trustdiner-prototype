"use client";

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { AuthContext } from '@/app/context/AuthContext';

// Components
import AdminMessage from '../components/AdminMessage';

interface Establishment {
  id: number;
  name: string;
  address: string;
  place_id: string;
  chain_id: number | null;
  chain_name: string | null;
  primary_category: string;
  cuisine: string;
  phone: string | null;
  website: string | null;
  local_image_url: string | null;
  review_count: number;
  avg_review_rating: number | null;
}

interface Chain {
  id: number;
  name: string;
  logo_url: string | null;
}

export default function PlaceEditorPage() {
  // Authentication
  const { isAdminUser, isCheckingAdmin, error: authError, loading: authLoading } = useAdminAuth();
  const { user } = useContext(AuthContext);
  
  // Messages
  const { message, showSuccess, showError } = useAdminMessages();
  
  // State
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());

  const pageSize = 25;

  // Fetch establishments
  const fetchEstablishments = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: search,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      const response = await fetch(`/api/admin/establishments?${params}`, {
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch establishments');
      }

      const data = await response.json();
      setEstablishments(data.establishments || []);
      // Handle both response formats: direct total or pagination.total
      const total = data.total || data.pagination?.total || 0;
      setTotalPages(Math.ceil(total / pageSize));
      setTotalCount(total);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('❌ Failed to fetch establishments:', error);
      showError('Failed to load establishments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch chains
  const fetchChains = async () => {
    try {
      const response = await fetch('/api/admin/chains', {
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chains');
      }

      const data = await response.json();
      // Handle both response formats: direct array or {chains: array}
      const chainsData = Array.isArray(data) ? data : data.chains || [];
      setChains(chainsData);
      
    } catch (error) {
      console.error('❌ Failed to fetch chains:', error);
      showError('Failed to load chains');
    }
  };

  // Load data when admin status is confirmed
  useEffect(() => {
    if (isAdminUser && !isCheckingAdmin) {
      Promise.all([
        fetchEstablishments(1, searchTerm),
        fetchChains()
      ]);
    }
  }, [isAdminUser, isCheckingAdmin]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchEstablishments(1, term);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchEstablishments(page, searchTerm);
  };

  // Handle chain assignment
  const handleChainAssignment = async (establishmentId: number, chainId: number | null) => {
    try {
      const response = await fetch('/api/admin/assign-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || ''
        },
        body: JSON.stringify({
          establishmentId,
          chainId: chainId === 0 ? null : chainId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign chain');
      }

      showSuccess('Chain assignment updated successfully');
      fetchEstablishments(currentPage, searchTerm);
      
    } catch (error) {
      console.error('❌ Failed to assign chain:', error);
      showError('Failed to update chain assignment');
    }
  };

  // Handle image upload
  const handleImageUpload = async (establishmentId: number, file: File) => {
    try {
      setUploadingImages(prev => new Set(prev).add(establishmentId));
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/admin/establishments/${establishmentId}/image`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id?.toString() || ''
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      showSuccess('Image uploaded successfully');
      fetchEstablishments(currentPage, searchTerm);
      
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      showError('Failed to upload image');
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(establishmentId);
        return newSet;
      });
    }
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Place Editor
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Edit establishments and assign chains
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        <AdminMessage message={message} />

        {/* Search and Stats */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search establishments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="ml-4 text-sm text-gray-500">
            Showing {establishments.length} of {totalCount.toLocaleString()} establishments
          </div>
        </div>

        {/* Establishments Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading establishments...</p>
            </div>
          ) : establishments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No establishments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {establishments.map((establishment) => (
                    <tr key={establishment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {establishment.local_image_url ? (
                            <img
                              src={establishment.local_image_url}
                              alt={establishment.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div className="ml-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(establishment.id, file);
                                  }
                                }}
                                disabled={uploadingImages.has(establishment.id)}
                              />
                              <span className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                {uploadingImages.has(establishment.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  'Replace Image'
                                )}
                              </span>
                            </label>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {establishment.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {establishment.address}
                        </div>
                        {establishment.phone && (
                          <div className="text-xs text-gray-400">
                            📞 {establishment.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={establishment.chain_id || 0}
                          onChange={(e) => handleChainAssignment(establishment.id, parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value={0}>Individual Place</option>
                          {chains.map((chain) => (
                            <option key={chain.id} value={chain.id}>
                              {chain.name}
                            </option>
                          ))}
                        </select>
                        {establishment.chain_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            Currently: {establishment.chain_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {establishment.primary_category}
                        </div>
                        {establishment.cuisine && (
                          <div className="text-xs text-gray-500">
                            {establishment.cuisine}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {establishment.review_count} reviews
                        </div>
                        {establishment.avg_review_rating && (
                          <div className="text-xs text-gray-500">
                            ⭐ {Number(establishment.avg_review_rating).toFixed(1)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.open(`https://maps.google.com/?q=place_id:${establishment.place_id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View on Maps
                          </button>
                          {establishment.website && (
                            <button
                              onClick={() => window.open(establishment.website!, '_blank')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Website
                            </button>
                          )}
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
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}