// Mock Firebase utilities for local development
// import { auth, db, storage } from "./firebase";
// import {
//   signOut,
//   GoogleAuthProvider,
//   signInWithPopup,
// } from "firebase/auth";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   updateDoc,
//   deleteDoc,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Mock data storage
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
        text: 'Amazing performance at the Summer Music Festival! The energy was incredible! ��',
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

// Auth functions
export const logoutUser = async () => {
  localStorage.removeItem('mockUser');
  return Promise.resolve();
};

export const signInWithGoogle = async () => {
  const mockUser = {
    uid: 'mock-user-123',
    displayName: 'Demo User',
    email: 'demo@example.com',
    photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
  };
  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  return mockUser;
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newDoc = { id, ...data };
  
  if (collectionName === 'posts') {
    // Load existing posts from localStorage
    const storedPosts = localStorage.getItem('mockPosts');
    if (storedPosts) {
      mockPosts = JSON.parse(storedPosts);
    }
    
    mockPosts.push(newDoc);
    localStorage.setItem('mockPosts', JSON.stringify(mockPosts));
  } else if (collectionName === 'events') {
    // Load existing events from localStorage
    const storedEvents = localStorage.getItem('mockEvents');
    if (storedEvents) {
      mockEvents = JSON.parse(storedEvents);
    }
    
    mockEvents.push(newDoc);
    localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
  }
  
  return { id };
};

export const getDocuments = async (collectionName: string) => {
  try {
    console.log(`Getting documents from ${collectionName}...`);
    
    if (collectionName === 'posts') {
      // Try to load posts from localStorage first
      const storedPosts = localStorage.getItem('mockPosts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        if (parsedPosts && parsedPosts.length > 0) {
          console.log(`Loaded ${parsedPosts.length} posts from localStorage`);
          return parsedPosts;
        }
      }
      
      // If no posts in localStorage, initialize dummy data
      console.log('No posts found in localStorage, initializing dummy data');
      const posts = initializeDummyData();
      return posts;
    } else if (collectionName === 'events') {
      // Try to load events from localStorage first
      const storedEvents = localStorage.getItem('mockEvents');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (parsedEvents && parsedEvents.length > 0) {
          console.log(`Loaded ${parsedEvents.length} events from localStorage`);
          return parsedEvents;
        }
      }
      
      // If no events in localStorage, initialize dummy events
      console.log('No events found in localStorage, initializing dummy events');
      const events = initializeDummyEvents();
      return events;
    }
    
    return [];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return [];
  }
};

export const getDocument = async (collectionName: string, id: string) => {
  if (collectionName === 'events') {
    // Initialize dummy data if needed
    initializeDummyData();
    
    // Load events from localStorage
    const storedEvents = localStorage.getItem('mockEvents');
    if (storedEvents) {
      const events = JSON.parse(storedEvents);
      return events.find((event: any) => event.id === id) || null;
    }
  } else if (collectionName === 'posts') {
    // Load posts from localStorage
    const storedPosts = localStorage.getItem('mockPosts');
    if (storedPosts) {
      const posts = JSON.parse(storedPosts);
      return posts.find((post: any) => post.id === id) || null;
    }
  }
  return null;
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  if (collectionName === 'posts') {
    // Load existing posts from localStorage
    const storedPosts = localStorage.getItem('mockPosts');
    if (storedPosts) {
      mockPosts = JSON.parse(storedPosts);
      const index = mockPosts.findIndex(post => post.id === id);
      if (index !== -1) {
        mockPosts[index] = { ...mockPosts[index], ...data };
        localStorage.setItem('mockPosts', JSON.stringify(mockPosts));
      }
    }
  } else if (collectionName === 'events') {
    // Load existing events from localStorage
    const storedEvents = localStorage.getItem('mockEvents');
    if (storedEvents) {
      mockEvents = JSON.parse(storedEvents);
      const index = mockEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        mockEvents[index] = { ...mockEvents[index], ...data };
        localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
      }
    }
  }
  return Promise.resolve();
};

export const deleteDocument = async (collectionName: string, id: string) => {
  if (collectionName === 'posts') {
    // Load existing posts from localStorage
    const storedPosts = localStorage.getItem('mockPosts');
    if (storedPosts) {
      mockPosts = JSON.parse(storedPosts);
      mockPosts = mockPosts.filter(post => post.id !== id);
      localStorage.setItem('mockPosts', JSON.stringify(mockPosts));
    }
  } else if (collectionName === 'events') {
    // Load existing events from localStorage
    const storedEvents = localStorage.getItem('mockEvents');
    if (storedEvents) {
      mockEvents = JSON.parse(storedEvents);
      mockEvents = mockEvents.filter(event => event.id !== id);
      localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
    }
  }
  return Promise.resolve();
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      mockStorage[path] = base64data;
      localStorage.setItem('mockStorage', JSON.stringify(mockStorage));
      resolve(base64data);
    };
    reader.readAsDataURL(file);
  });
};
