'use client';


import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Project = { 
  id: string; client_name: string; video_title: string; progress: number; 
  delivery_link: string | null; editor_proposed_link: string | null;
  editor_can_chat: boolean; editor_can_deliver: boolean;
};
type Message = { id: number; project_id: string; sender_role: 'admin'|'editor'|'client'; target_role: string; message_text: string; created_at: string; };

const CP = 'polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))';
const CPS = 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))';

function CyberFrame({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className="relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'wss://nore-realtime-engine.norehq01.workers.dev';

export default function EditorDashboard() {
  const router = useRouter();
  const paramsHook = useParams();
  const editorId = paramsHook?.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTarget, setChatTarget] = useState<'admin' | 'client'>('admin');
  
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const [proposedLink, setProposedLink] = useState<string>('');
  const [wsConnected, setWsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!editorId) return;
    fetchData();
  }, [editorId]);

  const fetchData = async () => {
    setLoading(true);
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      session = anonData?.session || null;
    }

    if (session) {
      // Find the editor by custom_id
      const { data: editorData } = await supabase.from('child_editors').select('*').eq('custom_id', editorId).single();
      if (editorData) {
        const { data: projData } = await supabase.from('projects').select('*').eq('assigned_editor_id', editorData.id);
        if (projData) setProjects(projData);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (pid: string) => {
    const { data } = await supabase.from('messages').select('*').eq('project_id', pid).order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  useEffect(() => {
    if (!activeChatProjectId) return;
    fetchMessages(activeChatProjectId);

    let isCancelled = false;
    const connectWs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isCancelled) return;

      const ws = new WebSocket(`${WS_URL}/chat/${activeChatProjectId}?token=${session.access_token}&role=editor`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case 'chat':
              setChatMessages((prev) => [...prev, {
                id: Date.now(),
                project_id: activeChatProjectId,
                sender_role: payload.sender_role,
                target_role: payload.target_role,
                message_text: payload.message_text,
                created_at: payload.timestamp || new Date().toISOString(),
              }]);
              break;
            case 'progress':
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, progress: payload.value } : p));
              break;
            case 'delivery':
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, delivery_link: payload.link } : p));
              break;
            case 'propose_link':
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, editor_proposed_link: payload.link } : p));
              break;
            case 'authority_update':
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver } : p));
              break;
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (isCancelled) return;
        setTimeout(connectWs, 5000);
      };
    };

    connectWs();
    return () => {
      isCancelled = true;
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [activeChatProjectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const broadcastToRoom = async (projectId: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeChatProjectId === projectId) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const httpUrl = WS_URL.replace(/^ws(s)?/, 'http$1') + `/chat/${projectId}/broadcast`;
        await fetch(httpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('Broadcast fallback failed', err);
        if (payload.type === 'progress') supabase.from('projects').update({ progress: payload.value }).eq('id', projectId);
        if (payload.type === 'delivery') supabase.from('projects').update({ delivery_link: payload.link }).eq('id', projectId);
        if (payload.type === 'propose_link') supabase.from('projects').update({ editor_proposed_link: payload.link }).eq('id', projectId);
      }
    }
  };

  const handleLocalProgressChange = (id: string, v: number) => {
    setLocalProgress({ ...localProgress, [id]: v });
  };

  const confirmProgress = async (id: string) => {
    const v = localProgress[id];
    if (v === undefined) return;
    setProjects(projects.map(p => p.id === id ? { ...p, progress: v } : p));
    
    const newLocal = { ...localProgress };
    delete newLocal[id];
    setLocalProgress(newLocal);

    await broadcastToRoom(id, { type: 'progress', project_id: id, value: v });
  };

  const handleProposeLink = async (projectId: string) => {
    if (!proposedLink.trim()) return;
    const p = projects.find(x => x.id === projectId);
    
    if (p?.editor_can_deliver) {
      setProjects(projects.map(proj => proj.id === projectId ? { ...proj, delivery_link: proposedLink } : proj));
      await broadcastToRoom(projectId, { type: 'delivery', project_id: projectId, link: proposedLink });
    } else {
      setProjects(projects.map(proj => proj.id === projectId ? { ...proj, editor_proposed_link: proposedLink } : proj));
      await broadcastToRoom(projectId, { type: 'propose_link', project_id: projectId, link: proposedLink });
    }
    setProposedLink('');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatProjectId) return;
    const msgText = chatInput.trim();
    setChatInput('');
    
    const p = projects.find(x => x.id === activeChatProjectId);
    const target = p?.editor_can_chat ? 'all' : chatTarget;

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      project_id: activeChatProjectId,
      sender_role: 'editor',
      target_role: target,
      message_text: msgText,
      created_at: new Date().toISOString(),
    }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        project_id: activeChatProjectId,
        sender_role: 'editor',
        target_role: target,
        message_text: msgText,
      }));
    }
  };

  if (loading) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Loading Projects...</div>;

  return (
    <div className="min-h-screen bg-parchment font-sans py-10">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-black uppercase text-noir mb-10">Your Assigned Projects</h1>
        
        {projects.length === 0 ? (
          <div className="text-center py-20 text-noir/40 font-bold uppercase tracking-widest">No projects assigned to you.</div>
        ) : (
          <div className="flex flex-col gap-8">
            {projects.map((project) => {
              const currentProg = localProgress[project.id] !== undefined ? localProgress[project.id] : project.progress;
              const isProgChanged = localProgress[project.id] !== undefined && localProgress[project.id] !== project.progress;

              return (
              <CyberFrame key={project.id}>
                <div className="p-4 md:p-6">
                  <div className="mb-4">
                    <h2 className="text-xl md:text-2xl font-black text-noir">{project.client_name}</h2>
                    <p className="text-sm font-bold uppercase text-tarantino">{project.video_title}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold uppercase text-noir/50">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-noir">{currentProg}%</span>
                        {isProgChanged && (
                          <button onClick={() => confirmProgress(project.id)} className="bg-tarantino text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-noir active:scale-95 transition-all">
                            Confirm
                          </button>
                        )}
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={currentProg} onChange={(e) => handleLocalProgressChange(project.id, parseInt(e.target.value))} className="w-full h-2 bg-noir/10 appearance-none accent-tarantino" />
                  </div>

                  {/* Delivery Link */}
                  <div className="mb-6 p-4 bg-noir/5">
                    <span className="text-xs font-bold uppercase text-noir/50 block mb-2">
                      {project.editor_can_deliver ? "Update Final Delivery Link" : "Propose Delivery Link to Admin"}
                    </span>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={proposedLink} onChange={(e) => setProposedLink(e.target.value)} placeholder="https://..." className="flex-1 px-2 py-1 text-xs border border-noir/20 focus:border-tarantino outline-none" />
                      <button onClick={() => handleProposeLink(project.id)} className="bg-noir text-white px-3 py-1 text-[10px] font-bold uppercase hover:bg-tarantino active:scale-95 transition-all" style={{ clipPath: CPS }}>Send</button>
                    </div>
                    {project.editor_proposed_link && !project.editor_can_deliver && (
                      <p className="text-[10px] text-tarantino font-bold">Currently proposed: {project.editor_proposed_link}</p>
                    )}
                    {project.delivery_link && (
                      <p className="text-[10px] text-green-700 font-bold">Final link delivered: {project.delivery_link}</p>
                    )}
                  </div>

                  {/* Chat Toggle */}
                  {activeChatProjectId !== project.id ? (
                    <button onClick={() => setActiveChatProjectId(project.id)} className="w-full bg-parchment border-2 border-noir text-noir py-2 text-xs font-bold uppercase hover:bg-noir hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all" style={{ clipPath: CPS }}>Open Chat</button>
                  ) : (
                    <div className="mt-4 border-2 border-noir flex flex-col h-80 bg-white">
                      
                      <div className="flex border-b-2 border-noir">
                        {project.editor_can_chat ? (
                          <div className="flex-1 p-2 bg-noir/5 text-center text-xs font-bold uppercase text-noir">Unified Group Chat</div>
                        ) : (
                          <div className="flex-1 p-2 bg-noir/5 text-center text-xs font-bold uppercase text-noir">Admin Chat (Client cannot see)</div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {chatMessages.filter(m => project.editor_can_chat || m.target_role === 'editor' || m.sender_role === 'editor' || m.target_role === 'all').map((msg) => {
                          const isMe = msg.sender_role === 'editor';
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <span className="text-[9px] uppercase text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                              <div className={`px-4 py-2 text-sm max-w-[85%] ${isMe ? 'bg-noir text-white' : 'bg-parchment border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                                {msg.message_text}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      <form onSubmit={sendMessage} className="p-2 border-t-2 border-noir flex gap-2 bg-parchment">
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent outline-none px-2 text-sm" />
                        <button type="submit" disabled={!wsConnected} className="bg-tarantino text-white px-4 py-2 text-xs font-bold uppercase disabled:opacity-50 active:scale-95 hover:-translate-y-0.5 transition-all" style={{ clipPath: CPS }}>Send</button>
                      </form>
                    </div>
                  )}

                </div>
              </CyberFrame>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
