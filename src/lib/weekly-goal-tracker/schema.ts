import { z } from "zod";
import { LIMITS } from "./types";

const text = z.string().trim().max(LIMITS.textMax);

const subtaskSchema = z.object({
  text: text.min(1, "Subtask text is required"),
});

const taskSchema = z.object({
  text: text.min(1, "Task text is required"),
  subtasks: z.array(subtaskSchema).max(LIMITS.maxSubtasksPerTask),
});

const goalSchema = z.object({
  text: text.min(1, "Goal text is required"),
  tasks: z.array(taskSchema).max(LIMITS.maxTasksPerGoal),
});

export const weeklyPlannerConfigSchema = z.object({
  focus: text.optional(),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Year must be 4 digits")
    .optional()
    .or(z.literal("")),
  goals: z.array(goalSchema).max(LIMITS.maxGoals),
  gridRows: z
    .array(text)
    .min(LIMITS.minGridRows, "Add at least one grid row")
    .max(LIMITS.maxGridRows, `Maximum ${LIMITS.maxGridRows} grid rows`),
  blank: z.boolean().optional(),
});

export type ValidatedWeeklyPlannerConfig = z.infer<
  typeof weeklyPlannerConfigSchema
>;
