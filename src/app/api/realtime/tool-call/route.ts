import { getMyProfile } from "@/actions/profile";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
import { executeRealtimeTool } from "@/lib/realtime-tools";
import { createClient } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The browser can't call OpenAI's Realtime API tools directly — a
 * function call over the WebRTC data channel just tells the client "the
 * model wants to call X with these arguments"; something with server
 * access has to actually run it. This proxies to the exact same tool
 * objects/execute functions the text chat uses (src/lib/realtime-tools.ts),
 * gated by the same enabled-modules check, using the caller's own session
 * cookie — same trust boundary as every other server action in the app.
 */
export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { name?: string; arguments?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.name) {
    return Response.json({ error: "Missing tool name" }, { status: 400 });
  }

  const profile = await getMyProfile();
  const enabledModules: ModuleKey[] =
    profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;

  const result = await executeRealtimeTool(body.name, body.arguments, enabledModules);
  return Response.json(result);
}
