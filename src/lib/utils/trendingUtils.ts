/**
 * Utility functions for determining trending content
 */

interface Post {
  id: string;
  likes: string[];
  comments: any[];
  createdAt: string;
  views?: number;
}

/**
 * Calculate a trending score for a post based on likes, comments, and recency
 * @param post The post to calculate the trending score for
 * @returns A numeric score representing how trending the post is
 */
export const calculateTrendingScore = (post: Post): number => {
  // Get the post age in hours
  const createdAt = new Date(post.createdAt);
  const now = new Date();
  const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Calculate base engagement score
  const likesWeight = 1;
  const commentsWeight = 2;
  const viewsWeight = 0.1;
  
  const likesScore = post.likes.length * likesWeight;
  const commentsScore = post.comments.length * commentsWeight;
  const viewsScore = (post.views || 0) * viewsWeight;
  
  const engagementScore = likesScore + commentsScore + viewsScore;
  
  // Apply time decay factor (more recent posts get higher scores)
  // We use a half-life of 24 hours
  const timeDecayFactor = Math.pow(0.5, ageInHours / 24);
  
  // Calculate final trending score
  const trendingScore = engagementScore * timeDecayFactor;
  
  return trendingScore;
};

/**
 * Determine if a post is trending based on its trending score
 * @param post The post to check
 * @param threshold The minimum score to be considered trending (default: 5)
 * @returns Boolean indicating if the post is trending
 */
export const isTrending = (post: Post, threshold: number = 5): boolean => {
  const score = calculateTrendingScore(post);
  return score >= threshold;
};

/**
 * Get trending level (0-3) based on trending score
 * 0 = not trending
 * 1 = slightly trending
 * 2 = trending
 * 3 = hot trending
 * 
 * @param post The post to check
 * @returns A number from 0-3 indicating trending level
 */
export const getTrendingLevel = (post: Post): number => {
  const score = calculateTrendingScore(post);
  
  if (score < 5) return 0; // Not trending
  if (score < 10) return 1; // Slightly trending
  if (score < 20) return 2; // Trending
  return 3; // Hot trending
}; 