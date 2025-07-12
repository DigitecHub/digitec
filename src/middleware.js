import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if the route requires authentication
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/courses/learn') || 
    req.nextUrl.pathname.startsWith('/account') ||
    req.nextUrl.pathname.startsWith('/enrollment');
  
  // If protected route and no session, redirect to sign in
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.pathname;
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('redirect', redirectUrl);
    return NextResponse.redirect(signInUrl);
  }
  
  // If auth routes and already signed in, redirect to dashboard
  if ((req.nextUrl.pathname.startsWith('/auth/signin') || 
      req.nextUrl.pathname.startsWith('/auth/signup')) && 
      session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return res;
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/courses/learn/:path*',
    '/account/:path*',
    '/enrollment/:path*',
    '/auth/signin',
    '/auth/signup'
  ],
}; 