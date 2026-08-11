-- Migration: profile fields (age, phone) + habit parent-child constraint fix
-- Created: 2025-08-11
-- Depends on: 20250810_redesign_habits_system.sql (already applied)

-- ============================================================================
-- 1. Add age_range + phone_number to profiles
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT NULL;

-- ============================================================================
-- 2. Fix the habit parent/child type constraint
--
-- The previous migration's chk_parent_habit_type constraint required that
-- any habit ROW with parent_habit_id set must itself be type='smart_checklist'.
-- That's backwards: a CHILD habit (e.g. a plain boolean "Meditation" habit
-- linked under a "Morning Wellness" smart checklist) should keep its own
-- type (boolean/checklist) — it's the PARENT being referenced that must be
-- type='smart_checklist'. Postgres CHECK constraints can't reference other
-- rows, so that invariant is enforced in application code (createHabit /
-- setHabitParent in src/actions/habits.ts) instead of a DB constraint.
-- ============================================================================

ALTER TABLE habits DROP CONSTRAINT IF EXISTS chk_parent_habit_type;

-- Prevent a habit from being its own parent.
ALTER TABLE habits ADD CONSTRAINT chk_habit_not_own_parent
  CHECK (parent_habit_id IS NULL OR parent_habit_id != id);

-- ============================================================================
-- Migration complete
-- ============================================================================
-- To verify:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT conname FROM pg_constraint WHERE conrelid = 'habits'::regclass;
