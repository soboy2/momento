"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const handleSignIn = useCallback(async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Success is handled by the AuthContext which will redirect
    } catch (error: any) {
      console.error("Error signing in:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized for authentication. Please contact the administrator.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in popup was closed before completing the sign-in process.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This is a normal case when user clicks multiple times, no need to show error
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup was blocked by the browser. Please allow popups for this site.');
      } else {
        toast.error('Failed to sign in. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [signInWithGoogle, isLoading]);

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out disabled:opacity-70"
      type="button"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 48 48" 
          width="24" 
          height="24" 
          className="mr-2"
        >
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
      )}
      Sign in with Google
    </button>
  );
}
