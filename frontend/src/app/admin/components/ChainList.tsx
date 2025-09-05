"use client";

import { Chain } from '@/hooks/useAdminChains';

interface ChainListProps {
  chains: Chain[];
  loading: boolean;
  deletingChain: number | null;
  onEditChain: (chain: Chain) => void;
  onDeleteChain: (chainId: number) => void;
}

export default function ChainList({
  chains,
  loading,
  deletingChain,
  onEditChain,
  onDeleteChain
}: ChainListProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Restaurant Chains
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Restaurant Chains ({chains.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {chains.length > 0 ? (
          chains.map((chain) => (
            <div key={chain.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {chain.local_logo_path || chain.logo_url ? (
                      <img
                        src={chain.local_logo_path || chain.logo_url}
                        alt={`${chain.name} logo`}
                        className="h-12 w-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-semibold">
                          {chain.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chain Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {chain.name}
                      </h3>
                      {chain.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {chain.category}
                        </span>
                      )}
                    </div>
                    
                    {chain.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {chain.description}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Slug: {chain.slug}</span>
                      <span>Created: {new Date(chain.created_at).toLocaleDateString()}</span>
                      {chain.website_url && (
                        <a
                          href={chain.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Website ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditChain(chain)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteChain(chain.id)}
                    disabled={deletingChain === chain.id}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingChain === chain.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chains yet</h3>
              <p className="text-sm">Create your first restaurant chain to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}