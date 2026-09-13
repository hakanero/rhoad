-- rhoad schema. Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

-- profiles ------------------------------------------------------------
-- Mirrors auth.users so the feed can show a name without querying auth.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text
);

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- core tables ---------------------------------------------------------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pitch text,
  share_slug text not null unique,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  color text not null default 'dusk',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  text text not null,
  is_expense boolean not null default false,
  amount numeric(12,2),
  receipt_url text,
  is_free_tier boolean not null default false,
  expected_cost numeric(12,2),
  converts_at date,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  platform text not null check (platform in ('linkedin','x','other')),
  caption text not null,
  pitch_snapshot text,
  created_at timestamptz not null default now()
);

create index entries_ws_created on entries (workspace_id, created_at desc);
create index posts_ws_created on posts (workspace_id, created_at desc);

-- pitch snapshot ------------------------------------------------------
-- Captured in the DB, not the client: a stale browser tab would
-- otherwise snapshot the wrong pitch, which defeats the feature.
create function snapshot_pitch() returns trigger
language plpgsql as $$
begin
  select pitch into new.pitch_snapshot
  from workspaces where id = new.workspace_id;
  return new;
end $$;

create trigger posts_snapshot before insert on posts
for each row execute function snapshot_pitch();

-- membership ----------------------------------------------------------
create function is_member(ws uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

-- Creating a workspace: makes the workspace and the founding member
-- together, so you can never strand a workspace with no members.
create function create_workspace(ws_name text)
returns workspaces
language plpgsql security definer set search_path = public as $$
declare
  ws workspaces;
  slug text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  slug := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into workspaces (name, share_slug) values (ws_name, slug)
  returning * into ws;
  insert into members (workspace_id, user_id, color)
  values (ws.id, auth.uid(), 'dusk');
  return ws;
end $$;

-- Joining via invite link. Must be security definer: a non-member
-- cannot read the workspace row yet, so normal RLS can't get them in.
-- Colors cycle by join order so two collaborators never collide.
create function join_workspace(slug text)
returns workspaces
language plpgsql security definer set search_path = public as $$
declare
  ws workspaces;
  n int;
  palette text[] := array['dusk','slate','plum','berry'];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into ws from workspaces where share_slug = slug;
  if ws.id is null then
    raise exception 'workspace not found';
  end if;

  select count(*) into n from members where workspace_id = ws.id;

  insert into members (workspace_id, user_id, color)
  values (ws.id, auth.uid(), palette[(n % 4) + 1])
  on conflict (workspace_id, user_id) do nothing;

  return ws;
end $$;

-- totals --------------------------------------------------------------
-- Summed in SQL so the numbers stay correct as the feed paginates.
create view workspace_totals
with (security_invoker = true) as
select
  workspace_id,
  coalesce(sum(amount) filter (where is_expense), 0)::numeric(12,2) as invested,
  coalesce(sum(expected_cost) filter (where is_free_tier), 0)::numeric(12,2) as queued
from entries
group by workspace_id;

create view member_totals
with (security_invoker = true) as
select
  workspace_id,
  member_id,
  coalesce(sum(amount) filter (where is_expense), 0)::numeric(12,2) as invested
from entries
group by workspace_id, member_id;

-- RLS -----------------------------------------------------------------
-- Scoped, not hardened: this is what makes one workspace's feed stay
-- out of another's. Demo-grade on purpose.
alter table workspaces enable row level security;
alter table members    enable row level security;
alter table entries    enable row level security;
alter table posts      enable row level security;
alter table profiles   enable row level security;

create policy ws_read   on workspaces for select using (is_member(id));
create policy ws_update on workspaces for update using (is_member(id));

create policy m_read   on members for select using (is_member(workspace_id));
create policy e_read   on entries for select using (is_member(workspace_id));
create policy e_insert on entries for insert with check (is_member(workspace_id));
create policy p_read   on posts   for select using (is_member(workspace_id));
create policy p_insert on posts   for insert with check (is_member(workspace_id));

create policy prof_read on profiles for select using (true);

-- storage -------------------------------------------------------------
-- A public bucket grants public reads, but uploads still pass through
-- RLS on storage.objects. Without this, the composer's receipt upload
-- fails for signed-in users.
create policy receipts_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'receipts');

create policy receipts_read on storage.objects
for select using (bucket_id = 'receipts');

-- replies -------------------------------------------------------------
-- Flat, no nesting. Targets an entry or a post; exactly one of the two.
create table replies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  entry_id uuid references entries(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  constraint one_target check (num_nonnulls(entry_id, post_id) = 1)
);

create index replies_entry on replies (entry_id, created_at);
create index replies_post on replies (post_id, created_at);

alter table replies enable row level security;
create policy r_read   on replies for select using (is_member(workspace_id));
create policy r_insert on replies for insert with check (is_member(workspace_id));

-- Let users set their own display name.
create policy prof_update on profiles for update using (id = auth.uid());

-- identity ------------------------------------------------------------
-- The pitch page is structured: `pitch` stays the one-liner (used by
-- next steps and readiness), `identity` holds the longer sections.
alter table workspaces add column identity jsonb not null default '{}'::jsonb;

-- Snapshot the whole identity, not just the one-liner.
create or replace function snapshot_pitch() returns trigger
language plpgsql as $$
declare
  ws workspaces;
  parts text[] := '{}';
  k text;
  labels jsonb := '{
    "problem": "The problem",
    "what": "What it does",
    "who": "Who it is for",
    "model": "How it makes money",
    "stage": "Where it is now"
  }'::jsonb;
begin
  select * into ws from workspaces where id = new.workspace_id;
  if coalesce(ws.pitch, '') <> '' then
    parts := parts || ws.pitch;
  end if;
  for k in select * from jsonb_object_keys(labels) loop
    if coalesce(ws.identity->>k, '') <> '' then
      parts := parts || ((labels->>k) || E'\n' || (ws.identity->>k));
    end if;
  end loop;
  new.pitch_snapshot := nullif(array_to_string(parts, E'\n\n'), '');
  return new;
end $$;
