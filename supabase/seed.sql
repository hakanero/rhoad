-- Sample data for rhoad.
--
-- Creates one workspace ("Ledgerly") owned by an existing account, with
-- activity, expenses (some backdated, one upcoming), income, a post, and
-- replies. Run in the Supabase SQL editor AFTER schema.sql and after you
-- have signed in at least once (so your account exists in auth.users).
--
-- Change the email below to the account you sign in with.

do $$
declare
  owner_email text := 'you@example.com';   -- <-- change me
  uid uuid;
  ws_id uuid;
  m_id uuid;
  e_shared uuid;
  e_claude uuid;
begin
  select id into uid from auth.users where email = owner_email;
  if uid is null then
    raise exception 'No account with email %. Sign in once first, then re-run.', owner_email;
  end if;

  insert into profiles (id, name, email) values (uid, 'Hakan', owner_email)
  on conflict (id) do update set name = coalesce(profiles.name, excluded.name);

  insert into workspaces (name, pitch, identity, budget, share_slug)
  values (
    'Ledgerly',
    'Ledgerly is a shared ledger for idea-stage companies, so the money spent before incorporation is on record from day one.',
    '{"problem":"Founders spend real money before a company exists. It lives in personal bank statements and group chats, and nobody can say who paid for what.",
      "what":"A private workspace where a small team logs activity, expenses with receipts, and income, and sees running totals per person.",
      "who":"Two-to-three person teams that have started paying for domains, tools, and subscriptions but have not incorporated."}'::jsonb,
    2500,
    'demo' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  )
  returning id into ws_id;

  insert into members (workspace_id, user_id, color, intended_equity)
  values (ws_id, uid, 'dusk', 50)
  returning id into m_id;

  -- activity
  insert into entries (workspace_id, member_id, text, occurred_at, created_at) values
    (ws_id, m_id, 'Sketched the first version of the ledger view.', current_date - 21, now() - interval '21 days'),
    (ws_id, m_id, 'Talked to two founders about how they track early spend. Both use a notes app.', current_date - 14, now() - interval '14 days'),
    (ws_id, m_id, 'Working prototype: entries, totals, invite links.', current_date - 6, now() - interval '6 days');

  insert into entries (workspace_id, member_id, text, occurred_at, created_at)
  values (ws_id, m_id, 'Showed the demo to Sam.', current_date - 3, now() - interval '3 days')
  returning id into e_shared;

  -- expenses
  insert into entries (workspace_id, member_id, text, category, is_expense, amount, occurred_at, created_at) values
    (ws_id, m_id, 'ledgerly.co domain', 'domain', true, 14.00, current_date - 28, now() - interval '28 days'),
    (ws_id, m_id, 'Figma', 'software', true, 15.00, current_date - 20, now() - interval '20 days'),
    (ws_id, m_id, 'Supabase Pro', 'software', true, 25.00, current_date - 9, now() - interval '9 days'),
    (ws_id, m_id, 'Vercel Pro', 'software', true, 20.00, current_date - 9, now() - interval '9 days');

  insert into entries (workspace_id, member_id, text, category, is_expense, amount, occurred_at, created_at)
  values (ws_id, m_id, 'Claude subscription', 'software', true, 20.00, current_date - 5, now() - interval '5 days')
  returning id into e_claude;

  -- upcoming cost (free trial ending)
  insert into entries (workspace_id, member_id, text, category, is_upcoming, upcoming_amount, upcoming_from, occurred_at, created_at)
  values (ws_id, m_id, 'Resend (free tier)', 'software', true, 20.00, (current_date + 40)::date, current_date - 4, now() - interval '4 days');

  -- income
  insert into entries (workspace_id, member_id, text, is_income, amount, source, occurred_at, created_at)
  values (ws_id, m_id, 'Pilot fee', true, 250.00, 'Northwind Studio', current_date - 2, now() - interval '2 days');

  -- post (trigger fills pitch_snapshot)
  insert into posts (workspace_id, member_id, platform, caption, created_at)
  values (ws_id, m_id, 'linkedin', 'Building something small for founders who spend before they incorporate. More soon.', now() - interval '7 days');

  -- replies
  insert into replies (workspace_id, member_id, entry_id, text, created_at) values
    (ws_id, m_id, e_shared, 'Sam: the totals per person were the part that landed.', now() - interval '3 days'),
    (ws_id, m_id, e_claude, 'Might need a higher tier by next month.', now() - interval '4 days');

  raise notice 'Seeded workspace % for %', ws_id, owner_email;
end $$;
