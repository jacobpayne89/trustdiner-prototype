"use client";

import { Chain } from '@/hooks/useAdminChains';
import { Establishment } from '@/hooks/useEstablishmentAssignment';

interface EstablishmentAssignmentTableProps {
  establishments: Establishment[];
  chains: Chain[];
  loading: boolean;
  processingIds: Set<number>;
  onAssignToChain: (establishmentId: number, chainId: number | null) => void;
}

export default function EstablishmentAssignmentTable({
  establishments,
  chains,
  loading,
  processingIds,
  onAssignToChain
}: EstablishmentAssignmentTableProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="text-center py-12 text-gray-500">
          No establishments found. Try adjusting your search criteria.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Establishment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category & Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Chain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assign to Chain
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {establishments.map((establishment) => (
              <tr key={establishment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {establishment.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {establishment.address}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{establishment.primary_category}</div>
                  <div className="text-sm text-gray-500">
                    Rating: {establishment.rating || 'N/A'} ({establishment.user_ratings_total || 0} reviews)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {establishment.chain_name ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      🔗 {establishment.chain_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Individual
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <select
                      value={establishment.chain_id || ''}
                      onChange={(e) => onAssignToChain(establishment.id, e.target.value ? parseInt(e.target.value) : null)}
                      disabled={processingIds.has(establishment.id)}
                      className="text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Individual Place</option>
                      {chains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                    {processingIds.has(establishment.id) && (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

