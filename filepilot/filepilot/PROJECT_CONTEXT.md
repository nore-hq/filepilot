# FilePilot — Complete Project Context & Memory for Agents

> **IMPORTANT**: This document is the single source of truth for any agent working on FilePilot.
> Read this ENTIRE document before making any code changes.

---

## 1. Project Overview

**FilePilot** is a client-portal platform built by **Agency NORE** (NoreHQ) for media agencies and video editors. It replaces messy WhatsApp threads and scattered Google Drive links with a streamlined, real-time custom dashboard.

- **Production URL**: `https://filepilot.norehq.com`
- **Team**: ALOK K L (Founder & Lead Engineer), DHANANJAY MOHAN, RAM MADHAV M, KIRAN P MANOJ

### Core Value Proposition
- **For Editors**: A centralized place to manage client projects, update progress, deliver final video links (Google Drive/YouTube), and chat with clients.
- **For Clients**: A professional, passwordless custom dashboard (accessed via a unique magic link) to track video progress, receive delivery links, and chat with editors in real-time.
- **Business Model**: Free initially (Product-Led Growth), paid tiers later.

---

## 2. User Roles & Workflows

### A. Editor (Agency Side)
1. **Authentication**: Email/Password or Google OAuth via Supabase Auth.
2. **Dashboard** (`/dashboard`): Lists all active projects as cards.
3. **Create Client Dashboard**: Enter Client Name + Video Title → system generates a unique UUID-based shareable URL.
4. **Per-Project Actions**:
   - Adjust progress bar (0-100%).
   - Paste a delivery link (Google Drive, YouTube, etc.).
   - Click "Confirm" to save updates to Supabase.
   - Click "Link" to copy the client's unique dashboard URL.
   - Open real-time chat with the client.
   - Delete the project.

### B. Client
1. **Authentication**: Passwordless. Accesses dashboard via unique link: `https://filepilot.norehq.com/client/{project-uuid}`.
2. **Dashboard View**: Sees their name, video title, live progress bar, delivery link (when ready), and a real-time chat panel.
3. **Anonymous Auth**: If no Supabase session exists, the client is signed in anonymously to enable WebSocket chat.

### C. Agency Head (Future)
- RBAC: Assign client projects to specific editors.
- Oversight: View all projects and communications across the agency.

---

## 3. System Architecture

### Architecture Type: Edge-Hosted Hybrid (Serverless + Real-Time + Postgres)

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT BROWSER                                                 │
│  ┌───────────────────┐    ┌──────────────────────────────┐      │
│  │  Next.js Frontend │    │  WebSocket Connection         │      │
│  │  (React/Tailwind) │    │  (Chat Real-Time)            │      │
│  └────────┬──────────┘    └──────────────┬───────────────┘      │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐    ┌──────────────────────────────┐
│  CLOUDFLARE PAGES     │    │  CLOUDFLARE WORKERS +        │
│  (Serves Next.js)     │    │  DURABLE OBJECTS             │
│                       │    │  (nore-realtime-engine)      │
│  filepilot.norehq.com │    │  WebSocket chat rooms        │
└───────────────────────┘    │  Message broadcasting        │
                             │  Batch flush to Supabase DB  │
                             └──────────────┬───────────────┘
                                            │
                                            ▼
                             ┌──────────────────────────────┐
                             │  SUPABASE                    │
                             │  ┌────────────────────────┐  │
                             │  │  Auth (Email, Google,  │  │
                             │  │  Anonymous Sessions)   │  │
                             │  ├────────────────────────┤  │
                             │  │  PostgreSQL Database   │  │
                             │  │  (projects, messages,  │  │
                             │  │   users, agencies)     │  │
                             │  ├────────────────────────┤  │
                             │  │  Realtime (Postgres    │  │
                             │  │  Changes for progress  │  │
                             │  │  bar live updates)     │  │
                             │  └────────────────────────┘  │
                             └──────────────────────────────┘
```

### 3A. Cloudflare (Delivery & Real-Time Edge)

| Component | Purpose |
|---|---|
| **Cloudflare Pages** | Hosts the Next.js frontend. Serves React, HTML, CSS to the browser. |
| **Cloudflare Workers + Durable Objects** | The `nore-realtime-engine`. Each chat room spins up a unique Durable Object at the edge to keep state in-memory and broadcast WebSocket messages instantly between editor and client. |

### 3B. Supabase (Permanent Brain)

| Component | Purpose |
|---|---|
| **Auth** | All user logins, signups, session management. Anonymous sign-in for clients. |
| **PostgreSQL Database** | Permanent storage: projects, messages, user profiles, agencies. |
| **Supabase Realtime** | **NOT used for real-time anymore.** All live updates go through Cloudflare WebSocket. Supabase is strictly for persistence. |
| **Storage** (Future) | File/document uploads and downloads. |

### 3C. Data Flow

1. Client visits `filepilot.norehq.com` → served by **Cloudflare Pages**.
2. Editor logs in → verified by **Supabase Auth**.
3. Editor creates a project → row inserted into **Supabase PostgreSQL** `projects` table.
4. Editor copies unique link → sends to client.
5. Client opens link → anonymous sign-in via **Supabase Auth** to get a JWT token.
6. Both editor and client open a **WebSocket** to `wss://nore-realtime-engine.norehq01.workers.dev/chat/{projectId}?token={jwt}`.
7. The **Cloudflare Durable Object** broadcasts messages instantly to all connected WebSocket clients.
8. Chat messages are batch-flushed to **Supabase `messages` table** every 3 seconds by the Durable Object's alarm.
9. Progress and delivery link updates are written to **Supabase `projects` table** immediately by the Durable Object via raw `fetch()` (no SDK).

---

## 4. Credentials & Environment Variables

### Next.js Frontend (`.env.local`)
| Variable | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pjdtlbrfagtvxphqgukc.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (JWT) | Supabase anonymous public key |
| `NEXT_PUBLIC_REALTIME_URL` | *(not yet set — defaults to `ws://localhost:8787`)* | Cloudflare Workers WebSocket URL |

### Cloudflare Realtime Engine (`wrangler.toml` / `.dev.vars`)
| Variable | Value | Purpose |
|---|---|---|
| `SUPABASE_URL` | `https://pjdtlbrfagtvxphqgukc.supabase.co` | For batch-flushing messages to DB |
| `SUPABASE_SERVICE_ROLE_KEY` | **⚠️ NOT YET SET** (`your-service-role-key-here`) | Needed for server-side DB writes |

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` in both `wrangler.toml` and `.dev.vars` is still a placeholder. This MUST be set to the real service role key from the Supabase dashboard before chat message persistence will work.

---

## 5. Database Schema

### Current Schema (from `supabase_schema.sql`)

**⚠️ CRITICAL MISMATCH**: The SQL schema defines `projects` with columns `(id, agency_id, name, description)`, but the frontend code uses columns `(id, editor_id, client_name, video_title, progress, delivery_link)`. This schema-code mismatch is the most likely reason the "Create Dashboard" button silently fails.

| Table | Columns (as defined in SQL) | Columns (as used by frontend code) |
|---|---|---|
| `agencies` | `id`, `name`, `created_at`, `updated_at` | *(not directly used yet)* |
| `users` | `id` (→auth.users), `agency_id`, `email`, `full_name`, `role`, `created_at`, `updated_at` | *(not directly used yet)* |
| `projects` | `id`, `agency_id`, `name`, `description`, `created_at`, `updated_at` | `id`, `editor_id`, `client_name`, `video_title`, `progress`, `delivery_link`, `created_at` |
| `chat_messages` | `id`, `project_id`, `user_id`, `content`, `created_at` | *(frontend uses table name `messages` with columns: `project_id`, `sender_role`, `message_text`, `created_at`)* |

> [!WARNING]
> **Before anything else works, the Supabase database tables must be updated** to match what the frontend code actually expects. Either:
> 1. Alter the existing Supabase tables to add the missing columns (`editor_id`, `client_name`, `video_title`, `progress`, `delivery_link`), OR
> 2. Update the frontend code to match the existing schema.
> Option 1 is strongly recommended since the frontend already has the UI built.

### Required SQL to fix (Option 1 — recommended):
```sql
-- Drop and recreate projects table to match frontend
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    video_title TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    delivery_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sender_role TEXT CHECK (sender_role IN ('editor', 'client')) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow editors to manage their own projects
CREATE POLICY "Editors can manage own projects" ON public.projects
    FOR ALL USING (editor_id = auth.uid());

-- Allow anyone with the project UUID to view it (for client links)
CREATE POLICY "Clients can view projects by ID" ON public.projects
    FOR SELECT USING (true);

-- Allow anyone to read/write messages for accessible projects
CREATE POLICY "Users can access messages" ON public.messages
    FOR ALL USING (true);
```

---

## 6. Codebase File Map

### Repository Root: `c:\E_folder\AGENCY\filepilot\`

```
filepilot/                          ← Git root
├── .gitignore
├── filepilot/                      ← MISLEADING FOLDER (empty, just contains next level)
│   └── filepilot/                  ← ACTUAL NEXT.JS PROJECT ROOT
│       ├── .env.local              ← Supabase credentials
│       ├── package.json            ← Next.js 16.1.2, React 19, Supabase, GSAP, Framer Motion
│       ├── tailwind.config.js      ← Custom colors: parchment, tarantino, noir, burnt
│       ├── middleware.ts           ← Rewrites all routes to /portal/* prefix
│       ├── supabase_schema.sql     ← ⚠️ OUTDATED — does not match frontend
│       ├── app/
│       │   ├── layout.tsx          ← Root layout (Syne + Inter fonts, global CSS)
│       │   ├── globals.css         ← Global styles
│       │   ├── robots.ts           ← SEO robots config
│       │   ├── sitemap.ts          ← SEO sitemap
│       │   └── (dashboard)/portal/
│       │       ├── layout.tsx      ← Portal layout (SEO metadata, JSON-LD schema)
│       │       ├── login/
│       │       │   └── page.tsx    ← Login/Signup page (Email + Google OAuth)
│       │       ├── dashboard/
│       │       │   └── page.tsx    ← Editor dashboard (project cards, create modal, chat tray)
│       │       └── client/
│       │           └── [id]/
│       │               └── page.tsx ← Client dashboard (progress, deliverables, chat)
│       └── realtime-engine/        ← EMBEDDED copy (may be outdated)
│           ├── wrangler.toml
│           ├── src/
│           │   ├── index.ts        ← Worker entry: routes /room/:id to Durable Object
│           │   └── ChatRoom.ts     ← Durable Object: WebSocket, broadcast, batch flush
│
├── nore-realtime-engine/           ← PRIMARY Cloudflare Workers project
│   ├── wrangler.toml               ← Worker name: nore-realtime-engine
│   ├── package.json
│   └── src/                        ← (same structure as embedded copy)
│
└── filepilot@details/              ← Possibly design/spec docs (not explored)
```

> [!IMPORTANT]
> There are **two copies** of the realtime engine:
> 1. `c:\E_folder\AGENCY\filepilot\nore-realtime-engine\` — the PRIMARY, standalone one.
> 2. `c:\E_folder\AGENCY\filepilot\filepilot\filepilot\realtime-engine\` — an embedded copy inside the Next.js project.
> Always check which one is actively deployed and keep them in sync.

---

## 7. Design System

| Token | Value | Usage |
|---|---|---|
| `parchment` | `#F1EFE7` | Light background, text on dark |
| `tarantino` | `#FF4F00` | Primary accent (buttons, highlights, progress bars) |
| `noir` | `#1A1A1A` | Dark backgrounds, primary text |
| `burnt` | `#C2410C` | Secondary accent |
| Heading font | `Syne` (via `--font-syne`) | All headings, uppercase + tight tracking |
| Body font | `Inter` | Body text |

**Visual Style**: Cyberpunk-inspired with beveled clip-path frames (`polygon()`), circuit-board SVG backgrounds, corner accent borders, and subtle glow effects (`box-shadow` with tarantino color).

---

## 8. Known Issues & TODOs

| # | Issue | Severity | Details |
|---|---|---|---|
| 1 | ~~**DB schema mismatch**~~ | ✅ FIXED | SQL provided to recreate tables matching frontend code. |
| 2 | ~~**Service Role Key not set**~~ | ⚠️ ACTION | Must set via `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` before deploying Worker. |
| 3 | ~~**WebSocket URL mismatch**~~ | ✅ FIXED | Frontend now connects to `/chat/{projectId}` which matches Worker routing. |
| 4 | ~~**Supabase batch flush commented out**~~ | ✅ FIXED | Batch flush is fully implemented and active in the Worker. |
| 5 | ~~**JWT verification not implemented**~~ | ✅ FIXED | Worker uses `jose` + Supabase JWKS for JWT verification. |
| 6 | **Google OAuth not wired up** | 🟡 MEDIUM | The "Continue with Google" button on the login page has no `onClick` handler. |
| 7 | **RLS policies too broad** | 🟡 MEDIUM | Current RLS uses `USING (true)` for client read access — should be tightened in production. |
| 8 | **Nested folder structure** | 🟢 LOW | The project is 3 levels deep (`filepilot/filepilot/filepilot/`), which is confusing. |

---

## 9. Development Guidelines for Future Agents

1. **Fix the DB schema FIRST** before debugging any frontend "nothing happens" issues. The mismatch in Section 5 is the root cause.
2. **Real-Time First**: Progress bar updates, messages, and delivery links should reflect instantly without refresh.
3. **Error Handling**: Always wrap Supabase calls in `try/catch` and surface errors visually (alerts or toast notifications).
4. **Link Security**: Client links use UUID project IDs — keep them unpredictable.
5. **Mobile Responsiveness**: Clients will open links on phones. The client dashboard must be fully responsive.
6. **Run `npm run dev` from**: `c:\E_folder\AGENCY\filepilot\filepilot\filepilot\` (the innermost folder with `package.json ).
6. **Run `npm run dev` from**: `c:\E_folder\AGENCY\filepilot\filepilot\filepilot\` (the innermost folder with `package.json`).
7. **Run the Cloudflare Worker locally**: `npx wrangler dev` from `c:\E_folder\AGENCY\filepilot\nore-realtime-engine\`.

---

## 10. Editor / Client Authorization Workflow (Recent Progress)

The workflow has been refined to ensure security and privacy between the child editors and the end clients. The Agency (Admin) sits in the middle and acts as the gatekeeper.

### Authorization System
- **By default, Editors cannot talk to or deliver files to Clients directly.**
- On the Admin Dashboard, under the "Workplace" section, admins can assign an Editor to a Client's project.
- Admins have two toggleable authorities: **Authorize Chat** and **Authorize Deliver**.
- Changes to these authorities are staged locally and require clicking **Confirm Auth** to save and broadcast.

### Chat Flow
- **If Editor is NOT authorized to chat**: 
  - The Editor's chat interface defaults to talking to the Admin ("Admin Chat").
  - The Client's chat interface defaults to talking to the Admin ("Type a message to the Agency...").
  - The Admin sees these messages and can mediate. The Editor and Client never see each other's messages.
- **If Editor IS authorized to chat**:
  - The chat room becomes a **Unified Group Chat**.
  - Editor and Client can talk directly. The Admin can still see the entire chat history.

### Delivery Flow
- **If Editor is NOT authorized to deliver**:
  - The Editor can only "Propose" a link. 
  - This proposed link shows up on the Admin dashboard. 
  - The Admin can review the link and click **Finalize**, which officially sends the link to the Client and updates the progress.
- **If Editor IS authorized to deliver**:
  - The Editor can send the delivery link directly to the Client.

### Real-Time Updates & Fallbacks
- All chat messages continue to run through the Cloudflare Worker WebSockets.
- **The Challenge**: Admins often update progress bars, delivery links, or authorization toggles while they *do not* have the specific project's chat actively open (meaning no active WebSocket connection for that room).
- **The Solution**: A fallback HTTP POST endpoint (`/chat/:roomId/broadcast`) was added to the Cloudflare Worker. It is secured by CORS and the Supabase JWT.
- If the WebSocket is open, updates are sent via WS. If not, the dashboard fires a POST request to the Worker, which then broadcasts the update to all connected Clients/Editors in that room instantly.

---

*Last updated: 2026-07-25 by Antigravity Agent*
