-- /app/talk chat history + personalization ("memory") settings.
--
-- Design decision, since this was asked to be kept simple rather than fully
-- normalized:
--
-- `chats.messages` stores the full AI SDK v6 UIMessage[] array as jsonb, one
-- row per conversation. This is the pattern AI SDK's own examples use: a
-- UIMessage already carries everything that happened in a turn (text parts,
-- tool calls + their results, reasoning, attachments) as nested JSON, so
-- storing it as one jsonb blob per chat preserves full context without a
-- message-per-row schema (chat_id, role, parts...) that would need a join on
-- every single load and buys nothing unless we need to query into individual
-- messages with SQL. If that need shows up later (search across messages,
-- analytics), messages can be split into their own table then.
--
-- `user_preferences` is the personalization/"memory" settings: one row per
-- user. `traits` is a jsonb bag for the tunable style knobs (enthusiasm,
-- verbosity, use_images, and whatever else personalization grows to include)
-- so new knobs don't need a migration each time - only promote a key out of
-- `traits` into its own column once it's stable and queried directly.
-- `memory_summary` is a running free-text summary the assistant maintains
-- about the user over time (facts learned across conversations), separate
-- from the one-time-entered `nickname`/`occupation`/`custom_instructions`.

create table public.chats (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chats_pkey primary key (id),
  constraint chats_user_id_fkey foreign key (user_id) references auth.users (id)
);

create index chats_user_id_updated_at_idx
  on public.chats (user_id, updated_at desc);

create table public.user_preferences (
  user_id uuid not null,
  nickname text,
  occupation text,
  traits jsonb not null default '{}'::jsonb,
  custom_instructions text,
  memory_summary text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_preferences_pkey primary key (user_id),
  constraint user_preferences_user_id_fkey foreign key (user_id) references auth.users (id)
);
