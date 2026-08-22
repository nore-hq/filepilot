'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InvoiceManager from '../../../../components/InvoiceManager';

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

const CP = 'polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))';
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

const circuitBg = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,80 L100,80 L100,60 L180,60 L180,80 L400,80' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,200 L60,200 L60,180 L140,180 L140,200 L260,200 L260,220 L400,220' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M0,320 L120,320 L120,300 L200,300 L200,320 L400,320' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M80,0 L80,60' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M200,0 L200,80 L200,180' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Cpath d='M320,0 L320,100 L320,220 L320,400' stroke='rgba(255,79,0,0.1)' fill='none' stroke-width='0.8'/%3E%3Ccircle cx='100' cy='80' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='180' cy='60' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='60' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='140' cy='180' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='260' cy='200' r='3' fill='rgba(255,79,0,0.1)'/%3E%3Ccircle cx='120' cy='320' r='3' fill='rgba(255,79,0,0.1)'/%3E%3C/svg%3E")`;

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'wss://nore-realtime-engine.norehq01.workers.dev';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'workplace'|'create_client'|'create_editor'|'accounts'|'master'>('workplace');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [childEditors, setChildEditors] = useState<ChildEditor[]>([]);
  
  const [newClientName, setNewClientName] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  
  const [newEditorName, setNewEditorName] = useState('');
  const [newEditorId, setNewEditorId] = useState('');

  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const [localAuth, setLocalAuth] = useState<Record<string, { chat?: boolean, deliver?: boolean, invoice?: boolean }>>({});
  
  const [justCreatedClient, setJustCreatedClient] = useState<Project | null>(null);
  const [justCreatedEditor, setJustCreatedEditor] = useState<ChildEditor | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'chat' | 'billing'>('chat');
  const [chatTarget, setChatTarget] = useState<'client' | 'editor' | 'all'>('client');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [mounted, setMounted] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Master Metrics & State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [metrics, setMetrics] = useState({ totalProjects: 0, totalEditors: 0, avgProgress: 0 });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); fetchData(); }, []);

  const fetchData = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { router.push('/portal/login'); return; }
    
    if (u.user.email === 'adminmaster@norehq.com') {
      setIsSuperAdmin(true);
      setActiveTab('master');
    }
    
    const [projRes, edRes, maintRes] = await Promise.all([
      supabase.from('projects').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('child_editors').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('app_settings').select('maintenance_mode').eq('id', 1).single()
    ]);

    if (projRes.data) {
      setProjects(projRes.data);
      const totalP = projRes.data.length;
      const avgP = totalP > 0 ? Math.round(projRes.data.reduce((acc, p) => acc + p.progress, 0) / totalP) : 0;
      setMetrics(prev => ({ ...prev, totalProjects: totalP, avgProgress: avgP }));
    }
    if (edRes.data) {
      setChildEditors(edRes.data);
      setMetrics(prev => ({ ...prev, totalEditors: edRes.data.length }));
    }
    if (maintRes.data) {
      setMaintenanceMode(maintRes.data.maintenance_mode);
      if (maintRes.data.maintenance_mode && u.user.email !== 'adminmaster@norehq.com') {
        router.push('/maintenance');
        return;
      }
    }
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    setMaintenanceMode(newVal);
    await supabase.from('app_settings').update({ maintenance_mode: newVal }).eq('id', 1);
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
              setProjects((prev) => prev.map(p => p.id === payload.project_id ? { ...p, editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver, editor_can_invoice: payload.editor_can_invoice } : p));
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
      setMetrics(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
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
      setMetrics(prev => ({ ...prev, totalEditors: prev.totalEditors + 1 }));
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
        if (payload.type === 'progress') supabase.from('projects').update({ progress: payload.value }).eq('id', projectId);
        if (payload.type === 'delivery') supabase.from('projects').update({ delivery_link: payload.link }).eq('id', projectId);
        if (payload.type === 'authority_update') supabase.from('projects').update({ editor_can_chat: payload.editor_can_chat, editor_can_deliver: payload.editor_can_deliver, editor_can_invoice: payload.editor_can_invoice }).eq('id', projectId);
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
    const invoice = authState.invoice !== undefined ? authState.invoice : p.editor_can_invoice;

    const updated = { ...p, editor_can_chat: chat, editor_can_deliver: deliver, editor_can_invoice: invoice };
    setProjects(projects.map(proj => proj.id === id ? updated : proj));

    const newLocal = { ...localAuth };
    delete newLocal[id];
    setLocalAuth(newLocal);

    // Save directly to Supabase since the worker might not know about editor_can_invoice
    await supabase.from('projects').update({ editor_can_chat: chat, editor_can_deliver: deliver, editor_can_invoice: invoice }).eq('id', id);

    await broadcastToRoom(id, {
      type: 'authority_update',
      project_id: id,
      editor_can_chat: chat,
      editor_can_deliver: deliver,
      editor_can_invoice: invoice
    });
  };

  const finalizeLink = async (projectId: string, link: string) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, delivery_link: link, editor_proposed_link: null } : p));
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
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setActiveChatProjectId(null);
    }
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
    const link = `${window.location.origin}/${type}/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProjects = projects.filter(p => 
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.video_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-parchment font-sans" style={{ cursor: 'auto', backgroundImage: circuitBg }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col h-screen overflow-hidden">
        
        {/* Header & Tabs */}
        <div className={`shrink-0 mb-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-heading text-3xl md:text-4xl font-black uppercase tracking-tighter text-noir leading-none">
              Agency <span className="text-tarantino italic">Portal</span>
            </h1>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/portal/login'); }} className="text-xs font-bold uppercase tracking-widest text-noir/50 hover:text-tarantino transition-colors active:scale-95">
              Sign Out
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 border-b-2 border-noir/10">
            {(isSuperAdmin ? ['master'] : ['workplace', 'create_client', 'create_editor', 'accounts']).map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setJustCreatedClient(null); setJustCreatedEditor(null); }}
                className={`pb-2 px-1 font-bold uppercase tracking-widest text-xs md:text-sm whitespace-nowrap border-b-2 transition-all active:scale-95 ${activeTab === tab ? 'border-tarantino text-tarantino' : 'border-transparent text-noir/40 hover:text-noir'}`}
              >
                {tab === 'master' ? 'Master Admin' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content (Fills remaining height) */}
        <div className={`flex-1 overflow-hidden transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          
          {/* WORKPLACE (Master-Detail) */}
          {activeTab === 'workplace' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full pb-4">
              
              {/* SIDEBAR: Master List */}
              <div className={`flex-col w-full lg:w-[35%] shrink-0 h-full ${selectedProjectId ? 'hidden lg:flex' : 'flex'}`}>
                {/* Search Bar */}
                <div className="mb-4 shrink-0 relative">
                  <input 
                    type="text" 
                    placeholder="SEARCH CLIENTS..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-noir/5 border-b-2 border-noir/10 pl-10 pr-4 py-3 text-xs uppercase font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/30"
                  />
                  <svg className="w-4 h-4 text-noir/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                {/* Project List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {filteredProjects.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => { setSelectedProjectId(p.id); setActiveChatProjectId(p.id); }}
                      className={`p-4 cursor-pointer border-l-4 transition-all group ${selectedProjectId === p.id ? 'border-tarantino bg-tarantino/10' : 'border-noir/10 bg-noir/5 hover:border-tarantino/50 hover:bg-noir/10'}`}
                      style={{ clipPath: CPS }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`font-black text-lg leading-tight transition-colors ${selectedProjectId === p.id ? 'text-tarantino' : 'text-noir group-hover:text-tarantino'}`}>{p.client_name}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50">{p.video_title}</p>
                        </div>
                        {p.editor_proposed_link && !p.editor_can_deliver && (
                          <span className="w-2 h-2 rounded-full bg-tarantino animate-pulse mt-1" title="Action Required" />
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-noir/40 bg-noir/5 px-2 py-1">
                          {p.assigned_editor_id ? childEditors.find(e => e.id === p.assigned_editor_id)?.name || 'Unknown' : 'Unassigned'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-noir/60">{p.progress}%</span>
                          <div className="w-16 h-1 bg-noir/10 overflow-hidden">
                            <div className="h-full bg-tarantino" style={{ width: `${p.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProjects.length === 0 && (
                    <div className="text-center py-10 text-[10px] font-bold uppercase tracking-widest text-noir/40">No clients match search.</div>
                  )}
                </div>
              </div>

              {/* MAIN CONTENT: Detail View */}
              <div className={`w-full lg:w-[65%] h-full flex-col ${selectedProjectId ? 'flex' : 'hidden lg:flex'}`}>
                {!selectedProjectId ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-noir/10 bg-noir/5">
                    <p className="text-sm font-bold uppercase tracking-widest text-noir/30 text-center">Select a client from the list<br/>to manage their workspace</p>
                  </div>
                ) : (
                  (() => {
                    const project = projects.find(p => p.id === selectedProjectId);
                    if (!project) return null;
                    
                    const currentProg = localProgress[project.id] !== undefined ? localProgress[project.id] : project.progress;
                    const isProgChanged = localProgress[project.id] !== undefined && localProgress[project.id] !== project.progress;
                    const authChat = localAuth[project.id]?.chat !== undefined ? localAuth[project.id]!.chat! : project.editor_can_chat;
                    const authDeliver = localAuth[project.id]?.deliver !== undefined ? localAuth[project.id]!.deliver! : project.editor_can_deliver;
                    const authInvoice = localAuth[project.id]?.invoice !== undefined ? localAuth[project.id]!.invoice! : project.editor_can_invoice;
                    const isAuthChanged = (localAuth[project.id]?.chat !== undefined && localAuth[project.id]!.chat !== project.editor_can_chat) || 
                                          (localAuth[project.id]?.deliver !== undefined && localAuth[project.id]!.deliver !== project.editor_can_deliver) ||
                                          (localAuth[project.id]?.invoice !== undefined && localAuth[project.id]!.invoice !== project.editor_can_invoice);

                    return (
                      <CyberFrame className="h-full flex flex-col" contentClassName="flex flex-col h-full">
                        {/* Mobile Back Button */}
                        <div className="lg:hidden bg-noir px-4 py-3 flex items-center">
                           <button onClick={() => { setSelectedProjectId(null); setActiveChatProjectId(null); }} className="text-[10px] text-parchment font-bold uppercase tracking-widest flex items-center gap-2 hover:text-tarantino">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                             Back to List
                           </button>
                        </div>

                        {/* Top Section: Settings & Progress */}
                        <div className="p-4 md:p-6 shrink-0 bg-white" style={{ borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                              <h2 className="text-2xl md:text-3xl font-black text-noir tracking-tight leading-none mb-1">{project.client_name}</h2>
                              <p className="text-xs font-bold uppercase tracking-widest text-tarantino">{project.video_title}</p>
                            </div>
                            
                            {/* Editor Assignment */}
                            <div className="flex flex-col items-start md:items-end gap-2 bg-noir/5 p-3 w-full md:w-auto" style={{ clipPath: CPS }}>
                              <select 
                                value={project.assigned_editor_id || 'none'}
                                onChange={(e) => assignEditor(project.id, e.target.value)}
                                className="bg-white border border-noir/10 text-noir text-[10px] font-bold uppercase tracking-widest rounded-none px-2 py-1.5 outline-none focus:border-tarantino w-full md:w-48"
                              >
                                <option value="none">-- Assign Editor --</option>
                                {childEditors.map(ed => (
                                  <option key={ed.id} value={ed.id}>{ed.name}</option>
                                ))}
                              </select>
                              
                              {project.assigned_editor_id && (
                                <div className="flex flex-col items-start md:items-end gap-1 w-full mt-2">
                                  <label className="text-[9px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer">
                                    <span>Allow Chat with Client</span>
                                    <input type="checkbox" checked={authChat} onChange={(e) => setLocalAuth({ ...localAuth, [project.id]: { ...localAuth[project.id], chat: e.target.checked } })} className="accent-tarantino" />
                                  </label>
                                  <label className="text-[9px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer">
                                    <span>Allow Final Delivery</span>
                                    <input type="checkbox" checked={authDeliver} onChange={(e) => setLocalAuth({ ...localAuth, [project.id]: { ...localAuth[project.id], deliver: e.target.checked } })} className="accent-tarantino" />
                                  </label>
                                  <label className="text-[9px] uppercase font-bold text-noir/70 flex items-center gap-2 cursor-pointer">
                                    <span>Allow Invoicing</span>
                                    <input type="checkbox" checked={authInvoice} onChange={(e) => setLocalAuth({ ...localAuth, [project.id]: { ...localAuth[project.id], invoice: e.target.checked } })} className="accent-tarantino" />
                                  </label>
                                  {isAuthChanged && (
                                    <button onClick={() => confirmAuth(project.id)} className="w-full bg-tarantino text-white px-2 py-1.5 mt-1 text-[9px] font-bold uppercase tracking-widest hover:bg-noir transition-colors">
                                      Save Auth
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress & Delivery */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Progress */}
                            <div>
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Progress</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-noir">{currentProg}%</span>
                                  {isProgChanged && (
                                    <button onClick={() => confirmProgress(project.id)} className="bg-tarantino text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-noir transition-all">Save</button>
                                  )}
                                </div>
                              </div>
                              <input type="range" min="0" max="100" value={currentProg} onChange={(e) => handleLocalProgressChange(project.id, parseInt(e.target.value))} className="w-full h-1.5 bg-noir/10 appearance-none cursor-ew-resize accent-tarantino" />
                            </div>

                            {/* Delivery Link */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-noir/50 block mb-2">Final Delivery Link</span>
                              <div className="flex gap-2">
                                <input type="text" value={project.delivery_link || ''} onChange={(e) => updateDeliveryLink(project.id, e.target.value)} placeholder="https://..." className="flex-1 bg-white border border-noir/10 px-2 py-1.5 text-xs font-medium text-noir outline-none focus:border-tarantino transition-colors" />
                                <button onClick={() => saveDeliveryLink(project.id)} className="bg-noir text-parchment px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-tarantino transition-colors" style={{ clipPath: CPS }}>Save</button>
                              </div>
                              {project.editor_proposed_link && !project.editor_can_deliver && (
                                <div className="mt-2 p-2 border border-tarantino/30 bg-tarantino/10 flex flex-col gap-1.5">
                                  <span className="text-[9px] font-bold uppercase text-tarantino tracking-widest">Editor Proposed:</span>
                                  <a href={project.editor_proposed_link} target="_blank" className="text-[10px] text-noir underline break-all font-medium">{project.editor_proposed_link}</a>
                                  <button onClick={() => finalizeLink(project.id, project.editor_proposed_link!)} className="bg-tarantino text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-noir transition-colors self-start mt-1">Finalize</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Chat or Billing (Takes up remaining height) */}
                        <div className="flex-1 flex flex-col min-h-0 bg-parchment relative">
                          {/* Tabs for Workspace */}
                          <div className="flex absolute -top-8 left-4 gap-2 z-10">
                            <button onClick={() => setActiveWorkspaceTab('chat')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeWorkspaceTab === 'chat' ? 'bg-noir text-parchment' : 'bg-white text-noir border border-b-0 border-noir/10 hover:bg-noir/5'}`} style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                              Communication
                            </button>
                            <button onClick={() => setActiveWorkspaceTab('billing')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeWorkspaceTab === 'billing' ? 'bg-noir text-parchment' : 'bg-white text-noir border border-b-0 border-noir/10 hover:bg-noir/5'}`} style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                              Billing & Invoices
                            </button>
                          </div>

                          {activeWorkspaceTab === 'chat' ? (
                            <div className="flex-1 flex flex-col min-h-0">
                              <div className="flex border-b-2 border-noir/10 shrink-0">
                                {project.editor_can_chat ? (
                                  <div className="flex-1 p-2 bg-noir/5 text-center text-[10px] font-bold uppercase tracking-widest text-noir">Unified Group Chat</div>
                                ) : (
                                  <>
                                    <button onClick={() => setChatTarget('client')} className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${chatTarget === 'client' ? 'bg-noir text-parchment' : 'bg-transparent text-noir hover:bg-noir/5'}`}>Client Chat</button>
                                    {project.assigned_editor_id && (
                                      <button onClick={() => setChatTarget('editor')} className={`flex-1 p-2 border-l-2 border-noir/10 text-[10px] font-bold uppercase tracking-widest transition-colors ${chatTarget === 'editor' ? 'bg-tarantino text-white' : 'bg-transparent text-noir hover:bg-noir/5'}`}>Editor Chat</button>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-parchment/30">
                                {chatMessages.length === 0 && <div className="text-center text-noir/40 text-[10px] font-bold uppercase tracking-widest my-auto">No messages yet.</div>}
                                {chatMessages.filter(m => project.editor_can_chat || m.target_role === chatTarget || m.target_role === 'all' || (m.sender_role === chatTarget)).map((msg) => {
                                  const isAdmin = msg.sender_role === 'admin';
                                  return (
                                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                      <span className="text-[9px] uppercase tracking-widest text-noir/40 font-bold mb-1">{msg.sender_role}</span>
                                      <div className={`px-4 py-2.5 text-sm max-w-[85%] font-medium ${isAdmin ? 'bg-noir text-parchment' : 'bg-parchment border border-noir/10 text-noir'}`} style={{ clipPath: CPS }}>
                                        {msg.message_text}
                                      </div>
                                    </div>
                                  );
                                })}
                                <div ref={chatEndRef} />
                              </div>

                              <form onSubmit={sendMessage} className="p-3 border-t-2 border-noir/10 flex gap-2 bg-parchment shrink-0">
                                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message ${project.editor_can_chat ? 'everyone' : chatTarget}...`} className="flex-1 bg-white border border-noir/10 px-3 py-2 text-sm font-medium text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/30" />
                                <button type="submit" disabled={!wsConnected || !chatInput.trim()} className="bg-tarantino text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-noir transition-colors disabled:opacity-50" style={{ clipPath: CPS }}>Send</button>
                              </form>
                            </div>
                          ) : (
                            <InvoiceManager 
                              projectId={project.id} 
                              adminId={project.admin_id} 
                              role="admin" 
                              clientName={project.client_name} 
                              videoTitle={project.video_title} 
                            />
                          )}
                        </div>

                      </CyberFrame>
                    );
                  })()
                )}
              </div>

            </div>
          )}

          {/* CREATE CLIENT (Scrollable if needed) */}
          {activeTab === 'create_client' && (
            <div className="max-w-md overflow-y-auto h-full pb-8">
              <CyberFrame>
                {justCreatedClient ? (
                  <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
                    <div className="text-4xl text-green-500 mb-2">✓</div>
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Dashboard Created!</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-noir/70">Copy this link and give to your client to access their dashboard.</p>
                    
                    <div className="bg-noir/5 p-4 border border-noir/10 flex flex-col gap-2">
                      <code className="text-xs text-noir break-all">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://filepilot.norehq.com'}/client/{justCreatedClient.id}
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
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/10 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Nike" required />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70 mb-2">Video Title</label>
                      <input type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/10 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Summer Campaign" required />
                    </div>
                    <button type="submit" className="mt-4 bg-tarantino text-white py-3 font-bold uppercase tracking-widest hover:bg-noir hover:-translate-y-0.5 active:scale-95 transition-all" style={{ clipPath: CPS }}>Create Dashboard</button>
                  </form>
                )}
              </CyberFrame>
            </div>
          )}

          {/* CREATE EDITOR */}
          {activeTab === 'create_editor' && (
            <div className="max-w-md overflow-y-auto h-full pb-8">
              <CyberFrame>
                {justCreatedEditor ? (
                  <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
                    <div className="text-4xl text-green-500 mb-2">✓</div>
                    <h2 className="text-xl md:text-2xl font-black text-noir tracking-tight">Editor Account Created!</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-noir/70">Copy this link and give to your editor to access their dashboard.</p>
                    
                    <div className="bg-noir/5 p-4 border border-noir/10 flex flex-col gap-2">
                      <code className="text-xs text-noir break-all">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://filepilot.norehq.com'}/editor/{justCreatedEditor.custom_id}
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
                      <input type="text" value={newEditorName} onChange={(e) => setNewEditorName(e.target.value)} className="w-full bg-transparent border-b-2 border-noir/10 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. Alex" required />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-noir/70">Custom ID</label>
                        <button type="button" onClick={() => setNewEditorId('ed_' + Math.random().toString(36).substring(2, 8))} className="text-[10px] text-tarantino font-bold uppercase tracking-widest active:scale-95 hover:opacity-80">Generate</button>
                      </div>
                      <input type="text" value={newEditorId} onChange={(e) => setNewEditorId(e.target.value.replace(/\s+/g, '-').toLowerCase())} className="w-full bg-transparent border-b-2 border-noir/10 py-2 text-lg md:text-xl font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/20" placeholder="e.g. alex-cuts" required />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto h-full pb-8 pr-2 custom-scrollbar">
              
              {/* Clients */}
              <div>
                <h3 className="font-heading text-2xl font-black uppercase tracking-tighter text-noir mb-6 border-b-2 border-noir/10 pb-2">Client Accounts</h3>
                <div className="flex flex-col gap-4">
                  {projects.map(p => (
                    <div key={p.id} className="p-4 border-2 border-noir/10 flex justify-between items-center hover:border-noir transition-colors bg-white">
                      <div>
                        <div className="font-bold text-noir">{p.client_name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-tarantino">{p.video_title}</div>
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
                    <div key={e.id} className="p-4 border-2 border-noir/10 flex justify-between items-center hover:border-noir transition-colors bg-white">
                      <div>
                        <div className="font-bold text-noir">{e.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">ID: {e.custom_id}</div>
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

          {/* MASTER ADMIN */}
          {activeTab === 'master' && (
            <div className="max-w-4xl mx-auto h-full pb-8">
              <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir mb-6">Global Metrics & Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <CyberFrame>
                  <div className="p-6 text-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-noir/50 mb-2">Total Projects</div>
                    <div className="text-4xl font-black text-tarantino">{metrics.totalProjects}</div>
                  </div>
                </CyberFrame>
                <CyberFrame>
                  <div className="p-6 text-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-noir/50 mb-2">Total Editors</div>
                    <div className="text-4xl font-black text-tarantino">{metrics.totalEditors}</div>
                  </div>
                </CyberFrame>
                <CyberFrame>
                  <div className="p-6 text-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-noir/50 mb-2">Avg. Progress</div>
                    <div className="text-4xl font-black text-tarantino">{metrics.avgProgress}%</div>
                  </div>
                </CyberFrame>
              </div>

              <CyberFrame>
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-black uppercase text-noir">Maintenance Mode</h3>
                      {maintenanceMode && (
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-noir/60 max-w-md">
                      When enabled, all visitors to the Client Portal and Editor Portal will be automatically redirected to a "Server under maintenance" page. You can still access the Agency Portal to manage settings.
                    </p>
                  </div>
                  <button 
                    onClick={toggleMaintenance}
                    className={`px-8 py-4 font-bold uppercase tracking-widest text-xs transition-all active:scale-95 ${maintenanceMode ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-noir text-parchment hover:bg-tarantino'}`}
                    style={{ clipPath: CPS }}
                  >
                    {maintenanceMode ? 'DISABLE MAINTENANCE' : 'ENABLE MAINTENANCE'}
                  </button>
                </div>
              </CyberFrame>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
