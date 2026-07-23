'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Project = { id: string; client_name: string; video_title: string; progress: number; delivery_link: string | null; created_at: string; };
type Message = { id: number; project_id: string; sender_role: 'editor' | 'client'; message_text: string; created_at: string; };

const CP = 'polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))';
const CPS = 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))';

function CyberFrame({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className="relative overflow-hidden">{children}</div>
    </div>
  );
}

const circuitBg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,400' stroke='rgba(255,79,0,0.06)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.08)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.08)'/%3E%3C/svg%3E")`;

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); fetchProjects(); }, []);
  useEffect(() => {
    if (!activeChatProjectId) return;
    fetchMessages(activeChatProjectId);
    
    const connectWs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:8787';
      const ws = new WebSocket(`${WS_URL}/chat/${activeChatProjectId}?token=${session.access_token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          setChatMessages((prev) => [...prev, {
            id: Date.now(),
            project_id: activeChatProjectId,
            sender_role: payload.sender_role,
            message_text: payload.content,
            created_at: payload.timestamp
          } as Message]);
        }
      };
    };
    
    connectWs();

    return () => { 
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeChatProjectId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchProjects = async () => { const { data: u } = await supabase.auth.getUser(); if (!u.user) { router.push('/portal/login'); return; } const { data } = await supabase.from('projects').select('*').eq('editor_id', u.user.id).order('created_at', { ascending: false }); if (data) setProjects(data); };
  const fetchMessages = async (pid: string) => { const { data } = await supabase.from('messages').select('*').eq('project_id', pid).order('created_at', { ascending: true }); if (data) setChatMessages(data); };
  const handleCreateProject = async (e: React.FormEvent) => { e.preventDefault(); const { data: u } = await supabase.auth.getUser(); if (!u.user) return; const { data } = await supabase.from('projects').insert([{ client_name: newClientName, video_title: newVideoTitle, editor_id: u.user.id }]).select(); if (data) { setProjects([data[0], ...projects]); setIsModalOpen(false); setNewClientName(''); setNewVideoTitle(''); } };
  const updateProgress = (id: string, v: number) => setProjects(projects.map(p => p.id === id ? { ...p, progress: v } : p));
  const updateDeliveryLink = (id: string, link: string) => setProjects(projects.map(p => p.id === id ? { ...p, delivery_link: link } : p));
  const saveProjectUpdates = async (id: string) => { const p = projects.find(x => x.id === id); if (!p) return; setSavingId(id); await supabase.from('projects').update({ progress: p.progress, delivery_link: p.delivery_link }).eq('id', id); setSavingId(null); };
  const deleteProject = async (id: string) => { if (!window.confirm('Are you sure you want to delete this dashboard?')) return; setProjects(projects.filter(p => p.id !== id)); await supabase.from('projects').delete().eq('id', id); if (activeChatProjectId === id) setActiveChatProjectId(null); };
  const sendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!chatInput.trim() || !activeChatProjectId) return; const newMsg = { project_id: activeChatProjectId, sender_role: 'editor' as const, message_text: chatInput.trim() }; if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) { wsRef.current.send(JSON.stringify(newMsg)); setChatMessages(prev => [...prev, { ...newMsg, id: Date.now(), created_at: new Date().toISOString() }]); } setChatInput(''); };
  const copyClientLink = (pid: string) => { const local = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'); const link = local ? `http://localhost:3000/client/${pid}?filepilot=true` : `https://filepilot.norehq.com/client/${pid}`; navigator.clipboard.writeText(link); setCopiedId(pid); setTimeout(() => setCopiedId(null), 2000); };

  return (
    <div className="min-h-screen bg-parchment" style={{ cursor: 'auto', backgroundImage: circuitBg }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-black uppercase tracking-tighter text-noir leading-none">Your <span className="text-tarantino italic">Projects</span></h1>
            <p className="text-noir/40 text-sm font-medium mt-2">Manage client dashboards, track progress, and communicate in real-time.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-tarantino text-noir font-black uppercase text-xs tracking-[0.15em] px-8 py-4 hover:brightness-110 transition-all duration-300" style={{ cursor: 'pointer', clipPath: CPS, boxShadow: '0 0 15px rgba(255,79,0,0.25)' }}>+ Create Client Dashboard</button>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <CyberFrame className="max-w-md mx-auto">
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 bg-noir flex items-center justify-center mb-6" style={{ clipPath: CPS, boxShadow: '0 0 20px rgba(255,79,0,0.2)' }}>
                <svg className="w-8 h-8 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
              </div>
              <h3 className="font-heading text-xl font-black uppercase tracking-tight text-noir mb-2">No Projects Yet</h3>
              <p className="text-noir/40 text-sm font-medium">Create your first client dashboard to start tracking projects.</p>
            </div>
          </CyberFrame>
        )}

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <CyberFrame key={project.id} className={`transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="p-6 flex flex-col relative" style={{ transitionDelay: `${idx * 80}ms`, minHeight: '340px' }}>
                {/* Corner accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-tarantino/20" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-tarantino/20" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-tarantino/20" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-tarantino/20" />

                {/* Title */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-black uppercase tracking-tight text-noir leading-tight">{project.video_title}</h3>
                      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/30 mt-1">{project.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-[0.15em] font-bold px-2 py-1 whitespace-nowrap ${project.progress === 100 ? 'bg-green-500/10 text-green-600 border border-green-500/20' : project.progress > 0 ? 'bg-tarantino/10 text-tarantino border border-tarantino/20' : 'bg-noir/[0.03] text-noir/30 border border-noir/[0.06]'}`} style={{ clipPath: CPS }}>{project.progress === 100 ? 'Delivered' : project.progress > 0 ? 'In Progress' : 'Not Started'}</span>
                      <button onClick={() => deleteProject(project.id)} className="text-red-500/40 hover:text-red-500 transition-colors" style={{ cursor: 'pointer' }} title="Delete Dashboard">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/40">Progress</span>
                    <span className="text-sm font-black text-tarantino">{project.progress}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden" style={{ background: 'rgba(26,26,26,0.06)', clipPath: CPS }}>
                    <div className="absolute top-0 left-0 h-full bg-tarantino transition-all duration-500 ease-out" style={{ width: `${project.progress}%`, boxShadow: '0 0 8px rgba(255,79,0,0.5), 0 0 16px rgba(255,79,0,0.2)' }} />
                  </div>
                  <input type="range" min="0" max="100" value={project.progress} onChange={(e) => updateProgress(project.id, parseInt(e.target.value))} className="w-full mt-2 accent-tarantino h-1 opacity-60 hover:opacity-100 transition-opacity" style={{ cursor: 'pointer' }} />
                </div>

                {/* Delivery URL */}
                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/40 block mb-2">Delivery URL</label>
                  <input type="url" value={project.delivery_link || ''} onChange={(e) => updateDeliveryLink(project.id, e.target.value)} placeholder="https://drive.google.com/..." className="w-full text-sm bg-noir/[0.03] text-noir px-4 py-2.5 font-medium placeholder:text-noir/20 focus:outline-none transition-colors duration-300" style={{ cursor: 'text', border: '1px solid rgba(26,26,26,0.06)', clipPath: CPS }} />
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 flex justify-between items-center flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,79,0,0.1)' }}>
                  <button onClick={() => saveProjectUpdates(project.id)} disabled={savingId === project.id} className="text-[10px] uppercase tracking-[0.15em] font-bold bg-tarantino text-noir px-4 py-2 hover:brightness-110 transition-all disabled:opacity-50" style={{ cursor: 'pointer', clipPath: CPS, boxShadow: '0 0 8px rgba(255,79,0,0.2)' }}>{savingId === project.id ? 'Saving...' : 'Confirm'}</button>
                  <div className="flex gap-2">
                    <button onClick={() => copyClientLink(project.id)} className="text-[10px] uppercase tracking-[0.15em] font-bold text-tarantino/70 hover:text-tarantino transition-colors flex items-center gap-1" style={{ cursor: 'pointer' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.688a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.55" /></svg>
                      {copiedId === project.id ? 'Copied!' : 'Link'}
                    </button>
                    <button onClick={() => setActiveChatProjectId(project.id)} className="text-[10px] uppercase tracking-[0.15em] font-bold text-noir/40 hover:text-noir px-3 py-1.5 hover:border-noir/20 transition-all flex items-center gap-1" style={{ cursor: 'pointer', border: '1px solid rgba(26,26,26,0.08)', clipPath: CPS }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            </CyberFrame>
          ))}
        </div>

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-noir/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ cursor: 'auto' }}>
            <CyberFrame className="w-full max-w-lg">
              <div className="p-8 relative">
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-tarantino/25" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-tarantino/25" />
                <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir mb-1">New <span className="text-tarantino italic">Project</span></h2>
                <p className="text-noir/40 text-sm font-medium mb-8">Create a new client dashboard. A unique shareable link will be generated.</p>
                <form onSubmit={handleCreateProject} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-noir/50 mb-2">Client Name</label>
                    <input required type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full bg-white/80 text-noir px-5 py-3.5 text-sm font-medium placeholder:text-noir/25 focus:outline-none transition-colors duration-300" style={{ cursor: 'text', border: '1px solid rgba(26,26,26,0.08)', clipPath: CPS }} placeholder="e.g. Acme Corp" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-noir/50 mb-2">Video Title</label>
                    <input required type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} className="w-full bg-white/80 text-noir px-5 py-3.5 text-sm font-medium placeholder:text-noir/25 focus:outline-none transition-colors duration-300" style={{ cursor: 'text', border: '1px solid rgba(26,26,26,0.08)', clipPath: CPS }} placeholder="e.g. Q3 Brand Film" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] uppercase tracking-[0.2em] font-bold text-noir/40 hover:text-noir px-6 py-3 transition-colors" style={{ cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="bg-tarantino text-noir font-black uppercase text-xs tracking-[0.15em] px-8 py-3 hover:brightness-110 transition-all duration-300" style={{ cursor: 'pointer', clipPath: CPS, boxShadow: '0 0 12px rgba(255,79,0,0.25)' }}>Create Dashboard</button>
                  </div>
                </form>
              </div>
            </CyberFrame>
          </div>
        )}

        {/* Chat Tray */}
        {activeChatProjectId && (
          <div className="fixed bottom-0 right-0 md:right-10 w-full md:w-[380px] px-4 md:px-0 z-40" style={{ cursor: 'auto' }}>
            <CyberFrame dark>
              <div className="flex flex-col" style={{ height: '440px' }}>
                <div className="px-5 py-4 flex justify-between items-center shrink-0" style={{ borderBottom: '1px solid rgba(255,79,0,0.15)' }}>
                  <div><span className="font-heading text-sm font-black uppercase tracking-tight text-parchment">Project Chat</span><span className="text-[9px] uppercase tracking-[0.2em] font-bold text-tarantino/60 ml-2">Live</span></div>
                  <button onClick={() => setActiveChatProjectId(null)} className="text-parchment/30 hover:text-parchment transition-colors" style={{ cursor: 'pointer' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-[10px] uppercase tracking-[0.2em] font-bold text-parchment/20 text-center">No messages yet.<br />Start the conversation.</p></div>}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'editor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 text-sm font-medium ${msg.sender_role === 'editor' ? 'text-parchment' : 'text-parchment/70'}`} style={{ background: msg.sender_role === 'editor' ? 'rgba(255,79,0,0.12)' : 'rgba(241,239,231,0.06)', border: `1px solid ${msg.sender_role === 'editor' ? 'rgba(255,79,0,0.25)' : 'rgba(241,239,231,0.1)'}`, clipPath: CPS }}>
                        <p>{msg.message_text}</p>
                        <span className="text-[9px] uppercase tracking-wider text-parchment/20 mt-1 block">{msg.sender_role === 'editor' ? 'You' : 'Client'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid rgba(255,79,0,0.12)' }}>
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-parchment/[0.04] text-parchment text-sm px-4 py-2.5 font-medium placeholder:text-parchment/20 focus:outline-none transition-colors" style={{ cursor: 'text', border: '1px solid rgba(241,239,231,0.1)', clipPath: CPS }} />
                  <button type="submit" className="bg-tarantino text-noir p-2.5 hover:brightness-110 transition-colors" style={{ cursor: 'pointer', clipPath: CPS, boxShadow: '0 0 8px rgba(255,79,0,0.3)' }}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></button>
                </form>
              </div>
            </CyberFrame>
          </div>
        )}
      </div>
    </div>
  );
}
