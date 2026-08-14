-- Migration: habit priority
-- Created: 2026-08-13
-- Depends on: 20250810_redesign_habits_system.sql
--
-- Adds a per-habit priority so the /app/habits Focus view can sort
-- uncompleted habits by importance (high → medium → low → unspecified).
-- Nullable — most existing habits don't have one, and forcing a default
-- of "low" or "medium" would misrepresent user intent.

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT NULL
    CHECK (priority IN ('high', 'medium', 'low'));
