'use client';

import { AuthProvider } from '../../lib/contexts/AuthContext';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="max-w-screen-md mx-auto">
        {children}
      </div>
    </AuthProvider>
  );
} 