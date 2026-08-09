"use client";

import type { ToolUIPart } from "ai";
import { CheckIcon, WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom UI for structured tool outputs, so the chat pane can show
 * tasks / habits / finance as purpose-built widgets instead of a raw
 * JSON dump. Called from ChatPane's tool-part branch.
 *
 * Returns `null` when the tool type isn't one we specially render — the
 * caller falls back to the generic Tool/ToolOutput display.
 */

type Data = Record<string, unknown> | null | undefined;

function asData(output: unknown): Data {
  if (output == null) return null;
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    // Tools return { data: ... } — unwrap.
    if ("data" in obj && obj.data && typeof obj.data === "object") {
      return obj.data as Data;
    }
    return obj;
  }
  return null;
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TaskList({ data }: { data: Data }) {
  const tasks = (data?.tasks as
    | Array<{
        id: string;
        name: string;
        category: string | null;
        dueDate: string | null;
        isCompleted: boolean;
      }>
    | undefined) ?? [];
  const filter = (data?.filter as string | undefined) ?? "open";
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-paper p-3 text-sm text-body-muted">
        No {filter} tasks.
      </p>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-paper">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-start gap-3 px-3 py-2.5">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
              t.isCompleted
                ? "border-rf-green-deep bg-rf-green-deep text-white"
                : "border-line bg-white",
            )}
          >
            {t.isCompleted ? <CheckIcon className="size-3.5" /> : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                "text-sm text-ink",
                t.isCompleted && "text-body-muted line-through",
              )}
            >
              {t.name}
            </span>
            {t.category || t.dueDate ? (
              <span className="flex flex-wrap gap-1.5 text-xs text-body-muted">
                {t.category ? <span>{t.category}</span> : null}
                {t.dueDate ? <span>· due {fmtDate(t.dueDate)}</span> : null}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function HabitChips({ data }: { data: Data }) {
  const habits = (data?.habits as
    | Array<{
        id: string;
        name: string;
        category: string | null;
        doneToday: boolean;
        streak: number;
      }>
    | undefined) ?? [];
  if (habits.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-paper p-3 text-sm text-body-muted">
        No habits set up.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {habits.map((h) => (
        <div
          key={h.id}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
            h.doneToday
              ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
              : "border-line bg-paper text-body-muted",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-4 items-center justify-center rounded-full",
              h.doneToday ? "bg-rf-green-deep text-white" : "bg-line",
            )}
          >
            {h.doneToday ? <CheckIcon className="size-2.5" /> : null}
          </span>
          <span className="text-ink">{h.name}</span>
          {h.streak > 0 ? (
            <span className="text-body-muted">· {h.streak}d</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FinanceSummary({ data }: { data: Data }) {
  if (!data) return null;
  const income = Number(data.income ?? 0);
  const expense = Number(data.expense ?? 0);
  const net = Number(data.net ?? 0);
  const topCategories =
    (data.topCategories as Array<{ category: string; amount: number }>) ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Income" value={fmtMoney(income)} tone="income" />
        <MetricCard label="Spent" value={fmtMoney(expense)} tone="expense" />
        <MetricCard
          label="Net"
          value={fmtMoney(net)}
          tone={net >= 0 ? "income" : "expense"}
        />
      </div>
      {topCategories.length > 0 ? (
        <div className="rounded-xl border border-line bg-paper">
          <div className="border-b border-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-body-muted">
            Top categories
          </div>
          <div className="flex flex-col divide-y divide-line">
            {topCategories.map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between px-3 py-1.5 text-sm"
              >
                <span className="text-ink">{c.category}</span>
                <span className="tabular-nums font-semibold text-rf-coral">
                  {fmtMoney(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-paper px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-body-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-base font-bold tabular-nums",
          tone === "income" ? "text-rf-green-deep" : "text-rf-coral",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TransactionList({ data }: { data: Data }) {
  const txns = (data?.transactions as
    | Array<{
        id: string;
        type: "income" | "expense";
        amount: number;
        category: string | null;
        description: string | null;
        occurredOn: string;
      }>
    | undefined) ?? [];
  if (txns.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-paper p-3 text-sm text-body-muted">
        No transactions yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-paper">
      {txns.map((t) => (
        <div key={t.id} className="flex items-center gap-3 px-3 py-2">
          <WalletIcon className="size-4 shrink-0 text-body-muted" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-ink">
              {t.description || t.category || "Untitled"}
            </span>
            <span className="text-xs text-body-muted">
              {fmtDate(t.occurredOn)}
              {t.category ? ` · ${t.category}` : ""}
            </span>
          </div>
          <span
            className={cn(
              "tabular-nums shrink-0 text-sm font-semibold",
              t.type === "income" ? "text-rf-green-deep" : "text-rf-coral",
            )}
          >
            {t.type === "income" ? "+" : "-"}
            {fmtMoney(t.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Router: given a tool part, returns the custom widget if we have one,
 * else null (so the caller falls back to the generic JSON display).
 */
export function renderToolOutput(part: ToolUIPart): React.ReactElement | null {
  if (part.state !== "output-available") return null;
  const data = asData(part.output);
  if (!data) return null;

  switch (part.type) {
    case "tool-getTasks":
      return <TaskList data={data} />;
    case "tool-listHabits":
      return <HabitChips data={data} />;
    case "tool-getFinanceSummary":
      return <FinanceSummary data={data} />;
    case "tool-listRecentTransactions":
      return <TransactionList data={data} />;
    default:
      return null;
  }
}
