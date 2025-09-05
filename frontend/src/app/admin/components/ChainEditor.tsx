"use client";

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

interface Chain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  local_logo_path?: string | null;
  featured_image_path?: string | null;
  website_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface ChainEditorProps {
  chain: Chain | null; // null for creating new chain
  onSave: (chainData: Partial<Chain>) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function ChainEditor({ chain, onSave, onCancel }: ChainEditorProps) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    website_url: '',
    category: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadedLogoPath, setUploadedLogoPath] = useState<string | null>(null);
  const [uploadedFeaturedPath, setUploadedFeaturedPath] = useState<string | null>(null);

  // Initialize form data
  useEffect(() => {
    if (chain) {
      setFormData({
        name: chain.name || '',
        slug: chain.slug || '',
        description: chain.description || '',
        logo_url: chain.logo_url || '',
        website_url: chain.website_url || '',
        category: chain.category || ''
      });
      // Show persisted uploads when reopening editor
      setUploadedLogoPath(chain.local_logo_path || null);
      setUploadedFeaturedPath(chain.featured_image_path || null);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo_url: '',
        website_url: '',
        category: ''
      });
      setUploadedLogoPath(null);
      setUploadedFeaturedPath(null);
    }
  }, [chain]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const uploadFile = async (url: string, file: File) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(url, { 
      method: 'POST', 
      headers: {
        'x-user-id': user.id.toString()
      },
      body: formData 
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name) // Only auto-generate if slug is empty
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Chain name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.website_url && !formData.website_url.match(/^https?:\/\/.+/)) {
      newErrors.website_url = 'Website URL must start with http:// or https://';
    }

    if (formData.logo_url && !formData.logo_url.match(/^https?:\/\/.+/)) {
      newErrors.logo_url = 'Logo URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Clean up empty strings to null
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          value.trim() === '' ? null : value.trim()
        ])
      );

      const result = await onSave(cleanData);
      
      if (result.success) {
        onCancel(); // Close modal on success
      } else {
        setErrors({ general: result.error || 'Failed to save chain' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = [
    'Fast Food',
    'Casual Dining',
    'Fine Dining',
    'Coffee Shop',
    'Bakery',
    'Pizza',
    'Asian',
    'Italian',
    'Mexican',
    'Indian',
    'Mediterranean',
    'American',
    'British',
    'Pub',
    'Bar',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {chain ? 'Edit Chain' : 'Create New Chain'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{errors.general}</div>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Chain Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., McDonald's, Starbucks"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., mcdonalds, starbucks"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
              </p>
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category...</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the chain..."
              />
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="website_url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.website_url ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://www.example.com"
              />
              {errors.website_url && <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>}
            </div>

            {/* Logo URL */}
            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.logo_url ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://example.com/logo.png"
              />
              {errors.logo_url && <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>}
              
              {/* Logo Preview */}
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="h-12 w-12 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Upload Logo (local) */}
              {chain && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{uploadedLogoPath ? 'Replace Logo' : 'Upload Logo (will be shown small next to chain name)'}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !chain) return;
                      try {
                        setUploadingLogo(true);
                        const result = await uploadFile(`/api/admin/chains/${chain.id}/logo`, file);
                        // reflect immediately with returned local path
                        if (result && result.local_logo_path) {
                          setUploadedLogoPath(result.local_logo_path);
                        }
                      } catch (err) {
                        setErrors({ general: 'Failed to upload logo' });
                      } finally {
                        setUploadingLogo(false);
                      }
                    }}
                    className="block w-full text-sm text-gray-700"
                  />
                  {uploadingLogo && <p className="text-xs text-gray-500 mt-1">Uploading logo...</p>}
                  {uploadedLogoPath && (
                    <div className="mt-2">
                      <p className="text-xs text-green-700">{chain?.local_logo_path ? 'Current logo' : 'Logo uploaded'}</p>
                      <img
                        src={uploadedLogoPath}
                        alt="Uploaded logo preview"
                        className="h-12 w-12 rounded object-contain border border-gray-200"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Featured Image Upload */}
            {chain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{uploadedFeaturedPath ? 'Replace Featured Venue Image' : 'Upload Featured Venue Image (used in cards)'}
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !chain) return;
                    try {
                      setUploadingFeatured(true);
                      const result = await uploadFile(`/api/admin/chains/${chain.id}/featured`, file);
                      if (result && result.featured_image_path) {
                        setUploadedFeaturedPath(result.featured_image_path);
                      }
                    } catch (err) {
                      setErrors({ general: 'Failed to upload featured image' });
                    } finally {
                      setUploadingFeatured(false);
                    }
                  }}
                  className="block w-full text-sm text-gray-700"
                />
                {uploadingFeatured && <p className="text-xs text-gray-500 mt-1">Uploading featured image...</p>}
                {uploadedFeaturedPath && (
                  <div className="mt-2">
                    <p className="text-xs text-green-700">{chain?.featured_image_path ? 'Current featured image' : 'Featured image uploaded'}</p>
                    <img
                      src={uploadedFeaturedPath}
                      alt="Uploaded featured preview"
                      className="h-28 w-full object-cover rounded border border-gray-200"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (chain ? 'Update Chain' : 'Create Chain')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
