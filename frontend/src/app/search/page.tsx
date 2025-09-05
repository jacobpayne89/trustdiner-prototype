"use client";

import React, { useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import { useSearch } from '@/hooks/useSearch';
import type { SearchResult } from '@/types';

export default function SearchPage() {
  const { user } = useContext(AuthContext);
  const {
    query,
    location,
    results,
    isSearching,
    isLoadingDetails,
    searchInfo,
    error,
    selectedPlace,
    setQuery,
    setLocation,
    handleSearch,
    handlePlaceSelect,
    formatPriceLevel,
    formatTypes,
  } = useSearch();



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Search</h1>
          <p className="text-gray-600">Search for any restaurant in the UK using Google Places</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Dishoom, Nando's, Pizza Express..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., London, Manchester, Birmingham..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search Restaurants'}
            </button>
          </form>

          {/* Usage Info */}
          {searchInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">
                  Found {searchInfo.count} results for "{searchInfo.query}"
                </span>
                <span className="text-blue-600">
                  Cost today: ${searchInfo.usage.today.toFixed(4)} | Searches remaining: {searchInfo.usage.remaining}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              {results.map((place) => (
                <div
                  key={place.placeId}
                  className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedPlace?.placeId === place.placeId ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handlePlaceSelect(place)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{place.name}</h3>
                        {place.inDatabase && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Database
                          </span>
                        )}
                        {isLoadingDetails === place.placeId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Loading...
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{place.address}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {place.rating && (
                          <span className="flex items-center">
                            ⭐ {place.rating} ({place.userRatingsTotal} reviews)
                          </span>
                        )}
                        {place.priceLevel && (
                          <span>{formatPriceLevel(place.priceLevel)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatTypes(place.types)}</p>
                    </div>
                    {place.hasPhotos && (
                      <div className="ml-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          📸
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Place Details */}
            <div className="sticky top-8">
              {selectedPlace ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Details</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900">{selectedPlace.name}</h3>
                      <p className="text-gray-600">{selectedPlace.address}</p>
                    </div>

                    {selectedPlace.rating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{selectedPlace.rating}</span>
                        <span className="text-gray-500">({selectedPlace.userRatingsTotal} reviews)</span>
                      </div>
                    )}

                    {selectedPlace.priceLevel && (
                      <div>
                        <span className="text-sm text-gray-500">Price Level: </span>
                        <span className="font-medium">{formatPriceLevel(selectedPlace.priceLevel)}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-500">Categories: </span>
                      <span className="text-gray-900">{formatTypes(selectedPlace.types)}</span>
                    </div>

                    {selectedPlace.phone && (
                      <div>
                        <span className="text-sm text-gray-500">Phone: </span>
                        <span className="text-gray-900">{selectedPlace.phone}</span>
                      </div>
                    )}

                    {selectedPlace.website && (
                      <div>
                        <span className="text-sm text-gray-500">Website: </span>
                        <a 
                          href={selectedPlace.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedPlace.inDatabase 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedPlace.inDatabase ? 'Cached in Database' : 'From Google API'}
                        </span>
                        <button
                          onClick={() => router.push('/')}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View in Main App →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Details</h2>
                  <p className="text-gray-500 text-center py-8">
                    Click on a restaurant from the search results to view detailed information
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isSearching && results.length === 0 && searchInfo && (
          <div className="text-center py-12">
            <p className="text-gray-500">No restaurants found. Try a different search term or location.</p>
          </div>
        )}

        {/* Getting Started */}
        {!isSearching && results.length === 0 && !searchInfo && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-600 mb-6">
              Search for any restaurant, cafe, or food establishment in the UK. 
              Click on results to view full details and automatically add them to the TrustDiner database.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">🔍 Search</div>
                Find restaurants from Google's comprehensive database
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">📝 Cache</div>
                Selected places are automatically saved to your database
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">📊 Track</div>
                Monitor API usage and costs in real-time
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 