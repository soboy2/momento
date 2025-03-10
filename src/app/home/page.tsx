'use client';

import { useEffect, useState } from 'react';
import { getDocuments } from '../../lib/firebase/firebaseUtils';
import Post from '../../components/Post';
import { AuthProvider } from '../../lib/contexts/AuthContext';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, ChevronRight, Clock, Plus } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../../lib/hooks/useAuth';
import TrendingPosts from '../../components/TrendingPosts';

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
    <div className="p-4 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Home</h1>
        <Link href="/create" className="bg-blue-500 text-white p-2 rounded-full">
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-bold">Happening Now</h2>
              </div>
              <div className="flex overflow-x-auto space-x-4 pb-2">
                {activeEvents.map(event => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="flex-shrink-0 bg-blue-50 rounded-lg p-3 border border-blue-100 w-64"
                  >
                    <h3 className="font-medium text-blue-800 mb-1">{event.name}</h3>
                    <div className="flex items-center text-xs text-blue-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{event.location.venue}</span>
                    </div>
                    <div className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full inline-block">
                      Live Now
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Trending Posts Section */}
          <TrendingPosts posts={posts} maxPosts={3} />

          {/* Feed */}
          <div className="space-y-4">
            {posts.map(post => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
      
      <Navigation />
    </div>
  );
} 