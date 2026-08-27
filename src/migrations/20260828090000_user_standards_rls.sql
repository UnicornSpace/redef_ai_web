-- Fixes: "new row violates row-level security policy for table
-- "user_standards"" on the very first save.
--
-- Every other table in this app (habits, tasks, transactions, chats,
-- user_preferences...) relies on app-layer filtering — every action does
-- `.eq("user_id", user.id)` itself and RLS is left off, which is this
-- project's established (if slightly unusual) convention; see the note in
-- 20260805090000_profiles.sql. user_standards is the odd one out: RLS
-- ended up enabled on it (most likely via Supabase's dashboard security
-- advisor, which flags any new table with no policies) with zero policies
-- attached — which doesn't fall back to "no protection", it falls back to
-- "reject everything," including the owning user's own writes.
--
-- Rather than fight that by disabling RLS again (which the advisor will
-- just re-flag), this gives the table real policies. It's more correct
-- than the app-layer-only pattern anyway — worth doing here since we're
-- touching it, not worth a separate migration sweeping every other table.

alter table public.user_standards enable row level security;

create policy "select own standards"
  on public.user_standards for select
  using (auth.uid() = user_id);

create policy "insert own standards"
  on public.user_standards for insert
  with check (auth.uid() = user_id);

create policy "update own standards"
  on public.user_standards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own standards"
  on public.user_standards for delete
  using (auth.uid() = user_id);
