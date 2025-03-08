'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { addDocument, uploadFile, getDocuments } from '../../lib/firebase/firebaseUtils';
import { 
  ImageUp, Loader2, MapPin, Tag, Calendar, X, ChevronDown, 
  Camera, ArrowLeft, Info, Clock 
} from 'lucide-react';
import Image from 'next/image';
import { AuthProvider } from '../../lib/contexts/AuthContext';
import Navigation from '../../components/Navigation';
import Link from 'next/link';

// Define the Event interface
interface EventData {
  id: string;
  name: string;
  description: string;
  location: {
    venue: string;
    address?: string;
  };
  timeRange: {
    start: string;
    end: string;
  };
  coverImage?: string;
  participantCount: number;
  postCount: number;
  participants: Array<{
    id: string;
    name: string;
    photoURL: string;
  }>;
}

// Type guard function to check if an object is an EventData
function isEventData(obj: any): obj is EventData {
  return obj && typeof obj === 'object' && 'name' in obj;
}

export default function CreatePostPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingState />}>
        <CreatePostContent />
      </Suspense>
    </AuthProvider>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Loading...</span>
    </div>
  );
}

function CreatePostContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');
  
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for enhanced features
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [deviceOrientation, setDeviceOrientation] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  } | null>(null);
  
  // State for events from firebaseUtils
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  
  // Fetch events from firebaseUtils
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getDocuments('events') as EventData[];
        setEvents(eventsData);
        
        // Process events
        const now = new Date();
        
        // Active events (happening now)
        const active = eventsData.filter(event => {
          const startDate = new Date(event.timeRange.start);
          const endDate = new Date(event.timeRange.end);
          return startDate <= now && endDate >= now;
        });
        
        // Recent events (ended in the last 24 hours)
        const recent = eventsData.filter(event => {
          const endDate = new Date(event.timeRange.end);
          return endDate < now && endDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        });
        
        setActiveEvents(active);
        setRecentEvents(recent);
        
        // If there's a preselected event ID, set it
        if (preselectedEventId) {
          const preselectedEvent = eventsData.find(event => event.id === preselectedEventId);
          if (preselectedEvent) {
            setSelectedEvent(preselectedEvent);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    fetchEvents();
  }, [preselectedEventId]);
  
  // Get device orientation if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        setDeviceOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        });
      };
      
      window.addEventListener('deviceorientation', handleOrientation);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  // Try to get location automatically if an event is selected
  useEffect(() => {
    if (selectedEvent && !location) {
      getCurrentLocation();
    }
  }, [selectedEvent, location]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
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
        setError('Failed to get your location. Please try again.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Format date for events
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!text.trim() && !image) {
      setError('Please add some text or an image to your post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageURL = '';
      
      if (image) {
        const path = `posts/${user.uid}/${Date.now()}_${image.name}`;
        imageURL = await uploadFile(image, path);
      }

      // Create post data object, omitting undefined fields
      const postData: any = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        text: text.trim(),
        imageURL: imageURL || '',
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        captureTimestamp: new Date().toISOString(),
        location: location,
        ...(selectedEvent?.id && { eventId: selectedEvent.id }),
        ...(selectedEvent?.name && { eventName: selectedEvent.name }),
        ...(tags.length > 0 && { contextualTags: tags })
      };
      
      // Only add deviceOrientation if it's valid
      if (deviceOrientation && deviceOrientation.alpha !== null && 
          deviceOrientation.beta !== null && deviceOrientation.gamma !== null) {
        postData.deviceOrientation = deviceOrientation;
      }
      
      await addDocument('posts', postData);
      
      // If this post is associated with an event, update the event's post count
      if (selectedEvent) {
        const eventData = events.find(event => event.id === selectedEvent.id);
        if (eventData) {
          await addDocument('events', {
            ...eventData,
            postCount: eventData.postCount + 1
          });
        }
      }

      // Redirect to the appropriate page
      if (selectedEvent) {
        router.push(`/events/${selectedEvent.id}`);
      } else {
        router.push('/home');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 max-w-screen-md mx-auto">
      <div className="p-4">
        <header className="mb-6 flex items-center">
          <Link href={selectedEvent ? `/events/${selectedEvent.id}` : "/home"} className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Share a Moment</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            {/* Context banner - shows when an event is selected */}
            {selectedEvent && (
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium text-blue-800">{selectedEvent.name}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Your moment will be added to this event&apos;s timeline
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => setSelectedEvent(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              placeholder={selectedEvent 
                ? `What's happening at ${selectedEvent.name}?` 
                : "What's on your mind?"
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
            />

            {imagePreview && (
              <div className="mt-4 relative">
                <div className="relative w-full h-60">
                  <Image 
                    src={imagePreview} 
                    alt="Preview" 
                    fill 
                    className="object-contain rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {/* Enhanced features section */}
            <div className="mt-4 space-y-3">
              {/* Location */}
              <div className="flex items-center">
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
                  <button
                    type="button"
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setLocation(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Event selection */}
              {!selectedEvent && (
                <div className="relative">
                  <button
                    type="button"
                    className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg text-sm ${
                      selectedEvent ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setShowEventDropdown(!showEventDropdown)}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{'Select an event (optional)'}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showEventDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {loadingEvents ? (
                          <div className="px-3 py-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                            <span className="text-sm text-gray-500">Loading events...</span>
                          </div>
                        ) : (
                          <>
                            {/* Active events section */}
                            {activeEvents.length > 0 && (
                              <div className="mb-2">
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  HAPPENING NOW
                                </div>
                                {activeEvents.map(event => (
                                  <div
                                    key={event.id}
                                    className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEventDropdown(false);
                                    }}
                                  >
                                    <div className="font-medium flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      {event.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Ends {formatEventDate(event.timeRange.end)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Recent events section */}
                            {recentEvents.length > 0 && (
                              <div className="mb-2">
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  RECENT EVENTS
                                </div>
                                {recentEvents.map(event => (
                                  <div
                                    key={event.id}
                                    className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEventDropdown(false);
                                    }}
                                  >
                                    <div className="font-medium">{event.name}</div>
                                    <div className="text-xs text-gray-500">Ended {formatEventDate(event.timeRange.end)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Other events */}
                            {events.length > 0 && (
                              <div>
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  ALL EVENTS
                                </div>
                                {events
                                  .filter(event => 
                                    !activeEvents.some(e => e.id === event.id) && 
                                    !recentEvents.some(e => e.id === event.id)
                                  )
                                  .map(event => (
                                    <div
                                      key={event.id}
                                      className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        setSelectedEvent(event);
                                        setShowEventDropdown(false);
                                      }}
                                    >
                                      <div className="font-medium">{event.name}</div>
                                      <div className="text-xs text-gray-500">{event.location.venue}</div>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                            
                            {events.length === 0 && (
                              <div className="px-3 py-2 text-center text-gray-500 text-sm">
                                No events available
                              </div>
                            )}
                            
                            <div className="mt-2 border-t border-gray-200 pt-2">
                              <Link
                                href="/events/create"
                                className="block px-3 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm text-center"
                              >
                                Create a new event
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tags */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Add tags</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter"
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:border-blue-500"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="bg-gray-100 px-3 py-2 rounded-r-lg border border-l-0 border-gray-300 text-sm"
                    onClick={addTag}
                    disabled={!tagInput.trim() || isSubmitting}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <div className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition">
                  <ImageUp className="h-6 w-6" />
                </div>
                <span className="text-sm text-gray-600">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || (!text.trim() && !image)}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </form>
      </div>
      <Navigation />
    </div>
  );
} 