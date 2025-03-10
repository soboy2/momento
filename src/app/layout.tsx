'use client';

import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthWrapper from "../components/AuthWrapper";

export const metadata = {
  title: "Social Media App",
  description: "A social media application built with Next.js and Firebase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
