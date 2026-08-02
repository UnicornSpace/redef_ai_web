-- Habit collaborators: a friend who accepted a habit invite link tracks
-- their own progress against the ORIGINAL habit, instead of getting an
-- independent copy with no link back to the inviter.
--
-- Mirrors the challenges / challenge_participants split: `habits` keeps the
-- owner's own completed_dates as today, and this table holds one row per
-- collaborator per habit, each with their own completed_dates array — same
-- "no separate check-ins table needed" reasoning as challenge_participants.
--
-- `display_name` is captured once at join time from the user's own email,
-- same as challenges, to avoid needing a profiles table just to label who's
-- who in the avatar stack / leaderboard-style comparison.

create table public.habit_collaborators (
  id uuid not null default gen_random_uuid(),
  habit_id uuid not null,
  user_id uuid not null,
  display_name text,
  completed_dates date[] default '{}'::date[],
  joined_at timestamp with time zone default now(),
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint habit_collaborators_pkey primary key (id),
  constraint habit_collaborators_habit_id_fkey foreign key (habit_id) references public.habits (id),
  constraint habit_collaborators_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint habit_collaborators_unique unique (habit_id, user_id)
);

create index habit_collaborators_habit_id_idx
  on public.habit_collaborators (habit_id);

create index habit_collaborators_user_id_idx
  on public.habit_collaborators (user_id);

-- The habit owner's own display name, captured once at creation from their
-- email (same "no profiles table" reasoning as challenge_participants'
-- display_name) so the invite page can show "<name> wants you to start
-- <habit>" without an admin-API lookup. Existing rows are left null and
-- fall back to a generic label at read time.
alter table public.habits
  add column if not exists owner_display_name text;
