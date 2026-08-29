// Shared between client components and server-side tool/action code (no
// "use client"/"use server" directive — pure logic, safe in both).

/** The one label that changes a task's behavior — case-insensitive, no
    exact-string-match footgun for "Buy"/"buy"/" Buy ". */
export const SHOPPING_LABEL = "buy";

/**
 * A task carrying the "Buy" label is a shopping item, not a to-do: it's
 * pulled out of the main task list, AI reminders (getTasks), and
 * getDayReview entirely, and shown only in the dedicated shopping-list
 * view. Centralized here so every place that needs to know "is this a
 * shopping item" (client UI, the getTasks/day-review tools) agrees.
 */
export function isShoppingTask(labels: string[] | null | undefined): boolean {
  return (labels ?? []).some((l) => l.trim().toLowerCase() === SHOPPING_LABEL);
}
