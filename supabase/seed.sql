-- Sample data: the rhoad workspace, for rhoad.
--
-- Run AFTER schema.sql, and after signing in at least once so your
-- account exists. Set owner_email below. If a second account exists at
-- partner_email, it is added as a collaborator with its own entries;
-- otherwise that part is skipped.

do $$
declare
  owner_email   text := 'you@example.com';      -- <-- change me
  partner_email text := 'partner@example.com';  -- optional second account
  uid  uuid;
  pid  uuid;
  ws_id uuid;
  me   uuid;
  them uuid;
  e_demo uuid;
  e_claude uuid;
  e_name uuid;
begin
  select id into uid from auth.users where email = owner_email;
  if uid is null then
    raise exception 'No account with email %. Sign in once first, then re-run.', owner_email;
  end if;
  select id into pid from auth.users where email = partner_email;

  insert into profiles (id, name, email) values (uid, 'Hakan', owner_email)
  on conflict (id) do update set name = coalesce(profiles.name, excluded.name);

  insert into workspaces (name, pitch, identity, budget, share_slug)
  values (
    'rhoad',
    'rhoad is a private workspace for a company before it is incorporated: activity, expenses, income, and public posts on record from day one, and a handoff to Rho when it is time.',
    '{"problem":"Founders spend real money and do real work before a company exists. It is scattered across bank statements, group chats, and social posts, and nobody can say who paid for what or what the pitch was when it was posted.",
      "what":"A shared workspace with an activity feed, an expense ledger with receipts and per-person totals, income tracking, a budget with runway, and a pitch that posts snapshot automatically. When name and business purpose exist, one screen hands everything to Rho.",
      "who":"Two or three people with an idea, a domain, and a few subscriptions, who are not ready to be official yet."}'::jsonb,
    500,
    'rhoad' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5)
  )
  returning id into ws_id;

  insert into members (workspace_id, user_id, color, intended_equity)
  values (ws_id, uid, 'dusk', case when pid is null then null else 50 end)
  returning id into me;

  -- activity ------------------------------------------------------------
  insert into entries (workspace_id, member_id, text, occurred_at, created_at) values
    (ws_id, me, 'wrote the spec', current_date - 9, now() - interval '9 days'),
    (ws_id, me, 'going with "rhoad" for the name', current_date - 9, now() - interval '9 days'),
    (ws_id, me, 'schema + auth + invite links working', current_date - 8, now() - interval '8 days'),
    (ws_id, me, 'redid the whole UI, it looked like a notes app', current_date - 7, now() - interval '7 days'),
    (ws_id, me, 'moved expenses out of the home feed into their own tab', current_date - 5, now() - interval '5 days'),
    (ws_id, me, 'cut the reimbursement flow, out of scope', current_date - 3, now() - interval '3 days');

  insert into entries (workspace_id, member_id, text, occurred_at, created_at)
  values (ws_id, me, 'showed it to Deniz', current_date - 2, now() - interval '2 days')
  returning id into e_demo;

  insert into entries (workspace_id, member_id, text, occurred_at, created_at)
  values (ws_id, me, 'logo done', current_date - 1, now() - interval '1 day')
  returning id into e_name;

  -- expenses ------------------------------------------------------------
  insert into entries (workspace_id, member_id, text, category, is_expense, amount, occurred_at, created_at) values
    (ws_id, me, 'rhoad domain', 'domain', true, 14.00, current_date - 9, now() - interval '9 days'),
    (ws_id, me, 'Figma', 'software', true, 15.00, current_date - 7, now() - interval '7 days');

  insert into entries (workspace_id, member_id, text, category, is_expense, amount, occurred_at, created_at)
  values (ws_id, me, 'Claude subscription', 'software', true, 20.00, current_date - 8, now() - interval '8 days')
  returning id into e_claude;

  -- upcoming: free tiers that will start charging
  insert into entries (workspace_id, member_id, text, category, is_upcoming, upcoming_amount, upcoming_from, occurred_at, created_at) values
    (ws_id, me, 'Supabase (free tier)', 'software', true, 25.00, (date_trunc('month', current_date) + interval '2 months')::date, current_date - 8, now() - interval '8 days'),
    (ws_id, me, 'Vercel (hobby)', 'software', true, 20.00, (date_trunc('month', current_date) + interval '1 month')::date, current_date - 1, now() - interval '1 day');

  -- income: none yet. Uncomment to show the Income tab populated.
  -- insert into entries (workspace_id, member_id, text, is_income, amount, source, occurred_at, created_at)
  -- values (ws_id, me, 'Pilot fee', true, 250.00, 'A founder who wanted it early', current_date - 1, now() - interval '1 day');

  -- content -------------------------------------------------------------
  insert into posts (workspace_id, member_id, platform, caption, created_at) values
    (ws_id, me, 'x', 'building something for the hackathon this week, will post more when it works', now() - interval '6 days'),
    (ws_id, me, 'linkedin', 'https://www.linkedin.com/posts/hakanero_rhoad', now() - interval '2 days');

  -- replies -------------------------------------------------------------
  insert into replies (workspace_id, member_id, entry_id, text, created_at) values
    (ws_id, me, e_demo, 'he asked if it does receipts, said yes, he said ok', now() - interval '2 days'),
    (ws_id, me, e_claude, 'might need the bigger plan', now() - interval '6 days');

  -- optional collaborator ----------------------------------------------
  if pid is not null then
    insert into profiles (id, name, email) values (pid, 'Sam', partner_email)
    on conflict (id) do update set name = coalesce(profiles.name, excluded.name);

    insert into members (workspace_id, user_id, color, intended_equity)
    values (ws_id, pid, 'slate', 50)
    returning id into them;

    insert into entries (workspace_id, member_id, text, occurred_at, created_at) values
      (ws_id, them, 'read the spec, some notes in the doc', current_date - 6, now() - interval '6 days'),
      (ws_id, them, 'went through finances, budget and projection should be one page', current_date - 3, now() - interval '3 days');

    insert into entries (workspace_id, member_id, text, category, is_expense, amount, occurred_at, created_at)
    values (ws_id, them, 'Google Workspace', 'software', true, 12.00, current_date - 4, now() - interval '4 days');

    insert into replies (workspace_id, member_id, entry_id, text, created_at)
    values (ws_id, them, e_name, 'nice', now() - interval '1 day');
  end if;

  raise notice 'Seeded workspace % (%)', ws_id, owner_email;
end $$;
