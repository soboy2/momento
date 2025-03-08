'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadFile, updateUserProfile } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Camera, Loader2 } from 'lucide-react';

interface CoverPhotoUploadProps {
  currentCoverPhoto?: string;
  onCoverPhotoChange: (url: string) => void;
}

export default function CoverPhotoUpload({ currentCoverPhoto, onCoverPhotoChange }: CoverPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Upload to Firebase Storage
      const path = `users/${user.uid}/cover_photo_${Date.now()}`;
      const result = await uploadFile(file, path);

      if (result.success && result.url) {
        // Update user profile in Firestore
        await updateUserCoverPhoto(result.url);
        onCoverPhotoChange(result.url);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateUserCoverPhoto = async (photoURL: string) => {
    if (!user) return;
    
    try {
      // Store the cover photo URL in Firestore
      const result = await updateUserProfile(user.uid, {
        coverPhoto: photoURL,
        updatedAt: new Date().toISOString()
      });
      
      if (!result.success) {
        throw new Error('Failed to update user profile');
      }
    } catch (error) {
      console.error('Error updating user cover photo:', error);
      throw error;
    }
  };

  return (
    <div className="h-32 relative">
      {currentCoverPhoto ? (
        <Image 
          src={currentCoverPhoto} 
          alt="Cover Photo" 
          fill
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-blue-400 to-purple-500" />
      )}
      
      {/* Edit Cover Button or Uploading State */}
      {uploading ? (
        <div className="absolute bottom-2 right-2 bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-md z-10 flex items-center">
          <Loader2 size={16} className="mr-2 animate-spin" />
          Uploading...
        </div>
      ) : (
        <button 
          onClick={handleEditClick}
          disabled={uploading}
          className="absolute bottom-2 right-2 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-md z-10 flex items-center"
          type="button"
        >
          <Camera size={16} className="mr-2" />
          Edit Cover
        </button>
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      
      {/* Error message */}
      {uploadError && (
        <div className="absolute bottom-10 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
          {uploadError}
        </div>
      )}
    </div>
  );
} 