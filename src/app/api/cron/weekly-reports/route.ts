import { runWeeklyReportCronForAllUsers } from "@/actions/reports";

// Touches every user via the service-role key — must run on Node, and
// must never be reachable without the shared secret below.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // one Sunday run over every user can take a while

/**
 * Triggered weekly by Vercel Cron (see vercel.json — Sundays, 09:00 UTC).
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
 * invocations when a CRON_SECRET env var is set on the project, which is
 * also what any external scheduler (cron-job.org, a GitHub Actions
 * schedule, etc.) should be configured to send if this ever needs to run
 * somewhere other than Vercel.
 *
 * GET because that's what Vercel Cron issues; POST is also accepted for
 * manually triggering a run (e.g. `curl -X POST ... -H "Authorization:
 * Bearer $CRON_SECRET"`) without waiting for Sunday.
 */
async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional override for a manual backfill/replay of a specific week:
  // POST with ?asOf=2026-08-24 (a Sunday) to regenerate that week instead
  // of "today". Defaults to today, which is correct for the real Sunday
  // cron trigger.
  const url = new URL(req.url);
  const asOfKey = url.searchParams.get("asOf") ?? undefined;

  const result = await runWeeklyReportCronForAllUsers(asOfKey);
  return Response.json(result);
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
