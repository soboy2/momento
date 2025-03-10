'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Post from './Post';
import { calculateTrendingScore } from '../lib/utils/trendingUtils';

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
  views?: number;
}

interface TrendingPostsProps {
  posts: PostData[];
  maxPosts?: number;
}

export default function TrendingPosts({ posts, maxPosts = 3 }: TrendingPostsProps) {
  const [trendingPosts, setTrendingPosts] = useState<PostData[]>([]);
  
  useEffect(() => {
    // Filter and sort posts by trending score
    const postsWithScores = posts.map(post => ({
      post,
      score: calculateTrendingScore(post)
    }));
    
    // Filter posts with a minimum trending score
    const trending = postsWithScores
      .filter(item => item.score >= 5) // Minimum score to be considered trending
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .map(item => item.post) // Extract just the post data
      .slice(0, maxPosts); // Limit to maxPosts
    
    setTrendingPosts(trending);
  }, [posts, maxPosts]);
  
  // Don't render anything if there are no trending posts
  if (trendingPosts.length === 0) return null;
  
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <Flame className="h-5 w-5 text-red-500 mr-2" />
        <h2 className="text-lg font-bold">Trending Now</h2>
      </div>
      
      <div className="space-y-4">
        {trendingPosts.map(post => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
} 