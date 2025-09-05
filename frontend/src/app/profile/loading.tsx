/**
 * Loading component for profile page
 * Shows while the profile page is being lazy loaded
 */
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header placeholder */}
      <div className="bg-[#2716a6] h-16 w-full animate-pulse"></div>
      
      {/* Main content placeholder */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="space-y-6">
            {/* Title placeholder */}
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            
            {/* Avatar placeholder */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Form fields placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Allergen selector placeholder */}
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Reviews section placeholder */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
