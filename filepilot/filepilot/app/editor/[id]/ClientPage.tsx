'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Project = { 
  id: string; client_name: string; video_title: string; progress: number; 
};

const CP = 'polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))';

function CyberFrame({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ padding: '1.5px', clipPath: CP, background: dark ? 'linear-gradient(135deg, rgba(255,79,0,0.5), rgba(80,80,80,0.4), rgba(255,79,0,0.3))' : 'linear-gradient(135deg, rgba(160,160,160,0.5), rgba(255,79,0,0.2), rgba(160,160,160,0.45))' }}>
      <div style={{ clipPath: CP, background: dark ? '#1A1A1A' : 'rgba(241,239,231,0.93)' }} className="relative overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}

export default function EditorDashboard() {
  const router = useRouter();
  const paramsHook = useParams();
  const editorId = paramsHook?.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: editorData } = await supabase.from('child_editors').select('*').eq('custom_id', editorId).single();
      if (editorData) {
        const { data: projData } = await supabase.from('projects').select('*').eq('assigned_editor_id', editorData.id);
        if (projData) setProjects(projData);
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-parchment flex items-center justify-center font-bold text-noir/50">Loading Projects...</div>;

  return (
    <div className="min-h-screen bg-parchment font-sans py-10">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-tarantino mb-2">Editor Portal</p>
          <h1 className="text-3xl md:text-5xl font-black uppercase text-noir tracking-tighter leading-none">Your Clients</h1>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-20 text-noir/40 font-bold uppercase tracking-widest text-xs">No projects assigned to you.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => router.push(`/editor/${editorId}/project/${project.id}`)}
                className="cursor-pointer group"
              >
                <CyberFrame className="h-full transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="p-6 md:p-8 flex flex-col h-full">
                    <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-noir group-hover:text-tarantino transition-colors">{project.client_name}</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-noir/50 mt-1 mb-8">{project.video_title}</p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-noir/40">Progress</span>
                        <span className="text-lg font-black text-tarantino leading-none">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-noir/10 overflow-hidden relative">
                        <div className="h-full bg-tarantino absolute left-0 top-0 transition-all duration-500" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </CyberFrame>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
