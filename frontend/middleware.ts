import { NextRequest, NextResponse } from 'next/server';

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('breezy_access')?.value;

  // Auth Route Handlers handle their own logic — let them through as-is
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // For all other API calls: inject Authorization header so the gateway receives it
  if (pathname.startsWith('/api/')) {
    if (!accessToken) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const headers = new Headers(req.headers);
    headers.set('authorization', `Bearer ${accessToken}`);
    return NextResponse.next({ request: { headers } });
  }

  // Page route protection
  const isAuthPage = pathname.startsWith('/auth');

  if (!isAuthPage && !accessToken) {
    return NextResponse.redirect(new URL('/auth', req.nextUrl));
  }

  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Excludes Next.js internals, static assets, and locale JSON from middleware
  matcher: ['/((?!_next/static|_next/image|favicon.ico|locales|.*\\.png$).*)'],
};
