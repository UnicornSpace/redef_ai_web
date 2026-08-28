import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

/**
 * Raw Supabase/OAuth error strings, translated into something a user can
 * actually act on. This page used to receive no error info at all (every
 * redirect() call that sent someone here omitted the query string), so it
 * always showed "An unspecified error occurred" regardless of what broke —
 * now that /auth/callback and /auth/confirm pass the real message through,
 * this is where it earns its keep by not just echoing raw Supabase/OAuth
 * text back at someone who has no way to know what it means.
 */
function friendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("code challenge") || lower.includes("code verifier")) {
    return "This sign-in link expired or was already used. Go back and try signing in again.";
  }
  if (lower.includes("invalid") && lower.includes("code")) {
    return "This sign-in link is invalid or has expired. Try signing in again.";
  }
  if (lower.includes("no sign-in code")) {
    return raw;
  }
  if (lower.includes("email not confirmed")) {
    return "Your email isn't confirmed yet — check your inbox for the confirmation link.";
  }
  if (lower.includes("user already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Couldn't reach the sign-in server. Check your connection and try again.";
  }
  return raw;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const rawError = params?.error?.trim();

  return (
    <AuthShell title="Sorry, something went wrong">
      <div className="flex flex-col items-center gap-5">
        <p className="text-center text-sm text-ink">
          {rawError ? friendlyMessage(rawError) : "An unspecified error occurred."}
        </p>
        {rawError ? (
          <details className="w-full rounded-lg border border-line bg-paper/60 px-3 py-2 text-xs text-body-muted">
            <summary className="cursor-pointer select-none">
              Technical details
            </summary>
            <p className="mt-1.5 break-words font-mono">{rawError}</p>
          </details>
        ) : null}
        <Button render={<Link href="/auth/login" />} className="w-full">
          Back to login
        </Button>
      </div>
    </AuthShell>
  );
}
