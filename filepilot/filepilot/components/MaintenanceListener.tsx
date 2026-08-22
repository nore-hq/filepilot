'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MaintenanceListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMasterAdmin = false;
    
    // Check initial user status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === 'adminmaster@norehq.com') {
        isMasterAdmin = true;
      }
    });

    // Subscribe to realtime updates on app_settings table
    const channel = supabase
      .channel('public:app_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        async (payload) => {
          const newMaintenanceMode = payload.new.maintenance_mode;
          
          if (newMaintenanceMode && !isMasterAdmin && pathname !== '/maintenance') {
            console.log('Maintenance mode activated! Forcing logout...');
            await supabase.auth.signOut();
            router.push('/maintenance');
          } else if (!newMaintenanceMode && pathname === '/maintenance') {
            console.log('Maintenance mode disabled! Recovering...');
            router.push('/portal/login');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return null; // This component doesn't render anything
}
