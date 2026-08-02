import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — authenticated with the service-role key, so it
 * bypasses Row Level Security. Use ONLY for reads/writes that need to
 * cross user boundaries (e.g. looking up a habit or challenge by id when
 * the caller isn't the owner, for shareable invite links).
 *
 * SERVER ONLY. Never import this into a client component or a route
 * exposed to the browser — the service-role key must never be shipped.
 *
 * Env vars: prefers SUPABASE_SERVICE_ROLE_KEY (the conventional name),
 * falls back to SUPABASE_KEY. If your SUPABASE_KEY is actually the anon
 * key, RLS won't be bypassed — check the Supabase dashboard: Settings →
 * API → Project API keys → service_role (NOT anon).
 */
export function createAdminClient() {
  // `||` (not `??`) deliberately — an empty-string env var (e.g. a blank
  // SUPABASE_URL="" left over in .env.local) should also fall through to
  // the next candidate, not be treated as "set".
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
