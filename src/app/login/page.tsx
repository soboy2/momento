'use client';

import { useAuth } from '../../lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SignInWithGoogle from '../../components/SignInWithGoogle';
import { AuthProvider } from '../../lib/contexts/AuthContext';

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginContent />
    </AuthProvider>
  );
}

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in to continue to Social Media App</p>
        </div>
        
        <div className="mt-8 space-y-6">
          <SignInWithGoogle />
          
          <p className="mt-4 text-sm text-center text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
} 