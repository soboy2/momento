"use client";

import React, { createContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { signInWithGoogle as firebaseSignInWithGoogle, logoutUser as firebaseSignOut } from "../firebase/firebaseUtils";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Set auth cookie with 7 days expiry
        Cookies.set('auth', 'authenticated', { expires: 7 });
      } else {
        setUser(null);
        // Remove auth cookie
        Cookies.remove('auth');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  const signInWithGoogle = async () => {
    try {
      await firebaseSignInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut();
      // Remove auth cookie
      Cookies.remove('auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
