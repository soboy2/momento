'use client';

import { useEffect, useState } from 'react';
import { getDocuments } from '../../lib/firebase/firebaseUtils';
import Post from '../../components/Post';
import { AuthProvider } from '../../lib/contexts/AuthContext';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, ChevronRight, Clock } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../../lib/hooks/useAuth';

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

export default function HomePage() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

function HomeContent() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch posts
        const postsData = await getDocuments('posts') as PostData[];
        
        // Sort posts by creation date (newest first)
        const sortedPosts = postsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setPosts(sortedPosts);
        
        // Fetch events
        const eventsData = await getDocuments('events') as EventData[];
        setEvents(eventsData);
        
        // Process events
        const now = new Date();
        const upcoming = eventsData.filter(event => {
          const startDate = new Date(event.timeRange.start);
          const endDate = new Date(event.timeRange.end);
          return startDate > now && startDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
        }).sort((a, b) => new Date(a.timeRange.start).getTime() - new Date(b.timeRange.start).getTime());
        
        const active = eventsData.filter(event => {
          const startDate = new Date(event.timeRange.start);
          const endDate = new Date(event.timeRange.end);
          return startDate <= now && endDate >= now;
        });
        
        setUpcomingEvents(upcoming.slice(0, 3)); // Show top 3 upcoming events
        setActiveEvents(active);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group posts by event
  const postsByEvent: Record<string, PostData[]> = {};
  const postsWithoutEvent: PostData[] = [];
  
  posts.forEach(post => {
    if (post.eventId) {
      if (!postsByEvent[post.eventId]) {
        postsByEvent[post.eventId] = [];
      }
      postsByEvent[post.eventId].push(post);
    } else {
      postsWithoutEvent.push(post);
    }
  });
  
  // Format date for events
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Check if an event is happening now
  const isEventNow = (event: EventData) => {
    const now = new Date();
    const startDate = new Date(event.timeRange.start);
    const endDate = new Date(event.timeRange.end);
    return startDate <= now && endDate >= now;
  };

  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        {user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              {user.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  width={48} 
                  height={48} 
                  className="rounded-full mr-3"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-700 font-bold text-lg">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">Welcome, {user.displayName || 'User'}!</h2>
                <p className="text-sm text-gray-600">You're now signed in with Google</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Events Section */}
        {activeEvents.length > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg">Happening Now</h2>
                <Link href="/events" className="text-sm flex items-center hover:underline">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-3">
                {activeEvents.map(event => (
                  <Link href={`/events/${event.id}`} key={event.id} className="block">
                    <div className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition">
                      <h3 className="font-bold text-white">{event.name}</h3>
                      <div className="flex items-center text-sm mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Ends {formatEventDate(event.timeRange.end)}</span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="flex -space-x-1 mr-2">
                          {event.participants.slice(0, 3).map(participant => (
                            <div key={participant.id} className="w-6 h-6 rounded-full border border-white overflow-hidden relative">
                              <Image 
                                src={participant.photoURL} 
                                alt={participant.name} 
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {event.participantCount > 3 && (
                            <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xs">
                              +{event.participantCount - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs">{event.participantCount} participating</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-blue-600 flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <Link href={`/events/${event.id}`} key={event.id} className="block">
                  <div className="bg-white rounded-lg shadow-sm p-3 hover:bg-gray-50 transition">
                    <h3 className="font-bold">{event.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatEventDate(event.timeRange.start)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{event.location.venue}</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex -space-x-1 mr-2">
                        {event.participants.slice(0, 3).map(participant => (
                          <div key={participant.id} className="w-6 h-6 rounded-full border border-white overflow-hidden relative">
                            <Image 
                              src={participant.photoURL} 
                              alt={participant.name} 
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {event.participantCount > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                            +{event.participantCount - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{event.participantCount} participating</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Posts Feed */}
        <div>
          <h2 className="font-bold text-lg mb-4">Recent Activity</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {/* First show posts from active events */}
              {activeEvents.map(event => {
                const eventPosts = postsByEvent[event.id] || [];
                if (eventPosts.length === 0) return null;
                
                return (
                  <div key={event.id} className="mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg mb-2">
                      <Link href={`/events/${event.id}`} className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs font-medium">
                              LIVE
                            </div>
                            <h3 className="font-bold ml-2">{event.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.postCount} moments shared
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </Link>
                    </div>
                    
                    {eventPosts.slice(0, 3).map(post => (
                      <Post key={post.id} post={post} />
                    ))}
                    
                    {eventPosts.length > 3 && (
                      <Link href={`/events/${event.id}`} className="block text-center text-blue-600 py-2 hover:underline">
                        View {eventPosts.length - 3} more moments from this event
                      </Link>
                    )}
                  </div>
                );
              })}
              
              {/* Then show other posts */}
              {postsWithoutEvent.map(post => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-gray-400 mb-3">
                <Users className="h-12 w-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
              <p className="text-gray-500 mb-4">Be the first to share a moment</p>
              <Link 
                href="/create" 
                className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Create Post
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 