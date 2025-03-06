'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/hooks/useAuth';
import { getDocuments, logoutUser } from '../../lib/firebase/firebaseUtils';
import Post from '../../components/Post';
import Image from 'next/image';
import { LogOut, Settings, Calendar, MapPin, Link as LinkIcon, Heart } from 'lucide-react';
import { AuthProvider } from '../../lib/contexts/AuthContext';
import Navigation from '../../components/Navigation';

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

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalComments: 0
  });
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      
      try {
        const postsData = await getDocuments('posts') as PostData[];
        // Filter posts by the current user and sort by creation date (newest first)
        const filteredPosts = postsData
          .filter((post) => post.userId === user.uid)
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        
        setUserPosts(filteredPosts);

        // Calculate stats
        const totalLikes = filteredPosts.reduce((sum, post) => sum + post.likes.length, 0);
        const totalComments = filteredPosts.reduce((sum, post) => sum + post.comments.length, 0);
        setStats({ totalLikes, totalComments });
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // No need to redirect since we're always using a mock user
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) return null;

  // Format date for "joined" information
  const joinedDate = new Date(2023, 8, 15); // September 15, 2023
  const joinedDateFormatted = joinedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="pb-20 max-w-screen-md mx-auto">
      <div className="p-4">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex space-x-2">
            <button 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative">
            {/* Edit Cover Button */}
            <button className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
              Edit Cover
            </button>
          </div>
          
          <div className="px-6 pb-6">
            {/* Profile Picture */}
            <div className="relative -mt-12 mb-4">
              <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden">
                {user.photoURL && !avatarError ? (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    fill
                    className="object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="bg-blue-500 h-full w-full flex items-center justify-center">
                    <span className="text-white text-2xl">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="mb-4">
              <h2 className="text-xl font-bold">{user.displayName || 'Anonymous'}</h2>
              <p className="text-gray-600">{user.email}</p>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  <a href="#" className="text-sm text-blue-500 hover:underline">github.com/demouser</a>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">Joined {joinedDateFormatted}</span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-4 border-t border-gray-100 pt-4">
              <div className="text-center px-4">
                <div className="text-xl font-bold">{userPosts.length}</div>
                <div className="text-gray-500 text-sm">Posts</div>
              </div>
              <div className="text-center px-4 border-l border-gray-100">
                <div className="text-xl font-bold">{stats.totalLikes}</div>
                <div className="text-gray-500 text-sm">Likes</div>
              </div>
              <div className="text-center px-4 border-l border-gray-100">
                <div className="text-xl font-bold">{stats.totalComments}</div>
                <div className="text-gray-500 text-sm">Comments</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">You haven't created any posts yet.</p>
              <button 
                onClick={() => window.location.href = '/create'}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Create Your First Post
              </button>
            </div>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
} 