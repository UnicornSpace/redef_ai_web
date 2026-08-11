-- Migration: add a fourth habit type — "number" (track a numeric value
-- against a goal + comparator + unit, e.g. "at least 30 pushups a day")
-- Created: 2025-08-12
-- Depends on: 20250810_redesign_habits_system.sql, 20250811_profile_fields_and_habit_fixes.sql

-- ============================================================================
-- 1. Allow 'number' as a habit type
-- ============================================================================

ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_type_check;
ALTER TABLE habits ADD CONSTRAINT habits_type_check
  CHECK (type IN ('boolean', 'checklist', 'smart_checklist', 'number'));

-- ============================================================================
-- 2. Goal fields for number-type habits
-- ============================================================================

ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_number NUMERIC DEFAULT NULL;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_unit TEXT DEFAULT NULL;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_comparator TEXT DEFAULT NULL
  CHECK (goal_comparator IN ('at_least', 'less_than', 'exactly'));

-- ============================================================================
-- 3. Per-day logged value for number-type habits
-- ============================================================================

ALTER TABLE habit_completions ADD COLUMN IF NOT EXISTS numeric_value NUMERIC DEFAULT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- To verify:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'habits'::regclass AND conname = 'habits_type_check';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'habits' AND column_name LIKE 'goal_%';
