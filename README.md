# rhoad

road from idea to company

## Setup

1. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.
2. Storage → new bucket named `receipts`, public.
3. Authentication → URL Configuration → add `http://localhost:5173/**` (and
   `https://<your-domain>/**`) to the redirect allowlist. The `/**` wildcard
   matters: invite links send new users to `/join/<slug>`, and without it
   the sign-in link fails silently for them.
4. Database → Replication → make sure `entries`, `posts`, `replies`,
   `members`, and `workspaces` are in the `supabase_realtime` publication
   (the schema does this; verify if live updates don't appear).
5. Copy `.env.example` to `.env.local` and fill in the project URL and the
   **publishable** key. Never the secret key — `VITE_*` values ship inside the
   browser bundle.

```bash
npm install
npm run dev
```

## Stack

Vite + React + TypeScript + Tailwind, Supabase for Postgres, auth, and storage.
No backend: the browser talks to Supabase directly, and RLS scopes every
workspace.

## Notes

- `pitch_snapshot` on posts is filled by a database trigger, not the client, so
  a stale tab can't record the wrong pitch.
- Money totals are computed in SQL (`workspace_totals`, `member_totals`) rather
  than summed client-side.
- Member colors cycle by join order so two collaborators never collide.
