/**
 * CORS allowlist for API routes the marketing site (redef_ai_marketing_site,
 * a separate Astro origin — see its src/lib/app-api.ts) calls cross-origin.
 * Currently just the two stateless PDF-generation endpoints; no auth, no
 * cookies, no user data in the request or response, so reflecting an
 * allow-listed Origin is safe here without touching credentials.
 */
const ALLOWED_ORIGINS = [
  "http://localhost:4321", // astro dev
  "https://redefai.app",
  "https://www.redefai.app",
];

export function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

export function corsPreflight(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}
