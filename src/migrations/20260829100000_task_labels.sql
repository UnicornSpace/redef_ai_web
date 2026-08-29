-- Tasks move from a single free-text `category` to multi-select `labels`.
-- "Buy" is a recognized label (case-insensitive, checked in application
-- code — see src/lib/tasks.ts) that routes a task to the dedicated
-- shopping-list view and out of the main list, AI reminders, and
-- getDayReview entirely, so there's nothing to enforce here beyond the
-- column shape itself.
alter table public.tasks add column if not exists labels text[] not null default '{}'::text[];

update public.tasks
set labels = array[category]
where category is not null and trim(category) <> '' and labels = '{}'::text[];

alter table public.tasks drop column if exists category;
