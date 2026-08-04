-- Goals: a time-boxed target the user sets for themselves — a set of
-- habits, a set of tasks, and/or a daily deep-work hours target, over a
-- date range (weekly / 21-day / monthly / custom).
--
-- Deep-work hours progress is NOT stored here — it's computed at read time
-- by summing deepwork_sessions rows whose start_time falls within
-- [start_date, end_date], compared against daily_hours_target. No join
-- table needed for that part, same reasoning as habits.completed_dates
-- not needing a separate check-ins table.

create table public.goals (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  period_type text not null default 'custom', -- 'weekly' | '21_day' | 'monthly' | 'custom'
  start_date date not null default current_date,
  end_date date not null,
  daily_hours_target numeric, -- nullable: goal may be habits/tasks-only
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint goals_pkey primary key (id),
  constraint goals_user_id_fkey foreign key (user_id) references auth.users (id)
);

create table public.goal_habits (
  goal_id uuid not null,
  habit_id uuid not null,
  constraint goal_habits_pkey primary key (goal_id, habit_id),
  constraint goal_habits_goal_id_fkey foreign key (goal_id) references public.goals (id),
  constraint goal_habits_habit_id_fkey foreign key (habit_id) references public.habits (id)
);

create table public.goal_tasks (
  goal_id uuid not null,
  task_id uuid not null,
  constraint goal_tasks_pkey primary key (goal_id, task_id),
  constraint goal_tasks_goal_id_fkey foreign key (goal_id) references public.goals (id),
  constraint goal_tasks_task_id_fkey foreign key (task_id) references public.tasks (id)
);

create index goals_user_id_idx on public.goals (user_id);
create index goal_habits_goal_id_idx on public.goal_habits (goal_id);
create index goal_tasks_goal_id_idx on public.goal_tasks (goal_id);
