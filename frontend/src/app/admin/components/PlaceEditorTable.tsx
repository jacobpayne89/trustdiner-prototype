"use client";

import { useState, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

interface Establishment {
  id: string;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  primary_category: string;
  cuisine: string;
  business_status: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  chain_id: string | null;
  chain_name: string | null;
  chain_slug: string | null;
  review_count: number;
  avg_allergen_score: number | null;
  local_image_url?: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PlaceEditorTableProps {
  establishments: Establishment[];
  loading: boolean;
  onUpdate: (id: string, updates: Partial<Establishment>) => Promise<{ success: boolean; error?: string }>;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

interface EditingState {
  id: string | null;
  field: string | null;
  value: any;
}

export default function PlaceEditorTable({
  establishments,
  loading,
  onUpdate,
  pagination,
  onPageChange
}: PlaceEditorTableProps) {
  const { user } = useContext(AuthContext);
  const [editing, setEditing] = useState<EditingState>({ id: null, field: null, value: null });
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const startEdit = (id: string, field: string, currentValue: any) => {
    setEditing({ id, field, value: currentValue });
  };

  const cancelEdit = () => {
    setEditing({ id: null, field: null, value: null });
  };

  const saveEdit = async () => {
    if (!editing.id || !editing.field) return;

    setSaving(editing.id);
    
    try {
      const result = await onUpdate(editing.id, {
        [editing.field]: editing.value
      });

      if (result.success) {
        setEditing({ id: null, field: null, value: null });
      } else {
        alert(result.error || 'Failed to update');
      }
    } catch (error) {
      alert('Failed to update establishment');
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (establishmentId: string, file: File) => {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setUploadingImage(establishmentId);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/admin/establishments/${establishmentId}/image`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id.toString()
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      // Update the establishment with the new image URL
      await onUpdate(establishmentId, {
        local_image_url: result.imageUrl
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVerifiedBadge = (verified: boolean) => {
    return verified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ Verified
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unverified
      </span>
    );
  };

  const getChainBadge = (chainName: string | null) => {
    return chainName ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        🔗 {chainName}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Individual
      </span>
    );
  };

  const renderEditableCell = (establishment: Establishment, field: string, value: any, type: 'text' | 'select' | 'boolean' = 'text', options?: Array<{value: any, label: string}>) => {
    const isEditing = editing.id === establishment.id && editing.field === field;
    const isSaving = saving === establishment.id;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {type === 'text' && (
            <input
              type="text"
              value={editing.value || ''}
              onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
          )}
          {type === 'select' && options && (
            <select
              value={editing.value || ''}
              onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {type === 'boolean' && (
            <select
              value={editing.value ? 'true' : 'false'}
              onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value === 'true' }))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}
          <button
            onClick={saveEdit}
            disabled={isSaving}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? '...' : '✓'}
          </button>
          <button
            onClick={cancelEdit}
            disabled={isSaving}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        className="group cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-200 transition-all duration-200 relative"
        onClick={() => startEdit(establishment.id, field, value)}
        title="Click to edit"
      >
        <div className="flex items-center justify-between">
          <span className="flex-1">
            {field === 'verified' ? getVerifiedBadge(value) : (value || <span className="text-gray-400 italic">Click to add...</span>)}
          </span>
          <svg 
            className="w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </div>
    );
  };

  const renderImageCell = (establishment: Establishment) => {
    const isUploading = uploadingImage === establishment.id;
    
    return (
      <div className="flex items-center space-x-3">
        {/* Current Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {establishment.local_image_url ? (
            <img 
              src={establishment.local_image_url} 
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Upload Button */}
        <div className="flex-1">
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
              disabled={isUploading}
            />
            <div className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {establishment.local_image_url ? 'Replace Image' : 'Upload Image'}
                </>
              )}
            </div>
          </label>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
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
                Category & Cuisine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {establishments.map((establishment) => (
              <tr key={establishment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {renderImageCell(establishment)}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {renderEditableCell(establishment, 'name', establishment.name)}
                    <div className="text-sm text-gray-500">
                      {renderEditableCell(establishment, 'address', establishment.address)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {renderEditableCell(establishment, 'primary_category', establishment.primary_category)}
                    <div className="text-sm text-gray-500">
                      {renderEditableCell(establishment, 'cuisine', establishment.cuisine)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getChainBadge(establishment.chain_name)}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {renderEditableCell(establishment, 'verified', establishment.verified, 'boolean')}
                    <div className="text-xs text-gray-500">
                      {establishment.business_status}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>{formatDate(establishment.updated_at)}</div>
                    <div className="text-xs">
                      Created: {formatDate(establishment.created_at)}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
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
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    pagination.page - 2
                  )) + i;
                  
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
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

      {/* Empty state */}
      {establishments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No establishments found</h3>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
}
