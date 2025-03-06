'use client';

import Navigation from '../../components/Navigation';
import { AuthProvider } from '../../lib/contexts/AuthContext';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="pb-20 max-w-screen-md mx-auto">
        {children}
        <Navigation />
      </div>
    </AuthProvider>
  );
} 