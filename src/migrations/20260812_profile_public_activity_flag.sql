-- Migration: profile public-activity visibility flag
-- Created: 2026-08-12
-- Depends on: 20250811_profile_fields_and_habit_fixes.sql
--
-- The public /u/[username] page shows an aggregate 12-month heatmap of
-- habit-completion density. That's meaningfully less sensitive than named
-- habits (density only, no names), but it still reveals activity/absence
-- patterns — vacations, sick weeks, mental-health dips. Gate it behind a
-- per-user opt-in toggle surfaced in /app/profile/preferences.
--
-- Default TRUE for the growth signal (people showing their consistency is
-- what drives the /u/ page's shareability); users who want it off can
-- toggle it. Flip the default here if you'd rather ship conservatively.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_activity_visible BOOLEAN NOT NULL DEFAULT TRUE;
