import { createClient } from "@/lib/server";
import { tool } from "ai";
import z from "zod";

/**
 * Personal-finance tools for AI Talk. Structured outputs — the chat pane
 * renders finance summaries as metric cards and transaction lists as
 * receipt rows, not as a wall of JSON.
 */

type RangeKey = "today" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns a CLOSED [start, end] date-key range (both inclusive, both
 * YYYY-MM-DD) for the given preset — critically, always with an upper
 * bound. The previous version only applied a lower-bound filter, so
 * every range silently included everything from that start date through
 * today; "yesterday" wasn't even offered as an option, so the model
 * would approximate it with "week" and return 7x too much.
 */
function rangeToDateKeys(
  range: RangeKey,
  startDate?: string,
  endDate?: string,
): { start: string; end: string } | null {
  const today = new Date();
  const todayKey = dateKey(today);

  if (range === "today") return { start: todayKey, end: todayKey };

  if (range === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    const key = dateKey(y);
    return { start: key, end: key };
  }

  if (range === "week") {
    const s = new Date(today);
    s.setDate(s.getDate() - 6);
    return { start: dateKey(s), end: todayKey };
  }

  if (range === "month") {
    const s = new Date(today);
    s.setDate(s.getDate() - 29);
    return { start: dateKey(s), end: todayKey };
  }

  if (range === "year") {
    const s = new Date(today);
    s.setFullYear(s.getFullYear() - 1);
    return { start: dateKey(s), end: todayKey };
  }

  if (range === "custom") {
    if (!startDate || !endDate) return null;
    return { start: startDate, end: endDate };
  }

  // "all"
  return { start: "0000-01-01", end: todayKey };
}

export const getFinanceSummaryTool = tool({
  description:
    "Summarize the user's personal finance for a range: total income, " +
    "total spent, net, and top spending categories. Use for questions " +
    "like \"how much did I spend yesterday\" or \"what did I spend on " +
    "this month\". Use range='custom' with startDate+endDate for anything " +
    "that doesn't fit a preset.",
  inputSchema: z.object({
    range: z
      .enum(["today", "yesterday", "week", "month", "year", "all", "custom"])
      .describe(
        "today, yesterday, last 7 days, last 30 days, last year, all-time, or custom",
      ),
    startDate: z
      .string()
      .optional()
      .describe("YYYY-MM-DD, only with range='custom'"),
    endDate: z
      .string()
      .optional()
      .describe("YYYY-MM-DD, only with range='custom'"),
  }),
  execute: async ({ range, startDate, endDate }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }

    const bounds = rangeToDateKeys(range as RangeKey, startDate, endDate);
    if (!bounds) return { error: "Invalid range" };

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, category")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .gte("occurred_on", bounds.start)
      .lte("occurred_on", bounds.end);
    if (error) return { error: error.message };

    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, number>();
    for (const t of data ?? []) {
      const amt = Number(t.amount ?? 0);
      if (t.type === "income") income += amt;
      else {
        expense += amt;
        const cat = (t.category as string | null) || "Uncategorized";
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + amt);
      }
    }
    const topCategories = Array.from(byCategory.entries())
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      data: {
        range,
        startDate: bounds.start,
        endDate: bounds.end,
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        net: Number((income - expense).toFixed(2)),
        transactionCount: (data ?? []).length,
        topCategories,
      },
    };
  },
});

export const listRecentTransactionsTool = tool({
  description:
    "List the most recent N transactions with description, amount, " +
    "type, and category. Renders as a receipt-style list in the chat.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10)
      .optional()
      .describe("How many recent transactions to fetch (max 20)"),
  }),
  execute: async ({ limit }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, category, description, occurred_on")
      .eq("user_id", user.user.id)
      .eq("is_deleted", false)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { error: error.message };

    return {
      data: {
        transactions: (data ?? []).map((t) => ({
          id: t.id as string,
          type: t.type as "income" | "expense",
          amount: Number(t.amount ?? 0),
          category: (t.category as string | null) ?? null,
          description: (t.description as string | null) ?? null,
          occurredOn: t.occurred_on as string,
        })),
      },
    };
  },
});

export const addTransactionTool = tool({
  description:
    "Add a personal-finance transaction (expense or income). Only call " +
    "when the user clearly says they want to log a specific amount.",
  inputSchema: z.object({
    type: z.enum(["expense", "income"]),
    amount: z.number().positive().describe("Amount, always positive"),
    category: z
      .string()
      .nullable()
      .optional()
      .describe("Category label, e.g. Food, Transport, Salary"),
    description: z.string().nullable().optional(),
    occurredOn: z
      .string()
      .describe("Date the transaction happened, YYYY-MM-DD"),
  }),
  execute: async ({ type, amount, category, description, occurredOn }) => {
    const supabase = await createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user) {
      return { error: authError?.message ?? "Not signed in" };
    }
    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: user.user.id,
      type,
      amount,
      category: category ?? null,
      description: description ?? null,
      occurred_on: occurredOn,
    });
    if (error) return { error: error.message };
    return {
      data: `Logged ${type} of ${amount.toFixed(2)}${category ? ` (${category})` : ""}.`,
    };
  },
});
