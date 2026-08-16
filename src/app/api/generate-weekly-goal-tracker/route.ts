import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { WeeklyGoalTrackerDocument } from "@/components/weekly-goal-tracker/weekly-goal-tracker-pdf";
import { weeklyPlannerConfigSchema } from "@/lib/weekly-goal-tracker/schema";

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

  const parsed = weeklyPlannerConfigSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid planner config", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const config = parsed.data;

  try {
    const buffer = await renderToBuffer(
      createElement(WeeklyGoalTrackerDocument, { config }) as unknown as Parameters<
        typeof renderToBuffer
      >[0],
    );

    const filename = config.blank
      ? "redef-weekly-goal-planner-blank.pdf"
      : "redef-weekly-goal-planner.pdf";
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
    console.error("[generate-weekly-goal-tracker] render failed", err);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
