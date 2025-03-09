'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadFile, updateUserProfile } from '../lib/firebase/firebaseUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Show toast for upload start
      toast.loading('Uploading image...', { id: 'upload-toast' });
      
      // Upload to Firebase Storage
      const path = `users/${user.uid}/cover_photo_${Date.now()}`;
      console.log(`Attempting to upload file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      // Try direct upload first
      try {
        const fileUrl = await uploadFile(file, path);
        console.log('Upload successful, URL:', fileUrl);
        
        // Update user profile in Firestore
        await updateUserCoverPhoto(fileUrl);
        onCoverPhotoChange(fileUrl);
        
        // Dismiss loading toast and show success
        toast.dismiss('upload-toast');
        toast.success('Cover photo updated successfully');
      } catch (uploadError: any) {
        console.error('Error during upload:', uploadError);
        
        // Show detailed error message
        const errorMessage = uploadError.message || 'Failed to upload image';
        setUploadError(errorMessage);
        
        // Dismiss loading toast and show error
        toast.dismiss('upload-toast');
        toast.error(`Upload failed: ${errorMessage}`);
        
        throw uploadError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      // Error is already handled in the inner catch
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
      console.log('Updating user profile with new cover photo URL:', photoURL);
      
      // Store the cover photo URL in Firestore
      const result = await updateUserProfile(user.uid, {
        coverPhoto: photoURL,
        updatedAt: new Date().toISOString()
      });
      
      if (!result.success) {
        throw new Error('Failed to update user profile');
      }
      
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user cover photo:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  };

  return (
    <div className="h-32 relative">
      {currentCoverPhoto ? (
        <div className="relative h-full w-full">
          <Image 
            src={currentCoverPhoto} 
            alt="Cover Photo" 
            fill
            className="object-cover"
            onError={() => {
              console.error('Failed to load cover image:', currentCoverPhoto);
              toast.error('Failed to load cover image');
            }}
          />
        </div>
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
        <div className="absolute bottom-14 right-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm flex items-center max-w-xs">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span className="line-clamp-2">{uploadError}</span>
        </div>
      )}
    </div>
  );
} 