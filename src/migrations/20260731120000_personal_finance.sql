-- Personal finance: a single transactions table for tracking expenses and income.
--
-- Kept deliberately flat/simple to match the existing schema style (tasks, habits,
-- projects): category and space are free-text columns with app-side autocomplete
-- suggestions, not separate lookup tables. Soft-deletes via is_deleted, same as
-- every other table in this app.
--
-- type       - "expense" or "income"
-- amount     - always positive; sign/meaning comes from `type`
-- category   - free text (e.g. "Groceries", "Salary"), user can type any custom value
-- space      - free text label to group related transactions (e.g. "Japan trip")
-- occurred_on - the date the transaction happened (today, yesterday, or any custom date)

create table public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  type text not null,
  amount numeric(12, 2) not null,
  category text,
  space text,
  description text,
  occurred_on date not null default current_date,
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint transactions_type_check check (type in ('expense', 'income')),
  constraint transactions_amount_check check (amount > 0)
);

create index transactions_user_id_occurred_on_idx
  on public.transactions (user_id, occurred_on desc);
