// biome-ignore-all lint/suspicious/noArrayIndexKey: static preview cells — index is a stable key here
"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Download,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeLayout } from "@/lib/habit-tracker/layout";
import {
  LIMITS,
  PRESET_LENGTHS,
  type TrackerConfig,
  WIDGET_META,
  type WidgetType,
  widgetNeedsCount,
} from "@/lib/habit-tracker/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------

interface HabitDraft {
  id: string;
  label: string;
  type: WidgetType;
  count: number;
  subLabels: string; // raw comma-separated input
}

const WIDGET_ORDER: WidgetType[] = [
  "multi-check",
  "checkbox",
  "blank-line",
  "unit-blocks",
];

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function newHabit(partial: Partial<HabitDraft> = {}): HabitDraft {
  return {
    id: uid(),
    label: "",
    type: "checkbox",
    count: 3,
    subLabels: "",
    ...partial,
  };
}

function parseSubLabels(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const QUICK_ADD: { label: string; make: () => HabitDraft }[] = [
  {
    label: "Single checkbox",
    make: () => newHabit({ label: "", type: "checkbox" }),
  },
  {
    label: "5 prayers",
    make: () =>
      newHabit({
        label: "Namaz",
        type: "multi-check",
        count: 5,
        subLabels: "F,Z,A,M,I",
      }),
  },
  {
    label: "3 meals",
    make: () =>
      newHabit({
        label: "Meals",
        type: "multi-check",
        count: 3,
        subLabels: "B,L,D",
      }),
  },
  {
    label: "Water ×8",
    make: () => newHabit({ label: "Water", type: "unit-blocks", count: 8 }),
  },
  {
    label: "Deep work",
    make: () => newHabit({ label: "Deep Work", type: "blank-line" }),
  },
];

// ---------------------------------------------------------------------------

export function HabitBuilder() {
  const [preset, setPreset] = useState<string>("21");
  const [customLength, setCustomLength] = useState<string>("30");
  const [startDate, setStartDate] = useState<string>("");
  const [habits, setHabits] = useState<HabitDraft[]>([
    newHabit({
      label: "Namaz",
      type: "multi-check",
      count: 5,
      subLabels: "F,Z,A,M,I",
    }),
    newHabit({ label: "Exercise", type: "checkbox" }),
    newHabit({ label: "Water", type: "unit-blocks", count: 8 }),
  ]);
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);

  const challengeLength =
    preset === "custom" ? Number(customLength) : Number(preset);

  // ---- derive config + validation + layout (memoized) ---------------------
  const config: TrackerConfig = useMemo(
    () => ({
      challengeLength: Number.isFinite(challengeLength) ? challengeLength : 0,
      startDate: startDate || undefined,
      habits: habits.map((h) => {
        const sub = h.type === "multi-check" ? parseSubLabels(h.subLabels) : [];
        return {
          label: h.label.trim(),
          type: h.type,
          ...(widgetNeedsCount(h.type) ? { count: h.count } : {}),
          ...(sub.length ? { subLabels: sub } : {}),
        };
      }),
    }),
    [challengeLength, startDate, habits],
  );

  const validation = useMemo(() => {
    const fieldErrors: Record<string, string> = {};
    const problems: string[] = [];

    if (!Number.isFinite(challengeLength) || challengeLength < LIMITS.minDays) {
      fieldErrors.length = `Enter ${LIMITS.minDays}–${LIMITS.maxDays} days`;
      problems.push("Challenge length is invalid");
    } else if (challengeLength > LIMITS.maxDays) {
      fieldErrors.length = `Maximum is ${LIMITS.maxDays} days`;
      problems.push(`Challenge length can't exceed ${LIMITS.maxDays} days`);
    }

    if (habits.length === 0) problems.push("Add at least one habit");
    if (habits.length > LIMITS.maxHabits) {
      problems.push(`Too many habits (max ${LIMITS.maxHabits})`);
    }

    habits.forEach((h, i) => {
      if (!h.label.trim()) fieldErrors[`${i}.label`] = "Label is required";
      if (widgetNeedsCount(h.type)) {
        if (
          !Number.isInteger(h.count) ||
          h.count < LIMITS.minCount ||
          h.count > LIMITS.maxCount
        ) {
          fieldErrors[`${i}.count`] = `${LIMITS.minCount}–${LIMITS.maxCount}`;
        }
      }
      if (h.type === "multi-check") {
        const sub = parseSubLabels(h.subLabels);
        if (sub.length > 0 && sub.length !== h.count) {
          fieldErrors[`${i}.subLabels`] =
            `Need exactly ${h.count} labels, or leave blank`;
        }
      }
    });

    const ok = problems.length === 0 && Object.keys(fieldErrors).length === 0;
    return { ok, fieldErrors, problems };
  }, [challengeLength, habits]);

  const layout = useMemo(() => {
    try {
      return computeLayout(config);
    } catch {
      return null;
    }
  }, [config]);

  // ---- mutations -----------------------------------------------------------
  const update = (id: string, patch: Partial<HabitDraft>) =>
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    );
  const remove = (id: string) =>
    setHabits((prev) => prev.filter((h) => h.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setHabits((prev) => {
      const i = prev.findIndex((h) => h.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = (draft: HabitDraft) => {
    if (habits.length >= LIMITS.maxHabits) {
      toast.error(`You can add up to ${LIMITS.maxHabits} habits`);
      return;
    }
    setHabits((prev) => [...prev, draft]);
  };

  // ---- download ------------------------------------------------------------
  async function onDownload() {
    if (!validation.ok) {
      setShowErrors(true);
      toast.error("Please fix the highlighted fields first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not generate the PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redef-habit-tracker-${challengeLength}-day.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Your printable sheet is downloading");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const err = (key: string) =>
    showErrors ? validation.fieldErrors[key] : undefined;

  // -------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex flex-1 flex-col gap-6 sm:gap-8">
        {/* Step 1 — length */}
        <section className="flex flex-col gap-3">
          <StepHeading n={1} title="Challenge length" />
          <div className="flex flex-wrap gap-2">
            {PRESET_LENGTHS.map((d) => (
              <Segment
                key={d}
                active={preset === String(d)}
                onClick={() => setPreset(String(d))}
              >
                {d} days
              </Segment>
            ))}
            <Segment
              active={preset === "custom"}
              onClick={() => setPreset("custom")}
            >
              Custom
            </Segment>
            {preset === "custom" && (
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.minDays}
                  max={LIMITS.maxDays}
                  value={customLength}
                  onChange={(e) => setCustomLength(e.target.value)}
                  className="w-28"
                  aria-label="Custom challenge length in days"
                  aria-invalid={Boolean(err("length"))}
                />
              </div>
            )}
          </div>
          {err("length") && (
            <ErrorText>{validation.fieldErrors.length}</ErrorText>
          )}
        </section>

        {/* Step 2 — start date */}
        <section className="flex flex-col gap-3">
          <StepHeading n={2} title="Start date" optional />
          <p className="text-sm text-body-muted -mt-1">
            Optional. If set, we pre-fill the Date column. Leave blank to fill
            dates by hand.
          </p>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-56"
            aria-label="Start date"
          />
        </section>

        {/* Step 3 — habits */}
        <section className="flex flex-col gap-3">
          <StepHeading n={3} title="Habits to track" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-body-muted">Quick add:</span>
            {QUICK_ADD.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => add(q.make())}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(55,50,47,0.14)] bg-white px-3 py-1 text-xs font-medium text-ink shadow-xs transition-colors hover:bg-paper"
              >
                <Sparkles className="size-3 opacity-70" />
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {habits.map((h, i) => (
              <HabitRow
                key={h.id}
                index={i}
                total={habits.length}
                habit={h}
                labelError={err(`${i}.label`)}
                countError={err(`${i}.count`)}
                subError={err(`${i}.subLabels`)}
                onChange={(patch) => update(h.id, patch)}
                onRemove={() => remove(h.id)}
                onMove={(dir) => move(h.id, dir)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => add(newHabit())}
            disabled={habits.length >= LIMITS.maxHabits}
          >
            <Plus /> Add habit
          </Button>
        </section>
      </div>

      {/* Preview + generate — pinned to the right on desktop so the page
          you're building stays visible while you edit on the left. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-[420px] lg:shrink-0">
        <StepHeading n={4} title="Preview" />
        <SheetPreview layout={layout} config={config} />
        {layout?.cramped && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              These columns will be tight to write in:{" "}
              <strong>{layout.crampedLabels.join(", ")}</strong>. It still
              prints, but consider removing a habit or reducing sub-boxes for
              more room.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            size="xl"
            className="w-full bg-rf-green-deep shadow-lg shadow-rf-green-deep/20 hover:bg-rf-green-deep/90"
            onClick={onDownload}
            loading={loading}
            disabled={loading}
          >
            <Download /> Download printable PDF
          </Button>
          {showErrors && !validation.ok && validation.problems.length > 0 && (
            <p className="text-center text-xs text-destructive-foreground">
              {validation.problems[0]}
            </p>
          )}
          <p className="text-center text-xs text-body-muted">
            A4 landscape · {config.challengeLength || 0} days ·{" "}
            {layout
              ? `${layout.totalPages} page${layout.totalPages > 1 ? "s" : ""}`
              : "—"}{" "}
            · free, no sign-up
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepHeading({
  n,
  title,
  optional,
}: {
  n: number;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-rf-green-deep text-xs font-semibold text-white">
        {n}
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {optional && <span className="text-xs text-body-muted">(optional)</span>}
    </div>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-[rgba(55,50,47,0.16)] bg-white text-ink hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-destructive-foreground">{children}</p>;
}

function HabitRow({
  index,
  total,
  habit,
  labelError,
  countError,
  subError,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  total: number;
  habit: HabitDraft;
  labelError?: string;
  countError?: string;
  subError?: string;
  onChange: (patch: Partial<HabitDraft>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const meta = WIDGET_META[habit.type];
  return (
    <div className="rounded-xl border border-[rgba(55,50,47,0.12)] bg-white p-3 sm:p-4 shadow-xs">
      <div className="flex items-start gap-2">
        <span className="mt-2 hidden text-xs font-semibold text-body-muted sm:inline">
          {index + 1}
        </span>
        <div className="flex-1 flex flex-col gap-3">
          {/* label + reorder/remove */}
          <div className="flex items-start gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <Input
                value={habit.label}
                placeholder="Habit name — e.g. Namaz, Meals, Reading"
                onChange={(e) => onChange({ label: e.target.value })}
                aria-invalid={Boolean(labelError)}
                aria-label={`Habit ${index + 1} label`}
              />
              {labelError && <ErrorText>{labelError}</ErrorText>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ArrowUp />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={onRemove}
                aria-label="Remove habit"
                className="text-destructive-foreground hover:bg-destructive/8"
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          {/* widget type segmented control */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {WIDGET_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ type: t })}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    habit.type === t
                      ? "border-ink bg-ink text-white"
                      : "border-[rgba(55,50,47,0.16)] bg-white text-ink hover:bg-paper",
                  )}
                >
                  {WIDGET_META[t].name}
                </button>
              ))}
            </div>
            <p className="text-xs text-body-muted">{meta.blurb}</p>
          </div>

          {/* type-specific config */}
          {(habit.type === "multi-check" || habit.type === "unit-blocks") && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="block text-xs font-medium text-ink">
                  {habit.type === "multi-check" ? "Sub-boxes" : "Blocks"}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.minCount}
                  max={LIMITS.maxCount}
                  value={habit.count}
                  onChange={(e) =>
                    onChange({ count: Math.trunc(Number(e.target.value)) })
                  }
                  className="w-24"
                  aria-invalid={Boolean(countError)}
                  aria-label="Box count"
                />
                {countError && <ErrorText>{countError}</ErrorText>}
              </div>
              {habit.type === "multi-check" && (
                <div className="flex-1 min-w-[180px] flex flex-col gap-1">
                  <span className="block text-xs font-medium text-ink">
                    Sub-labels{" "}
                    <span className="text-body-muted">
                      (optional, comma-separated)
                    </span>
                  </span>
                  <Input
                    value={habit.subLabels}
                    placeholder="e.g. F,Z,A,M,I — or leave blank"
                    onChange={(e) => onChange({ subLabels: e.target.value })}
                    aria-invalid={Boolean(subError)}
                    aria-label="Sub-labels"
                  />
                  {subError && <ErrorText>{subError}</ErrorText>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- schematic preview of the printed grid --------------------------------
function SheetPreview({
  layout,
  config,
}: {
  layout: ReturnType<typeof computeLayout> | null;
  config: TrackerConfig;
}) {
  if (!layout || config.habits.length === 0) {
    return (
      <div className="flex aspect-[297/210] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(55,50,47,0.2)] bg-white/50 px-4 text-center text-sm text-body-muted shadow-sm">
        Add a habit to see a preview of your sheet.
      </div>
    );
  }

  const cols = layout.columns;
  const totalW =
    cols.day +
    cols.date +
    cols.score +
    cols.habits.reduce((a, h) => a + h.width, 0);
  const pct = (w: number) => `${(w / totalW) * 100}%`;

  const HeaderCell = ({
    width,
    children,
    tight,
  }: {
    width: number;
    children: React.ReactNode;
    tight?: boolean;
  }) => (
    <div
      style={{ flexBasis: pct(width), width: pct(width) }}
      className={cn(
        "shrink-0 border-r border-[rgba(55,50,47,0.25)] px-1 py-1.5 text-center text-[10px] font-semibold text-ink last:border-r-0 overflow-hidden",
        tight && "bg-amber-100",
      )}
    >
      {children}
    </div>
  );

  return (
    <div className="flex aspect-[297/210] w-full flex-col justify-center rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(55,50,47,0.12),0_8px_24px_rgba(55,50,47,0.1)] sm:p-4">
      <div className="overflow-hidden rounded-md border border-[rgba(55,50,47,0.16)]">
        {/* header */}
        <div className="flex border-b border-[rgba(55,50,47,0.25)] bg-paper">
          <HeaderCell width={cols.day}>Day</HeaderCell>
          <HeaderCell width={cols.date}>Date</HeaderCell>
          {cols.habits.map((h, i) => (
            <HeaderCell key={i} width={h.width} tight={h.cramped}>
              <span className="block truncate">{h.habit.label || "—"}</span>
              <MiniGlyph plan={h} />
            </HeaderCell>
          ))}
          <HeaderCell width={cols.score}>Score</HeaderCell>
        </div>
        {/* a couple of sample rows */}
        {[1, 2, 3].map((d) => (
          <div
            key={d}
            className="flex border-b border-[rgba(55,50,47,0.12)] last:border-b-0"
          >
            <div
              style={{ flexBasis: pct(cols.day), width: pct(cols.day) }}
              className="shrink-0 border-r border-[rgba(55,50,47,0.12)] px-1 py-1.5 text-center text-[10px] text-body-muted"
            >
              {d}
            </div>
            <div
              style={{ flexBasis: pct(cols.date), width: pct(cols.date) }}
              className="shrink-0 border-r border-[rgba(55,50,47,0.12)] px-1 py-1.5 text-center text-[9px] text-body-muted"
            >
              {config.startDate ? "—" : ""}
            </div>
            {cols.habits.map((h, i) => (
              <div
                key={i}
                style={{ flexBasis: pct(h.width), width: pct(h.width) }}
                className="flex shrink-0 items-center justify-center gap-0.5 border-r border-[rgba(55,50,47,0.12)] px-1 py-1.5"
              >
                <MiniGlyph plan={h} />
              </div>
            ))}
            <div
              style={{ flexBasis: pct(cols.score), width: pct(cols.score) }}
              className="shrink-0 px-1 py-1.5"
            />
          </div>
        ))}
        <p className="border-t border-[rgba(55,50,47,0.12)] bg-paper px-2 py-1 text-center text-[10px] text-body-muted">
          Rows {1}–{layout.pages[0]?.count ?? 0} shown per page ·{" "}
          {config.challengeLength} days total
        </p>
      </div>
    </div>
  );
}

function MiniGlyph({
  plan,
}: {
  plan: ReturnType<typeof computeLayout>["columns"]["habits"][number];
}) {
  const { habit } = plan;
  if (habit.type === "blank-line") {
    return (
      <span className="inline-block h-2.5 w-6 border-b border-body-muted" />
    );
  }
  if (habit.type === "checkbox") {
    return (
      <span className="inline-block size-2.5 rounded-[2px] border border-[#6b7280]" />
    );
  }
  const n = Math.min(habit.count ?? 1, 12);
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-2 border border-[#6b7280]",
            habit.type === "unit-blocks" ? "rounded-[1px]" : "rounded-[2px]",
          )}
        />
      ))}
    </span>
  );
}
