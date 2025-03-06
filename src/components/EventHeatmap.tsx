'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Define the post data interface
interface PostLocation {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string; // ISO timestamp
}

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
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const animationRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [processedPosts, setProcessedPosts] = useState<PostLocation[]>([]);

  // Process posts to create time-bucketed data
  const processPostsData = () => {
    if (!posts || posts.length === 0) return { timeBuckets: [], timeRange: [new Date(), new Date()] as [Date, Date] };

    // Sort posts by timestamp
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get time range
    const startTime = new Date(sortedPosts[0].timestamp);
    const endTime = new Date(sortedPosts[sortedPosts.length - 1].timestamp);
    
    // Create 20 time buckets
    const bucketSize = (endTime.getTime() - startTime.getTime()) / 20;
    const buckets: PostLocation[][] = Array(20).fill(null).map(() => []);
    
    // Assign posts to buckets
    sortedPosts.forEach(post => {
      const postTime = new Date(post.timestamp).getTime();
      const bucketIndex = Math.min(
        Math.floor((postTime - startTime.getTime()) / bucketSize),
        19 // Ensure we don't exceed the array bounds
      );
      buckets[bucketIndex].push(post);
    });
    
    setProcessedPosts(sortedPosts);
    
    return { 
      timeBuckets: buckets,
      timeRange: [startTime, endTime] as [Date, Date]
    };
  };

  // Update the heatmap with new data
  const updateHeatmap = (postsData: PostLocation[]) => {
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
  };

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
  }, [posts, processPostsData]);

  // Handle time slider change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setTimeIndex(newIndex);
    
    const { timeBuckets } = processPostsData();
    if (timeBuckets.length > 0) {
      updateHeatmap(timeBuckets[newIndex]);
      
      // Update current time display
      const timeProgress = newIndex / (timeBuckets.length - 1);
      const newTime = new Date(
        timeRange[0].getTime() + 
        timeProgress * (timeRange[1].getTime() - timeRange[0].getTime())
      );
      setCurrentTime(newTime);
    }
  };

  // Handle play/pause
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
            timeProgress * (timeRange[1].getTime() - timeRange[0].getTime())
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
  }, [playing, timeRange, mapLoaded, processedPosts, timeIndex]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div ref={mapContainer} className="w-full h-64 md:h-96 rounded-lg" />
      
      <div className="mt-4 px-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {formatDate(currentTime)} {formatTime(currentTime)}
          </span>
          <button 
            onClick={togglePlay}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{formatTime(timeRange[0])}</span>
          <input
            type="range"
            min="0"
            max="19"
            value={timeIndex}
            onChange={handleTimeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">{formatTime(timeRange[1])}</span>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          Showing post activity intensity over time
        </div>
      </div>
    </div>
  );
} 