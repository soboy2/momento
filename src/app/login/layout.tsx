'use client';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-screen-md mx-auto">
      {children}
    </div>
  );
} 