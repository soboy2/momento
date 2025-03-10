"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import Cookies from 'js-cookie';
import { onAuthStateChanged, User, getRedirectResult, browserPopupRedirectResolver } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { signInWithGoogle as firebaseSignInWithGoogle, logoutUser as firebaseSignOut } from "../firebase/firebaseUtils";
import { toast } from 'react-hot-toast';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for redirect result when the component mounts
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
  
  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      setIsRedirecting(true);
      const result = await firebaseSignInWithGoogle();
      
      if (!result.success) {
        const error = result.error;
        console.error("Error signing in with Google:", error);
        
        // Set the error message
        if (error.code === 'auth/unauthorized-domain') {
          const domain = window.location.hostname;
          setAuthError(`This domain (${domain}) is not authorized for Firebase authentication. Please add it to your Firebase console.`);
          
          // Redirect to login page with error
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?error=${encodeURIComponent('Authentication failed: Unauthorized domain')}`;
          }
        } else if (error.code === 'auth/popup-closed-by-user') {
          // This is a normal case, just show a gentle reminder
          toast.error('Sign-in popup was closed before completing the sign-in process.');
        } else if (error.code === 'auth/popup-blocked') {
          toast.error('Sign-in popup was blocked by the browser. Please allow popups for this site.');
        } else {
          setAuthError(error.message || 'Authentication failed');
        }
        
        throw error;
      }
      
      // If we're redirecting, show a loading message
      if (result.redirecting) {
        toast.loading('Redirecting to Google sign-in...');
      }
    } catch (error: any) {
      // This will catch any other errors that might occur
      console.error("Unexpected error during sign in:", error);
      setAuthError(error.message || 'An unexpected error occurred');
      throw error;
    } finally {
      setIsRedirecting(false);
    }
  }, []);

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut();
      // Remove auth cookie
      Cookies.remove('auth');
      // Clear any auth errors
      setAuthError(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error('Failed to sign out. Please try again.');
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
