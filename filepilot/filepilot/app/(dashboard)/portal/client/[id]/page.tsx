'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Project = { id: string; client_name: string; video_title: string; progress: number; delivery_link: string | null; };
type Message = { id: number; project_id: string; sender_role: 'editor' | 'client'; message_text: string; created_at: string; };

/* ─── Cyberpunk beveled frame ─── */
const CP = 'polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))';

function CyberFrame({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className="relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ─── Circuit SVG background ─── */
const circuitSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,320 L320,400' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M140,180 L140,300' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='200' cy='300' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='320' cy='220' r='3' fill='rgba(255,79,0,0.08)'/%3E%3C/svg%3E")`;

const darkCircuitSvg = `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,60 L70,60 L70,40 L130,40 L130,60 L300,60' stroke='rgba(255,79,0,0.12)' fill='none' stroke-width='0.6'/%3E%3Cpath d='M0,160 L50,160 L50,140 L110,140 L110,160 L200,160 L200,180 L300,180' stroke='rgba(255,79,0,0.12)' fill='none' stroke-width='0.6'/%3E%3Cpath d='M0,260 L90,260 L90,240 L160,240 L160,260 L300,260' stroke='rgba(255,79,0,0.12)' fill='none' stroke-width='0.6'/%3E%3Cpath d='M70,0 L70,40' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.6'/%3E%3Cpath d='M200,0 L200,60 L200,160' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.6'/%3E%3Ccircle cx='70' cy='60' r='2' fill='rgba(255,79,0,0.15)'/%3E%3Ccircle cx='130' cy='40' r='2' fill='rgba(255,79,0,0.15)'/%3E%3Ccircle cx='110' cy='140' r='2' fill='rgba(255,79,0,0.15)'/%3E%3Ccircle cx='200' cy='160' r='2' fill='rgba(255,79,0,0.15)'/%3E%3Ccircle cx='90' cy='260' r='2' fill='rgba(255,79,0,0.15)'/%3E%3C/svg%3E")`;

export default function ClientDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [projectId, setProjectId] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => { params.then((p) => setProjectId(p.id)); }, [params]);

  useEffect(() => {
    if (!projectId) return;
    setMounted(true);
    fetchProject();
    fetchMessages();
    const projectChannel = supabase.channel(`project-${projectId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, (payload) => setProject(payload.new as Project)).subscribe();
    
    const connectWs = async () => {
      let { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Failed to sign in anonymously:', error);
          return;
        }
        session = anonData.session;
      }
      
      if (!session) return;

      const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:8787';
      const ws = new WebSocket(`${WS_URL}/chat/${projectId}?token=${session.access_token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          setMessages((prev) => [...prev, {
            id: Date.now(),
            project_id: projectId,
            sender_role: payload.sender_role,
            message_text: payload.content,
            created_at: payload.timestamp
          } as Message]);
        }
      };
    };

    connectWs();

    return () => { 
      supabase.removeChannel(projectChannel); 
      if (wsRef.current) wsRef.current.close();
    };
  }, [projectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchProject = async () => { setLoading(true); const { data } = await supabase.from('projects').select('*').eq('id', projectId).single(); if (data) setProject(data); setLoading(false); };
  const fetchMessages = async () => { const { data } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }); if (data) setMessages(data); };
  const sendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!chatInput.trim()) return; const newMsg = { project_id: projectId, sender_role: 'client' as const, message_text: chatInput.trim() }; if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) { wsRef.current.send(JSON.stringify(newMsg)); setMessages(prev => [...prev, { ...newMsg, id: Date.now(), created_at: new Date().toISOString() }]); } setChatInput(''); };
  const manualSync = () => { router.refresh(); fetchProject(); fetchMessages(); };

  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center" style={{ cursor: 'auto', backgroundImage: circuitSvg }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-noir rounded-xl flex items-center justify-center" style={{ animation: 'pulse 2s infinite', boxShadow: '0 0 20px rgba(255,79,0,0.3)' }}>
          <svg className="w-7 h-7 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-noir/30">Loading Workspace...</span>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center" style={{ cursor: 'auto', backgroundImage: circuitSvg }}>
      <CyberFrame><div className="p-12 text-center"><h2 className="font-heading text-3xl font-black uppercase tracking-tight text-noir mb-2">Project Not Found</h2><p className="text-noir/40 text-sm font-medium">This link may be invalid or the project has been removed.</p></div></CyberFrame>
    </div>
  );

  const progressLabel = project.progress === 100 ? 'Complete' : project.progress >= 75 ? 'Final Review' : project.progress >= 50 ? 'Post-Production' : project.progress >= 25 ? 'In Progress' : 'Getting Started';

  return (
    <div className="min-h-screen bg-parchment relative" style={{ cursor: 'auto', backgroundImage: circuitSvg }}>
      {/* ─── Header ─── */}
      <header className="bg-noir py-4 px-6 md:px-10 sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,79,0,0.15)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-xl font-black uppercase tracking-tighter text-parchment">File<span className="text-tarantino italic">Pilot</span></span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-parchment/25">Client Portal</span>
          </div>
          <button onClick={manualSync} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-parchment/50 hover:text-tarantino px-4 py-2 transition-all duration-300" style={{ cursor: 'pointer', border: '1px solid rgba(255,79,0,0.25)', borderRadius: '4px', clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" /></svg>
            Sync
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        {/* ─── Welcome ─── */}
        <div className={`mb-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-tarantino mb-2">Your Workspace</p>
          <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tighter text-noir leading-none">Welcome, <span className="text-tarantino italic">{project.client_name}</span></h1>
          <p className="text-noir/40 text-sm font-medium mt-3">Project: {project.video_title}</p>
        </div>

        {/* ─── Bento Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ══ Progress Card ══ */}
          <CyberFrame className={`lg:col-span-2 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="p-8 relative">
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-tarantino/25" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-tarantino/25" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-tarantino/25" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-tarantino/25" />

              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir">Project <span className="text-tarantino italic">Status</span></h2>
                  <p className="text-noir/40 text-sm font-medium mt-1">Real-time progress tracking</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-noir bg-tarantino px-3 py-1.5" style={{ clipPath: 'polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))' }}>{progressLabel}</span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/40">Completion</span>
                  <span className="font-heading text-5xl font-black text-tarantino leading-none">{project.progress}<span className="text-lg">%</span></span>
                </div>
                <div className="relative h-3 w-full overflow-hidden" style={{ background: 'rgba(26,26,26,0.06)', clipPath: 'polygon(0 2px, 2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px))' }}>
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-tarantino to-tarantino/80 transition-all duration-1000 ease-out" style={{ width: `${project.progress}%`, boxShadow: '0 0 12px rgba(255,79,0,0.6), 0 0 25px rgba(255,79,0,0.3), 0 0 50px rgba(255,79,0,0.15)' }} />
                  {project.progress > 0 && project.progress < 100 && <div className="absolute top-0 h-full w-8 bg-tarantino/40 blur-lg transition-all duration-1000 ease-out" style={{ left: `calc(${project.progress}% - 16px)` }} />}
                </div>
                {/* Milestone dots */}
                <div className="relative mt-1 h-2">
                  {[0, 25, 50, 75, 100].map((m) => (
                    <div key={m} className="absolute top-0 w-1.5 h-1.5 rounded-full -translate-x-1/2 transition-colors duration-500" style={{ left: `${m}%`, background: project.progress >= m ? '#FF4F00' : 'rgba(26,26,26,0.1)', boxShadow: project.progress >= m ? '0 0 6px rgba(255,79,0,0.5)' : 'none' }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {['Start', '25%', '50%', '75%', 'Done'].map((label, i) => (
                    <span key={label} className={`text-[9px] uppercase tracking-wider font-bold ${project.progress >= i * 25 ? 'text-tarantino/70' : 'text-noir/15'}`}>{label}</span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,79,0,0.1)' }}>
                <p className="text-noir/40 text-sm font-medium">{project.progress === 100 ? '🎉 Your project is complete and ready for review!' : 'Your editor is actively working on this project. The progress bar updates in real-time.'}</p>
              </div>
            </div>
          </CyberFrame>

          {/* ══ Deliverables Card ══ */}
          <CyberFrame dark className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="p-8 flex flex-col justify-between h-full relative" style={{ backgroundImage: darkCircuitSvg }}>
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-tarantino/30" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-tarantino/30" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-tarantino/30" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-tarantino/30" />

              <div>
                <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.25)', clipPath: 'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                  <svg className="w-6 h-6 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </div>
                <h3 className="font-heading text-xl font-black uppercase tracking-tight text-parchment mb-2">Your <span className="text-tarantino italic">Deliverables</span></h3>
                <p className="text-parchment/30 text-sm font-medium">{project.delivery_link ? 'Your files are ready. Access them using the button below.' : 'Deliverables will appear here once your editor uploads them.'}</p>
              </div>

              {project.delivery_link ? (
                <div className="mt-8">
                  <div className="px-4 py-3 mb-4 text-sm text-parchment/60 font-medium overflow-hidden text-ellipsis whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,79,0,0.15)', clipPath: 'polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))' }}>{project.delivery_link}</div>
                  <a href={project.delivery_link} target="_blank" rel="noreferrer" className="block bg-tarantino text-noir font-black uppercase text-xs tracking-[0.15em] px-6 py-4 text-center hover:brightness-110 transition-all duration-300" style={{ cursor: 'pointer', clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))', boxShadow: '0 0 15px rgba(255,79,0,0.3)' }}>Access Deliverables →</a>
                </div>
              ) : (
                <div className="mt-8 text-center py-4" style={{ border: '1px solid rgba(241,239,231,0.08)' }}>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-parchment/20">Pending Upload</span>
                </div>
              )}
            </div>
          </CyberFrame>

          {/* ══ Chat Card ══ */}
          <CyberFrame className={`lg:col-span-3 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="flex flex-col" style={{ height: '420px' }}>
              {/* Chat Header */}
              <div className="px-8 py-4 flex justify-between items-center shrink-0 bg-noir" style={{ borderBottom: '1px solid rgba(255,79,0,0.15)' }}>
                <div className="flex items-center gap-3">
                  <h3 className="font-heading text-base font-black uppercase tracking-tight text-parchment">Project <span className="text-tarantino italic">Chat</span></h3>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-green-500/60">Live</span>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3">
                {messages.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-[10px] uppercase tracking-[0.2em] font-bold text-noir/15 text-center">No messages yet. Send a message to your editor below.</p></div>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_role === 'client' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-5 py-3 text-sm font-medium ${msg.sender_role === 'client' ? 'text-noir' : 'text-noir/70'}`} style={{ background: msg.sender_role === 'client' ? 'rgba(255,79,0,0.08)' : 'rgba(26,26,26,0.04)', border: `1px solid ${msg.sender_role === 'client' ? 'rgba(255,79,0,0.2)' : 'rgba(26,26,26,0.08)'}`, clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                      <p>{msg.message_text}</p>
                      <span className="text-[9px] uppercase tracking-wider text-noir/25 mt-1.5 block">{msg.sender_role === 'client' ? 'You' : 'Editor'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <form onSubmit={sendMessage} className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid rgba(255,79,0,0.1)' }}>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message to your editor..." className="flex-1 bg-noir/[0.04] text-noir text-sm px-5 py-3 font-medium placeholder:text-noir/20 focus:outline-none transition-colors" style={{ cursor: 'text', border: '1px solid rgba(26,26,26,0.08)', clipPath: 'polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))' }} />
                <button type="submit" className="bg-tarantino text-noir px-5 py-3 font-black uppercase text-xs tracking-[0.1em] hover:brightness-110 transition-colors flex items-center gap-2" style={{ cursor: 'pointer', clipPath: 'polygon(0 3px, 3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))', boxShadow: '0 0 10px rgba(255,79,0,0.25)' }}>
                  Send <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                </button>
              </form>
            </div>
          </CyberFrame>
        </div>
      </div>
    </div>
  );
}
