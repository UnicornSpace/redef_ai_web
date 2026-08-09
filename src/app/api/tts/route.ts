/**
 * Server-side proxy for Unreal Speech's /stream endpoint (docs at
 * https://docs.unrealspeech.com/reference/stream). This exists so the
 * client can request TTS audio without ever seeing the API key.
 *
 * Requires `UNREALSPEECH_API_KEY` in .env.local. If it isn't set, this
 * route responds 501 and the client-side auto-speak just no-ops — the
 * chat still works, it just doesn't talk. Voice defaults to "Sierra";
 * override with a `voice` field in the request body if you want a
 * different one (Amelia, Zephyr, Autumn, Charlotte, Willow, etc.).
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.UNREALSPEECH_API_KEY;
  if (!apiKey) {
    return new Response("TTS not configured", { status: 501 });
  }

  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) return new Response("Missing text", { status: 400 });

  // /stream caps around ~500 chars in practice; anything longer gets
  // clipped to a safe length. The caller (useTTSQueue) already breaks on
  // sentence boundaries, so this is a defense-in-depth truncation.
  const safeText = text.slice(0, 500);

  const upstream = await fetch("https://api.v8.unrealspeech.com/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Text: safeText,
      VoiceId: body.voice ?? "Sierra",
      Bitrate: "192k",
      Speed: "0",
      Pitch: "1",
      Codec: "libmp3lame",
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return new Response(`Upstream TTS error: ${errText}`, {
      status: upstream.status || 502,
    });
  }

  // Pass through Unreal Speech's MP3 stream directly — no buffering, so
  // the client can start playing as bytes arrive.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
