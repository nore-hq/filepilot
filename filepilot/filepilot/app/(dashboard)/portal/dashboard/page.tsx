'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type ChildEditor = { id: string; name: string; custom_id: string; created_at: string; };
type Project = { 
  id: string; client_name: string; video_title: string; progress: number; 
  delivery_link: string | null; editor_proposed_link: string | null;
  assigned_editor_id: string | null; editor_can_chat: boolean; editor_can_deliver: boolean;
  created_at: string; 
};
type Message = { id: number; project_id: string; sender_role: 'admin'|'editor'|'client'; target_role: string; message_text: string; created_at: string; };

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

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'wss://nore-realtime-engine.norehq01.workers.dev';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'workplace'|'create_client'|'create_editor'|'accounts'>('workplace');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [childEditors, setChildEditors] = useState<ChildEditor[]>([]);
  
  const [newClientName, setNewClientName] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  
  const [newEditorName, setNewEditorName] = useState('');
  const [newEditorId, setNewEditorId] = useState('');

  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const [localAuth, setLocalAuth] = useState<Record<string, { chat?: boolean, deliver?: boolean }>>({});
  
  const [justCreatedClient, setJustCreatedClient] = useState<Project | null>(null);
  const [justCreatedEditor, setJustCreatedEditor] = useState<ChildEditor | null>(null);

  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<'client' | 'editor' | 'all'>('client');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [mounted, setMounted] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const router = useRouter();

  useEffect(() => { setMounted(true); fetchData(); }, []);

  const fetchData = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { router.push('/portal/login'); return; }
    
    const [projRes, edRes] = await Promise.all([
      supabase.from('projects').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('child_editors').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false })
    ]);
    if (projRes.data) setProjects(projRes.data);
    if (edRes.data) setChildEditors(edRes.data);
  };

  const fetchMessages = async (pid: string) => {
    const { data } = await supabase.from('messages').select('*').eq('project_id', pid).order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  // WebSocket Connection
  useEffect(() => {
    if (!activeChatProjectId) return;
    fetchMessages(activeChatProjectId);

    let isCancelled = false;

    const connectWs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isCancelled) return;

      const ws = new WebSocket(`${WS_URL}/chat/${activeChatProjectId}?token=${session.access_token}&role=admin`);
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
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, delivery_link: payload.link, editor_proposed_link: null } : p));
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
  }, [activeChatProjectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newVideoTitle.trim()) return alert('Fill all fields');
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from('projects').insert([{ client_name: newClientName, video_title: newVideoTitle, admin_id: u.user.id }]).select();
    if (error) return alert('Error: ' + error.message);
    if (data) {
      setProjects([data[0], ...projects]);
      setNewClientName('');
      setNewVideoTitle('');
      setJustCreatedClient(data[0]);
    }
  };

  const handleCreateEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEditorName.trim() || !newEditorId.trim()) return alert('Fill all fields');
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from('child_editors').insert([{ name: newEditorName, custom_id: newEditorId, admin_id: u.user.id }]).select();
    if (error) return alert('Error: ' + error.message);
    if (data) {
      setChildEditors([data[0], ...childEditors]);
      setNewEditorName('');
      setNewEditorId('');
      setJustCreatedEditor(data[0]);
    }
  };

  const assignEditor = async (projectId: string, editorId: string) => {
    const val = editorId === 'none' ? null : editorId;
    setProjects(projects.map(p => p.id === projectId ? { ...p, assigned_editor_id: val } : p));
    await supabase.from('projects').update({ assigned_editor_id: val }).eq('id', projectId);
  };

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
        // Fallback to direct DB update if the worker fails
        if (payload.type === 'progress') supabase.from('projects').update({ progress: payload.value }).eq('id', projectId);
        if (payload.type === 'delivery') supabase.from('projects').update({ delivery_link: payload.link }).eq('id', projectId);
        if (payload.type === 'authority_update') supabase.from('projects').update({ editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver }).eq('id', projectId);
      }
    }
  };

  const confirmAuth = async (id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    const authState = localAuth[id];
    if (!authState) return;

    const chat = authState.chat !== undefined ? authState.chat : p.editor_can_chat;
    const deliver = authState.deliver !== undefined ? authState.deliver : p.editor_can_deliver;

    const updated = { ...p, editor_can_chat: chat, editor_can_deliver: deliver };
    setProjects(projects.map(proj => proj.id === id ? updated : proj));

    const newLocal = { ...localAuth };
    delete newLocal[id];
    setLocalAuth(newLocal);

    await broadcastToRoom(id, {
      type: 'authority_update',
      project_id: id,
      editor_can_chat: chat,
      editor_can_deliver: deliver
    });
  };

  const finalizeLink = async (projectId: string, link: string) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, delivery_link: link, editor_proposed_link: null } : p));
    // Finalizing a link sets it as delivered and clears the proposal in the DB.
    // The worker handles updating both in handleDeliveryUpdate if we send a delivery. 
    // BUT we also need to clear editor_proposed_link in Supabase manually if the worker doesn't do it.
    await supabase.from('projects').update({ delivery_link: link, editor_proposed_link: null }).eq('id', projectId);
    
    await broadcastToRoom(projectId, { type: 'delivery', project_id: projectId, link });
  };

  const handleLocalProgressChange = (id: string, v: number) => {
    setLocalProgress({ ...localProgress, [id]: v });
  };

  const confirmProgress = async (id: string) => {
    const v = localProgress[id];
    if (v === undefined) return;
    setProjects(projects.map(p => p.id === id ? { ...p, progress: v } : p));
    
    // Clear local override once confirmed
    const newLocal = { ...localProgress };
    delete newLocal[id];
    setLocalProgress(newLocal);

    await broadcastToRoom(id, { type: 'progress', project_id: id, value: v });
  };

  const updateDeliveryLink = (id: string, link: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, delivery_link: link } : p));
  };

  const saveDeliveryLink = async (id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    await broadcastToRoom(id, { type: 'delivery', project_id: id, link: p.delivery_link || '' });
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm('Delete this client dashboard?')) return;
    setProjects(projects.filter(p => p.id !== id));
    await supabase.from('projects').delete().eq('id', id);
    if (activeChatProjectId === id) setActiveChatProjectId(null);
  };

  const deleteEditor = async (id: string) => {
    if (!window.confirm('Delete this editor account?')) return;
    setChildEditors(childEditors.filter(e => e.id !== id));
    await supabase.from('child_editors').delete().eq('id', id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatProjectId) return;
    const msgText = chatInput.trim();
    setChatInput('');
    
    const p = projects.find(x => x.id === activeChatProjectId);
    // If editor_can_chat is true, target_role is 'all'
    const target = p?.editor_can_chat ? 'all' : chatTarget;

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      project_id: activeChatProjectId,
      sender_role: 'admin',
      target_role: target,
      message_text: msgText,
      created_at: new Date().toISOString(),
    }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        project_id: activeChatProjectId,
        sender_role: 'admin',
        target_role: target,
        message_text: msgText,
      }));
    }
  };

  const copyLink = (type: 'client'|'editor', id: string) => {
    const local = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const link = local ? `http://localhost:3000/${type}/${id}?filepilot=true` : `https://filepilot.norehq.com/${type}/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-parchment font-sans" style={{ cursor: 'auto', backgroundImage: circuitBg }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Header & Tabs */}
        <div className={`mb-8 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="font-heading text-3xl md:text-4xl font-black uppercase tracking-tighter text-noir leading-none">
              Agency <span className="text-tarantino italic">Portal</span>
            </h1>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/portal/login'); }} className="text-xs font-bold uppercase tracking-widest text-noir/50 hover:text-tarantino transition-colors active:scale-95">
              Sign Out
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 border-b-2 border-noir/10">
            {['workplace', 'create_client', 'create_editor', 'accounts'].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setJustCreatedClient(null); setJustCreatedEditor(null); }}
                className={`pb-2 px-1 font-bold uppercase tracking-widest text-xs md:text-sm whitespace-nowrap border-b-2 transition-all active:scale-95 ${activeTab === tab ? 'border-tarantino text-tarantino' : 'border-transparent text-noir/40 hover:text-noir'}`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          
          {/* WORKPLACE */}
          {activeTab === 'workplace' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.length === 0 ? (
                <div className="lg:col-span-2 text-center py-16 text-noir/40 font-bold uppercase tracking-widest">No clients assigned to workplace yet.</div>
              ) : (
                projects.map((project) => {
                  const currentProg = localProgress[project.id] !== undefined ? localProgress[project.id] : project.progress;
                  const isProgChanged = localProgress[project.id] !== undefined && localProgress[project.id] !== project.progress;
                  
                  const authChat = localAuth[project.id]?.chat !== undefined ? localAuth[project.id]!.chat! : project.editor_can_chat;
                  const authDeliver = localAuth[project.id]?.deliver !== undefined ? localAuth[project.id]!.deliver! : project.editor_can_deliver;
                  const isAuthChanged = (localAuth[project.id]?.chat !== undefined && localAuth[project.id]!.chat !== project.editor_can_chat) || (localAuth[project.id]?.deliver !== undefined && localAuth[project.id]!.deliver !== project.editor_can_deliver);

                  return (
                  <CyberFrame key={project.id} className="h-full">
                    <div className="p-4 md:p-6 flex flex-col h-full relative">
                      
                      {/* Top bar: Client info + Editor Assignment */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight leading-none mb-1">{project.client_name}</h2>
                          <p className="text-sm font-bold uppercase tracking-widest text-tarantino">{project.video_title}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <select 
                            value={project.assigned_editor_id || 'none'}
                            onChange={(e) => assignEditor(project.id, e.target.value)}
                            className="bg-transparent border border-noir/20 text-noir text-xs font-bold uppercase tracking-widest rounded-none px-2 py-1 outline-none focus:border-tarantino"
                          >
                            <option value="none">Unassigned</option>
                            {childEditors.map(ed => (
                              <option key={ed.id} value={ed.id}>{ed.name}</option>
                            ))}
                          </select>
                          
                          {project.assigned_editor_id && (
                            <div className="flex flex-col items-end gap-1 mt-2 bg-noir/5 p-2 rounded-sm border border-noir/10">
                              <label className="text-[10px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer">
                                <span>Authorize Chat</span>
                                <input type="checkbox" checked={authChat} onChange={(e) => setLocalAuth({ ...localAuth, [project.id]: { ...localAuth[project.id], chat: e.target.checked } })} className="accent-tarantino" />
                              </label>
                              <label className="text-[10px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer">
                                <span>Authorize Deliver</span>
                                <input type="checkbox" checked={authDeliver} onChange={(e) => setLocalAuth({ ...localAuth, [project.id]: { ...localAuth[project.id], deliver: e.target.checked } })} className="accent-tarantino" />
                              </label>
                              {isAuthChanged && (
                                <button onClick={() => confirmAuth(project.id)} className="bg-tarantino text-white px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-widest hover:bg-noir active:scale-95 transition-all">
                                  Confirm Auth
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-noir/50">Progress</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-noir">{currentProg}%</span>
                            {isProgChanged && (
                              <button onClick={() => confirmProgress(project.id)} className="ml-2 bg-tarantino text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-noir active:scale-95 transition-all">
                                Confirm
                              </button>
                            )}
                          </div>
                        </div>
                        <input type="range" min="0" max="100" value={currentProg} onChange={(e) => handleLocalProgressChange(project.id, parseInt(e.target.value))} className="w-full h-2 bg-noir/10 rounded-none appearance-none cursor-ew-resize accent-tarantino" />
                      </div>

                      {/* Delivery Link Section */}
                      <div className="mb-6 p-4 bg-noir/5 border border-noir/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-noir/50 block mb-2">Final Delivery Link</span>
                        <div className="flex gap-2">
                          <input type="text" value={project.delivery_link || ''} onChange={(e) => updateDeliveryLink(project.id, e.target.value)} placeholder="https://..." className="flex-1 bg-white/50 border border-noir/20 px-2 py-1 text-xs font-medium text-noir outline-none focus:border-tarantino transition-colors" />
                          <button onClick={() => saveDeliveryLink(project.id)} className="bg-noir text-parchment px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-tarantino hover:-translate-y-0.5 active:scale-95 transition-all" style={{ clipPath: CPS }}>Save</button>
                        </div>
                        
                        {/* Editor Proposed Link */}
                        {project.editor_proposed_link && !project.editor_can_deliver && (
                          <div className="mt-4 p-3 border border-tarantino/30 bg-tarantino/5 flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-tarantino tracking-widest">Editor Proposed Link</span>
                            <a href={project.editor_proposed_link} target="_blank" className="text-xs text-noir underline break-all">{project.editor_proposed_link}</a>
                            <button onClick={() => finalizeLink(project.id, project.editor_proposed_link!)} className="bg-tarantino text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-noir hover:-translate-y-0.5 active:scale-95 transition-all self-start">Finalize & Send to Client</button>
                          </div>
                        )}
                      </div>

                      {/* Chat / Open Workspace Button */}
                      <div className="mt-auto">
                        {activeChatProjectId === project.id ? (
                          <button onClick={() => setActiveChatProjectId(null)} className="w-full bg-noir text-parchment py-2 text-xs font-bold uppercase tracking-widest hover:bg-tarantino hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2" style={{ clipPath: CPS }}>Close Workspace Chat</button>
                        ) : (
                          <button onClick={() => setActiveChatProjectId(project.id)} className="w-full bg-parchment border-2 border-noir text-noir py-2 text-xs font-bold uppercase tracking-widest hover:bg-noir hover:text-parchment hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2" style={{ clipPath: CPS }}>Open Workspace Chat</button>
                        )}
                      </div>

                      {/* Chat Panel (when active) */}
                      {activeChatProjectId === project.id && (
                        <div className="mt-4 border-2 border-noir flex flex-col h-80 bg-white">
                          
                          {/* Chat Header / Target Selector */}
                          <div className="flex border-b-2 border-noir">
                            {project.editor_can_chat ? (
                              <div className="flex-1 p-2 bg-noir/5 text-center text-xs font-bold uppercase tracking-widest text-noir">Unified Group Chat (Admin, Client, Editor)</div>
                            ) : (
                              <>
                                <button onClick={() => setChatTarget('client')} className={`flex-1 p-2 text-xs font-bold uppercase tracking-widest transition-colors ${chatTarget === 'client' ? 'bg-noir text-white' : 'bg-white text-noir hover:bg-noir/5'}`}>Client Chat</button>
                                {project.assigned_editor_id && (
                                  <button onClick={() => setChatTarget('editor')} className={`flex-1 p-2 border-l-2 border-noir text-xs font-bold uppercase tracking-widest transition-colors ${chatTarget === 'editor' ? 'bg-tarantino text-white' : 'bg-white text-noir hover:bg-noir/5'}`}>Editor Chat</button>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            {chatMessages.length === 0 && <div className="text-center text-noir/40 text-xs font-bold uppercase tracking-widest my-auto">No messages yet.</div>}
                            {chatMessages.filter(m => project.editor_can_chat || m.target_role === chatTarget || m.target_role === 'all' || (m.sender_role === chatTarget)).map((msg) => {
                              const isAdmin = msg.sender_role === 'admin';
                              return (
                                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[9px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                                  <div className={`px-4 py-2 text-sm max-w-[85%] ${isAdmin ? 'bg-noir text-parchment' : 'bg-parchment border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                                    {msg.message_text}
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={sendMessage} className="p-2 border-t-2 border-noir flex gap-2 bg-parchment">
                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message ${project.editor_can_chat ? 'everyone' : chatTarget}...`} className="flex-1 bg-transparent border-none outline-none text-sm px-2 font-medium" />
                            <button type="submit" disabled={!wsConnected} className="bg-tarantino text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-noir transition-colors disabled:opacity-50" style={{ clipPath: CPS }}>Send</button>
                          </form>
                        </div>
                      )}
                    </div>
                  </CyberFrame>
                  );
                })
              )}
            </div>
          )}

          {/* CREATE CLIENT */}
          {activeTab === 'create_client' && (
            <div className="max-w-md">
              <CyberFrame>
                {justCreatedClient ? (
                  <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
                    <div className="text-4xl text-green-500 mb-2">✓</div>
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Dashboard Created!</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-noir/70">Copy this link and give to your client to access their dashboard.</p>
                    
                    <div className="bg-noir/5 p-4 border border-noir/10 flex flex-col gap-2">
                      <code className="text-xs text-noir break-all">
                        https://filepilot.norehq.com/client/{justCreatedClient.id}
                      </code>
                      <button onClick={() => copyLink('client', justCreatedClient.id)} className="bg-tarantino text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-noir hover:-translate-y-0.5 active:scale-95 transition-all">
                        {copiedId === `client-${justCreatedClient.id}` ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>

                    <button onClick={() => setJustCreatedClient(null)} className="mt-4 text-xs font-bold uppercase tracking-widest text-noir/50 hover:text-noir active:scale-95 transition-all">
                      Create Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateClient} className="p-6 md:p-8 flex flex-col gap-6">
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Create Client Dashboard</h2>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70 mb-2">Client Name</label>
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/20 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Nike" required />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70 mb-2">Video Title</label>
                      <input type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/20 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Summer Campaign" required />
                    </div>
                    <button type="submit" className="mt-4 bg-tarantino text-white py-3 font-bold uppercase tracking-widest hover:bg-noir hover:-translate-y-0.5 active:scale-95 transition-all" style={{ clipPath: CPS }}>Create Dashboard</button>
                  </form>
                )}
              </CyberFrame>
            </div>
          )}

          {/* CREATE EDITOR */}
          {activeTab === 'create_editor' && (
            <div className="max-w-md">
              <CyberFrame>
                {justCreatedEditor ? (
                  <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
                    <div className="text-4xl text-green-500 mb-2">✓</div>
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Editor Account Created!</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-noir/70">Copy this link and give to your editor to access their dashboard.</p>
                    
                    <div className="bg-noir/5 p-4 border border-noir/10 flex flex-col gap-2">
                      <code className="text-xs text-noir break-all">
                        https://filepilot.norehq.com/editor/{justCreatedEditor.custom_id}
                      </code>
                      <button onClick={() => copyLink('editor', justCreatedEditor.custom_id)} className="bg-noir text-parchment py-2 text-xs font-bold uppercase tracking-widest hover:bg-tarantino hover:-translate-y-0.5 active:scale-95 transition-all">
                        {copiedId === `editor-${justCreatedEditor.custom_id}` ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>

                    <button onClick={() => setJustCreatedEditor(null)} className="mt-4 text-xs font-bold uppercase tracking-widest text-noir/50 hover:text-noir active:scale-95 transition-all">
                      Create Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateEditor} className="p-6 md:p-8 flex flex-col gap-6">
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Create Editor Account</h2>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70 mb-2">Editor Name</label>
                      <input type="text" value={newEditorName} onChange={(e) => setNewEditorName(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/20 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Alex" required />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70">Custom ID</label>
                        <button type="button" onClick={() => setNewEditorId('ed_' + Math.random().toString(36).substring(2, 8))} className="text-[10px] text-tarantino font-bold uppercase tracking-widest active:scale-95 hover:opacity-80">Generate</button>
                      </div>
                      <input type="text" value={newEditorId} onChange={(e) => setNewEditorId(e.target.value.replace(/\s+/g, '-').toLowerCase())} className="w-full bg-transparent border-b-2 border-noir/20 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. alex-cuts" required />
                      <p className="text-[10px] text-noir/40 mt-1">They will login via: filepilot.norehq.com/editor/{newEditorId || '[id]'}</p>
                    </div>
                    <button type="submit" className="mt-4 bg-noir text-parchment py-3 font-bold uppercase tracking-widest hover:bg-tarantino hover:-translate-y-0.5 active:scale-95 transition-all" style={{ clipPath: CPS }}>Create Editor</button>
                  </form>
                )}
              </CyberFrame>
            </div>
          )}

          {/* ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Clients */}
              <div>
                <h3 className="font-heading text-2xl font-black uppercase tracking-tighter text-noir mb-6 border-b-2 border-noir/10 pb-2">Client Accounts</h3>
                <div className="flex flex-col gap-4">
                  {projects.map(p => (
                    <div key={p.id} className="p-4 border-2 border-noir/10 flex justify-between items-center hover:border-noir transition-colors bg-white/50">
                      <div>
                        <div className="font-bold text-noir">{p.client_name}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-tarantino">{p.video_title}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyLink('client', p.id)} className="text-[10px] font-bold uppercase tracking-widest text-noir/50 hover:text-noir active:scale-95 transition-transform">{copiedId === `client-${p.id}` ? 'Copied!' : 'Copy Link'}</button>
                        <button onClick={() => deleteProject(p.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 active:scale-95 transition-transform">Delete</button>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && <div className="text-sm font-medium text-noir/40">No clients yet.</div>}
                </div>
              </div>

              {/* Editors */}
              <div>
                <h3 className="font-heading text-xl md:text-2xl font-black uppercase tracking-tighter text-noir mb-6 border-b-2 border-noir/10 pb-2">Editor Accounts</h3>
                <div className="flex flex-col gap-4">
                  {childEditors.map(e => (
                    <div key={e.id} className="p-4 border-2 border-noir/10 flex justify-between items-center hover:border-noir transition-colors bg-white/50">
                      <div>
                        <div className="font-bold text-noir">{e.name}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-noir/50">ID: {e.custom_id}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyLink('editor', e.custom_id)} className="text-[10px] font-bold uppercase tracking-widest text-noir/50 hover:text-noir active:scale-95 transition-transform">{copiedId === `editor-${e.custom_id}` ? 'Copied!' : 'Copy Link'}</button>
                        <button onClick={() => deleteEditor(e.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 active:scale-95 transition-transform">Delete</button>
                      </div>
                    </div>
                  ))}
                  {childEditors.length === 0 && <div className="text-sm font-medium text-noir/40">No child editors yet.</div>}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
