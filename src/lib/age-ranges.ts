/**
 * Shared between client components and server actions — kept out of any
 * "use server" file because such files may only export async functions;
 * a plain array export there breaks EVERY action in that file at runtime
 * (see https://nextjs.org/docs/messages/invalid-use-server-value).
 */
export const AGE_RANGES = [
  "13-17",
  "18-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "65+",
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];
