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
    editor_can_invoice BOOLEAN DEFAULT false,
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

-- 4. Invoices Table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by_role TEXT CHECK (created_by_role IN ('admin', 'editor')) NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency_symbol TEXT DEFAULT '₹',
    status TEXT DEFAULT 'pending',
    items JSONB NOT NULL, -- Array of { description, quantity, rate, total }
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Invoice Presets Table
CREATE TABLE public.invoice_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preset_name TEXT NOT NULL,
    items_json JSONB NOT NULL, -- Array of default line items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.child_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_presets ENABLE ROW LEVEL SECURITY;

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

-- Policies: Invoices
CREATE POLICY "Public access for invoices" ON public.invoices
    FOR ALL USING (true); -- Dashboard/Portal controls access via Project ID

-- Policies: Invoice Presets
CREATE POLICY "Admins manage own invoice presets" ON public.invoice_presets
    FOR ALL USING (admin_id = auth.uid());

CREATE POLICY "Public read for invoice presets" ON public.invoice_presets
    FOR SELECT USING (true); -- Editors need to read admin presets

-- 4. App Settings Table (Global Maintenance Mode)
CREATE TABLE public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    maintenance_mode BOOLEAN DEFAULT false
);

INSERT INTO public.app_settings (id, maintenance_mode) VALUES (1, false);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for settings" ON public.app_settings
    FOR SELECT USING (true);

CREATE POLICY "Master admin updates settings" ON public.app_settings
    FOR UPDATE USING (
        (auth.jwt() ->> 'email')::text = 'adminmaster@norehq.com'
    );
