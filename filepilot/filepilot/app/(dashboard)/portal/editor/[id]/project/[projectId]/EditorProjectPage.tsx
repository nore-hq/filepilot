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

function CyberFrame({ children, dark = false, className = '', contentClassName = '' }: { children: React.ReactNode; dark?: boolean; className?: string; contentClassName?: string }) {
  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className={`relative overflow-hidden ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'wss://nore-realtime-engine.norehq01.workers.dev';
const circuitBg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,400' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.1)'/%3E%3C/svg%3E")`;

export default function EditorProjectPage() {
  const router = useRouter();
  const paramsHook = useParams();
  const editorId = paramsHook?.id as string;
  const projectId = paramsHook?.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTarget, setChatTarget] = useState<'admin' | 'client'>('admin');
  
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [proposedLink, setProposedLink] = useState<string>('');
  
  const [wsConnected, setWsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!editorId || !projectId) return;
    fetchData();
  }, [editorId, projectId]);

  const fetchData = async () => {
    setLoading(true);
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      session = anonData?.session || null;
    }

    if (session) {
      const { data: projData } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (projData) setProject(projData);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  useEffect(() => {
    if (!projectId) return;
    fetchMessages();

    let isCancelled = false;
    const connectWs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isCancelled) return;

      const ws = new WebSocket(`${WS_URL}/chat/${projectId}?token=${session.access_token}&role=editor`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          switch (payload.type) {
            case 'chat':
              setChatMessages((prev) => [...prev, {
                id: Date.now(),
                project_id: projectId,
                sender_role: payload.sender_role,
                target_role: payload.target_role,
                message_text: payload.message_text,
                created_at: payload.timestamp || new Date().toISOString(),
              }]);
              break;
            case 'progress':
              setProject((prev) => prev ? { ...prev, progress: payload.value } : prev);
              break;
            case 'delivery':
              setProject((prev) => prev ? { ...prev, delivery_link: payload.link } : prev);
              break;
            case 'propose_link':
              setProject((prev) => prev ? { ...prev, editor_proposed_link: payload.link } : prev);
              break;
            case 'authority_update':
              setProject((prev) => prev ? { ...prev, editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver } : prev);
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
  }, [projectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const broadcastToRoom = async (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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

  const confirmProgress = async () => {
    if (!project || localProgress === null) return;
    const v = localProgress;
    setProject({ ...project, progress: v });
    setLocalProgress(null);
    await broadcastToRoom({ type: 'progress', project_id: projectId, value: v });
  };

  const handleProposeLink = async () => {
    if (!proposedLink.trim() || !project) return;
    
    if (project.editor_can_deliver) {
      setProject({ ...project, delivery_link: proposedLink });
      await broadcastToRoom({ type: 'delivery', project_id: projectId, link: proposedLink });
    } else {
      setProject({ ...project, editor_proposed_link: proposedLink });
      await broadcastToRoom({ type: 'propose_link', project_id: projectId, link: proposedLink });
    }
    setProposedLink('');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !project) return;
    const msgText = chatInput.trim();
    setChatInput('');
    
    const target = project.editor_can_chat ? 'all' : chatTarget;

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      project_id: projectId,
      sender_role: 'editor',
      target_role: target,
      message_text: msgText,
      created_at: new Date().toISOString(),
    }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        project_id: projectId,
        sender_role: 'editor',
        target_role: target,
        message_text: msgText,
      }));
    }
  };

  if (loading) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Loading Project Details...</div>;
  if (!project) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Project not found</div>;

  const currentProg = localProgress !== null ? localProgress : project.progress;
  const isProgChanged = localProgress !== null && localProgress !== project.progress;

  return (
    <div className="min-h-screen bg-parchment font-sans py-8" style={{ cursor: 'auto', backgroundImage: circuitBg }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col h-screen overflow-hidden">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button 
            onClick={() => router.push(`/portal/editor/${editorId}`)}
            className="flex items-center justify-center w-10 h-10 bg-noir text-parchment hover:bg-tarantino transition-colors active:scale-95" 
            style={{ clipPath: CPS }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-tighter text-noir leading-none">
              Project <span className="text-tarantino italic">Workspace</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Manage delivery and communication</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 pb-4">
          
          {/* Left Column: Details & Delivery */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
            <CyberFrame>
              <div className="p-6 md:p-8 bg-white/90">
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-noir tracking-tight mb-1">{project.client_name}</h2>
                  <p className="text-sm font-bold uppercase tracking-widest text-tarantino">{project.video_title}</p>
                </div>

                {/* Progress */}
                <div className="mb-8 p-4 bg-noir/5" style={{ clipPath: CPS }}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-noir/50">Update Progress</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-noir leading-none">{currentProg}%</span>
                      {isProgChanged && (
                        <button onClick={confirmProgress} className="bg-tarantino text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-all" style={{ clipPath: CPS }}>Save</button>
                      )}
                    </div>
                  </div>
                  <input type="range" min="0" max="100" value={currentProg} onChange={(e) => setLocalProgress(parseInt(e.target.value))} className="w-full h-2 bg-noir/20 appearance-none cursor-ew-resize accent-tarantino" />
                </div>

                {/* Delivery */}
                <div className="p-4 bg-noir/5" style={{ clipPath: CPS }}>
                  <span className="text-xs font-bold uppercase tracking-widest text-noir/50 block mb-3">
                    {project.editor_can_deliver ? "Update Final Delivery Link" : "Propose Delivery Link to Admin"}
                  </span>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={proposedLink} onChange={(e) => setProposedLink(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 text-xs border-2 border-noir/10 focus:border-tarantino outline-none bg-white transition-colors" />
                    <button onClick={handleProposeLink} className="bg-noir text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-tarantino active:scale-95 transition-all" style={{ clipPath: CPS }}>Send</button>
                  </div>
                  {project.editor_proposed_link && !project.editor_can_deliver && (
                    <div className="p-3 border-2 border-tarantino/30 bg-tarantino/10">
                      <p className="text-[10px] uppercase font-bold text-tarantino tracking-widest mb-1">Currently proposed:</p>
                      <a href={project.editor_proposed_link} target="_blank" className="text-xs font-medium text-noir underline break-all">{project.editor_proposed_link}</a>
                    </div>
                  )}
                  {project.delivery_link && (
                    <div className="p-3 border-2 border-green-700/30 bg-green-700/10">
                      <p className="text-[10px] uppercase font-bold text-green-700 tracking-widest mb-1">Final link delivered:</p>
                      <a href={project.delivery_link} target="_blank" className="text-xs font-medium text-noir underline break-all">{project.delivery_link}</a>
                    </div>
                  )}
                </div>
              </div>
            </CyberFrame>
          </div>

          {/* Right Column: Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <CyberFrame className="h-full flex flex-col" contentClassName="flex flex-col h-full bg-white/95">
              <div className="flex border-b-2 border-noir/10 shrink-0">
                {project.editor_can_chat ? (
                  <div className="flex-1 p-4 bg-noir/5 text-center text-xs font-bold uppercase tracking-widest text-noir">Unified Group Chat</div>
                ) : (
                  <div className="flex-1 p-4 bg-noir/5 text-center text-xs font-bold uppercase tracking-widest text-noir">Admin Chat (Client cannot see)</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-parchment/30">
                {chatMessages.length === 0 && <div className="text-center text-noir/40 text-xs font-bold uppercase tracking-widest my-auto">No messages yet.</div>}
                {chatMessages.filter(m => project.editor_can_chat || m.target_role === 'editor' || m.sender_role === 'editor' || m.target_role === 'all').map((msg) => {
                  const isMe = msg.sender_role === 'editor';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                      <div className={`px-5 py-3 text-sm max-w-[85%] font-medium shadow-sm ${isMe ? 'bg-noir text-parchment' : 'bg-white border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                        {msg.message_text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t-2 border-noir/10 flex gap-3 bg-white shrink-0">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-noir/5 border-2 border-transparent px-4 py-3 text-sm font-medium text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/30" />
                <button type="submit" disabled={!wsConnected || !chatInput.trim()} className="bg-tarantino text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-colors disabled:opacity-50" style={{ clipPath: CPS }}>Send</button>
              </form>
            </CyberFrame>
          </div>

        </div>
      </div>
    </div>
  );
}
