"use client";

import React, { createContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { signInWithGoogle as firebaseSignInWithGoogle, logoutUser as firebaseSignOut } from "../firebase/firebaseUtils";
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  authError: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
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
      console.error("Auth state change error:", error);
      setAuthError(error.message);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
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
        } else {
          setAuthError(error.message || 'Authentication failed');
        }
        
        throw error;
      }
    } catch (error: any) {
      // This will catch any other errors that might occur
      console.error("Unexpected error during sign in:", error);
      setAuthError(error.message || 'An unexpected error occurred');
      throw error;
    }
  };

  const signOutUser = async () => {
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
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signOut: signOutUser,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
