/**
 * Day-note types — kept out of src/actions/day-notes.ts because that file
 * has "use server" at the top, and Next's server-action transform only
 * permits async function exports from such a module. A plain `export
 * interface` (erased by TypeScript, but seen by the transform before that
 * erasure) silently breaks every action in the file at runtime. Same trap
 * as src/lib/types/reports.ts documents.
 */

/** Who last wrote the note — hand-typed, or written by the assistant. */
export type DayNoteSource = "manual" | "ai";

export interface DayNote {
  id: string;
  userId: string;
  /** YYYY-MM-DD. */
  noteDate: string;
  content: string;
  source: DayNoteSource;
  createdAt: string;
  updatedAt: string;
}
