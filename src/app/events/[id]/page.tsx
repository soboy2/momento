'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthProvider } from '../../../lib/contexts/AuthContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import Navigation from '../../../components/Navigation';
import Post from '../../../components/Post';
import EventHeatmap from '../../../components/EventHeatmap';
import { 
  MapPin, Calendar, Users, Clock, Share2, 
  Camera, Grid, List, Map, ChevronLeft, 
  Plus, MoreHorizontal, Bookmark, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { getDocument, getDocuments, deleteDocument } from '../../../lib/firebase/firebaseUtils';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { toast } from 'react-hot-toast';

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
  createdBy: string;
  visibility: 'public' | 'private';
  accessCode?: string;
}

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

export default function EventPage() {
  return (
    <AuthProvider>
      <EventContent />
    </AuthProvider>
  );
}

function EventContent() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [coverImageError, setCoverImageError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch event data
        const eventData = await getDocument('events', eventId) as EventData;
        if (!eventData) {
          setLoading(false);
          return;
        }
        
        setEvent(eventData);
        
        // Check if user has access to this event
        const isCreator = user && eventData.createdBy === user.uid;
        const isParticipant = user && eventData.participants.some(p => p.id === user.uid);
        const isPublic = eventData.visibility === 'public';
        
        // Get access code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('code');
        
        // Determine if user has access
        const userHasAccess = isPublic || isCreator || isParticipant || 
                             (codeFromUrl && eventData.accessCode === codeFromUrl);
        
        setHasAccess(userHasAccess ? true : false);
        
        // If user has access, fetch posts
        if (userHasAccess) {
          // Fetch posts for this event
          const allPosts = await getDocuments('posts') as PostData[];
          const eventPosts = allPosts.filter(post => post.eventId === eventId);
          
          // Sort posts by creation date (newest first)
          const sortedPosts = eventPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setPosts(sortedPosts);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setLoading(false);
      }
    };
    
    if (eventId && user) {
      fetchData();
    }
  }, [eventId, user]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/events" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }
  
  // Format date range
  const startDate = new Date(event.timeRange.start);
  const endDate = new Date(event.timeRange.end);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const dateDisplay = startDate.toDateString() === endDate.toDateString()
    ? formatDate(startDate)
    : `${formatDate(startDate)} - ${formatDate(endDate)}`;
    
  const timeDisplay = startDate.toDateString() === endDate.toDateString()
    ? `${formatTime(startDate)} - ${formatTime(endDate)}`
    : `${formatTime(startDate)} - ${formatTime(endDate)}`;
  
  // Prepare posts data for the heatmap
  const getPostsForHeatmap = () => {
    if (!posts) return [];
    
    return posts
      .filter(post => post.location && post.location.latitude && post.location.longitude)
      .map(post => ({
        id: post.id,
        location: {
          latitude: post.location!.latitude,
          longitude: post.location!.longitude
        },
        timestamp: post.captureTimestamp || post.createdAt
      }));
  };
  
  const handleShareEvent = () => {
    setShowShareModal(true);
  };
  
  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event || !accessCode) return;
    
    if (accessCode === event.accessCode) {
      setHasAccess(true);
      setAccessError(null);
      
      // Update URL with access code
      const url = new URL(window.location.href);
      url.searchParams.set('code', accessCode);
      window.history.replaceState({}, '', url.toString());
      
      // Fetch posts now that we have access
      fetchData();
    } else {
      setAccessError('Invalid access code. Please try again.');
    }
  };
  
  const fetchData = async () => {
    try {
      // Fetch posts for this event
      const allPosts = await getDocuments('posts') as PostData[];
      const eventPosts = allPosts.filter(post => post.eventId === eventId);
      
      // Sort posts by creation date (newest first)
      const sortedPosts = eventPosts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  
  // Generate shareable link with access code
  const getShareableLink = () => {
    if (!event || !event.accessCode) return '';
    
    const url = new URL(window.location.href);
    url.searchParams.set('code', event.accessCode);
    return url.toString();
  };
  
  const handleDeleteEvent = async () => {
    if (!user || !event) return;
    
    setIsDeleting(true);
    
    try {
      // Delete the event
      const result = await deleteDocument('events', eventId);
      
      if (!result.success) {
        throw new Error(result.error ? result.error.toString() : 'Failed to delete event');
      }
      
      toast.success('Event deleted successfully');
      
      // Redirect to events page
      router.push('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Event Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 w-full bg-gradient-to-r from-blue-400 to-purple-500 relative">
          {event.coverImage && !coverImageError && (
            <Image
              src={event.coverImage}
              alt={event.name}
              fill
              className="object-cover"
              onError={() => setCoverImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Back button */}
          <div className="absolute top-4 left-4">
            <Link href="/events" className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Event Info Card */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
            <p className="text-gray-600 mb-4">{event.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">{dateDisplay}</p>
                  <p className="text-sm text-gray-500">{timeDisplay}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">{event.location.venue}</p>
                  <p className="text-sm text-gray-500">{event.location.address}</p>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={handleShareEvent}
                className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
              <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </button>
              {user && event.createdBy === user.uid && (
                <>
                  <Link 
                    href={`/events/${eventId}/edit`}
                    className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-1" />
                    Edit Event
                  </Link>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>
            
            {/* Participants */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {event.participants.slice(0, 5).map((participant, index) => (
                    <div key={participant.id} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                      <Image
                        src={participant.photoURL}
                        alt={participant.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {event.participantCount > 5 && (
                    <div className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                      +{event.participantCount - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {event.participantCount} {event.participantCount === 1 ? 'participant' : 'participants'}
                </span>
              </div>
              
              <Link 
                href={`/create?eventId=${event.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Moment
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6 pb-20">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button 
              className={`flex-1 py-3 text-center font-medium ${viewMode === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
            >
              <div className="flex items-center justify-center">
                <List className="h-4 w-4 mr-2" />
                Timeline
              </div>
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium ${viewMode === 'grid' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setViewMode('grid')}
            >
              <div className="flex items-center justify-center">
                <Grid className="h-4 w-4 mr-2" />
                Gallery
              </div>
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium ${viewMode === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setViewMode('map')}
            >
              <div className="flex items-center justify-center">
                <Map className="h-4 w-4 mr-2" />
                Map
              </div>
            </button>
          </div>
        </div>
        
        {/* Content based on view mode */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <Post key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No moments shared yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share your experience at this event</p>
                <Link 
                  href={`/create?eventId=${event.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Moment
                </Link>
              </div>
            )}
          </div>
        )}
        
        {viewMode === 'grid' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            {posts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {posts.map(post => (
                  <div key={post.id} className="aspect-square relative rounded overflow-hidden">
                    {post.imageURL ? (
                      <Image
                        src={post.imageURL}
                        alt=""
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs p-2 text-center">{post.text.substring(0, 50)}...</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No photos shared yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share your photos from this event</p>
                <Link 
                  href={`/create?eventId=${event.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photos
                </Link>
              </div>
            )}
          </div>
        )}
        
        {viewMode === 'map' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            {posts.some(post => post.location && post.location.latitude && post.location.longitude) ? (
              <div className="flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Activity Heatmap</h3>
                <p className="text-sm text-gray-500 mb-4">
                  See how activity evolved during this event. The warmer colors indicate higher intensity of moments being shared.
                </p>
                <EventHeatmap 
                  posts={getPostsForHeatmap()} 
                  eventId={eventId} 
                  className="mb-4"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <Map className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Location Data</h3>
                  <p className="text-gray-500 mb-4">No posts with location data are available for this event</p>
                  <Link 
                    href={`/create?eventId=${event.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add a Moment with Location
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      {!loading && event && (
        <div className="fixed bottom-20 right-4 md:right-8">
          <Link 
            href={`/create?eventId=${event.id}`}
            className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-6 w-6" />
          </Link>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Share Event</h3>
            
            {event.visibility === 'private' && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  This is a private event. Share this link with people you want to invite:
                </p>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={getShareableLink()}
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getShareableLink());
                      alert('Link copied to clipboard!');
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-r-lg text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Or share via:
              </p>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white p-2 rounded-full">
                  <span className="sr-only">Facebook</span>
                  {/* Facebook icon would go here */}
                </button>
                <button className="bg-blue-400 text-white p-2 rounded-full">
                  <span className="sr-only">Twitter</span>
                  {/* Twitter icon would go here */}
                </button>
                <button className="bg-green-500 text-white p-2 rounded-full">
                  <span className="sr-only">WhatsApp</span>
                  {/* WhatsApp icon would go here */}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Cancel"
        onConfirm={handleDeleteEvent}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
} 