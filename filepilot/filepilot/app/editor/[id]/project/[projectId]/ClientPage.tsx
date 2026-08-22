'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InvoiceManager from '../../../../../components/InvoiceManager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Project = { 
  id: string; client_name: string; video_title: string; progress: number; 
  delivery_link: string | null; editor_proposed_link: string | null;
  editor_can_chat: boolean; editor_can_deliver: boolean; editor_can_invoice: boolean;
  admin_id: string;
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

export default function EditorProjectWorkspace() {
  const router = useRouter();
  const paramsHook = useParams();
  const editorId = paramsHook?.id as string;
  const projectId = paramsHook?.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTarget, setChatTarget] = useState<'admin' | 'client'>('admin');
  
  const [localProgress, setLocalProgress] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat'|'billing'>('chat');
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
              setProject((prev) => prev ? { ...prev, editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver, editor_can_invoice: payload.editor_can_invoice } : prev);
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
      }
    }
  };

  const confirmProgress = async () => {
    if (localProgress === undefined || !project) return;
    setProject({ ...project, progress: localProgress });
    setLocalProgress(undefined);
    await broadcastToRoom({ type: 'progress', project_id: projectId, value: localProgress });
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

  if (loading) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Loading Workspace...</div>;
  if (!project) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Project not found</div>;

  const currentProg = localProgress !== undefined ? localProgress : project.progress;

  return (
    <div className="h-screen flex flex-col bg-parchment font-sans p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-tarantino mb-1">Editor Workspace</p>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-noir tracking-tighter leading-none">{project.client_name}</h1>
        </div>
        <button 
          onClick={() => router.push(`/editor/${editorId}`)}
          className="bg-noir text-parchment px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-tarantino transition-colors flex items-center gap-2"
          style={{ clipPath: CPS }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Clients
        </button>
      </div>

      <CyberFrame className="flex-1 min-h-0 flex flex-col" contentClassName="flex flex-col md:flex-row h-full">
        
        {/* Left Sidebar: Controls & Progress */}
        <div className="w-full md:w-[35%] lg:w-[25%] p-6 md:p-8 flex flex-col shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-noir/10 bg-white">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight text-noir mb-2">Project Control</h2>
          <p className="text-sm font-bold uppercase tracking-widest text-noir/50 mb-8">{project.video_title}</p>
          
          <div className="mb-10">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/40">Progress Update</span>
              <span className="text-3xl font-black text-noir leading-none">{currentProg}<span className="text-lg">%</span></span>
            </div>
            <input type="range" min="0" max="100" value={currentProg} onChange={(e) => setLocalProgress(parseInt(e.target.value))} className="w-full h-2 bg-noir/10 appearance-none outline-none mb-4 cursor-pointer accent-tarantino" />
            {localProgress !== undefined && localProgress !== project.progress && (
              <button onClick={confirmProgress} className="w-full bg-tarantino text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-noir active:scale-95 transition-all" style={{ clipPath: CPS }}>Confirm Progress</button>
            )}
          </div>

          <div className="mt-auto">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-noir/30 mb-2 text-center">Connection Status</p>
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-noir/40">{wsConnected ? 'Live Sync Active' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        {/* Right Area: Workspace Tabs */}
        <div className="flex-1 flex flex-col min-h-0 bg-parchment relative">
          
          <div className="flex border-b-2 border-noir/10 shrink-0">
            <button onClick={() => setActiveTab('chat')} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'chat' ? 'bg-noir text-parchment' : 'bg-transparent text-noir hover:bg-noir/5'}`}>
              Communication
            </button>
            {project.editor_can_invoice && (
              <button onClick={() => setActiveTab('billing')} className={`flex-1 p-3 border-l-2 border-noir/10 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'billing' ? 'bg-tarantino text-white' : 'bg-transparent text-noir hover:bg-noir/5'}`}>
                Billing & Invoices
              </button>
            )}
          </div>

          {activeTab === 'chat' ? (
            project.editor_can_chat ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex border-b-2 border-noir/5 shrink-0 bg-white">
                  <button onClick={() => setChatTarget('admin')} className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${chatTarget === 'admin' ? 'bg-noir text-parchment' : 'bg-transparent text-noir hover:bg-noir/5'}`}>Admin Only Chat</button>
                  <button onClick={() => setChatTarget('client')} className={`flex-1 p-2 border-l-2 border-noir/5 text-[10px] font-bold uppercase tracking-widest transition-colors ${chatTarget === 'client' ? 'bg-tarantino text-white' : 'bg-transparent text-noir hover:bg-noir/5'}`}>Client Chat</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                  {chatMessages.filter(m => m.target_role === chatTarget || m.target_role === 'all' || m.sender_role === chatTarget).length === 0 && <div className="text-center text-noir/40 text-[10px] font-bold uppercase tracking-widest my-auto">No messages yet.</div>}
                  {chatMessages.filter(m => m.target_role === chatTarget || m.target_role === 'all' || m.sender_role === chatTarget).map((msg) => {
                    const isMe = msg.sender_role === 'editor';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                        <div className={`px-5 py-3 text-sm max-w-[85%] font-medium ${isMe ? 'bg-noir text-parchment' : 'bg-white border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                          {msg.message_text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t-2 border-noir/10 flex gap-3 bg-white shrink-0">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-noir/5 outline-none px-4 text-sm font-medium focus:bg-noir/10 transition-colors" style={{ clipPath: CPS }} />
                  <button type="submit" disabled={!wsConnected} className="bg-tarantino text-white px-6 py-3 text-xs font-bold uppercase disabled:opacity-50 active:scale-95 hover:-translate-y-0.5 transition-all" style={{ clipPath: CPS }}>Send</button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6 text-noir/40 font-bold uppercase tracking-widest text-xs">
                Chat is currently disabled for this project.
              </div>
            )
          ) : (
            <div className="flex-1 min-h-0 bg-white">
              <InvoiceManager 
                projectId={project.id} 
                adminId={project.admin_id} 
                role="editor" 
                clientName={project.client_name} 
                videoTitle={project.video_title} 
              />
            </div>
          )}
          
        </div>
      </CyberFrame>
    </div>
  );
}
