"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import Header from "@/app/components/Header";
import { 
  LazyUserReviewsList, 
  LazyAllergenSelector, 
  LazyAvatarUploader 
} from "@/app/components/profile/LazyProfileComponents";
import { useUserProfile, USER_TYPES } from "@/hooks/useUserProfile";
export default function ProfilePage() {
  const { user, loading } = useContext(AuthContext);

  // Use the extracted profile hook
  const {
    // Core profile state
    allergens,
    email,
    userType,
    displayName,
    firstName,
    lastName,
    avatarUrl,
    
    // Edit mode state
    editMode,
    editAllergens,
    editUserType,
    editDisplayName,
    editFirstName,
    editLastName,
    editAvatarUrl,
    
    // Loading and status state
    loadingProfile,
    saving,
    error,
    success,
    uploadingAvatar,
    
    // Actions
    setEditMode,
    setError,
    setSuccess,
    setUploadingAvatar,
    setEditAvatarUrl,
    setEditFirstName,
    setEditLastName,
    setEditDisplayName,
    setEditUserType,
    handleCheckboxChange,
    handleSave,
    refreshProfile,
  } = useUserProfile();


  if (loading || loadingProfile) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Allergy Profile</h1>
        <p className="mb-4 text-gray-600">You must be logged in to view your profile.</p>
        <a href="/login" className="text-blue-600 underline">Log in</a>
      </div>
    );
  }

  return (
    <>
      <Header showSearch={true} />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Your Allergy Profile
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage your allergy information and view your reviews
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Profile */}
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 min-h-[600px]">
              {editMode ? (
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    handleSave();
                  }}
                >
                  {/* Avatar Section */}
                  <LazyAvatarUploader
                      userType={editUserType || userType || "allergy_sufferer"} 
                      avatarUrl={editAvatarUrl} 
                    onAvatarChange={setEditAvatarUrl}
                    uploadingAvatar={uploadingAvatar}
                    setUploadingAvatar={setUploadingAvatar}
                    onError={setError}
                    user={user}
                      size={100}
                    onRefresh={refreshProfile}
                    />
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        type="email"
                        disabled
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                        value={email || ""}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your first name"
                        value={editFirstName}
                        onChange={e => setEditFirstName(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your last name"
                        value={editLastName}
                        onChange={e => setEditLastName(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      Display name
                    </label>
                    <div className="mt-1">
                      <input
                        id="displayName"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your display name"
                        value={editDisplayName}
                        onChange={e => setEditDisplayName(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Profile type
                    </label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      {USER_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setEditUserType(type.value)}
                          disabled={saving}
                          className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors disabled:opacity-50 ${
                            editUserType === type.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type.shortLabel}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      {USER_TYPES.find(type => type.value === editUserType)?.label}
                    </p>
                  </div>

                  <LazyAllergenSelector
                    allergens={allergens}
                    isEditMode={true}
                    editAllergens={editAllergens}
                    onAllergenChange={handleCheckboxChange}
                            disabled={saving}
                  />

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            {error}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            {success}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setEditMode(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <LazyAvatarUploader
                      userType={userType || "allergy_sufferer"} 
                      avatarUrl={avatarUrl} 
                    onAvatarChange={() => {}} // Read-only mode
                    uploadingAvatar={false}
                    setUploadingAvatar={() => {}} // Read-only mode
                    onError={() => {}} // Read-only mode
                    user={user}
                      size={100} 
                    readOnly={true}
                    />

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm">
                        {email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-1">
                      <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 sm:text-sm">
                        {firstName || <span className="text-gray-400 italic">Not set</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-1">
                      <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 sm:text-sm">
                        {lastName || <span className="text-gray-400 italic">Not set</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display name
                    </label>
                    <div className="mt-1">
                      <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 sm:text-sm">
                        {displayName || <span className="text-gray-400 italic">Not set</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Profile type
                    </label>
                    <div className="mt-1">
                      <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 sm:text-sm">
                        {USER_TYPES.find(u => u.value === userType)?.label || <span className="text-gray-400 italic">Not set</span>}
                      </div>
                    </div>
                  </div>

                  <LazyAllergenSelector
                    allergens={allergens}
                    isEditMode={false}
                  />

                  <div>
                    <button
                      type="button"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Reviews */}
            <LazyUserReviewsList 
              userId={user.id.toString()}
              userDisplayName={displayName || user.displayName}
              userEmail={email || user.email}
              onSuccess={(message) => {
                setSuccess(message);
                setTimeout(() => setSuccess(null), 3000);
              }}
              onError={(message) => {
                setError(message);
                setTimeout(() => setError(null), 3000);
              }}
              refreshEstablishments={() => {
                // Refresh profile data when reviews are deleted/edited
                refreshProfile();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
