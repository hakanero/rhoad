# rhoad

road from idea to company

A private workspace for an early-stage company before it is incorporated. Founders log activity, expenses with receipts, income, and public posts; the workspace keeps running totals per person, an expected-cost projection, and a budget with runway. When the company is ready, one screen hands the workspace's data to Rho's incorporation flow. rhoad ends at that handoff.

## Stack

- **Vite + React 19 + TypeScript**, Tailwind v4
- **Supabase**: Postgres, Auth (magic link), Storage (receipts), Realtime
- No backend of its own. The browser talks to Supabase directly; row-level security scopes every workspace to its members.
- Rho integration is a mock behind an interface (`src/lib/rho.ts`).

## Setup

You need a Supabase project (free tier is fine) and Node 20+.

### 1. Database

In the Supabase dashboard, open **SQL Editor** and run the whole of [`supabase/schema.sql`](supabase/schema.sql), top to bottom. It is written as an ordered migration and is safe on a fresh project: tables, views, RLS policies, RPCs, triggers, and the Realtime publication.

### 2. Storage

**Storage → New bucket**, named exactly `receipts`, with **Public** on. (Uploads are still gated by RLS; only reads are public.)

### 3. Auth redirect allowlist

**Authentication → URL Configuration → Redirect URLs**, add:

```
http://localhost:5173/**
```

and later your deployed origin with the same `/**` suffix. The wildcard matters: invite links send new users to `/join/<slug>`, and the magic link silently fails without it.

### 4. Realtime

**Database → Replication** — confirm `entries`, `posts`, `replies`, `members`, and `workspaces` are in the `supabase_realtime` publication. The schema adds them; check here if live updates between members do not appear.

### 5. Environment

**Project Settings → API**. Copy `.env.example` to `.env.local` and fill in the project URL and the **publishable** key:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never the secret key: `VITE_*` values are inlined into the browser bundle. The app refuses to start if it detects one.

## Running

```bash
npm install
npm run dev
```

Open http://localhost:5173. Sign in with your email (a name is asked for on first sign-in), create a workspace, and start logging.

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # serve the build locally
npm run lint      # oxlint
```

## Sample data

[`supabase/seed.sql`](supabase/seed.sql) creates a populated workspace — three weeks of activity, backdated expenses, an upcoming cost, income, a post, replies, and a budget — so every screen has something to show.

1. Sign in to the app once, so your account exists.
2. Open `seed.sql`, change `owner_email` at the top to the address you signed in with.
3. Run it in the SQL editor.
4. Reload the app; the workspace appears under **Workspaces**.

It can be run more than once; each run makes a new workspace.

## Project structure

```
src/
  lib/
    supabase.ts       client + secret-key guard
    auth.tsx          session provider
    useWorkspace.ts   all workspace data, realtime subscription
    finance.ts        projection, contribution split, CSV
    rho.ts            Rho integration boundary (mocked)
    types.ts
  components/         ui primitives, composers, EntryEditor, Replies, icons
  routes/
    Landing, Login, Workspaces, NewWorkspace, Join
    WorkspaceLayout   sidebar shell
    Home, Pitch, Content, NextSteps, Incorporate
    finances/         Layout, Ledger, Income, Plan, Founders
supabase/
  schema.sql          ordered migration
  seed.sql            sample data
```

## Deploying

Static hosting works; `vercel.json` includes the SPA rewrite so deep links like `/join/<slug>` resolve. Set the two `VITE_*` variables in the host's environment, and add the deployed origin (with `/**`) to the Supabase redirect allowlist.
