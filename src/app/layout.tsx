import "./globals.css";
import ToasterProvider from "../components/ToasterProvider";
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
        <ToasterProvider />
      </body>
    </html>
  );
}
