-- Wipes every row: workspaces, entries, posts, replies, members,
-- profiles, uploaded receipts, and all user accounts. Schema, policies,
-- functions, and buckets stay. Cannot be undone.

truncate table replies, posts, entries, members, workspaces, profiles cascade;
delete from storage.objects where bucket_id = 'receipts';
delete from auth.users;
