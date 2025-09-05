"use client";

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';

// Hooks
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { useAdminChains } from '@/hooks/useAdminChains';
import { AuthContext } from '@/app/context/AuthContext';

// Components
import ChainEditor from '../components/ChainEditor';
import AdminMessage from '../components/AdminMessage';
import ChainList from '../components/ChainList';

export default function ChainsAdminPage() {
  // Authentication
  const { isAdminUser, isCheckingAdmin, error, loading: authLoading } = useAdminAuth();
  const { user } = useContext(AuthContext);
  
  // Messages
  const { message, showSuccess, showError } = useAdminMessages();

  // Chain management
  const chainHook = useAdminChains({
    onSuccess: showSuccess,
    onError: showError,
  });

  // Load data when admin status is confirmed AND user is available
  useEffect(() => {
    if (isAdminUser && !isCheckingAdmin && user?.id) {
      console.log('🔍 Admin chains page: Loading chains for user', user.id);
      chainHook.fetchChains();
    }
  }, [isAdminUser, isCheckingAdmin, user?.id]);

  // Handle chain deletion
  const handleDeleteChain = async (chainId: string) => {
    await chainHook.deleteChain(chainId);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">{error}</div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
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
                      <span className="text-gray-900 font-medium">Chain Management</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Chain Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage restaurant chains and assign establishments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => chainHook.openChainEditor()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + New Chain
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Message Display */}
        <AdminMessage message={message} />

        {/* Chain Stats */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🔗</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Chains
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {chainHook.chains.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chain Management Content */}
        <ChainList
          chains={chainHook.chains}
          loading={chainHook.loading}
          deletingChain={chainHook.deletingChain}
          onEditChain={chainHook.openChainEditor}
          onDeleteChain={handleDeleteChain}
        />
      </main>

      {/* Chain Editor Modal */}
      {(chainHook.showChainEditor || chainHook.selectedChain) && (
        <ChainEditor
          chain={chainHook.selectedChain}
          onSave={chainHook.selectedChain ? 
            (updates) => chainHook.updateChain(chainHook.selectedChain!.id, updates) : 
            chainHook.createChain
          }
          onCancel={chainHook.closeChainEditor}
        />
      )}
    </div>
  );
}