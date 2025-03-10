"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import Cookies from 'js-cookie';
import { onAuthStateChanged, User, getRedirectResult, browserPopupRedirectResolver } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { signInWithGoogle as firebaseSignInWithGoogle, logoutUser as firebaseSignOut } from "../firebase/firebaseUtils";
import { toast } from 'react-hot-toast';

// Mock user for bypassing authentication
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString()
  },
  providerData: [{
    providerId: 'google.com',
    uid: 'mock-user-123',
    displayName: 'Demo User',
    email: 'demo@example.com',
    phoneNumber: null,
    photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128'
  }],
  // Add required methods to satisfy the User interface
  delete: async () => Promise.resolve(),
  getIdToken: async () => Promise.resolve('mock-token'),
  getIdTokenResult: async () => Promise.resolve({
    token: 'mock-token',
    signInProvider: 'google.com',
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    issuedAtTime: new Date().toISOString(),
    authTime: new Date().toISOString(),
    claims: {}
  }),
  reload: async () => Promise.resolve(),
  toJSON: () => ({})
} as unknown as User;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  isRedirecting: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  authError: null,
  isRedirecting: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // TEMPORARY: Initialize with mock user instead of null
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false); // Set loading to false immediately
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // TEMPORARY: Set auth cookie on mount to bypass authentication checks
  useEffect(() => {
    Cookies.set('auth', 'authenticated', { expires: 7 });
    
    // Return cleanup function
    return () => {
      // No cleanup needed for temporary mock
    };
  }, []);

  /* ORIGINAL AUTH CODE - COMMENTED OUT TEMPORARILY
  useEffect(() => {
    let isMounted = true;
    
    const checkRedirectResult = async () => {
      try {
        // Check if we're returning from a redirect sign-in
        const result = await getRedirectResult(auth, browserPopupRedirectResolver);
        
        if (result && isMounted) {
          // User successfully signed in with redirect
          setUser(result.user);
          Cookies.set('auth', 'authenticated', { expires: 7 });
          setAuthError(null);
          toast.success('Successfully signed in!');
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        console.error("Error getting redirect result:", error);
        if (error.code === 'auth/unauthorized-domain') {
          setAuthError(`This domain is not authorized for Firebase authentication. Please add it to your Firebase console.`);
          toast.error('Authentication failed: Unauthorized domain');
        } else if (error.code !== 'auth/popup-closed-by-user') {
          // Don't show error for popup-closed-by-user as it's expected
          setAuthError(error.message || 'Authentication failed');
          toast.error('Authentication failed. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkRedirectResult();
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (!isMounted) return;
      
      if (authUser) {
        setUser(authUser);
        // Set auth cookie with 7 days expiry
        Cookies.set('auth', 'authenticated', { expires: 7 });
        // Clear any auth errors when successfully signed in
        setAuthError(null);
      } else {
        setUser(null);
        // Remove auth cookie
        Cookies.remove('auth');
      }
      setLoading(false);
    }, (error) => {
      if (!isMounted) return;
      
      console.error("Auth state change error:", error);
      setAuthError(error.message);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  */
  
  // TEMPORARY: Mock sign-in function that always succeeds
  const signInWithGoogle = useCallback(async () => {
    try {
      // Set mock user and auth cookie
      setUser(MOCK_USER);
      Cookies.set('auth', 'authenticated', { expires: 7 });
      toast.success('Successfully signed in as Demo User!');
      return Promise.resolve();
    } catch (error: any) {
      console.error("Mock sign-in error:", error);
      return Promise.reject(error);
    }
  }, []);

  // TEMPORARY: Mock sign-out function
  const signOutUser = useCallback(async () => {
    try {
      // Don't actually sign out, just show a toast
      toast.success('Sign out clicked (but keeping you signed in for demo)');
      return Promise.resolve();
    } catch (error: any) {
      console.error("Mock sign-out error:", error);
      return Promise.reject(error);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user, 
    loading, 
    signInWithGoogle, 
    signOut: signOutUser,
    authError,
    isRedirecting
  }), [user, loading, signInWithGoogle, signOutUser, authError, isRedirecting]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
