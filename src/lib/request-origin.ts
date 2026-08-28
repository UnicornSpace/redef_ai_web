import { headers } from "next/headers";

/**
 * The origin of the ACTUAL incoming request, not a hardcoded env var.
 * Only callable from a request-scoped context (Server Component, Route
 * Handler, Server Action) — headers() requires one.
 *
 * Used anywhere an OAuth redirectTo needs to send the browser back to
 * wherever it actually came from: localhost during desktop dev, a LAN IP
 * when testing from a phone on the same wifi (see allowedDevOrigins in
 * next.config.ts), or the real production domain once deployed.
 * NEXT_PUBLIC_SITE_URL alone can't cover all three — it's a single static
 * value, so a build-time origin baked into it is wrong for every other
 * origin the app is actually reachable from.
 */
export async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";
  }
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("192.") ? "http" : "https");
  return `${proto}://${host}`;
}
