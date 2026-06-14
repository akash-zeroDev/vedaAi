import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isOnboardingPage = req.nextUrl.pathname.startsWith('/onboarding');
    
    if (isAuth) {
      if (isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      const needsOnboarding = !token.isOnboarded || !token.schoolName;
      
      if (needsOnboarding && !isOnboardingPage && !req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }

      if (!needsOnboarding && isOnboardingPage) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith('/dashboard') || path.startsWith('/toolkit') || path.startsWith('/onboarding')) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/toolkit/:path*', '/onboarding', '/auth'],
};
