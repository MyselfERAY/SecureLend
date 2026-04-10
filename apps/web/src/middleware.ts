import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes — redirect to login if no access token cookie exists
  // Note: accessToken is in memory only, but we check for the refresh token cookie
  // as a proxy for "user has an active session"
  if (pathname.startsWith('/dashboard')) {
    const hasSession = request.cookies.has('__rt');
    if (!hasSession) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
