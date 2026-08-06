-- Profiles: the missing "who is this user, publicly" table every earlier
-- migration deliberately avoided building (see comments in
-- 20260801090000_challenges.sql and 20260802120000_habit_collaborators.sql).
-- It's needed now for three things at once:
--   1. A public username so /u/[username] resolves to a real person instead
--      of a hardcoded mock.
--   2. Which optional feature "modules" (habits/tasks/deep_work/
--      personal_finance) a user turned on during onboarding, so the sidebar
--      only shows what they actually use.
--   3. `onboarded_at` as the gate for whether a signed-in user still needs
--      to go through onboarding at all.
--
-- Username uniqueness/format is validated in the action layer (src/actions/
-- profile.ts), not here — matches this app's existing convention of
-- app-level validation over DB constraints/triggers.

create table public.profiles (
  user_id uuid not null,
  username text not null,
  enabled_modules text[] not null default '{}'::text[],
  onboarded_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (user_id),
  constraint profiles_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint profiles_username_key unique (username)
);

create index profiles_username_idx on public.profiles (username);
