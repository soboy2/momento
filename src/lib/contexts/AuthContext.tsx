"use client";

import React, { createContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
// Commenting out Firebase imports for now
// import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
// import { User } from "firebase/auth";
// import { auth } from "../firebase/firebase";

// Mock User type
interface MockUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create a default mock user
const defaultMockUser: MockUser = {
  uid: 'mock-user-123',
  displayName: 'Demo User',
  email: 'demo@example.com',
  photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random&size=128',
};

const AuthContext = createContext<AuthContextType>({
  user: defaultMockUser,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for auth cookie on initial load
  useEffect(() => {
    const authCookie = Cookies.get('auth');
    if (authCookie) {
      setUser(defaultMockUser);
    }
    setLoading(false);
  }, []);
  
  const signInWithGoogle = async () => {
    setUser(defaultMockUser);
    // Set auth cookie with 7 days expiry
    Cookies.set('auth', 'authenticated', { expires: 7 });
  };

  const signOutUser = async () => {
    // Remove auth cookie
    Cookies.remove('auth');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
