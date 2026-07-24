-- WARNING: This will delete all existing data.
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.child_editors CASCADE;

-- 1. Child Editors Table (Sub-accounts created by Admin)
CREATE TABLE public.child_editors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    custom_id TEXT UNIQUE NOT NULL, -- Used for the login link (e.g., /editor/john123)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_editor_id UUID REFERENCES public.child_editors(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    video_title TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    delivery_link TEXT,
    editor_proposed_link TEXT,
    editor_can_chat BOOLEAN DEFAULT false,
    editor_can_deliver BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Messages Table
CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sender_role TEXT CHECK (sender_role IN ('admin', 'editor', 'client')) NOT NULL,
    target_role TEXT CHECK (target_role IN ('admin', 'editor', 'client', 'all')) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.child_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies: Child Editors
CREATE POLICY "Admins can manage their child editors" ON public.child_editors
    FOR ALL USING (admin_id = auth.uid());

-- Allow anyone with a custom ID to view the child editor profile (needed for login lookup)
CREATE POLICY "Public read for child editors" ON public.child_editors
    FOR SELECT USING (true);

-- Policies: Projects
CREATE POLICY "Admins can manage own projects" ON public.projects
    FOR ALL USING (admin_id = auth.uid());

CREATE POLICY "Public read for projects" ON public.projects
    FOR SELECT USING (true); -- Clients and editors need to read via ID

-- Policies: Messages
CREATE POLICY "Public access for messages" ON public.messages
    FOR ALL USING (true); -- Real-time chat handles target scoping logic
