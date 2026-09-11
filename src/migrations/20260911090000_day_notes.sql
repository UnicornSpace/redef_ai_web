-- Free-text note attached to a calendar day.
--
-- Purpose: capture the things that don't fit any module. Habits, tasks,
-- deep work and transactions are all structured, so "my sister visited and
-- we finally sorted out the car" has nowhere to live today. This is that
-- place — one note per user per day, written either by hand from the
-- calendar's day dialog or by the assistant when you tell it what
-- happened.
--
-- ONE row per (user_id, note_date) rather than a log of many entries: the
-- calendar shows a day at a time and the user edits "the note for that
-- day", so a unique constraint lets every writer upsert without first
-- checking whether one exists, and makes "edit" a plain update instead of
-- a merge across rows. If per-entry timestamps are ever needed, this
-- becomes the parent and entries get their own table.
--
-- `source` records who last wrote it, so the UI can mark AI-written notes
-- as such — a summary you dictated should be visibly distinct from one you
-- typed, since only one of them can be subtly wrong.

create table public.day_notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  note_date date not null,
  content text not null default '',
  source text not null default 'manual',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint day_notes_pkey primary key (id),
  constraint day_notes_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint day_notes_user_date_unique unique (user_id, note_date),
  constraint day_notes_source_check check (source in ('manual', 'ai'))
);

-- The calendar loads a date window for one user at a time.
create index day_notes_user_date_idx
  on public.day_notes (user_id, note_date desc);

-- Real RLS rather than this project's older app-layer-only convention —
-- see the reasoning in 20260828090000_user_standards_rls.sql. New table,
-- so there's no migration cost to doing it properly here.
alter table public.day_notes enable row level security;

create policy "select own day notes"
  on public.day_notes for select
  using (auth.uid() = user_id);

create policy "insert own day notes"
  on public.day_notes for insert
  with check (auth.uid() = user_id);

create policy "update own day notes"
  on public.day_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own day notes"
  on public.day_notes for delete
  using (auth.uid() = user_id);
