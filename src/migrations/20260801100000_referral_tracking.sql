-- Referral tracking on user_preferences.
--
-- Deliberately simple: two new columns on the existing user_preferences row.
--
--   referral_code — this user's own code, shown to them in /app/profile/referral.
--                   Populated lazily the first time the user visits that page.
--                   Not marked UNIQUE at the DB layer because we generate it
--                   deterministically from user_id (first 8 hex chars) — collisions
--                   are cryptographically improbable and easy to reject at app layer.
--
--   referred_by   — the referral_code (or raw user_id prefix) the user came in with,
--                   captured from a ?ref= query param on their first pageview and
--                   persisted on first sign-in. Read-only after that.
--
-- No separate referrals table yet — we can add one when we start crediting
-- rewards; for now we just want to know "who came in through whose link".

alter table public.user_preferences
  add column if not exists referral_code text,
  add column if not exists referred_by text;

create index if not exists user_preferences_referred_by_idx
  on public.user_preferences (referred_by);
