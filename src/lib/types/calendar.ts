export type CalendarEventColor =
  | "green"
  | "coral"
  | "amber"
  | "blue"
  | "violet";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  color: CalendarEventColor;
  completed?: boolean;
  href?: string;
}

export interface DaySummary {
  tasks: { id: string; name: string; completed: boolean }[];
  habits: { id: string; name: string }[];
  financeNet: number;
  financeCount: number;
  workSeconds: number;
}

const PALETTE: CalendarEventColor[] = [
  "green",
  "coral",
  "amber",
  "blue",
  "violet",
];

export function colorForLabel(
  label: string | null | undefined,
): CalendarEventColor {
  if (!label) return "blue";
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
