'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Login and client pages get NO header — they are full-bleed
  // When middleware rewrites /?filepilot=true to /portal/login, usePathname()
  // may return the original path '/' or the rewritten path '/portal/login'
  const isLoginPage = pathname === '/' || pathname?.includes('/login');
  const isClientPage = pathname?.includes('/client/');
  const showHeader = !isLoginPage && !isClientPage;

  return (
    <div className="min-h-screen bg-parchment flex flex-col" style={{ cursor: 'auto' }}>
      {/* Dashboard Header — only on editor workspace pages */}
      {showHeader && (
        <header className="bg-noir border-b border-parchment/10 py-5 px-8 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-2xl font-black uppercase tracking-tighter text-parchment">
                File<span className="text-tarantino italic">Pilot</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-parchment/30">
                by Nore
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-[10px] uppercase tracking-[0.25em] font-bold text-parchment/40">
                Editor Workspace
              </span>
              <div className="hidden md:block w-px h-4 bg-parchment/10" />
              <button 
                onClick={async () => {
                  const { createClient } = await import('@supabase/supabase-js');
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                  );
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-tarantino/70 hover:text-tarantino transition-colors duration-300"
                style={{ cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Dashboard Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
