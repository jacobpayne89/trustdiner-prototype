"use client";

import { useState } from 'react';

interface Chain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface Establishment {
  id: string;
  place_id: string;
  name: string;
  address: string;
  chain_id: string | null;
  chain_name: string | null;
  primary_category: string;
  cuisine: string;
  rating: number;
  user_ratings_total: number;
}

interface EstablishmentAssignmentProps {
  establishments: Establishment[];
  chains: Chain[];
  loading: boolean;
  onAssign: (establishmentId: string, chainId: string | null) => Promise<{ success: boolean; error?: string }>;
}

export default function EstablishmentAssignment({
  establishments,
  chains,
  loading,
  onAssign
}: EstablishmentAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [assigning, setAssigning] = useState<string | null>(null);

  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         est.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'assigned' && est.chain_id) ||
                         (filter === 'unassigned' && !est.chain_id);

    return matchesSearch && matchesFilter;
  });

  const handleAssignment = async (establishmentId: string, chainId: string | null) => {
    setAssigning(establishmentId);
    
    try {
      const result = await onAssign(establishmentId, chainId);
      if (!result.success) {
        alert(result.error || 'Failed to assign establishment');
      }
    } finally {
      setAssigning(null);
    }
  };

  const getChainBadge = (chainName: string | null) => {
    return chainName ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        🔗 {chainName}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Individual
      </span>
    );
  };

  const assignedCount = establishments.filter(est => est.chain_id).length;
  const unassignedCount = establishments.filter(est => !est.chain_id).length;

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Establishments</dt>
                  <dd className="text-lg font-medium text-gray-900">{establishments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">🔗</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assigned to Chains</dt>
                  <dd className="text-lg font-medium text-gray-900">{assignedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">🏪</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Individual Places</dt>
                  <dd className="text-lg font-medium text-gray-900">{unassignedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Establishments
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or address..."
              />
            </div>
          </div>

          {/* Filter */}
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Assignment
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Establishments</option>
              <option value="assigned">Assigned to Chains</option>
              <option value="unassigned">Individual Places</option>
            </select>
          </div>
        </div>
      </div>

      {/* Establishments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Establishments ({filteredEstablishments.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEstablishments.length > 0 ? (
            filteredEstablishments.map((establishment) => (
              <div key={establishment.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {establishment.name}
                      </h4>
                      {getChainBadge(establishment.chain_name)}
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {establishment.address}
                    </p>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{establishment.primary_category}</span>
                      {establishment.cuisine && <span>• {establishment.cuisine}</span>}
                      {establishment.rating && (
                        <span>• {establishment.rating}⭐ ({establishment.user_ratings_total} reviews)</span>
                      )}
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="flex items-center space-x-3">
                    <select
                      value={establishment.chain_id || ''}
                      onChange={(e) => handleAssignment(establishment.id, e.target.value || null)}
                      disabled={assigning === establishment.id}
                      className="text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Individual Place</option>
                      {chains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                    
                    {assigning === establishment.id && (
                      <div className="text-sm text-gray-500">Saving...</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No establishments found</h3>
                <p className="text-sm">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No establishments available for assignment.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredEstablishments.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {filteredEstablishments.length} of {establishments.length} establishments
              {searchTerm && ` matching "${searchTerm}"`}
              {filter !== 'all' && ` (${filter})`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
