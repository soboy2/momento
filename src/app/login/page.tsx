'use client';

import { useAuth } from '../../lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SignInWithGoogle from '../../components/SignInWithGoogle';
import { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  return (
    <>
      <LoginContent />
      <Toaster position="bottom-center" />
    </>
  );
}

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
    
    // Check for auth error in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setAuthError(decodeURIComponent(error));
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in to continue to Social Media App</p>
        </div>
        
        {authError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {authError}
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <SignInWithGoogle />
          
          <div className="mt-4 text-sm text-center text-gray-600">
            <p className="mb-2">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
              <p className="font-medium mb-1">Having trouble signing in?</p>
              <p>Make sure you're accessing this app from an authorized domain.</p>
              <p>Current domain: <span className="font-mono">{typeof window !== 'undefined' ? window.location.hostname : ''}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 