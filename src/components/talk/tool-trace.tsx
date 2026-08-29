"use client";

import type { ToolUIPart } from "ai";
import {
  BanknoteIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClockIcon,
  FolderIcon,
  HistoryIcon,
  KeyRoundIcon,
  ListTodoIcon,
  Loader2Icon,
  type LucideIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  RepeatIcon,
  TimerIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { cn } from "@/lib/utils";

/**
 * Chain-of-thought trace for a run of tool calls, styled after the
 * collapsible "Completed N steps" pattern (globe/cloud step rows that each
 * expand to their own detail). Replaces the older stack of bordered Tool
 * cards — each step here is just an icon + a plain-English label, and the
 * label itself is the click target that reveals that call's raw parameters
 * and result inline. Reads as one tidy "here's what I did" list even when
 * several tools ran, instead of a column of debug boxes.
 */

// Friendly label + icon per tool, keyed by the `tool-<name>` part type the
// AI SDK emits (names match the tools registered in src/app/api/chat/route.ts).
const TOOL_META: Record<string, { label: string; Icon: LucideIcon }> = {
  "tool-getTasks": { label: "Checking your tasks", Icon: ListTodoIcon },
  "tool-getSecretPin": { label: "Getting your PIN", Icon: KeyRoundIcon },
  "tool-addNewTask": { label: "Adding a task", Icon: PlusIcon },
  "tool-markTaskAsCompleted": {
    label: "Marking a task complete",
    Icon: CircleCheckIcon,
  },
  "tool-listDeepWorkProjects": {
    label: "Checking your projects",
    Icon: FolderIcon,
  },
  "tool-logDeepWorkSessions": {
    label: "Logging your focus sessions",
    Icon: TimerIcon,
  },
  "tool-getDeepWorkSummary": {
    label: "Checking your focus time",
    Icon: ClockIcon,
  },
  "tool-listHabits": { label: "Checking your habits", Icon: RepeatIcon },
  "tool-toggleHabitToday": { label: "Updating a habit", Icon: CheckIcon },
  "tool-getFinanceSummary": {
    label: "Checking your finances",
    Icon: WalletIcon,
  },
  "tool-listRecentTransactions": {
    label: "Fetching recent transactions",
    Icon: ReceiptIcon,
  },
  "tool-addTransaction": { label: "Logging a transaction", Icon: BanknoteIcon },
  "tool-updateMemory": { label: "Updating memory", Icon: BrainIcon },
  "tool-createHabit": { label: "Setting up a new habit", Icon: PlusIcon },
  "tool-listRecentDeepWorkSessions": {
    label: "Looking up recent sessions",
    Icon: HistoryIcon,
  },
  "tool-updateDeepWorkSession": {
    label: "Correcting a session",
    Icon: PencilIcon,
  },
};

function isComplete(state: ToolUIPart["state"]): boolean {
  return (
    state === "output-available" ||
    state === "output-error" ||
    state === "output-denied"
  );
}

function TraceStep({
  part,
  isLast,
}: {
  part: ToolUIPart;
  isLast: boolean;
}) {
  const meta = TOOL_META[part.type] ?? {
    label: part.type.replace("tool-", ""),
    Icon: WrenchIcon,
  };
  const active = !isComplete(part.state);
  const hasInput =
    part.input != null &&
    typeof part.input === "object" &&
    Object.keys(part.input as object).length > 0;
  const hasOutput = part.output != null || part.errorText != null;
  const hasDetails = hasInput || hasOutput;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Icon + the vertical rail that threads the steps together. */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-5 items-center justify-center",
            active ? "text-ink" : "text-body-muted",
          )}
        >
          {active ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <meta.Icon className="size-4" />
          )}
        </div>
        {!isLast ? (
          <div className="absolute top-6 bottom-0 left-1/2 w-px -translate-x-1/2 bg-line" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pb-3">
        <button
          type="button"
          onClick={() => {
            if (hasDetails) setOpen((o) => !o);
          }}
          className={cn(
            "flex items-center gap-1 text-left text-sm transition-colors",
            active ? "text-ink" : "text-body-muted",
            hasDetails ? "cursor-pointer hover:text-ink" : "cursor-default",
          )}
        >
          <span>{meta.label}</span>
          {hasDetails ? (
            <ChevronRightIcon
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                open && "rotate-90",
              )}
            />
          ) : null}
        </button>

        {open && hasDetails ? (
          <div className="mt-2 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <div className="font-mono text-[10px] uppercase tracking-wide text-body-muted">
              {part.type.replace("tool-", "")}
            </div>
            {hasInput ? (
              <div className="overflow-hidden rounded-lg border border-line bg-paper text-xs">
                <CodeBlock
                  code={JSON.stringify(part.input, null, 2)}
                  language="json"
                />
              </div>
            ) : null}
            {part.errorText ? (
              <div className="rounded-lg border border-rf-coral/30 bg-rf-coral/10 p-3 text-xs text-rf-coral">
                {part.errorText}
              </div>
            ) : hasOutput ? (
              <div className="overflow-hidden rounded-lg border border-line bg-paper text-xs">
                <CodeBlock
                  code={
                    typeof part.output === "string"
                      ? part.output
                      : JSON.stringify(part.output, null, 2)
                  }
                  language="json"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ToolTrace({ parts }: { parts: ToolUIPart[] }) {
  const anyActive = parts.some((p) => !isComplete(p.state));
  // Auto-follow the run: open while working, collapse to the summary line
  // once every step finishes — unless the user has manually overridden it,
  // in which case their choice sticks.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? anyActive;
  const count = parts.length;

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-body-muted transition-colors hover:text-ink"
      >
        <BrainIcon className={cn("size-4", anyActive && "animate-pulse")} />
        <span>{anyActive ? "Working on it" : "Worked on it"}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>

      {open ? (
        <div className="mt-3 pl-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {parts.map((part, i) => (
            <TraceStep
              key={part.toolCallId ?? `${part.type}-${i}`}
              part={part}
              isLast={i === count - 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
