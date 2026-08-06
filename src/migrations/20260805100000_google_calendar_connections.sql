-- Google Calendar sync: stores the OAuth access/refresh tokens captured
-- from Supabase's Google provider when a user explicitly connects their
-- calendar (a separate, opt-in re-auth requesting the calendar.readonly
-- scope — see src/actions/google-calendar.ts:connectGoogleCalendar).
--
-- SECURITY: this table holds live OAuth tokens. Row Level Security MUST be
-- enabled in the Supabase dashboard restricting all access to
-- `auth.uid() = user_id`, matching every other per-user table in this app
-- (RLS is managed in the dashboard, not version-controlled here — see the
-- other migrations). The app itself only ever reads/writes a user's own
-- row through the RLS-scoped server client (src/lib/server.ts), never the
-- admin client, and never sends these tokens to the browser.

create table public.google_calendar_connections (
  user_id uuid not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone not null,
  connected_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint google_calendar_connections_pkey primary key (user_id),
  constraint google_calendar_connections_user_id_fkey foreign key (user_id) references auth.users (id)
);
