/**
 * Client-side UUID v4 generator that works even in insecure contexts.
 *
 * The obvious call — `crypto.randomUUID()` — is only exposed on `window.crypto`
 * in **secure contexts** (HTTPS or localhost). Opened over HTTP on a phone via
 * LAN (e.g. `http://192.168.31.47:3000`, which this project explicitly permits
 * via `allowedDevOrigins` in next.config.ts), it's undefined, and the naive
 * fallback of `Math.random().toString(36).slice(2)` returns something like
 * `"j7xa2p9k1"`. That value is used as the id of an optimistic row; if the
 * user then edits that row before it's replaced by the real server row, we
 * call `.eq("id", "j7xa2p9k1")` against a Postgres `uuid` column and get:
 *
 *   invalid input syntax for type uuid: "j7xa2p9k1"
 *
 * which is exactly the error we hit in production.
 *
 * `crypto.getRandomValues` IS available in insecure contexts, so we hand-roll
 * a UUID v4 from it whenever `randomUUID` isn't there.
 */
export function uid(): string {
  if (typeof crypto === "undefined") {
    // SSR / non-browser fallback — server-side callers should use
    // `crypto.randomUUID()` directly (Node's crypto always has it); this
    // path only exists so the module doesn't throw at import time.
    throw new Error("crypto is not available");
  }
  if ("randomUUID" in crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // RFC 4122 §4.4 — set the version to 4 and the variant to 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
