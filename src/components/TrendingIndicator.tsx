'use client';

import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TrendingIndicatorProps {
  level: number; // 0-3, where 0 is not trending and 3 is very hot
  showLabel?: boolean;
  className?: string;
}

export default function TrendingIndicator({ 
  level, 
  showLabel = false,
  className = ''
}: TrendingIndicatorProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Ensure animations only run on client side
  useEffect(() => {
    setIsClient(true);
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      // This empty cleanup function helps prevent React error #423
    };
  }, []);
  
  if (level === 0) return null; // Don't show anything if not trending
  
  // Define colors based on trending level
  const getColor = () => {
    switch (level) {
      case 1: return 'text-orange-300'; // Slightly trending
      case 2: return 'text-orange-500'; // Trending
      case 3: return 'text-red-500';    // Hot trending
      default: return 'text-gray-400';  // Fallback
    }
  };
  
  // Define labels based on trending level
  const getLabel = () => {
    switch (level) {
      case 1: return 'Trending';
      case 2: return 'Popular';
      case 3: return 'Hot';
      default: return '';
    }
  };
  
  // Define animation variants based on trending level
  const getAnimationProps = () => {
    if (!isClient) return {}; // No animation on server
    
    // Simplified animation props to avoid potential issues
    switch (level) {
      case 1: return {
        animate: { scale: [1, 1.1, 1] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      };
      case 2: return {
        animate: { scale: [1, 1.2, 1] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      };
      case 3: return {
        animate: { scale: [1, 1.3, 1] },
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      };
      default: return {};
    }
  };
  
  const color = getColor();
  const label = getLabel();
  const animationProps = isClient ? getAnimationProps() : {};
  
  return (
    <div className={`flex items-center ${className}`}>
      {isClient ? (
        <motion.div {...animationProps}>
          <Flame className={`${color} h-4 w-4`} />
        </motion.div>
      ) : (
        <Flame className={`${color} h-4 w-4`} />
      )}
      
      {showLabel && (
        <span className={`ml-1 text-xs font-medium ${color}`}>
          {label}
        </span>
      )}
    </div>
  );
} 