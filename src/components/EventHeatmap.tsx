'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [processedPosts, setProcessedPosts] = useState<PostLocation[]>([]);

  // Process posts to create time-bucketed data
  const processPostsData = useCallback(() => {
    if (posts.length === 0) return { timeBuckets: [], timeRange: [new Date(), new Date()] as [Date, Date] };

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
    
    setTimeRange([startTime, endTime] as [Date, Date]);
    
    return { 
      timeBuckets: buckets,
      timeRange: [startTime, endTime] as [Date, Date]
    };
  }, [posts]);

  // Initialize the map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Set the Mapbox access token
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token is not defined');
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Calculate the center of the map based on posts
    let center: [number, number] = [-74.5, 40]; // Default to NYC
    let zoom = 9;

    if (posts.length > 0) {
      // Calculate the average of all post locations
      const sumLat = posts.reduce((sum, post) => sum + post.location.latitude, 0);
      const sumLng = posts.reduce((sum, post) => sum + post.location.longitude, 0);
      center = [sumLng / posts.length, sumLat / posts.length];
    }

    // Create the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for the map to load
    map.current.on('load', () => {
      if (!map.current) return;

      // Create GeoJSON data from posts
      const geojsonData = {
        type: 'FeatureCollection',
        features: posts.map(post => ({
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

      // Add the source
      map.current.addSource('posts', {
        type: 'geojson',
        data: geojsonData as any
      });

      // Add a heatmap layer
      map.current.addLayer({
        id: 'posts-heat',
        type: 'heatmap',
        source: 'posts',
        paint: {
          // Increase the heatmap weight based on frequency of points
          'heatmap-weight': 1,
          // Increase the heatmap color weight weight by zoom level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            9, 0.5
          ],
        }
      });

      // Add a circle layer
      map.current.addLayer({
        id: 'posts-point',
        type: 'circle',
        source: 'posts',
        paint: {
          'circle-radius': 6,
          'circle-color': '#1E88E5',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'white',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0,
            8, 0.5
          ]
        }
      });

      setMapLoaded(true);
      
      // Process the posts data
      const { timeRange: newTimeRange } = processPostsData();
      setTimeRange(newTimeRange);
      setCurrentTime(newTimeRange[0]);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [posts, processPostsData]);

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
    if (posts.length > 0 && mapLoaded) {
      processPostsData();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [posts, mapLoaded, processPostsData]);

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
        frame = (frame + 1) % 101; // 0-100 for slider
        
        // Update time index
        setTimeIndex(frame);
        
        // Update current time display
        const timeProgress = frame / 100;
        const newTime = new Date(
          timeRange[0].getTime() + 
          (timeRange[1].getTime() - timeRange[0].getTime()) * timeProgress
        );
        setCurrentTime(newTime);
        
        // Update the heatmap
        const postsToShow = processedPosts.filter(post => 
          new Date(post.timestamp).getTime() <= newTime.getTime()
        );
        updateHeatmap(postsToShow);
        
        // Stop at the end
        if (frame === 100) {
          setPlaying(false);
          return;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, timeRange, mapLoaded, processedPosts, updateHeatmap]);

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