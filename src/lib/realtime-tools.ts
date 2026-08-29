import { z } from "zod";
import {
  getDeepWorkSummaryTool,
  listDeepWorkProjectsTool,
  listRecentDeepWorkSessionsTool,
  logDeepWorkSessionsTool,
  updateDeepWorkSessionTool,
} from "@/lib/ai-sdk-tools/deepwork";
import {
  addTransactionTool,
  getFinanceSummaryTool,
  listRecentTransactionsTool,
} from "@/lib/ai-sdk-tools/finance";
import { getDayReviewTool } from "@/lib/ai-sdk-tools/day-review";
import {
  createHabitTool,
  listHabitsTool,
  logHabitNumberTool,
  toggleHabitChecklistItemTool,
  toggleHabitTodayTool,
} from "@/lib/ai-sdk-tools/habits";
import { updateMemoryTool } from "@/lib/ai-sdk-tools/memory";
import { updateWorkStandardsTool } from "@/lib/ai-sdk-tools/standards";
import {
  addTasksTool,
  getSecretPinTool,
  getTasksTool,
  markTaskAsCompletedTool,
} from "@/lib/ai-sdk-tools/tasks";
import type { ModuleKey } from "@/lib/modules";

/**
 * Bridges the SAME tool objects the text chat uses (/api/chat/route.ts)
 * into the OpenAI Realtime API's function-calling format. Realtime tools
 * are just JSON — {type: "function", name, description, parameters} where
 * parameters is a JSON Schema — so nothing here reimplements any business
 * logic; it only converts the Zod inputSchema each tool already has (via
 * Zod 4's built-in z.toJSONSchema) and dispatches by name to the same
 * `execute` used server-side today. One registry, two transports.
 */

// ai-sdk v5's Tool type is a big discriminated union (static/dynamic,
// provider-executed or not) that doesn't collapse into one clean shape
// TypeScript will structurally match against a hand-written interface —
// every attempt at a precise type here just fought the union further. This
// registry is inherently a dynamic dispatch table over heterogeneous tools
// anyway (each has a different input shape), so `tool: any` is an honest
// representation of that, not laziness. `description`/`inputSchema`/
// `execute` are read off it as `any` and re-typed at the point of use
// (cast to z.ZodTypeAny for the Zod calls, results treated as `unknown`).
interface RegistryEntry {
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
  tool: any;
  /** null = always available, regardless of enabled modules. */
  moduleKey: ModuleKey | null;
}

const REGISTRY: Record<string, RegistryEntry> = {
  updateMemory: { tool: updateMemoryTool, moduleKey: null },
  updateWorkStandards: { tool: updateWorkStandardsTool, moduleKey: null },
  // Spans every module and gates itself internally on what's enabled.
  getDayReview: { tool: getDayReviewTool, moduleKey: null },
  getSecretPin: { tool: getSecretPinTool, moduleKey: null },
  getTasks: { tool: getTasksTool, moduleKey: "tasks" },
  addNewTask: { tool: addTasksTool, moduleKey: "tasks" },
  markTaskAsCompleted: { tool: markTaskAsCompletedTool, moduleKey: "tasks" },
  listDeepWorkProjects: { tool: listDeepWorkProjectsTool, moduleKey: "deep_work" },
  logDeepWorkSessions: { tool: logDeepWorkSessionsTool, moduleKey: "deep_work" },
  getDeepWorkSummary: { tool: getDeepWorkSummaryTool, moduleKey: "deep_work" },
  listRecentDeepWorkSessions: {
    tool: listRecentDeepWorkSessionsTool,
    moduleKey: "deep_work",
  },
  updateDeepWorkSession: {
    tool: updateDeepWorkSessionTool,
    moduleKey: "deep_work",
  },
  listHabits: { tool: listHabitsTool, moduleKey: "habits" },
  toggleHabitToday: { tool: toggleHabitTodayTool, moduleKey: "habits" },
  toggleHabitChecklistItem: {
    tool: toggleHabitChecklistItemTool,
    moduleKey: "habits",
  },
  logHabitNumber: { tool: logHabitNumberTool, moduleKey: "habits" },
  createHabit: { tool: createHabitTool, moduleKey: "habits" },
  getFinanceSummary: { tool: getFinanceSummaryTool, moduleKey: "personal_finance" },
  listRecentTransactions: {
    tool: listRecentTransactionsTool,
    moduleKey: "personal_finance",
  },
  addTransaction: { tool: addTransactionTool, moduleKey: "personal_finance" },
};

export interface RealtimeFunctionDef {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Same module-gating as the text chat's `tools:` object in route.ts —
    a tool for a module the user hasn't turned on shouldn't even be
    offered to the realtime session, let alone callable. */
export function buildRealtimeTools(enabledModules: ModuleKey[]): RealtimeFunctionDef[] {
  return Object.entries(REGISTRY)
    .filter(
      ([, entry]) => entry.moduleKey === null || enabledModules.includes(entry.moduleKey),
    )
    .map(([name, entry]) => {
      // z.toJSONSchema is Zod 4's built-in converter — no extra dependency
      // needed. Strip the `$schema` key it adds: valid JSON Schema, but
      // not a field the Realtime API's `parameters` object expects.
      const { $schema: _drop, ...parameters } = z.toJSONSchema(
        entry.tool.inputSchema as z.ZodTypeAny,
      ) as Record<string, unknown>;
      return {
        type: "function" as const,
        name,
        description: entry.tool.description ?? "",
        parameters,
      };
    });
}

export async function executeRealtimeTool(
  name: string,
  args: unknown,
  enabledModules: ModuleKey[],
): Promise<{ output: unknown } | { error: string }> {
  const entry = REGISTRY[name];
  if (!entry) return { error: `Unknown tool: ${name}` };
  if (entry.moduleKey !== null && !enabledModules.includes(entry.moduleKey)) {
    return { error: `The "${name}" tool isn't enabled for this user right now.` };
  }
  if (!entry.tool.execute) return { error: `Tool "${name}" has no execute function` };

  const parsed = (entry.tool.inputSchema as z.ZodTypeAny).safeParse(args ?? {});
  if (!parsed.success) {
    return { error: `Invalid arguments for ${name}: ${parsed.error.message}` };
  }

  try {
    const result = await entry.tool.execute(parsed.data);
    return { output: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool execution failed" };
  }
}
