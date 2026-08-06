import { openai } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from "ai";
import { createClient } from "@/lib/server";

export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("audio");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    const audio = new Uint8Array(await file.arrayBuffer());
    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio,
    });
    return Response.json({ text: result.text });
  } catch (err) {
    console.error("[transcribe]", err);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
