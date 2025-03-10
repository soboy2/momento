'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// This component safely uses useSearchParams inside a client component
function EventIdProvider({ children }: { children: (eventId: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  return <>{children(eventId)}</>;
}

// Loading fallback for the Suspense boundary
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-lg">Loading...</span>
    </div>
  );
}

export default function CreatePageWrapper({ 
  children 
}: { 
  children: (eventId: string | null) => React.ReactNode 
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EventIdProvider>
        {children}
      </EventIdProvider>
    </Suspense>
  );
} 