-- Challenges: friends compete on a shared habit via a leaderboard.
--
-- A challenge can be started from scratch or from an existing habit (copying
-- its name/description/category/completed_dates so the creator's current
-- streak carries over). Anyone with the challenge's join link can join while
-- signed in - no separate invite/email table, the link itself is the invite,
-- matching how every other sharing flow in this app works (keep it simple).
--
-- Each participant tracks their own completed_dates independently (same
-- shape as habits.completed_dates), so the leaderboard just ranks
-- participants by array length - no separate check-ins table needed.
--
-- `display_name` is captured once at join time from the user's own email
-- rather than joined against auth.users at read time - this avoids needing a
-- public profiles table or the Supabase admin API just to show a leaderboard.

create table public.challenges (
  id uuid not null default gen_random_uuid(),
  owner_user_id uuid,
  name text not null,
  description text,
  category text,
  start_date date not null default current_date,
  end_date date,
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint challenges_pkey primary key (id),
  constraint challenges_owner_user_id_fkey foreign key (owner_user_id) references auth.users (id)
);

create table public.challenge_participants (
  id uuid not null default gen_random_uuid(),
  challenge_id uuid not null,
  user_id uuid,
  display_name text,
  completed_dates date[] default '{}'::date[],
  joined_at timestamp with time zone default now(),
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint challenge_participants_pkey primary key (id),
  constraint challenge_participants_challenge_id_fkey foreign key (challenge_id) references public.challenges (id),
  constraint challenge_participants_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint challenge_participants_unique unique (challenge_id, user_id)
);

create index challenge_participants_challenge_id_idx
  on public.challenge_participants (challenge_id);
