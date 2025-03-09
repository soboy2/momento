'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, MapPin, Tag, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../lib/hooks/useAuth';
import { updateDocument, deleteDocument, getDocument } from '../lib/firebase/firebaseUtils';
import { useRouter } from 'next/navigation';
import ConfirmationModal from './ConfirmationModal';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface PostProps {
  post: {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL: string;
    text: string;
    imageURL?: string;
    likes: string[];
    comments: Comment[];
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
  };
}

export default function Post({ post }: PostProps) {
  const {
    id,
    userId,
    userName,
    userPhotoURL,
    text,
    imageURL,
    likes,
    comments,
    createdAt,
    location,
    eventId,
    eventName,
    contextualTags
  } = post;

  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? likes.includes(user.uid) : false);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1);

    let updatedLikes = [...likes];
    if (newIsLiked) {
      updatedLikes.push(user.uid);
    } else {
      updatedLikes = updatedLikes.filter(id => id !== user.uid);
    }

    await updateDocument('posts', id, { likes: updatedLikes });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setLocalComments([...localComments, comment]);
    setNewComment('');

    await updateDocument('posts', id, { 
      comments: [...localComments, comment] 
    });
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Delete the post
      const result = await deleteDocument('posts', id);
      
      if (!result.success) {
        throw new Error(result.error ? result.error.toString() : 'Failed to delete post');
      }
      
      toast.success('Post deleted successfully');
      
      // If the post is on an event page, update the event's post count
      if (eventId) {
        try {
          const eventData = await getDocument('events', eventId) as any;
          if (eventData && eventData.postCount > 0) {
            await updateDocument('events', eventId, {
              postCount: eventData.postCount - 1
            });
          }
        } catch (error) {
          console.error('Error updating event post count:', error);
          // Continue even if event update fails
        }
      }
      
      // Refresh the page to show the updated list
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      {/* Post header */}
      <div className="flex items-center p-4">
        <div className="h-10 w-10 rounded-full overflow-hidden relative">
          {userPhotoURL && !avatarError ? (
            <Image 
              src={userPhotoURL} 
              alt={userName} 
              fill 
              className="object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="bg-gray-200 h-full w-full flex items-center justify-center">
              <span className="text-gray-500 text-lg">{userName.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="font-medium">{userName}</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
        
        {/* Event tag if available */}
        {eventId && eventName && (
          <Link href={`/events/${eventId}`} className="flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            <Calendar className="h-3 w-3 mr-1" />
            {eventName}
          </Link>
        )}
      </div>

      {/* Post content */}
      <div className="px-4 pb-2">
        <p className="mb-2">{text}</p>
        
        {/* Location if available */}
        {location && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </span>
          </div>
        )}
        
        {/* Tags if available */}
        {contextualTags && contextualTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {contextualTags.map((tag, index) => (
              <span key={index} className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post image (if any) */}
      {imageURL && !imageError && (
        <div className="relative w-full h-80">
          <Image 
            src={imageURL} 
            alt="Post image" 
            fill 
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Post actions */}
      <div className="px-4 py-2 flex items-center border-t border-gray-100">
        <button 
          onClick={handleLike}
          className="flex items-center mr-4"
        >
          <Heart 
            className={`h-6 w-6 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
          />
          <span className="text-sm">{likeCount}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-gray-500 mr-4"
        >
          <MessageCircle className="h-6 w-6 mr-1" />
          <span className="text-sm">{localComments.length}</span>
        </button>
        {user && userId === user.uid && (
          <>
            <Link 
              href={`/posts/${id}/edit`}
              className="flex items-center text-gray-500 mr-4"
            >
              <Edit className="h-5 w-5 mr-1" />
              <span className="text-sm">Edit</span>
            </Link>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center text-gray-500"
            >
              <Trash2 className="h-5 w-5 mr-1" />
              <span className="text-sm">Delete</span>
            </button>
          </>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 py-2 border-t border-gray-100">
          {localComments.length > 0 ? (
            <div className="mb-4 max-h-40 overflow-y-auto">
              {localComments.map((comment) => (
                <div key={comment.id} className="mb-2">
                  <p className="text-sm">
                    <span className="font-medium">{comment.userName}</span>{' '}
                    {comment.text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No comments yet</p>
          )}

          <form onSubmit={handleAddComment} className="flex">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-r-lg px-3 py-2 text-sm"
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete Post"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
} 