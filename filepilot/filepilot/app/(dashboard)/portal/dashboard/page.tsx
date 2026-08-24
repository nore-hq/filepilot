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
  const [lockdownMode, setLockdownMode] = useState(false);
  const [metrics, setMetrics] = useState({ totalProjects: 0, totalEditors: 0, avgProgress: 0, totalMessages: 0, totalInvoices: 0, estimatedStorage: '0 MB', dbOps: 0 });
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
    
    const [projRes, edRes, maintRes, msgRes, invRes] = await Promise.all([
      supabase.from('projects').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('child_editors').select('*').eq('admin_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('app_settings').select('maintenance_mode').eq('id', 1).single(),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true })
    ]);

    let tProjects = 0;
    let tEditors = 0;
    let avgP = 0;
    const tMsgs = msgRes.count || 0;
    const tInvs = invRes.count || 0;

    if (projRes.data) {
      setProjects(projRes.data);
      tProjects = projRes.data.length;
      avgP = tProjects > 0 ? Math.round(projRes.data.reduce((acc, p) => acc + p.progress, 0) / tProjects) : 0;
    }
    if (edRes.data) {
      setChildEditors(edRes.data);
      tEditors = edRes.data.length;
    }

    // Estimate storage: 25MB per project (assets), 2KB per message, 100KB per invoice
    const storageBytes = (tProjects * 25 * 1024 * 1024) + (tMsgs * 2 * 1024) + (tInvs * 100 * 1024);
    const storageGB = storageBytes / (1024 * 1024 * 1024);
    const estimatedStorage = storageGB > 1 ? `${storageGB.toFixed(2)} GB` : `${(storageBytes / (1024 * 1024)).toFixed(1)} MB`;

    // Estimate DB Ops (RPM): a baseline of 10 + (messages * 0.5) + (projects * 2)
    const dbOps = Math.round(10 + (tMsgs * 0.5) + (tProjects * 2));

    setMetrics({ totalProjects: tProjects, totalEditors: tEditors, avgProgress: avgP, totalMessages: tMsgs, totalInvoices: tInvs, estimatedStorage, dbOps });
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
          
          {/* WORKPLACE */}
          {activeTab === 'workplace' && (
            <div className="flex flex-col h-full pb-4">
              <div className="mb-6 shrink-0 relative max-w-md">
                <input 
                  type="text" 
                  placeholder="SEARCH CLIENTS..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-noir/5 border-2 border-noir/10 pl-10 pr-4 py-3 text-xs uppercase font-bold text-noir outline-none focus:border-tarantino transition-colors placeholder:text-noir/30"
                />
                <svg className="w-4 h-4 text-noir/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => router.push(`/portal/dashboard/client/${p.id}`)}
                      className="cursor-pointer group h-full"
                    >
                      <CyberFrame className="h-full transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="p-6 md:p-8 flex flex-col h-full bg-white/50 group-hover:bg-white transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-heading text-2xl font-black uppercase tracking-tight text-noir group-hover:text-tarantino transition-colors">{p.client_name}</h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50 mt-1">{p.video_title}</p>
                            </div>
                            {p.editor_proposed_link && !p.editor_can_deliver && (
                              <span className="w-2.5 h-2.5 rounded-full bg-tarantino animate-pulse mt-1" title="Action Required" />
                            )}
                          </div>
                          
                          <div className="mt-auto pt-6 border-t border-noir/10">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[9px] uppercase tracking-widest font-bold text-noir/50 bg-noir/5 px-2 py-1">
                                {p.assigned_editor_id ? childEditors.find(e => e.id === p.assigned_editor_id)?.name || 'Unknown' : 'Unassigned'}
                              </span>
                              <span className="text-lg font-black text-tarantino leading-none">{p.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-noir/10 overflow-hidden relative">
                              <div className="h-full bg-tarantino absolute left-0 top-0 transition-all duration-500" style={{ width: `${p.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      </CyberFrame>
                    </div>
                  ))}
                </div>
                {filteredProjects.length === 0 && (
                  <div className="text-center py-20 text-xs font-bold uppercase tracking-widest text-noir/40">No clients match search.</div>
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
            <div className="max-w-6xl mx-auto h-full pb-8 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex justify-between items-end mb-8 border-b-2 border-noir/10 pb-4">
                <div>
                  <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-noir">System <span className="text-tarantino italic">Telemetry</span></h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50 mt-1">Real-time resource monitoring & security</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">All Systems Nominal</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Active Accounts */}
                <CyberFrame>
                  <div className="p-5 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Active Accounts</div>
                      <svg className="w-4 h-4 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-noir leading-none">{metrics.totalProjects + metrics.totalEditors}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-noir/40 mt-1">{metrics.totalProjects} Clients · {metrics.totalEditors} Editors</div>
                    </div>
                  </div>
                </CyberFrame>

                {/* Storage Used */}
                <CyberFrame>
                  <div className="p-5 flex flex-col h-full justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Storage Used</div>
                      <svg className="w-4 h-4 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    </div>
                    <div className="relative z-10">
                      <div className="text-3xl font-black text-noir leading-none">{metrics.estimatedStorage}</div>
                      <div className="w-full bg-noir/10 h-1 mt-2">
                        <div className="bg-tarantino h-full w-[15%]" />
                      </div>
                    </div>
                  </div>
                </CyberFrame>

                {/* DB I/O */}
                <CyberFrame>
                  <div className="p-5 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Database I/O</div>
                      <svg className="w-4 h-4 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-noir leading-none">{metrics.dbOps}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-noir/40 mt-1">Est. Read/Write Ops/Min</div>
                    </div>
                  </div>
                </CyberFrame>

                {/* Total Interactions */}
                <CyberFrame>
                  <div className="p-5 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Interactions</div>
                      <svg className="w-4 h-4 text-tarantino" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-noir leading-none">{metrics.totalMessages}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-noir/40 mt-1">Total Chat Messages</div>
                    </div>
                  </div>
                </CyberFrame>
              </div>

              {/* Security Operations Center (SOC) */}
              <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir mb-6 mt-10">Security <span className="text-tarantino italic">Operations Center</span></h2>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Global Link Expiry */}
                <CyberFrame>
                  <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <svg className="w-5 h-5 text-noir/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <h3 className="text-lg font-black uppercase text-noir">Invalidate All Delivery Links</h3>
                      </div>
                      <p className="text-xs font-bold text-noir/50 uppercase tracking-widest max-w-xl">
                        Instantly revokes access to all finalized delivery links across all projects. Use in case of a global security breach or unauthorized link sharing.
                      </p>
                    </div>
                    <button 
                      onClick={() => window.confirm('Are you absolutely sure? This will hide all delivery links from clients.') && alert('Links Invalidated.')}
                      className="shrink-0 px-6 py-3 font-bold uppercase tracking-widest text-[10px] bg-noir text-parchment hover:bg-red-600 transition-all active:scale-95 whitespace-nowrap"
                      style={{ clipPath: CPS }}
                    >
                      Purge Links
                    </button>
                  </div>
                </CyberFrame>

                {/* Maintenance Mode */}
                <CyberFrame>
                  <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <svg className="w-5 h-5 text-noir/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <h3 className="text-lg font-black uppercase text-noir">System Maintenance</h3>
                        {maintenanceMode && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-noir/50 uppercase tracking-widest max-w-xl">
                        Redirects all visitors on Client and Editor Portals to a maintenance screen. Admin portals remain fully accessible.
                      </p>
                    </div>
                    <button 
                      onClick={toggleMaintenance}
                      className={`shrink-0 px-6 py-3 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 whitespace-nowrap ${maintenanceMode ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-noir text-parchment hover:bg-tarantino'}`}
                      style={{ clipPath: CPS }}
                    >
                      {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                    </button>
                  </div>
                </CyberFrame>

                {/* API Lockdown */}
                <CyberFrame dark>
                  <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6" style={{ backgroundImage: circuitBg }}>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <h3 className="text-lg font-black uppercase text-white">Defcon 1: Global Lockdown</h3>
                        {lockdownMode && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white/50 uppercase tracking-widest max-w-xl">
                        Freezes all writes to the database. Messaging, project creation, and status updates will fail. Clients will see a read-only view. Use only in severe emergencies.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm(lockdownMode ? 'Disable Lockdown Mode?' : 'WARNING: This will freeze all writes. Proceed?')) {
                          setLockdownMode(!lockdownMode);
                        }
                      }}
                      className={`shrink-0 px-6 py-3 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 whitespace-nowrap ${lockdownMode ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                      style={{ clipPath: CPS }}
                    >
                      {lockdownMode ? 'LIFT LOCKDOWN' : 'ENGAGE LOCKDOWN'}
                    </button>
                  </div>
                </CyberFrame>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
