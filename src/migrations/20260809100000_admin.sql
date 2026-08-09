-- Admin access + AI chat token-usage logging, for a new internal /admin
-- dashboard (src/app/admin).
--
-- `admins` — a user is an admin iff a row exists here for their id. No
-- roles/permissions system, just a single gate — see isCurrentUserAdmin()
-- in src/actions/admin.ts. Nobody is an admin by default: after running
-- this migration, grant yourself access with
--   insert into public.admins (user_id) values ('<your-auth-user-id>');
-- (find your id in the Supabase dashboard under Authentication → Users).
--
-- `chat_usage` — one row per completed AI Talk turn, capturing the token
-- usage the AI SDK reports (see the streamText onFinish in
-- src/app/api/chat/route.ts). A log table rather than a cumulative counter
-- column on `chats` so the admin dashboard can sum tokens over any of its
-- time-range filters (last day/week/month/all time), not just lifetime
-- totals. Nothing was tracked before this migration — historical chats
-- will show 0 usage.
--
-- The admin dashboard's "interactions" and "highly active" numbers are
-- computed on read by counting each user's existing rows across
-- habits/tasks/transactions/chats/deepwork_sessions/goals — no new
-- activity-log table for that, since every domain table already carries
-- the created_at/updated_at timestamps needed.

create table public.admins (
  user_id uuid not null,
  created_at timestamp with time zone default now(),
  constraint admins_pkey primary key (user_id),
  constraint admins_user_id_fkey foreign key (user_id) references auth.users (id)
);

create table public.chat_usage (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  chat_id uuid not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamp with time zone default now(),
  constraint chat_usage_pkey primary key (id),
  constraint chat_usage_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint chat_usage_chat_id_fkey foreign key (chat_id) references public.chats (id)
);

create index chat_usage_user_id_created_at_idx
  on public.chat_usage (user_id, created_at desc);
