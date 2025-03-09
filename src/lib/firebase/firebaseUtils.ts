// Firebase utilities for production
import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Mock data storage - keeping for fallback
let mockPosts: any[] = [];
let mockEvents: any[] = [];
let mockStorage: Record<string, string> = {};

// Clear localStorage to ensure our changes take effect
// Remove this in production
const clearLocalStorage = () => {
  localStorage.removeItem('mockPosts');
  localStorage.removeItem('mockEvents');
  console.log('Cleared localStorage to ensure updated dummy data is used');
};

// Initialize dummy events data
const initializeDummyEvents = () => {
  // Always initialize events data
  const dummyEvents = [
    {
      id: 'event1',
      name: 'Tech Conference 2023',
      description: 'Annual technology conference featuring the latest innovations and industry leaders. Join us for three days of inspiring talks, hands-on workshops, and networking opportunities with the brightest minds in tech.',
      location: {
        venue: 'Convention Center',
        address: '123 Tech Blvd, San Francisco, CA'
      },
      timeRange: {
        start: '2023-09-15T09:00:00Z',
        end: '2023-09-17T18:00:00Z'
      },
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      participantCount: 42,
      postCount: 128,
      participants: [
        { id: 'user1', name: 'Alex Johnson', photoURL: 'https://ui-avatars.com/api/?name=Alex+Johnson&size=128&background=random' },
        { id: 'user2', name: 'Sam Taylor', photoURL: 'https://ui-avatars.com/api/?name=Sam+Taylor&size=128&background=random' },
        { id: 'user3', name: 'Jordan Lee', photoURL: 'https://ui-avatars.com/api/?name=Jordan+Lee&size=128&background=random' },
        { id: 'user4', name: 'Casey Smith', photoURL: 'https://ui-avatars.com/api/?name=Casey+Smith&size=128&background=random' },
        { id: 'user5', name: 'Riley Brown', photoURL: 'https://ui-avatars.com/api/?name=Riley+Brown&size=128&background=random' }
      ]
    },
    {
      id: 'event2',
      name: 'Summer Music Festival',
      description: 'Three days of amazing performances from top artists across multiple stages. Experience the best in music, food, and art in a beautiful outdoor setting.',
      location: {
        venue: 'Riverside Park',
        address: '456 River Rd, Austin, TX'
      },
      timeRange: {
        start: '2023-07-21T12:00:00Z',
        end: '2023-07-23T23:00:00Z'
      },
      coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      participantCount: 156,
      postCount: 347,
      participants: [
        { id: 'user1', name: 'Alex Johnson', photoURL: 'https://ui-avatars.com/api/?name=Alex+Johnson&size=128&background=random' },
        { id: 'user2', name: 'Sam Taylor', photoURL: 'https://ui-avatars.com/api/?name=Sam+Taylor&size=128&background=random' },
        { id: 'user3', name: 'Jordan Lee', photoURL: 'https://ui-avatars.com/api/?name=Jordan+Lee&size=128&background=random' }
      ]
    },
    {
      id: 'event3',
      name: 'Local Food Festival',
      description: 'Celebrate local cuisine with tastings, cooking demonstrations, and food trucks. Meet local chefs and producers while enjoying delicious food and drinks.',
      location: {
        venue: 'Downtown Square',
        address: '789 Main St, Portland, OR'
      },
      timeRange: {
        start: '2023-08-05T10:00:00Z',
        end: '2023-08-05T20:00:00Z'
      },
      coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      participantCount: 89,
      postCount: 215,
      participants: [
        { id: 'user4', name: 'Casey Smith', photoURL: 'https://ui-avatars.com/api/?name=Casey+Smith&size=128&background=random' },
        { id: 'user5', name: 'Riley Brown', photoURL: 'https://ui-avatars.com/api/?name=Riley+Brown&size=128&background=random' }
      ]
    },
    {
      id: 'event4',
      name: 'Art Exhibition Opening',
      description: 'Opening night for the new contemporary art exhibition featuring local and international artists. Join us for a special evening of art, conversation, and refreshments.',
      location: {
        venue: 'Modern Art Gallery',
        address: '101 Gallery Way, New York, NY'
      },
      timeRange: {
        start: '2023-10-12T18:00:00Z',
        end: '2023-10-12T22:00:00Z'
      },
      coverImage: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      participantCount: 37,
      postCount: 82,
      participants: [
        { id: 'user2', name: 'Sam Taylor', photoURL: 'https://ui-avatars.com/api/?name=Sam+Taylor&size=128&background=random' },
        { id: 'user3', name: 'Jordan Lee', photoURL: 'https://ui-avatars.com/api/?name=Jordan+Lee&size=128&background=random' }
      ]
    }
  ];

  localStorage.setItem('mockEvents', JSON.stringify(dummyEvents));
  return dummyEvents;
};

// Initialize dummy posts data
const initializeDummyData = () => {
  try {
    console.log('Initializing dummy data...');
    
    // Initialize events
    const events = initializeDummyEvents();
    const firstEvent = events.length > 0 ? events[0] : null;
    
    // Create a function to generate random coordinates around a center point
    const generateRandomLocation = (centerLat: number, centerLng: number, radiusKm: number) => {
      // Earth's radius in kilometers
      const earthRadius = 6371;
      
      // Convert radius from kilometers to radians
      const radiusInRadian = radiusKm / earthRadius;
      
      // Convert latitude and longitude to radians
      const centerLatRad = centerLat * Math.PI / 180;
      const centerLngRad = centerLng * Math.PI / 180;
      
      // Generate a random angle and distance
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomDistance = Math.random() * radiusInRadian;
      
      // Calculate new position
      const newLatRad = Math.asin(
        Math.sin(centerLatRad) * Math.cos(randomDistance) +
        Math.cos(centerLatRad) * Math.sin(randomDistance) * Math.cos(randomAngle)
      );
      
      const newLngRad = centerLngRad + Math.atan2(
        Math.sin(randomAngle) * Math.sin(randomDistance) * Math.cos(centerLatRad),
        Math.cos(randomDistance) - Math.sin(centerLatRad) * Math.sin(newLatRad)
      );
      
      // Convert back to degrees
      const newLat = newLatRad * 180 / Math.PI;
      const newLng = newLngRad * 180 / Math.PI;
      
      return {
        latitude: newLat,
        longitude: newLng,
        accuracy: Math.floor(Math.random() * 20) + 5 // Random accuracy between 5-25 meters
      };
    };
    
    // Generate a timestamp within the event timeframe
    const generateRandomTimestamp = (startTime: string, endTime: string) => {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      return new Date(start + Math.random() * (end - start)).toISOString();
    };

    // Default coordinates (Rome, Italy) if no event is available
    const defaultLat = 41.9028;
    const defaultLng = 12.4964;
    
    // Event timeframe or default to last 48 hours
    const eventStart = firstEvent ? firstEvent.timeRange.start : new Date(Date.now() - 172800000).toISOString();
    const eventEnd = firstEvent ? firstEvent.timeRange.end : new Date().toISOString();

    const dummyPosts = [
      {
        id: 'post-1',
        userId: 'mock-user-123',
        userName: 'Demo User',
        userPhotoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
        text: 'Just joined this amazing social network! Looking forward to connecting with everyone.',
        imageURL: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1950&q=80',
        likes: ['user-2', 'user-3'],
        comments: [
          {
            id: 'comment-1',
            userId: 'user-2',
            userName: 'Jane Smith',
            text: 'Welcome to the community!',
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        contextualTags: ['Welcome', 'Introduction'],
        location: generateRandomLocation(defaultLat, defaultLng, 0.5),
        captureTimestamp: generateRandomTimestamp(eventStart, eventEnd)
      },
      {
        id: 'post-2',
        userId: 'mock-user-123',
        userName: 'Demo User',
        userPhotoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
        text: 'Working on a new project using Next.js and Tailwind CSS. The developer experience is amazing!',
        imageURL: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1950&q=80',
        likes: ['user-3'],
        comments: [
          {
            id: 'comment-2',
            userId: 'user-3',
            userName: 'Alex Johnson',
            text: 'Next.js is awesome! What kind of project are you building?',
            createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
          },
          {
            id: 'comment-3',
            userId: 'mock-user-123',
            userName: 'Demo User',
            text: 'A social media platform with real-time features!',
            createdAt: new Date(Date.now() - 21600000).toISOString() // 6 hours ago
          }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        contextualTags: ['Next.js', 'Tailwind', 'WebDev'],
        location: generateRandomLocation(defaultLat, defaultLng, 0.5),
        captureTimestamp: generateRandomTimestamp(eventStart, eventEnd)
      },
      {
        id: 'post-3',
        userId: 'mock-user-123',
        userName: 'Demo User',
        userPhotoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
        text: 'Just finished reading "The Pragmatic Programmer". Highly recommend it to all developers!',
        imageURL: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
        likes: ['user-2', 'user-4', 'user-5'],
        comments: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        contextualTags: ['Books', 'Programming', 'Learning'],
        location: generateRandomLocation(defaultLat, defaultLng, 0.5),
        captureTimestamp: generateRandomTimestamp(eventStart, eventEnd)
      },
      {
        id: 'post-4',
        userId: 'mock-user-123',
        userName: 'Demo User',
        userPhotoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
        text: 'Amazing performance at the Summer Music Festival! The energy was incredible!',
        imageURL: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80',
        likes: ['user-1', 'user-2'],
        comments: [
          {
            id: 'comment-4',
            userId: 'user-1',
            userName: 'Alex Johnson',
            text: 'Wish I could have been there!',
            createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
          }
        ],
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        contextualTags: ['Music', 'Festival', 'Live'],
        location: generateRandomLocation(defaultLat, defaultLng, 0.5),
        captureTimestamp: generateRandomTimestamp(eventStart, eventEnd)
      }
    ];

    // Add event data to posts if available
    if (firstEvent) {
      dummyPosts.forEach(post => {
        (post as any).eventId = firstEvent.id;
        (post as any).eventName = firstEvent.name;
      });
    }

    // Add more posts with location data for the heatmap
    for (let i = 0; i < 15; i++) {
      const postId = `post-${i + 5}`; // Start from 5 to avoid conflicts
      const timestamp = generateRandomTimestamp(eventStart, eventEnd);
      
      const post: any = {
        id: postId,
        userId: 'mock-user-123',
        userName: 'Demo User',
        userPhotoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
        text: `Post ${i + 5} with location data for heatmap testing`,
        imageURL: i % 2 === 0 ? `https://picsum.photos/seed/${postId}/800/600` : undefined,
        likes: [],
        comments: [],
        createdAt: timestamp,
        captureTimestamp: timestamp,
        contextualTags: ['Heatmap', 'Test'],
        location: generateRandomLocation(defaultLat, defaultLng, 1)
      };
      
      // Add event data if available
      if (firstEvent) {
        (post as any).eventId = firstEvent.id;
        (post as any).eventName = firstEvent.name;
      }
      
      dummyPosts.push(post);
    }

    // Save to localStorage
    localStorage.setItem('mockPosts', JSON.stringify(dummyPosts));
    console.log('Dummy data initialized successfully with', dummyPosts.length, 'posts');
    return dummyPosts;
  } catch (error) {
    console.error('Error initializing dummy data:', error);
    return [];
  }
};

// Authentication functions
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return { success: false, error };
  }
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return { success: false, error };
  }
};

export const getDocuments = async (collectionName: string, filters?: { field: string, operator: string, value: any }[]) => {
  try {
    let q;
    if (filters && filters.length > 0) {
      q = query(
        collection(db, collectionName),
        ...filters.map(filter => where(filter.field, filter.operator as any, filter.value))
      );
    } else {
      q = collection(db, collectionName);
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    // Fallback to mock data if Firebase fails
    if (collectionName === 'posts') {
      if (mockPosts.length === 0) {
        initializeDummyData();
        mockPosts = JSON.parse(localStorage.getItem('mockPosts') || '[]');
      }
      return mockPosts;
    } else if (collectionName === 'events') {
      if (mockEvents.length === 0) {
        mockEvents = initializeDummyEvents();
      }
      return mockEvents;
    }
    return [];
  }
};

export const getDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`No document found with id ${id} in ${collectionName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return null;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return { success: false, error };
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    return { success: false, error };
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  console.log(`Starting uploadFile for ${file.name} (${file.size} bytes) to path: ${path}`);
  
  try {
    // Create a FormData object for the file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    console.log('Sending request to Firebase proxy API');
    
    // Send the request to our proxy API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch('/api/firebase-proxy', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      console.log(`Response status: ${response.status}, Response text:`, responseText);
      
      // Parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Invalid response format: ${responseText}`);
      }
      
      // Check if the request was successful
      if (!response.ok) {
        console.error('Upload failed with status:', response.status, result);
        
        // Create a detailed error message
        let errorMessage = result.error || `Upload failed with status: ${response.status}`;
        if (result.details) {
          errorMessage += ` - ${result.details}`;
        }
        if (result.code) {
          errorMessage += ` (${result.code})`;
        }
        
        const error = new Error(errorMessage);
        // @ts-ignore - Add additional properties to the error
        error.status = response.status;
        // @ts-ignore
        error.code = result.code;
        // @ts-ignore
        error.details = result.details;
        // @ts-ignore
        error.serverResponse = result.serverResponse;
        
        throw error;
      }
      
      // Check if the result indicates success
      if (result.success && result.url) {
        console.log('Upload successful, URL:', result.url);
        return result.url;
      } else {
        console.error('Upload failed:', result);
        throw new Error(result.error || 'Upload failed with unknown error');
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Upload request timed out');
        throw new Error('Upload request timed out. Please try again.');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// User profile functions
export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'userProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      // Create a default profile if it doesn't exist
      const defaultProfile = {
        coverPhoto: '',
        bio: '',
        location: '',
        website: '',
        joinedDate: new Date().toISOString(),
      };
      
      await setDoc(docRef, defaultProfile);
      return { success: true, data: defaultProfile };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const docRef = doc(db, 'userProfiles', userId);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};
