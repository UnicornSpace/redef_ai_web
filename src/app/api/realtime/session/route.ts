import { getUserPreferences } from "@/actions/chat";
import { getMyProfile } from "@/actions/profile";
import { getMyStandards } from "@/actions/standards";
import { getUserBaseline } from "@/lib/baseline";
import { buildSystemPrompt } from "@/lib/chat-prompt";
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/modules";
import { buildRealtimeTools } from "@/lib/realtime-tools";
import { createClient } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirmed via a live 404 from OpenAI ("Invalid URL POST /v1/realtime/
// sessions") that the old preview-era endpoint + flat session shape is
// gone — the GA Realtime API mints ephemeral secrets from
// /v1/realtime/client_secrets instead, wrapping session config under a
// `session` key with audio settings nested under `audio.input`/
// `audio.output` rather than flat `voice`/`turn_detection` fields.
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || "alloy";

/**
 * Mints a short-lived ("ephemeral") Realtime API session. The browser
 * gets back only a client secret scoped to this one call plus the model
 * name — never OPENAI_API_KEY, and never the system prompt or tool
 * implementations, which are baked into the session server-side here.
 */
export async function POST(): Promise<Response> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const [preferences, profile, standards] = await Promise.all([
    getUserPreferences(),
    getMyProfile(),
    getMyStandards(),
  ]);
  const enabledModules: ModuleKey[] =
    profile?.enabled_modules ?? DEFAULT_ENABLED_MODULES;

  // The voice session's instructions are fixed for the whole call, so the
  // baseline is a snapshot from when the call started. That's the right
  // trade — this is what stops the assistant telling a nine-hour-a-day
  // person to wrap up at hour two, which is exactly the bug that surfaced
  // in voice mode first.
  const baseline = await getUserBaseline(
    supabase,
    authData.user.id,
    enabledModules,
  );

  const instructions = buildSystemPrompt({
    preferences,
    enabledModules,
    mode: "voice",
    baseline,
    standards,
  });
  const tools = buildRealtimeTools(enabledModules);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          instructions,
          tools,
          tool_choice: "auto",
          audio: {
            input: {
              // Model detects when the user starts/stops talking on its
              // own — no manual "commit the audio buffer now" handshake.
              turn_detection: { type: "server_vad" },
              transcription: { model: "whisper-1" },
            },
            output: { voice: REALTIME_VOICE },
          },
        },
      }),
    });
  } catch (err) {
    console.error("[realtime/session] fetch to OpenAI failed", err);
    return Response.json(
      { error: "Could not reach OpenAI to start a voice session" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[realtime/session] session creation failed", res.status, text);
    // Surfacing the upstream message (not just a generic string) while
    // this integration is still stabilizing against a fast-moving API —
    // only reaches the already-signed-in user who clicked the button.
    return Response.json(
      { error: "Could not start a realtime voice session", detail: text },
      { status: 502 },
    );
  }

  const session = await res.json();
  return Response.json({
    clientSecret: session.value,
    expiresAt: session.expires_at,
    model: REALTIME_MODEL,
  });
}
