/**
 * The recap deliberately runs DARK while the rest of the app is light.
 *
 * That's not an inconsistency — it's the same move Spotify Wrapped and the
 * Instagram recap make: a full-screen, high-contrast "theater" that reads
 * as an event rather than another dashboard page. Confetti, big type, and
 * a bright accent line only land against a dark ground.
 *
 * These are literal values rather than the app's CSS custom properties
 * because the recap is also rendered into a share image by satori
 * (ImageResponse), which resolves no var() and no Tailwind — so the player
 * and the share card have to read their colors from the same plain object
 * to stay in sync.
 */
export const RECAP = {
  bg: "#151312",
  bgSoft: "#221F1D",
  text: "#FBFAF9",
  textMuted: "rgba(251,250,249,0.62)",
  line: "rgba(251,250,249,0.14)",
} as const;

/**
 * The app's four brand accents, hex-literal for the same satori reason.
 * Kept in the order used by src/lib/avatar.ts so a given slot means the
 * same hue everywhere in the product.
 */
export const RECAP_ACCENTS = {
  green: "#59B74F",
  amber: "#FFB332",
  violet: "#8B5CF6",
  coral: "#FF6A55",
} as const;

export type RecapAccent = keyof typeof RECAP_ACCENTS;

/** Positive/negative colors for deltas inside the dark recap. */
export const RECAP_DELTA = {
  good: RECAP_ACCENTS.green,
  bad: RECAP_ACCENTS.coral,
  flat: RECAP.textMuted,
} as const;
