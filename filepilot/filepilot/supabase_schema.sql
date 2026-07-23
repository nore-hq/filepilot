-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to avoid "relation already exists" errors during setup
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;

-- 1. Agencies Table
CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Users Table (Extends Supabase Auth users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('owner', 'editor')) DEFAULT 'editor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Agencies: Users can only view their own agency
CREATE POLICY "Users can view their own agency" ON public.agencies
    FOR SELECT USING (id IN (SELECT agency_id FROM public.users WHERE users.id = auth.uid()));

-- Users: Users can view other users in the same agency
CREATE POLICY "Users can view users in same agency" ON public.users
    FOR SELECT USING (agency_id IN (SELECT agency_id FROM public.users WHERE users.id = auth.uid()));

-- Projects: Users can view and manage projects in their agency
CREATE POLICY "Users can access projects in their agency" ON public.projects
    FOR ALL USING (agency_id IN (SELECT agency_id FROM public.users WHERE users.id = auth.uid()));

-- Chat Messages: Users can read and write messages in their agency's projects
CREATE POLICY "Users can access messages in their agency's projects" ON public.chat_messages
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.projects WHERE agency_id IN (
                SELECT agency_id FROM public.users WHERE users.id = auth.uid()
            )
        )
 );
