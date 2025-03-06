'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '../../lib/contexts/AuthContext';
import Navigation from '../../components/Navigation';
import EventCard from '../../components/EventCard';
import { Search, Filter, MapPin, Calendar, X, Plus } from 'lucide-react';
import { getDocuments } from '../../lib/firebase/firebaseUtils';
import Link from 'next/link';

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

export default function EventsPage() {
  return (
    <AuthProvider>
      <EventsContent />
    </AuthProvider>
  );
}

function EventsContent() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    upcoming: false,
    past: false,
    nearby: false
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await getDocuments('events') as EventData[];
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(query) || 
        event.description.toLowerCase().includes(query) ||
        event.location.venue.toLowerCase().includes(query)
      );
    }
    
    // Apply other filters
    if (filters.upcoming) {
      const now = new Date();
      result = result.filter(event => new Date(event.timeRange.start) > now);
    }
    
    if (filters.past) {
      const now = new Date();
      result = result.filter(event => new Date(event.timeRange.end) < now);
    }
    
    // For nearby filter, we would need actual geolocation
    // This is a simplified version
    if (filters.nearby) {
      // In a real app, we would filter based on user's location
      // For now, just show a subset of events
      result = result.slice(0, Math.max(1, Math.floor(result.length / 2)));
    }
    
    setFilteredEvents(result);
  }, [events, searchQuery, filters]);

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      upcoming: false,
      past: false,
      nearby: false
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Discover Events</h1>
          <Link 
            href="/events/create" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Event
          </Link>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => toggleFilter('upcoming')}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
                filters.upcoming 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming
            </button>
            <button 
              onClick={() => toggleFilter('past')}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
                filters.past 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Past
            </button>
            <button 
              onClick={() => toggleFilter('nearby')}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
                filters.nearby 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Nearby
            </button>
            
            {(searchQuery || !filters.upcoming || filters.past || filters.nearby) && (
              <button 
                onClick={clearFilters}
                className="flex items-center px-3 py-1.5 rounded-full text-sm text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {/* Events grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-3">
              <Filter className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <Link 
              href="/events/create" 
              className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>
        )}
      </main>
    </div>
  );
} 