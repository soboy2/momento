'use client';

import { Suspense } from 'react';
import SignInWithGoogle from './SignInWithGoogle';

// Loading fallback for the Suspense boundary
function SignInButtonLoading() {
  return (
    <button
      disabled
      className="w-full flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 opacity-70"
      type="button"
    >
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
      Loading...
    </button>
  );
}

export default function SignInWithGoogleWrapper() {
  return (
    <Suspense fallback={<SignInButtonLoading />}>
      <SignInWithGoogle />
    </Suspense>
  );
} 