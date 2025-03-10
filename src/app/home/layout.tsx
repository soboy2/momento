'use client';

import Navigation from '../../components/Navigation';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-20 max-w-screen-md mx-auto">
      {children}
      <Navigation />
    </div>
  );
} 