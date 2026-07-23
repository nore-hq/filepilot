'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Animated circuit-board background canvas ───
function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const init = () => {
      resize();
      nodes.length = 0;
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 18000);
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const draw = () => {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > cw) n.vx *= -1;
        if (n.y < 0 || n.y > ch) n.vy *= -1;
      }

      // Draw connections
      const maxDist = 120;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(255, 79, 0, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(255, 79, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}

// ─── Animated Glowing Grid Lines (CSS) ───
function GridOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 w-full h-px"
          style={{
            top: `${(i + 1) * 12}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,79,0,0.06) 20%, rgba(255,79,0,0.06) 80%, transparent 100%)`,
          }}
        />
      ))}
      {/* Vertical lines */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 h-full w-px"
          style={{
            left: `${(i + 1) * 8}%`,
            background: `linear-gradient(180deg, transparent 0%, rgba(255,79,0,0.04) 30%, rgba(255,79,0,0.04) 70%, transparent 100%)`,
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    setIsLoading(false);

    if (!result.error) {
      if (isSignUp) {
        setErrorMsg('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        router.push(`/dashboard${window.location.search}`);
      }
    } else {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden" style={{ cursor: 'auto' }}>
      {/* ═══ LEFT SIDE — Dark cinematic login panel ═══ */}
      <div className="relative z-10 w-full lg:w-[48%] min-h-screen flex flex-col justify-center bg-noir px-8 md:px-16 lg:px-20">
        {/* Subtle grain overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Tarantino accent line at top */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-tarantino via-tarantino/60 to-transparent" />

        {/* Content */}
        <div
          className={`relative z-10 max-w-md mx-auto w-full transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Brand */}
          <div className="mb-12">
            <h1 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tighter text-parchment leading-none">
              File<span className="text-tarantino italic">Pilot</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.35em] font-bold text-parchment/40 mt-2">
              by Nore
            </p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-tight text-parchment leading-tight">
              {isSignUp ? 'Create' : 'Login to'}{' '}
              <span className="text-tarantino">Your Portal</span>
            </h2>
            <p className="text-parchment/40 text-sm font-medium mt-2">
              {isSignUp
                ? 'Set up your editor credentials to get started.'
                : 'Access your client dashboards and project workspace.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className={`mb-4 px-4 py-3 text-sm font-medium rounded-lg border ${
              errorMsg.includes('created') || errorMsg.includes('success')
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-parchment/50 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-parchment/10 text-parchment px-5 py-3.5 text-sm font-medium placeholder:text-parchment/20 focus:outline-none focus:border-tarantino/60 focus:bg-white/[0.06] transition-all duration-300 rounded-none"
                style={{ cursor: 'text' }}
                placeholder="editor@norehq.com"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-parchment/50 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-parchment/10 text-parchment px-5 py-3.5 text-sm font-medium placeholder:text-parchment/20 focus:outline-none focus:border-tarantino/60 focus:bg-white/[0.06] transition-all duration-300 rounded-none"
                style={{ cursor: 'text' }}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-tarantino text-noir font-black uppercase text-xs tracking-[0.2em] px-6 py-4 hover:bg-tarantino/90 transition-all duration-300 disabled:opacity-50 mt-2 shadow-[4px_4px_0px_0px_rgba(255,79,0,0)] hover:shadow-[4px_4px_0px_0px_rgba(241,239,231,0.15)]"
              style={{ cursor: 'pointer' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign Up / Sign In Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-xs uppercase tracking-[0.2em] font-bold text-parchment/30 hover:text-tarantino transition-colors duration-300"
              style={{ cursor: 'pointer' }}
            >
              {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-parchment/10" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-parchment/20">or</span>
            <div className="flex-1 h-px bg-parchment/10" />
          </div>

          {/* Google OAuth Placeholder */}
          <button
            className="w-full bg-transparent border border-parchment/10 text-parchment/60 font-bold uppercase text-xs tracking-[0.15em] px-6 py-3.5 hover:border-parchment/25 hover:text-parchment/80 transition-all duration-300 flex items-center justify-center gap-3"
            style={{ cursor: 'pointer' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      {/* ═══ RIGHT SIDE — Parchment with animated circuit network ═══ */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-parchment items-center justify-center overflow-hidden">
        {/* Circuit canvas background */}
        <CircuitCanvas />
        
        {/* Grid overlay */}
        <GridOverlay />

        {/* Large tarantino radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tarantino/8 rounded-full blur-[150px] pointer-events-none" />

        {/* Central branding element */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Animated glowing ring */}
          <div className="relative w-48 h-48 mb-10">
            <div 
              className="absolute inset-0 rounded-full border-2 border-tarantino/20"
              style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}
            />
            <div 
              className="absolute inset-3 rounded-full border border-tarantino/10"
              style={{ animation: 'pulse-ring 3s ease-in-out infinite 0.5s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-noir rounded-2xl flex items-center justify-center shadow-2xl shadow-noir/30">
                <svg className="w-10 h-10 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="font-heading text-4xl font-black uppercase tracking-tighter text-noir leading-none mb-4">
            Secure Client<br />
            <span className="text-tarantino italic">Delivery Portal</span>
          </h2>
          <p className="text-noir/40 font-medium text-sm max-w-xs leading-relaxed">
            Real-time project tracking, file delivery, and seamless client communication — all in one workspace.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Real-Time Updates', 'Secure Links', 'Live Chat'].map((f) => (
              <span
                key={f}
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-noir/50 border border-noir/10 px-4 py-2 bg-white/50 backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
