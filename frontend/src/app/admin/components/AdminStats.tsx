"use client";

interface AdminStatsProps {
  totalEstablishments: number;
  assignedCount: number;
  unassignedCount: number;
}

export default function AdminStats({
  totalEstablishments,
  assignedCount,
  unassignedCount
}: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <dd className="text-lg font-medium text-gray-900">{totalEstablishments}</dd>
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
  );
}

