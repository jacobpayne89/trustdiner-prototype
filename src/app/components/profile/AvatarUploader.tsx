"use client";

import { useState } from 'react';

// Default Avatar Components
function DefaultAllergenSuffererAvatar({ size = 80 }: { size?: number }) {
  return (
    <div 
      className="rounded-full bg-blue-100 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        className="text-blue-600"
      >
        <path 
          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
          fill="currentColor"
        />
        <path 
          d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" 
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function DefaultParentAvatar({ size = 80 }: { size?: number }) {
  return (
    <div 
      className="rounded-full bg-green-100 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.7} 
        height={size * 0.7} 
        viewBox="0 0 24 24" 
        fill="none" 
        className="text-green-600"
      >
        {/* Adult figure */}
        <circle cx="8" cy="5" r="2.5" fill="currentColor"/>
        <path d="M8 8C6 8 4 9.5 4 12v8h8v-8c0-2.5-2-4-4-4z" fill="currentColor"/>
        {/* Child figure */}
        <circle cx="16" cy="7" r="1.8" fill="currentColor"/>
        <path d="M16 9.5C14.5 9.5 13 10.5 13 12.5v5.5h6v-5.5c0-2-1.5-3-3-3z" fill="currentColor"/>
      </svg>
    </div>
  );
}

function ProfileAvatar({ 
  userType, 
  avatarUrl, 
  size = 80 
}: { 
  userType: string; 
  avatarUrl?: string; 
  size?: number; 
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Profile picture"
        className="rounded-full object-cover border-2 border-gray-200"
        style={{ width: size, height: size }}
      />
    );
  }

  // Default avatars based on user type
  if (userType === "parent") {
    return <DefaultParentAvatar size={size} />;
  }
  
  return <DefaultAllergenSuffererAvatar size={size} />;
}

interface AvatarUploaderProps {
  userType: string;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  uploadingAvatar: boolean;
  setUploadingAvatar: (uploading: boolean) => void;
  onError: (error: string) => void;
  user?: any;
  className?: string;
  size?: number;
  readOnly?: boolean;
  onRefresh?: () => Promise<void>;
}

export default function AvatarUploader({
  userType,
  avatarUrl,
  onAvatarChange,
  uploadingAvatar,
  setUploadingAvatar,
  onError,
  user,
  className = "",
  size = 100,
  readOnly = false,
  onRefresh
}: AvatarUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setUploadProgress("Validating image...");

    try {
      console.log('Starting upload for file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

      // Validate file size (5MB limit)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        onError('Image must be smaller than 5MB. Please choose a smaller file.');
        setUploadingAvatar(false);
        setUploadProgress("");
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        onError('Please upload a valid image file (JPEG, PNG, or WebP).');
        setUploadingAvatar(false);
        setUploadProgress("");
        return;
      }

      // Upload directly to backend using FormData
      setUploadProgress("Uploading avatar...");
      console.log('Uploading to backend...');
      
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', (user.id || user.uid).toString());

      const uploadResponse = await fetch('/api/uploads/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const { publicUrl } = await uploadResponse.json();
      console.log('Upload successful, public URL:', publicUrl);

      // Update the avatar URL
      setUploadProgress("Finalizing...");
      onAvatarChange(publicUrl);
      
      // Refresh the profile data to show the new avatar
      if (onRefresh) {
        await onRefresh();
      }
      
      setUploadProgress("");
      
    } catch (err) {
      console.error('Error uploading avatar:', err);
      onError(`Failed to upload avatar: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setUploadProgress("");
    } finally {
      setUploadingAvatar(false);
    }
  };



  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !user) return;

    try {
      console.log('🗑️ Deleting avatar from local storage:', avatarUrl);

      // Call backend to delete from local storage
      const deleteResponse = await fetch(`/api/uploads/avatar/${user.id || user.uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarUrl: avatarUrl
        }),
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        console.warn('⚠️ Failed to delete from local storage:', errorData.message);
        // Still proceed to clear the URL locally even if deletion fails
      } else {
        console.log('✅ Avatar deleted from local storage successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error deleting avatar from local storage:', error);
      // Still proceed to clear the URL locally even if deletion fails
    }

    // Clear the avatar URL regardless of deletion result
    onAvatarChange("");
  };

  // If in read-only mode, just show the avatar
  if (readOnly) {
    return (
      <div className={`flex justify-center ${className}`}>
        <ProfileAvatar 
          userType={userType} 
          avatarUrl={avatarUrl} 
          size={size} 
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <ProfileAvatar 
        userType={userType} 
        avatarUrl={avatarUrl} 
        size={size} 
      />
      <div className="flex flex-col items-center space-y-2">
        <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          uploadingAvatar 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}>
          {uploadingAvatar ? (uploadProgress || "Uploading...") : "Change Profile Picture"}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
            className="hidden"
          />
        </label>
        {uploadingAvatar && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600">{uploadProgress || "Processing..."}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 text-center">
          JPEG, PNG, or WebP • Max 5MB • Auto-resized to 400×400px
        </p>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Use default profile picture
          </button>
        )}
      </div>
    </div>
  );
}
