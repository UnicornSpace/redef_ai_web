import { Resend } from "resend";
import type { ReportMetric, WeeklyReportData } from "@/lib/types/reports";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redefai.app";
// Needs a domain verified in the Resend dashboard before this will actually
// deliver — sending from an unverified domain gets rejected or lands in
// spam. Override with WEEKLY_REPORT_FROM_EMAIL once that's set up.
const FROM_EMAIL =
  process.env.WEEKLY_REPORT_FROM_EMAIL || "Redef AI <reports@redefai.app>";

let client: Resend | null = null;
function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(key);
  }
  return client;
}

export async function sendWeeklyReportEmail(params: {
  to: string;
  data: WeeklyReportData;
}): Promise<{ error?: string }> {
  try {
    const res = await getResend().emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Your week: ${params.data.windowLabel}`,
      html: renderWeeklyReportEmailHtml(params.data),
    });
    if (res.error) return { error: res.error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

// ---------------------------------------------------------------------------
// HTML — plain inline-styled tables. Email clients (Outlook especially)
// don't render flexbox/grid reliably, so this deliberately doesn't reuse
// any of the app's Tailwind/f-* styling — tables are the safe baseline.
// ---------------------------------------------------------------------------

const INK = "#37322f";
const MUTED = "#8b8b7d";
const GREEN = "#3e9a35";
const GREEN_PALE = "#eaf5e7";
const LINE = "#eae6df";

function pctLabel(m: ReportMetric): string {
  if (m.previous === 0) return m.current > 0 ? "New this week" : "";
  const pct = ((m.current - m.previous) / m.previous) * 100;
  if (Math.abs(pct) < 0.5) return "Flat vs last week";
  const arrow = pct > 0 ? "&uarr;" : "&darr;";
  return `${arrow} ${Math.abs(pct).toFixed(0)}% vs last week`;
}

function statRow(label: string, valueText: string, metric: ReportMetric, avgText: string): string {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${LINE};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">
              ${label}
            </td>
          </tr>
          <tr>
            <td style="font-size:28px;font-weight:800;color:${INK};padding-top:4px;">
              ${valueText}
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:${MUTED};padding-top:4px;">
              ${pctLabel(metric)} &middot; ${avgText} avg/week
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function formatMoney(n: number): string {
  return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function renderWeeklyReportEmailHtml(data: WeeklyReportData): string {
  const rows: string[] = [];

  if (data.habits) {
    rows.push(
      statRow(
        "Habit check-ins",
        String(data.habits.current),
        data.habits,
        data.habits.monthAvgPerWeek.toFixed(1),
      ),
    );
  }
  if (data.tasks) {
    rows.push(
      statRow(
        "Tasks completed",
        String(data.tasks.current),
        data.tasks,
        data.tasks.monthAvgPerWeek.toFixed(1),
      ),
    );
  }
  if (data.deepWork) {
    rows.push(
      statRow(
        "Deep work",
        `${data.deepWork.current.toFixed(1)}h`,
        data.deepWork,
        `${data.deepWork.monthAvgPerWeek.toFixed(1)}h`,
      ),
    );
  }
  if (data.personalFinance) {
    rows.push(
      statRow(
        "Spent",
        formatMoney(data.personalFinance.spent.current),
        data.personalFinance.spent,
        formatMoney(data.personalFinance.spent.monthAvgPerWeek),
      ),
    );
    rows.push(
      statRow(
        "Income",
        formatMoney(data.personalFinance.income.current),
        data.personalFinance.income,
        formatMoney(data.personalFinance.income.monthAvgPerWeek),
      ),
    );
  }

  const body = rows.length
    ? rows.join("")
    : `<tr><td style="padding:24px 0;color:${MUTED};font-size:14px;">Nothing tracked this week — turn on a module in Preferences to start seeing your report.</td></tr>`;

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
            <tr>
              <td style="padding:28px 28px 4px;">
                <span style="display:inline-block;background:${GREEN_PALE};color:${GREEN};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">
                  Weekly report
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;font-size:22px;font-weight:800;color:${INK};">
                ${data.windowLabel}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${body}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 28px;">
                <a href="${SITE_URL}/app/reports" style="display:inline-block;background:${GREEN};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:999px;">
                  Open your full report
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:${MUTED};margin-top:16px;">
            Redef AI &middot; ${SITE_URL.replace(/^https?:\/\//, "")}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}
