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
     * - client/ (direct route — no rewrite needed)
     * - editor/ (direct route — no rewrite needed)
     * - images, fonts, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|client/|editor/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Prevent infinite rewrite loops on Cloudflare Pages
  if (url.pathname.startsWith('/portal')) {
    return NextResponse.next();
  }
  
  // FilePilot portal rewrite
  // Only rewrites /login, /dashboard, etc. — NOT /client/* or /editor/* (those are direct routes now)
  const path = url.pathname === '/' ? '/login' : url.pathname;
  return NextResponse.rewrite(new URL(`/portal${path}`, req.url));
}
