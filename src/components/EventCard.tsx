'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface EventCardProps {
  id: string;
  name: string;
  description: string;
  location: {
    venue: string;
    address?: string;
  };
  timeRange: {
    start: string; // ISO timestamp
    end: string;   // ISO timestamp
  };
  coverImage?: string;
  participantCount: number;
  postCount: number;
  visibility?: 'public' | 'private';
}

export default function EventCard({
  id,
  name,
  description,
  location,
  timeRange,
  coverImage,
  participantCount,
  postCount,
  visibility = 'public'
}: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Format date range
  const startDate = new Date(timeRange.start);
  const endDate = new Date(timeRange.end);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const dateDisplay = startDate.toDateString() === endDate.toDateString()
    ? formatDate(startDate)
    : `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <Link href={`/events/${id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Cover Image */}
        <div className="relative h-40 w-full bg-gradient-to-r from-blue-400 to-purple-500">
          {coverImage && !imageError && (
            <Image
              src={coverImage}
              alt={name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </div>
          
          {visibility === 'private' && (
            <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md">
              Private
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{dateDisplay}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{location.venue}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
          <span className="text-sm font-medium text-blue-600">View Event</span>
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </Link>
  );
} 