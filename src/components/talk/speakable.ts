import type { ToolUIPart, UIMessage } from "ai";

/**
 * Turns an assistant message into clean, natural-sounding speech text.
 *
 * The problem this solves: for list/summary tools (tasks, habits, finance,
 * recent transactions) the chat renders a purpose-built VISUAL widget, and
 * the model is instructed (see src/app/api/chat/route.ts) to keep its text
 * reply a one-line caption that does NOT restate the widget's rows. Great
 * for reading — but "Read Aloud" / auto-speak only ever spoke that caption,
 * so everything the user could SEE (their actual tasks, habits, numbers)
 * was silently skipped.
 *
 * Here we reconstruct a spoken version of each widget's data on the fly —
 * grouped under a single natural label ("You have 3 open tasks: ...") rather
 * than dumping raw JSON/array structure — and stitch it together with the
 * caption in the same top-to-bottom order the user sees on screen.
 */

type AnyRecord = Record<string, unknown>;

// Tool executes return { data: <payload> } | { error }; unwrap to the
// payload (mirrors asData() in tool-renderers.tsx).
function unwrapData(output: unknown): AnyRecord | null {
  if (output == null || typeof output !== "object") return null;
  const obj = output as AnyRecord;
  if ("data" in obj && obj.data && typeof obj.data === "object") {
    return obj.data as AnyRecord;
  }
  return obj;
}

// "A" / "A and B" / "A, B, and C" — reads like a person listing things,
// not a comma-delimited data dump.
function joinNatural(items: string[]): string {
  const parts = items.filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

// Drop the ".00" when it's a whole number so TTS says "twelve" not
// "twelve point zero zero"; keep cents when they're meaningful.
function spokenAmount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const hasCents = Math.abs(rounded % 1) > 0.001;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

// "August 12" rather than "2026-08-12" — a date a voice can read cleanly.
function spokenDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function humanRange(range: unknown): string {
  switch (range) {
    case "today":
      return "today";
    case "yesterday":
      return "yesterday";
    case "week":
      return "over the past week";
    case "month":
      return "over the past month";
    case "year":
      return "over the past year";
    case "all":
      return "all time";
    default:
      return "";
  }
}

type TaskRow = { name: string; dueDate: string | null; isCompleted: boolean };
function tasksToSpeech(d: AnyRecord): string {
  const tasks = (d.tasks as TaskRow[] | undefined) ?? [];
  const filter = (d.filter as string | undefined) ?? "open";
  const label = filter === "completed" ? "completed" : "open";
  if (tasks.length === 0) {
    return label === "completed"
      ? "You have no completed tasks."
      : "You have no open tasks.";
  }
  const names = tasks.map((t) => {
    const due = spokenDate(t.dueDate);
    return due ? `${t.name}, due ${due}` : t.name;
  });
  const noun = tasks.length === 1 ? "task" : "tasks";
  return `You have ${tasks.length} ${label} ${noun}: ${joinNatural(names)}.`;
}

type HabitRow = { name: string; doneToday: boolean; streak: number };
function habitsToSpeech(d: AnyRecord): string {
  const habits = (d.habits as HabitRow[] | undefined) ?? [];
  if (habits.length === 0) return "You don't have any habits set up yet.";
  const done = habits.filter((h) => h.doneToday);
  const notDone = habits.filter((h) => !h.doneToday);
  const total = habits.length;
  let s = `${done.length} of ${total} habit${total === 1 ? "" : "s"} done today.`;
  if (done.length > 0) {
    const names = done.map((h) =>
      h.streak > 1 ? `${h.name}, on a ${h.streak} day streak` : h.name,
    );
    s += ` Done: ${joinNatural(names)}.`;
  }
  if (notDone.length > 0) {
    s += ` Still to do: ${joinNatural(notDone.map((h) => h.name))}.`;
  }
  return s;
}

type CategoryRow = { category: string; amount: number };
function financeToSpeech(d: AnyRecord): string {
  const income = Number(d.income ?? 0);
  const expense = Number(d.expense ?? 0);
  const net = Number(d.net ?? 0);
  const range = humanRange(d.range);
  const suffix = range && range !== "all time" ? ` ${range}` : "";
  const top = (d.topCategories as CategoryRow[] | undefined) ?? [];

  let s: string;
  if (income === 0) {
    s = `You spent ${spokenAmount(expense)}${suffix}.`;
  } else {
    s =
      `You brought in ${spokenAmount(income)} and spent ${spokenAmount(expense)}${suffix}, ` +
      (net >= 0
        ? `netting ${spokenAmount(net)}.`
        : `putting you ${spokenAmount(Math.abs(net))} in the red.`);
  }
  if (top.length > 0) {
    const cats = top.map((c) => `${c.category}, ${spokenAmount(c.amount)}`);
    s += ` Top spending: ${joinNatural(cats)}.`;
  }
  return s;
}

type TxnRow = {
  type: "income" | "expense";
  amount: number;
  category: string | null;
  description: string | null;
  occurredOn: string;
};
function transactionsToSpeech(d: AnyRecord): string {
  const txns = (d.transactions as TxnRow[] | undefined) ?? [];
  if (txns.length === 0) return "You don't have any transactions logged.";
  const items = txns.map((t) => {
    const label = t.description || t.category || "something";
    const date = spokenDate(t.occurredOn);
    const on = date ? ` on ${date}` : "";
    return t.type === "income"
      ? `received ${spokenAmount(t.amount)} from ${label}${on}`
      : `spent ${spokenAmount(t.amount)} on ${label}${on}`;
  });
  const noun = txns.length === 1 ? "transaction" : "transactions";
  return `Your ${txns.length} most recent ${noun}: ${joinNatural(items)}.`;
}

/**
 * Spoken text for a single tool part, or null if it isn't one of the
 * "shown as a widget but omitted from the caption" tools. This set is kept
 * deliberately in sync with renderToolOutput() in tool-renderers.tsx —
 * those are exactly the outputs whose data is visual-only and would
 * otherwise never be heard.
 */
export function toolPartToSpeech(part: ToolUIPart): string | null {
  if (part.state !== "output-available") return null;
  const d = unwrapData(part.output);
  if (!d) return null;
  switch (part.type) {
    case "tool-getTasks":
      return tasksToSpeech(d);
    case "tool-listHabits":
      return habitsToSpeech(d);
    case "tool-getFinanceSummary":
      return financeToSpeech(d);
    case "tool-listRecentTransactions":
      return transactionsToSpeech(d);
    default:
      return null;
  }
}

/**
 * Full spoken version of an assistant message: widget data + caption,
 * stitched together in on-screen (part) order. Used by the per-message
 * "Read Aloud" button.
 */
export function messageToSpeech(message: UIMessage): string {
  const chunks: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text") {
      const t = part.text.trim();
      if (t) chunks.push(t);
    } else if (part.type.startsWith("tool-")) {
      const spoken = toolPartToSpeech(part as ToolUIPart);
      if (spoken) chunks.push(spoken);
    }
  }
  return chunks.join(" ");
}
