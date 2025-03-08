import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' ||
                       path === '/login' || 
                       path === '/signup' || 
                       path === '/forgot-password' ||
                       path.startsWith('/api/firebase-proxy') ||
                       path.startsWith('/firebase-storage');

  // Check if the user is authenticated
  const isAuthenticated = request.cookies.has('auth');

  // If the path is not public and the user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the path is login and the user is authenticated, redirect to home
  if (path === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - firebase-storage (Firebase Storage proxy)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|firebase-storage).*)',
  ],
}; 