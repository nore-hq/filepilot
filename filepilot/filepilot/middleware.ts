import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // FilePilot portal rewrite
  // Since this project only serves the portal, rewrite all requests to /portal
  const path = url.pathname === '/' ? '/login' : url.pathname;
  return NextResponse.rewrite(new URL(`/portal${path}`, req.url));
}
