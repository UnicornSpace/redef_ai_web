import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { HabitTrackerDocument } from "@/components/habit-tracker/habit-tracker-pdf";
import { trackerConfigSchema } from "@/lib/habit-tracker/schema";

// react-pdf reads font files from disk and uses Node APIs — must run on Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = trackerConfigSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid tracker config", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const config = parsed.data;

  try {
    const buffer = await renderToBuffer(
      createElement(HabitTrackerDocument, { config }) as unknown as Parameters<
        typeof renderToBuffer
      >[0],
    );

    const filename = `redef-habit-tracker-${config.challengeLength}-day.pdf`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[generate-tracker] render failed", err);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
