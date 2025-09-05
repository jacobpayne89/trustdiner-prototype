import { useState, useCallback } from 'react';
import type { User } from '@/types';

interface UseAvatarUploadProps {
  user: User | null;
  onAvatarChange: (url: string) => void;
  onError: (error: string) => void;
}

export function useAvatarUpload({ user, onAvatarChange, onError }: UseAvatarUploadProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  }, []);

  const createPreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) {
      onError('You must be logged in to upload an avatar');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setUploadingAvatar(true);
    createPreview(file);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', user.id.toString());

      const response = await fetch('/api/uploads/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      // Success - update the avatar URL
      onAvatarChange(data.avatarUrl);
      setPreviewUrl(null); // Clear preview since we have the real URL now
      
      console.log('✅ Avatar uploaded successfully:', data.avatarUrl);

    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      onError(error.message || 'Failed to upload avatar');
      setPreviewUrl(null); // Clear preview on error
    } finally {
      setUploadingAvatar(false);
    }
  }, [user, validateFile, createPreview, onAvatarChange, onError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  }, [uploadAvatar]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  }, [uploadAvatar]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  return {
    // State
    uploadingAvatar,
    previewUrl,
    
    // Actions
    uploadAvatar,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    clearPreview,
    
    // Utilities
    validateFile,
    setUploadingAvatar,
  };
}

