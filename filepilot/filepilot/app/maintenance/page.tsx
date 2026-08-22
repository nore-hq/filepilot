import React from 'react';

const circuitSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,320 L320,400' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.08)'/%3E%3C/svg%3E")`;

const CP = 'polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundImage: circuitSvg }}>
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tarantino/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-noir/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-6 md:p-0">
        <div style={{ padding: '1.5px', clipPath: CP, background: 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.3), rgba(160,160,160,0.45))' }} className="shadow-2xl">
          <div style={{ clipPath: CP, background: 'rgba(241,239,231,0.98)' }} className="p-12 md:p-20 flex flex-col items-center text-center max-w-2xl backdrop-blur-md">
            
            <div className="w-20 h-20 bg-noir rounded-xl flex items-center justify-center mb-8 relative" style={{ boxShadow: '0 0 30px rgba(255,79,0,0.3)' }}>
              <div className="absolute inset-0 border-2 border-tarantino rounded-xl animate-ping opacity-20" />
              <svg className="w-10 h-10 text-tarantino animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75m4.215 9.423c1.033.09 2.062.246 3.075.467M12 18v-2.25m0 0v-2.25m0 2.25h2.25M12 15.75H9.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 0v2.25m0-2.25h2.25M12 11.25H9.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tighter text-noir mb-4 leading-none">
              System <span className="text-tarantino italic">Maintenance</span>
            </h1>
            
            <div className="w-16 h-1 bg-tarantino mb-6" />

            <p className="text-sm md:text-base font-bold text-noir/60 uppercase tracking-widest max-w-md leading-relaxed">
              We are currently performing scheduled maintenance to improve our systems. We will be back in a minute.
            </p>

            <div className="mt-10 px-6 py-3 bg-noir/5 border border-noir/10 w-full" style={{ clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-noir/40 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tarantino animate-pulse" />
                Systems Offline
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
