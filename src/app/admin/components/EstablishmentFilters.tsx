"use client";

interface EstablishmentFiltersProps {
  searchTerm: string;
  showUnassignedOnly: boolean;
  onSearchChange: (value: string) => void;
  onUnassignedFilterChange: (value: boolean) => void;
}

export default function EstablishmentFilters({
  searchTerm,
  showUnassignedOnly,
  onSearchChange,
  onUnassignedFilterChange
}: EstablishmentFiltersProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Establishments
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by name or address..."
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showUnassignedOnly}
              onChange={(e) => onUnassignedFilterChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Show unassigned only</span>
          </label>
        </div>
      </div>
    </div>
  );
}

