"use client";

import React, { createContext, useEffect, useState } from "react";
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
  const [user, setUser] = useState<MockUser | null>(defaultMockUser);
  const [loading, setLoading] = useState(false);

  // No need to check localStorage since we're always using the default user
  
  const signInWithGoogle = async () => {
    setUser(defaultMockUser);
  };

  const signOutUser = async () => {
    // Instead of signing out, just reset to the default user
    setUser(defaultMockUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
