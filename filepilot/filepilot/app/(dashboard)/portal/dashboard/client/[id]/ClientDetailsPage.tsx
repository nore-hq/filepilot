'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InvoiceManager from '../../../../../../components/InvoiceManager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type ChildEditor = { id: string; name: string; custom_id: string; created_at: string; };
type Project = { 
  id: string; admin_id: string; client_name: string; video_title: string; progress: number; 
  delivery_link: string | null; editor_proposed_link: string | null;
  assigned_editor_id: string | null; editor_can_chat: boolean; editor_can_deliver: boolean; editor_can_invoice: boolean;
  created_at: string; 
};
type Message = { id: number; project_id: string; sender_role: 'admin'|'editor'|'client'; target_role: string; message_text: string; created_at: string; };
type Invoice = { id: string; total_amount: number; currency_symbol: string; items: any[]; status: string; created_at: string; };

import InvoicePrintView from '../../../../../../components/InvoicePrintView';

const CP = 'polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))';
const CPS = 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))';
const circuitBg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,400' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.1)'/%3E%3C/svg%3E")`;
const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'wss://nore-realtime-engine.norehq01.workers.dev';

function CyberFrame({ children, dark = false, className = '', contentClassName = '' }: { children: React.ReactNode; dark?: boolean; className?: string; contentClassName?: string }) {


  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className={`relative overflow-hidden ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default function ClientDetailsPage() {
  const router = useRouter();
  const paramsHook = useParams();
  const projectId = paramsHook?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [childEditors, setChildEditors] = useState<ChildEditor[]>([]);
  const [loading, setLoading] = useState(true);

  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [localAuth, setLocalAuth] = useState<{ chat?: boolean, deliver?: boolean, invoice?: boolean } | null>(null);
  const [deliveryLinkInput, setDeliveryLinkInput] = useState('');

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'chat' | 'editor_chat' | 'billing' | 'progress'>('chat');
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [editorChatInput, setEditorChatInput] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreviousInvoices, setShowPreviousInvoices] = useState(false);
  
  const [wsConnected, setWsConnected] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorChatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const renderChat = () => (
    <div className={`flex-1 flex flex-col min-h-0 pt-2 ${isChatFullscreen ? 'fixed inset-0 z-[100] bg-parchment p-4 md:p-8' : ''}`}>
      <div className="flex border-b-2 border-noir/10 shrink-0 mx-6 mt-4 relative pr-10">
        <div className="flex-1 p-3 bg-noir/5 text-center text-[10px] font-bold uppercase tracking-widest text-noir">Project Group Chat</div>
        <button 
          onClick={() => setIsChatFullscreen(!isChatFullscreen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-noir/50 hover:text-noir transition-colors"
          title={isChatFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isChatFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
        {chatMessages.filter(m => m.target_role === 'all' || m.target_role === 'client' || (m.sender_role === 'client' && m.target_role === 'admin')).length === 0 && <div className="text-center text-noir/40 text-xs font-bold uppercase tracking-widest my-auto">No messages yet. Start the conversation.</div>}
        {chatMessages.filter(m => m.target_role === 'all' || m.target_role === 'client' || (m.sender_role === 'client' && m.target_role === 'admin')).map((msg) => {
          const isAdmin = msg.sender_role === 'admin';
          return (
            <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
              <div className={`px-5 py-3 text-sm max-w-[85%] font-medium shadow-sm ${isAdmin ? 'bg-noir text-parchment' : 'bg-white border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
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
    </div>
  );


  useEffect(() => {
    if (!projectId) return;
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { router.push('/portal/login'); return; }

    const [projRes, edRes, invRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('child_editors').select('*').eq('admin_id', u.user.id),
      supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    ]);

    if (projRes.data) {
      setProject(projRes.data);
      setDeliveryLinkInput(projRes.data.delivery_link || '');
    }
    if (edRes.data) {
      setChildEditors(edRes.data);
    }
    if (invRes.data) {
      setInvoices(invRes.data);
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

      const ws = new WebSocket(`${WS_URL}/chat/${projectId}?token=${session.access_token}&role=admin`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttemptRef.current = 0;
      };

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
              setProject((prev) => prev ? { ...prev, delivery_link: payload.link, editor_proposed_link: null } : prev);
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
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
        reconnectAttemptRef.current++;
        reconnectTimerRef.current = setTimeout(connectWs, delay);
      };
    };

    connectWs();

    return () => {
      isCancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [projectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const assignEditor = async (editorId: string) => {
    if (!project) return;
    const val = editorId === 'none' ? null : editorId;
    setProject({ ...project, assigned_editor_id: val });
    await supabase.from('projects').update({ assigned_editor_id: val }).eq('id', projectId);
  };

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
        if (payload.type === 'authority_update') supabase.from('projects').update({ editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver, editor_can_invoice: payload.editor_can_invoice }).eq('id', projectId);
      }
    }
  };

  const confirmAuth = async () => {
    if (!project || !localAuth) return;

    const chat = localAuth.chat !== undefined ? localAuth.chat : project.editor_can_chat;
    const deliver = localAuth.deliver !== undefined ? localAuth.deliver : project.editor_can_deliver;
    const invoice = localAuth.invoice !== undefined ? localAuth.invoice : project.editor_can_invoice;

    setProject({ ...project, editor_can_chat: chat, editor_can_deliver: deliver, editor_can_invoice: invoice });
    setLocalAuth(null);

    await supabase.from('projects').update({ editor_can_chat: chat, editor_can_deliver: deliver, editor_can_invoice: invoice }).eq('id', projectId);

    await broadcastToRoom({
      type: 'authority_update',
      project_id: projectId,
      editor_can_chat: chat,
      editor_can_deliver: deliver,
      editor_can_invoice: invoice
    });
  };

  const finalizeLink = async (link: string) => {
    if (!project) return;
    setProject({ ...project, delivery_link: link, editor_proposed_link: null });
    await supabase.from('projects').update({ delivery_link: link, editor_proposed_link: null }).eq('id', projectId);
    await broadcastToRoom({ type: 'delivery', project_id: projectId, link });
  };

  const confirmProgress = async () => {
    if (!project || localProgress === null) return;
    const v = localProgress;
    setProject({ ...project, progress: v });
    setLocalProgress(null);
    await broadcastToRoom({ type: 'progress', project_id: projectId, value: v });
  };

  const saveDeliveryLink = async () => {
    if (!project) return;
    setProject({ ...project, delivery_link: deliveryLinkInput });
    await supabase.from('projects').update({ delivery_link: deliveryLinkInput }).eq('id', projectId);
    await broadcastToRoom({ type: 'delivery', project_id: projectId, link: deliveryLinkInput });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !project) return;
    const msgText = chatInput.trim();
    setChatInput('');
    
    const target = project.editor_can_chat ? 'all' : 'client';

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      project_id: projectId,
      sender_role: 'admin',
      target_role: target,
      message_text: msgText,
      created_at: new Date().toISOString(),
    }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        project_id: projectId,
        sender_role: 'admin',
        target_role: target,
        message_text: msgText,
      }));
    }
  };

  const sendEditorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorChatInput.trim() || !project) return;
    const msgText = editorChatInput.trim();
    setEditorChatInput('');

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      project_id: projectId,
      sender_role: 'admin',
      target_role: 'editor',
      message_text: msgText,
      created_at: new Date().toISOString(),
    }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        project_id: projectId,
        sender_role: 'admin',
        target_role: 'editor',
        message_text: msgText,
      }));
    }
  };

  if (loading) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Loading Details...</div>;
  if (!project) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Project not found</div>;

  const currentProg = localProgress !== null ? localProgress : project.progress;
  const isProgChanged = localProgress !== null && localProgress !== project.progress;
  const authChat = localAuth?.chat !== undefined ? localAuth.chat : project.editor_can_chat;
  const authDeliver = localAuth?.deliver !== undefined ? localAuth.deliver : project.editor_can_deliver;
  const authInvoice = localAuth?.invoice !== undefined ? localAuth.invoice : project.editor_can_invoice;
  const isAuthChanged = localAuth !== null && (localAuth.chat !== undefined || localAuth.deliver !== undefined || localAuth.invoice !== undefined);

  return (
    <div className="min-h-screen bg-parchment font-sans py-8" style={{ cursor: 'auto', backgroundImage: circuitBg }}>
      {isChatFullscreen && renderChat()}
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col h-screen overflow-hidden">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button 
            onClick={() => router.push('/portal/dashboard')}
            className="flex items-center justify-center w-10 h-10 bg-noir text-parchment hover:bg-tarantino transition-colors active:scale-95" 
            style={{ clipPath: CPS }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-tighter text-noir leading-none">
                Client <span className="text-tarantino italic">Details</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Manage workspace and communication</p>
            </div>
            
            <div className="flex bg-noir/5 p-1 rounded-sm gap-1 ml-4 border border-noir/10" style={{ clipPath: CPS }}>
              <button 
                onClick={() => setActiveWorkspaceTab('chat')} 
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeWorkspaceTab === 'chat' ? 'bg-tarantino text-white shadow-[0_0_15px_rgba(255,79,0,0.6)]' : 'text-noir hover:bg-white'}`}
                style={{ clipPath: CPS }}
              >
                Group Chat
              </button>
              {project.assigned_editor_id && (
                <button 
                  onClick={() => setActiveWorkspaceTab('editor_chat')} 
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeWorkspaceTab === 'editor_chat' ? 'bg-tarantino text-white shadow-[0_0_15px_rgba(255,79,0,0.6)]' : 'text-noir hover:bg-white'}`}
                  style={{ clipPath: CPS }}
                >
                  Editor Chat
                </button>
              )}
              <button 
                onClick={() => setActiveWorkspaceTab('billing')} 
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeWorkspaceTab === 'billing' ? 'bg-tarantino text-white shadow-[0_0_15px_rgba(255,79,0,0.6)]' : 'text-noir hover:bg-white'}`}
                style={{ clipPath: CPS }}
              >
                Billing & Invoices
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab('progress')} 
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeWorkspaceTab === 'progress' ? 'bg-tarantino text-white shadow-[0_0_15px_rgba(255,79,0,0.6)]' : 'text-noir hover:bg-white'}`}
                style={{ clipPath: CPS }}
              >
                Progress & Delivery
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0">
          <CyberFrame className="h-full flex flex-col" contentClassName="flex flex-col h-full bg-white/95 shadow-2xl">
            {/* Top Section: Settings & Progress */}
            <div className="p-6 md:p-8 shrink-0" style={{ borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-noir tracking-tight leading-none mb-2">{project.client_name}</h2>
                  <p className="text-sm font-bold uppercase tracking-widest text-tarantino bg-tarantino/10 inline-block px-3 py-1">{project.video_title}</p>
                </div>
                
                {/* Editor Assignment */}
                <div className="flex flex-col items-start md:items-end gap-3 bg-noir/5 p-4 w-full md:w-auto" style={{ clipPath: CPS }}>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-tarantino bg-tarantino/10 px-2 py-1">Editor</span>
                    <select 
                      value={project.assigned_editor_id || 'none'}
                      onChange={(e) => assignEditor(e.target.value)}
                      className="bg-white border-2 border-noir/10 text-noir text-xs font-bold uppercase tracking-widest rounded-none px-3 py-2 outline-none focus:border-tarantino w-full md:w-56"
                    >
                      <option value="none">-- Assign Editor --</option>
                      {childEditors.map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {project.assigned_editor_id && (
                    <div className="flex flex-col items-start md:items-end gap-2 w-full mt-2">
                      <label className="text-[10px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer hover:text-noir transition-colors">
                        <span>Allow Chat with Client</span>
                        <input type="checkbox" checked={authChat} onChange={(e) => setLocalAuth({ ...(localAuth || {}), chat: e.target.checked })} className="accent-tarantino w-4 h-4" />
                      </label>
                      <label className="text-[10px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer hover:text-noir transition-colors">
                        <span>Allow Final Delivery</span>
                        <input type="checkbox" checked={authDeliver} onChange={(e) => setLocalAuth({ ...(localAuth || {}), deliver: e.target.checked })} className="accent-tarantino w-4 h-4" />
                      </label>
                      <label className="text-[10px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer hover:text-noir transition-colors">
                        <span>Allow Invoicing</span>
                        <input type="checkbox" checked={authInvoice} onChange={(e) => setLocalAuth({ ...(localAuth || {}), invoice: e.target.checked })} className="accent-tarantino w-4 h-4" />
                      </label>
                      {isAuthChanged && (
                        <button onClick={confirmAuth} className="w-full bg-tarantino text-white px-3 py-2 mt-2 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-colors" style={{ clipPath: CPS }}>
                          Save Auth
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Section: Chat or Billing (Takes up remaining height) */}
            <div className="flex-1 flex flex-col min-h-0 bg-parchment/50 relative">
              {/* Tabs for Workspace (Moved to header) */}

              {activeWorkspaceTab === 'progress' ? (
                <div className="p-6 md:p-8 h-full overflow-y-auto">
    									              {/* Progress & Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Progress */}
                <div className="bg-noir/5 p-4" style={{ clipPath: CPS }}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-noir/50">Progress</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-noir leading-none">{currentProg}%</span>
                      {isProgChanged && (
                        <button onClick={confirmProgress} className="bg-tarantino text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-all" style={{ clipPath: CPS }}>Save</button>
                      )}
                    </div>
                  </div>
                  <input type="range" min="0" max="100" value={currentProg} onChange={(e) => setLocalProgress(parseInt(e.target.value))} className="w-full h-2 bg-noir/20 appearance-none cursor-ew-resize accent-tarantino" />
                </div>

                {/* Delivery Link */}
                <div className="bg-noir/5 p-4" style={{ clipPath: CPS }}>
                  <span className="text-xs font-bold uppercase tracking-widest text-noir/50 block mb-3">Final Delivery Link</span>
                  <div className="flex gap-2">
                    <input type="text" value={deliveryLinkInput} onChange={(e) => setDeliveryLinkInput(e.target.value)} placeholder="https://..." className="flex-1 bg-white border-2 border-noir/10 px-3 py-2 text-sm font-medium text-noir outline-none focus:border-tarantino transition-colors" />
                    <button onClick={saveDeliveryLink} className="bg-noir text-parchment px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-tarantino transition-colors" style={{ clipPath: CPS }}>Send</button>
                  </div>
                  {project.editor_proposed_link && !project.editor_can_deliver && (
                    <div className="mt-3 p-3 border-2 border-tarantino/30 bg-tarantino/10 flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase text-tarantino tracking-widest">Editor Proposed Link:</span>
                      <a href={project.editor_proposed_link} target="_blank" className="text-xs text-noir underline break-all font-medium hover:text-tarantino">{project.editor_proposed_link}</a>
                      <button onClick={() => finalizeLink(project.editor_proposed_link!)} className="bg-tarantino text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-colors self-start mt-1" style={{ clipPath: CPS }}>Finalize & Send to Client</button>
                    </div>
                  )}
                </div>
              </div>

                </div>
              ) : activeWorkspaceTab === 'chat' ? (
                !isChatFullscreen ? renderChat() : <div className="flex-1" />
              ) : activeWorkspaceTab === 'editor_chat' ? (
                <div className="flex-1 flex flex-col min-h-0 bg-parchment/30">
                  <div className="p-3 bg-noir/5 border-b border-noir/10 shrink-0">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-noir/50 text-center">Private conversation with Editor</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                    {chatMessages.filter(m => (m.sender_role === 'editor' && m.target_role === 'admin') || (m.sender_role === 'admin' && m.target_role === 'editor')).length === 0 && <div className="text-center text-noir/40 text-[10px] font-bold uppercase tracking-widest my-auto">No private messages with the editor yet.</div>}
                    {chatMessages.filter(m => (m.sender_role === 'editor' && m.target_role === 'admin') || (m.sender_role === 'admin' && m.target_role === 'editor')).map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                          <div className={`px-5 py-3 text-sm max-w-[85%] font-medium shadow-sm ${isAdmin ? 'bg-noir text-parchment' : 'bg-white border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                            {msg.message_text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={editorChatEndRef} />
                  </div>
                  <form onSubmit={sendEditorMessage} className="p-4 border-t-2 border-noir/10 flex gap-3 bg-white shrink-0">
                    <input type="text" value={editorChatInput} onChange={(e) => setEditorChatInput(e.target.value)} placeholder="Message Editor privately..." className="flex-1 bg-noir/5 border-2 border-transparent px-4 py-3 text-sm font-medium text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/30" />
                    <button type="submit" disabled={!wsConnected || !editorChatInput.trim()} className="bg-tarantino text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-colors disabled:opacity-50" style={{ clipPath: CPS }}>Send</button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pt-8 px-6 pb-12 custom-scrollbar bg-parchment/50 relative">
                  {/* Invoice Form */}
                  <div className="mb-12">
                    <InvoiceManager 
                      projectId={project.id} 
                      adminId={project.admin_id} 
                      role="admin" 
                      clientName={project.client_name} 
                      videoTitle={project.video_title} 
                    />
                  </div>
                  
                  {/* Sent Invoices */}
                  {invoices.length > 0 && (
                    <div className="pt-8 border-t-2 border-noir/10">
                      <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir mb-6 flex items-center gap-3">
                        <span className="text-tarantino">Current</span> Invoice
                        <span className="flex-1 h-px bg-gradient-to-r from-noir/10 to-transparent ml-4"></span>
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CyberFrame key={invoices[0].id}>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="text-[10px] uppercase tracking-widest font-bold text-noir/40">Invoice Date</div>
                                <div className="text-sm font-bold text-noir">{new Date(invoices[0].created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest font-bold text-noir/40">Amount</div>
                                <div className="text-xl font-black text-tarantino leading-none mt-1">{invoices[0].currency_symbol}{invoices[0].total_amount.toLocaleString()}</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedInvoice(invoices[0])}
                              className="w-full bg-noir text-parchment py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-tarantino hover:text-white transition-colors mt-4" style={{ clipPath: CPS }}
                            >
                              View & Download
                            </button>
                          </div>
                        </CyberFrame>
                      </div>

                      {invoices.length > 1 && (
                        <div className="mt-8">
                          {!showPreviousInvoices ? (
                            <button onClick={() => setShowPreviousInvoices(true)} className="text-[10px] font-bold uppercase tracking-widest text-noir/50 hover:text-tarantino transition-colors flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              View Previous Invoices
                            </button>
                          ) : (
                            <div className="mt-8 pt-8 border-t border-noir/10">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="font-heading text-lg font-black uppercase tracking-tight text-noir/60">Previous Invoices</h3>
                                <button onClick={() => setShowPreviousInvoices(false)} className="text-[10px] font-bold uppercase tracking-widest text-noir/50 hover:text-tarantino transition-colors flex items-center gap-2">
                                  Close
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                                {invoices.slice(1).map(inv => (
                                  <CyberFrame key={inv.id}>
                                    <div className="p-6">
                                      <div className="flex justify-between items-start mb-4">
                                        <div>
                                          <div className="text-[10px] uppercase tracking-widest font-bold text-noir/40">Invoice Date</div>
                                          <div className="text-sm font-bold text-noir">{new Date(inv.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-[10px] uppercase tracking-widest font-bold text-noir/40">Amount</div>
                                          <div className="text-xl font-black text-noir leading-none mt-1">{inv.currency_symbol}{inv.total_amount.toLocaleString()}</div>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="w-full bg-noir/10 text-noir py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-tarantino hover:text-white transition-colors mt-4" style={{ clipPath: CPS }}
                                      >
                                        View & Download
                                      </button>
                                    </div>
                                  </CyberFrame>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </CyberFrame>
        </div>
      </div>
      
      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoicePrintView 
          invoice={selectedInvoice} 
          clientName={project.client_name} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </div>
  );
}
