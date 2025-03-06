'use client';

import { useEffect, useState } from 'react';
import { getDocuments } from '../../lib/firebase/firebaseUtils';
import Post from '../../components/Post';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs'; // Explicitly set the runtime

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

export default function AuthHomePage() {
  // Redirect to the actual home page
  redirect('/home');
} 