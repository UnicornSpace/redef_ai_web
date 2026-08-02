import { z } from "zod";
import { LIMITS } from "./types";

const widgetType = z.enum([
  "multi-check",
  "checkbox",
  "blank-line",
  "unit-blocks",
]);

export const habitConfigSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "Label is required")
      .max(40, "Keep labels short"),
    type: widgetType,
    count: z
      .number()
      .int()
      .min(LIMITS.minCount)
      .max(LIMITS.maxCount)
      .optional(),
    subLabels: z
      .array(z.string().trim().max(6))
      .max(LIMITS.maxCount)
      .optional(),
  })
  .superRefine((h, ctx) => {
    const needsCount = h.type === "multi-check" || h.type === "unit-blocks";
    if (needsCount && (h.count === undefined || h.count < LIMITS.minCount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: `"${h.type}" needs a box count (${LIMITS.minCount}-${LIMITS.maxCount})`,
      });
    }
    if (h.subLabels && h.subLabels.length > 0) {
      if (h.type !== "multi-check") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subLabels"],
          message: "Sub-labels are only for multi-check",
        });
      } else if (h.count !== undefined && h.subLabels.length !== h.count) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subLabels"],
          message: `Provide exactly ${h.count} sub-labels, or leave blank`,
        });
      }
    }
  });

export const trackerConfigSchema = z.object({
  challengeLength: z
    .number({ message: "Challenge length is required" })
    .int("Must be a whole number")
    .min(LIMITS.minDays, `Minimum ${LIMITS.minDays} day`)
    .max(LIMITS.maxDays, `Maximum ${LIMITS.maxDays} days`),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  habits: z
    .array(habitConfigSchema)
    .min(1, "Add at least one habit")
    .max(LIMITS.maxHabits, `Maximum ${LIMITS.maxHabits} habits`),
});

export type ValidatedTrackerConfig = z.infer<typeof trackerConfigSchema>;
