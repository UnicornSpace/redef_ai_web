-- Add an optional due date to tasks so they can show up on a calendar/timeline
-- view later. Nullable: a task with no due date is just a plain todo, unchanged
-- from current behavior.

alter table public.tasks
  add column due_date date;

create index tasks_user_id_due_date_idx
  on public.tasks (user_id, due_date);
