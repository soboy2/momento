'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { getDocument, updateDocument, uploadFile } from '../../../../lib/firebase/firebaseUtils';
import { 
  ImageUp, Loader2, MapPin, Tag, X, ChevronDown, 
  Camera, ArrowLeft, Info 
} from 'lucide-react';
import Image from 'next/image';
import { AuthProvider } from '../../../../lib/contexts/AuthContext';
import Navigation from '../../../../components/Navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface PostData {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  imageURL?: string;
  likes: string[];
  comments: any[];
  createdAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  deviceOrientation?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  eventId?: string;
  eventName?: string;
  contextualTags?: string[];
  captureTimestamp?: string;
}

export default function EditPostPage() {
  return (
    <AuthProvider>
      <EditPostContent />
    </AuthProvider>
  );
}

function EditPostContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  // Post content state
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  
  // Location state
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Event association
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const postData = await getDocument('posts', postId) as PostData;
        
        if (!postData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        // Check if user is authorized to edit (only creator can edit)
        if (postData.userId !== user.uid) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        
        // Populate form with post data
        setText(postData.text || '');
        
        // Set location
        if (postData.location) {
          setLocation({
            latitude: postData.location.latitude,
            longitude: postData.location.longitude,
            accuracy: postData.location.accuracy
          });
        }
        
        // Set tags
        if (postData.contextualTags) {
          setTags(postData.contextualTags);
        }
        
        // Set event association
        if (postData.eventId) {
          setEventId(postData.eventId);
          setEventName(postData.eventName || null);
        }
        
        // Set image
        if (postData.imageURL) {
          setExistingImage(postData.imageURL);
          setImagePreview(postData.imageURL);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching post data:', error);
        setError('Failed to load post data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Failed to get your location. Please try again or enter it manually.');
        setIsGettingLocation(false);
      }
    );
  };
  
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate - text is required if no image
    if (!text.trim() && !image && !existingImage) {
      setError('Please add text or an image to your post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageURL = existingImage || '';
      
      // Only upload a new image if one was selected
      if (image) {
        try {
          const path = `posts/${user.uid}/${Date.now()}_${image.name}`;
          imageURL = await uploadFile(image, path);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Continue with post update even if image upload fails
        }
      }
      
      const postData: any = {
        text: text.trim(),
        contextualTags: tags,
        updatedAt: new Date().toISOString(),
      };
      
      // Only add imageURL if it exists
      if (imageURL) {
        postData.imageURL = imageURL;
      }
      
      // Add location if available
      if (location) {
        postData.location = location;
      }

      const result = await updateDocument('posts', postId, postData);
      
      if (!result.success) {
        throw new Error(result.error ? result.error.toString() : 'Failed to update post');
      }

      toast.success('Post updated successfully');
      
      // Redirect to the post detail page or back to the feed
      if (eventId) {
        router.push(`/events/${eventId}`);
      } else {
        router.push('/home');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
      setIsSubmitting(false);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading post data...</span>
      </div>
    );
  }
  
  // If post not found
  if (notFound) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
        <p className="text-gray-600 mb-6">The post you're trying to edit doesn't exist or has been removed.</p>
        <Link href="/home" className="text-blue-600">
          Back to Home
        </Link>
      </div>
    );
  }
  
  // If user is not authorized to edit
  if (unauthorized) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-6">You don't have permission to edit this post.</p>
        <Link href="/home" className="text-blue-600">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-screen-md mx-auto">
      <div className="p-4">
        <header className="mb-6 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Edit Post</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            {/* Event association info */}
            {eventName && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">This post is associated with an event</p>
                  <p className="text-sm text-blue-600">{eventName}</p>
                </div>
              </div>
            )}
            
            {/* Post text */}
            <div className="mb-4">
              <textarea
                placeholder="What's on your mind?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-black"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Image upload */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-48">
                      <Image 
                        src={imagePreview} 
                        alt="Image Preview" 
                        fill 
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        setExistingImage(null);
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="text-gray-500 mb-2">
                      <Camera className="h-10 w-10 mx-auto mb-2" />
                      <p>Click to upload an image</p>
                      <p className="text-xs">(Max size: 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div className="mb-4">
              <button
                type="button"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                  location ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={getCurrentLocation}
                disabled={isSubmitting || isGettingLocation}
              >
                <MapPin className="h-4 w-4" />
                <span>{location ? 'Location Added' : 'Add Location'}</span>
                {isGettingLocation && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
              </button>
              
              {location && (
                <div className="mt-2 text-xs text-gray-500">
                  Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
                </div>
              )}
            </div>
            
            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:border-blue-500 text-black"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="bg-gray-100 px-3 py-2 rounded-r-lg border border-l-0 border-gray-300 text-sm"
                  onClick={addTag}
                  disabled={isSubmitting}
                >
                  Add
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <Navigation />
    </div>
  );
} 