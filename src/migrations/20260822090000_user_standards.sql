-- User standards: what someone is AIMING for, and how they want to be
-- coached toward it.
--
-- This is deliberately separate from both:
--   * the derived baseline (src/lib/baseline.ts) — that measures what they
--     ACTUALLY do, computed live from deepwork_sessions/habits/tasks. It
--     can tell you someone works 3h a day; it cannot tell you whether
--     that's a win or a disappointment.
--   * user_preferences — that's how the assistant TALKS (nickname, tone,
--     verbosity). This is about how the user WORKS.
--
-- The distinction matters because the same numbers demand opposite advice.
-- Someone logging 9h who's building something wants to be pushed; someone
-- logging 9h who's burning out wants to be told to stop. No amount of
-- behavioral data disambiguates that — only the person can, which is why
-- `coaching_stance` is an explicit, user-owned setting rather than
-- something the assistant infers.
--
-- Every column is nullable: a user who's never opened this page should get
-- an assistant that says "I don't know your target yet", not one that
-- assumes a default 8-hour day and coaches against a number the user never
-- agreed to.

create table public.user_standards (
  user_id uuid not null,
  -- Target deep-work hours on a working day. numeric, not int — 7.5 is a
  -- perfectly normal answer.
  target_deep_work_hours numeric,
  target_workdays_per_week integer,
  -- How they want to be talked to when they're short of / over their
  -- target. Drives whether the assistant pushes or protects.
  coaching_stance text,
  -- Free text: "no work after 8pm", "Sundays are off". Kept unstructured
  -- on purpose — the shape of what people protect varies too much to model
  -- as columns, and it only ever needs to be read by a language model.
  protected_time text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_standards_pkey primary key (user_id),
  constraint user_standards_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint user_standards_coaching_stance_check
    check (coaching_stance is null or coaching_stance in ('push', 'balanced', 'protect')),
  constraint user_standards_hours_check
    check (target_deep_work_hours is null or (target_deep_work_hours > 0 and target_deep_work_hours <= 24)),
  constraint user_standards_workdays_check
    check (target_workdays_per_week is null or (target_workdays_per_week >= 1 and target_workdays_per_week <= 7))
);
