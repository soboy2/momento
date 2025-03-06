'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Play, Pause } from 'lucide-react';

// Define the post location interface
interface PostLocation {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string; // ISO timestamp
}

// Define the component props
interface EventHeatmapProps {
  posts: PostLocation[];
  eventId: string;
  className?: string;
}

// Don't set the token at the module level
// Instead, we'll set it inside a useEffect

export default function EventHeatmap({ posts, eventId, className = '' }: EventHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [processedPosts, setProcessedPosts] = useState<PostLocation[]>([]);

  // Process posts to create time-bucketed data
  const processPostsData = useCallback(() => {
    if (posts.length === 0) return { timeBuckets: [], timeRange: [new Date(), new Date()] };

    // Sort posts by timestamp
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    setProcessedPosts(sortedPosts);
    
    // Get time range
    const startTime = new Date(sortedPosts[0].timestamp);
    const endTime = new Date(sortedPosts[sortedPosts.length - 1].timestamp);
    
    // Create time buckets (for now, just use the sorted posts)
    const buckets: PostLocation[][] = [];
    const bucketCount = 10; // Number of time buckets
    const timePerBucket = (endTime.getTime() - startTime.getTime()) / bucketCount;
    
    // Initialize buckets
    for (let i = 0; i < bucketCount; i++) {
      buckets.push([]);
    }
    
    // Assign posts to buckets
    sortedPosts.forEach(post => {
      const postTime = new Date(post.timestamp).getTime();
      const bucketIndex = Math.min(
        Math.floor((postTime - startTime.getTime()) / timePerBucket),
        bucketCount - 1
      );
      buckets[bucketIndex].push(post);
    });
    
    return { 
      timeBuckets: buckets,
      timeRange: [startTime, endTime] as [Date, Date]
    };
  }, [posts]);

  // Update the heatmap with new data
  const updateHeatmap = useCallback((postsData: PostLocation[]) => {
    if (!map.current || !mapLoaded) return;

    // Create GeoJSON data from posts
    const geojsonData = {
      type: 'FeatureCollection',
      features: postsData.map(post => ({
        type: 'Feature',
        properties: {
          id: post.id,
          timestamp: post.timestamp
        },
        geometry: {
          type: 'Point',
          coordinates: [post.location.longitude, post.location.latitude]
        }
      }))
    };

    // Update the source data
    const source = map.current.getSource('posts');
    if (source && 'setData' in source) {
      source.setData(geojsonData as any);
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (posts.length > 0) {
      processPostsData();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [posts, processPostsData, updateHeatmap]);

  // Handle time slider change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTimeIndex(value);
    
    // Update the current time display
    const timeProgress = value / 100;
    const newTime = new Date(
      timeRange[0].getTime() + 
      (timeRange[1].getTime() - timeRange[0].getTime()) * timeProgress
    );
    setCurrentTime(newTime);
    
    // Update the heatmap
    if (processedPosts.length > 0) {
      const postsToShow = processedPosts.filter(post => 
        new Date(post.timestamp).getTime() <= newTime.getTime()
      );
      updateHeatmap(postsToShow);
    }
  };

  // Toggle play/pause for the animation
  const togglePlay = () => {
    setPlaying(!playing);
  };

  // Animation effect
  useEffect(() => {
    // Animation logic for playing through the timeline
    if (playing && mapLoaded && processedPosts.length > 0) {
      let frame = 0;
      const animate = () => {
        frame = (frame + 1) % processedPosts.length;
        const bucketIndex = Math.min(
          Math.floor(frame / processedPosts.length),
          processedPosts.length - 1
        );
        
        if (bucketIndex !== timeIndex) {
          setTimeIndex(bucketIndex);
          updateHeatmap([processedPosts[bucketIndex]]);
          
          // Update current time display
          const timeProgress = bucketIndex / (processedPosts.length - 1);
          const newTime = new Date(
            timeRange[0].getTime() + 
            (timeRange[1].getTime() - timeRange[0].getTime()) * timeProgress
          );
          setCurrentTime(newTime);
        }
        
        // Stop at the end
        if (frame === processedPosts.length - 1) {
          setPlaying(false);
          return;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, timeRange, mapLoaded, processedPosts, timeIndex, updateHeatmap]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  // If no posts with location data, show a message
  if (posts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 text-center ${className}`}>
        <p className="text-gray-500">No location data available for this event.</p>
        <p className="text-sm text-gray-400 mt-2">Add moments with location to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Activity Heatmap</h3>
        <p className="text-sm text-gray-500">
          Visualize activity during the event
        </p>
      </div>
      
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-[400px]"
        />
        
        {/* Loading indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={togglePlay}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
            disabled={!mapLoaded}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="text-sm text-gray-600">
            {formatDate(currentTime)} {formatTime(currentTime)}
          </div>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={timeIndex}
          onChange={handleTimeChange}
          className="w-full"
          disabled={!mapLoaded}
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(timeRange[0])}</span>
          <span>{formatTime(timeRange[1])}</span>
        </div>
      </div>
    </div>
  );
} 