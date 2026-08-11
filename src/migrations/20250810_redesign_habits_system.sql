-- Migration: Redesign habits system with three habit types
-- Created: 2025-08-10
-- Description: Add habit types (boolean, checklist, smart_checklist), checklist items,
--              enhanced completions tracking, and user onboarding data

-- ============================================================================
-- 1. Update habits table - add new columns for habit types
-- ============================================================================

ALTER TABLE habits ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'boolean'
  CHECK (type IN ('boolean', 'checklist', 'smart_checklist'));

ALTER TABLE habits ADD COLUMN IF NOT EXISTS parent_habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_per_week INTEGER DEFAULT 7;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_goal_period TEXT DEFAULT 'daily'
  CHECK (user_goal_period IN ('daily', 'weekly', 'custom'));

ALTER TABLE habits ADD COLUMN IF NOT EXISTS custom_frequency INTEGER DEFAULT NULL;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_goal_category TEXT DEFAULT NULL;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT NULL;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT NULL;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMP DEFAULT NULL;

-- ============================================================================
-- 2. Create habit_checklist_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS habit_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  estimated_time_minutes INTEGER,

  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_habit ON habit_checklist_items(habit_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_order ON habit_checklist_items(habit_id, order_index);

-- ============================================================================
-- 3. Create habit_completions table (enhanced from previous)
-- ============================================================================

-- First, back up old data if it exists by creating a temp table
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  completion_date DATE NOT NULL,
  completion_time TIMESTAMP DEFAULT now(),

  -- For checklist habits: which items were completed
  completed_item_ids TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Time tracking
  time_spent_minutes INTEGER DEFAULT NULL,

  -- Notes & metadata
  notes TEXT DEFAULT NULL,

  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(habit_id, user_id, completion_date)
);

CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_completions_habit ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_user ON habit_completions(user_id);

-- ============================================================================
-- 4. Create user_onboarding table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  age_range TEXT DEFAULT NULL, -- "18-25", "26-35", etc.

  -- Selected tools during onboarding
  selected_tools TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["habits", "deepwork", "finance", ...]

  -- If user selected habits, then we ask habit onboarding questions
  -- (otherwise stored when they add their first habit)
  habit_goals TEXT[] DEFAULT NULL, -- ["save_time", "focus", "health", ...]
  habit_challenges TEXT[] DEFAULT NULL, -- ["remembering", "consistency", ...]
  habit_preferred_frequency TEXT DEFAULT NULL, -- "daily", "weekly", "flexible"
  habit_reminder_time TEXT DEFAULT NULL, -- "morning", "midday", "evening", "night"

  -- Recommended habits (based on goals)
  recommended_habit_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Status
  completed_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON user_onboarding(completed_at);

-- ============================================================================
-- 5. Create habit_goals reference table (for consistency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS habit_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  goal_type TEXT NOT NULL, -- "save_time", "focus", "health", "learn", "creative", "social", "financial", etc.
  goal_description TEXT DEFAULT NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habit_goals_user ON habit_goals(user_id);

-- ============================================================================
-- 6. Add indexes for parent-child habit relationships
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_habits_parent_id ON habits(parent_habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_type ON habits(type);
CREATE INDEX IF NOT EXISTS idx_habits_user_type ON habits(user_id, type);

-- ============================================================================
-- 7. Add constraints and checks
-- ============================================================================

-- Ensure checklist items have proper order
ALTER TABLE habit_checklist_items
ADD CONSTRAINT chk_checklist_order CHECK (order_index > 0);

-- Ensure parent habit type is smart_checklist
ALTER TABLE habits
ADD CONSTRAINT chk_parent_habit_type CHECK (
  parent_habit_id IS NULL OR type = 'smart_checklist'
);

-- Ensure completion date is not in future
ALTER TABLE habit_completions
ADD CONSTRAINT chk_completion_not_future CHECK (completion_date <= CURRENT_DATE);

-- ============================================================================
-- 8. Create view for active habits (not deleted)
-- ============================================================================

CREATE OR REPLACE VIEW active_habits AS
SELECT * FROM habits
WHERE is_deleted = FALSE AND end_date IS NULL;

-- ============================================================================
-- 9. Create view for habit hierarchy (parent + children)
-- ============================================================================

CREATE OR REPLACE VIEW habit_hierarchy AS
SELECT
  h.id,
  h.name,
  h.type,
  h.user_id,
  h.parent_habit_id,
  CASE WHEN h.parent_habit_id IS NOT NULL THEN 'child' ELSE 'parent' END as hierarchy_level,
  COUNT(CASE WHEN h2.parent_habit_id = h.id THEN 1 END) as child_count
FROM habits h
LEFT JOIN habits h2 ON h2.parent_habit_id = h.id
WHERE h.is_deleted = FALSE
GROUP BY h.id, h.name, h.type, h.user_id, h.parent_habit_id;

-- ============================================================================
-- 10. Seed common habit goals (optional)
-- ============================================================================

-- Note: These will be deleted on user_id CASCADE, so this is just for reference
-- You may want to use these as a reference table in the app

CREATE TABLE IF NOT EXISTS habit_goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_key TEXT UNIQUE NOT NULL, -- "save_time", "focus", etc.
  goal_label TEXT NOT NULL, -- Display name
  goal_description TEXT,
  icon TEXT, -- For UI
  example_habits TEXT[], -- Example habit names

  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO habit_goal_templates (goal_key, goal_label, goal_description, example_habits) VALUES
  ('save_time', 'Save Time & Efficiency', 'Automate tasks and reduce time spent', ARRAY['Time blocking', 'Batch tasks', 'Delegate']),
  ('focus', 'Improve Focus & Deep Work', 'Build deep work sessions and reduce distractions', ARRAY['Deep work block', 'Pomodoro routine', 'Distraction blocking']),
  ('health', 'Physical Health', 'Exercise, nutrition, and sleep habits', ARRAY['Exercise', 'Stretching', 'Meal prep']),
  ('wellness', 'Mental Wellness', 'Stress management and mental health', ARRAY['Meditation', 'Journaling', 'Therapy']),
  ('learn', 'Learn & Skill Build', 'Educational and skill-building habits', ARRAY['Read', 'Practice', 'Study']),
  ('creative', 'Creative Expression', 'Creative and artistic pursuits', ARRAY['Write', 'Draw', 'Compose']),
  ('social', 'Social Connections', 'Build and maintain relationships', ARRAY['Call friend', 'Date night', 'Community']),
  ('financial', 'Financial Health', 'Money management and saving', ARRAY['Track spending', 'Budget review', 'Invest'])
ON CONFLICT (goal_key) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- To verify the migration:
-- SELECT * FROM information_schema.tables WHERE table_name LIKE 'habit%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'habits';
