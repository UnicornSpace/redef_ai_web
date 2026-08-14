-- Migration: drop the UTC-locked "no future completion date" constraint
-- Created: 2026-08-14
-- Depends on: 20250810_redesign_habits_system.sql
--
-- The original migration added:
--   CHECK (completion_date <= CURRENT_DATE)
--
-- on habit_completions. Postgres's CURRENT_DATE is evaluated in the
-- SERVER's timezone (UTC on Supabase). A user in IST (UTC+5:30) who
-- ticks off a habit shortly after midnight local time sends today =
-- "Aug 14" while the server clock still reads "Aug 13" — the check
-- rejects the row and the whole toggleChecklistItem action fails.
-- Same story for PST/anywhere-behind-UTC users late at night.
--
-- The constraint doesn't earn its keep: the client only ever passes
-- `todayIso()` derived from the browser clock, so real "future" writes
-- would require someone bypassing the UI entirely — a threat model
-- nothing else in this app defends against. Dropping it.

ALTER TABLE habit_completions
  DROP CONSTRAINT IF EXISTS chk_completion_not_future;
