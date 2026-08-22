import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Allow the maintenance page itself
  if (url.pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Allow agency admins to always access the portal so they can turn off maintenance mode
  const isPortal = url.pathname.startsWith('/portal') || url.pathname === '/' || url.pathname === '/login' || url.pathname === '/dashboard';
  
  if (!isPortal) {
    // For /client/* and /editor/* routes, check if maintenance mode is active
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/app_settings?id=eq.1&select=maintenance_mode`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          cache: 'no-store'
        });
        const data = await res.json();
        
        if (data && data[0] && data[0].maintenance_mode === true) {
          return NextResponse.rewrite(new URL('/maintenance', req.url));
        }
      } catch (e) {
        // If DB fetch fails, fail open (allow access)
      }
    }
  }

  // Portal rewrite logic (same as before)
  if (url.pathname.startsWith('/portal')) {
    return NextResponse.next();
  }
  
  if (isPortal) {
    const path = url.pathname === '/' ? '/login' : url.pathname;
    return NextResponse.rewrite(new URL(`/portal${path}`, req.url));
  }

  return NextResponse.next();
}
