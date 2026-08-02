// Shared initials-avatar helpers. No avatar photo storage exists in this
// app (no avatar_url column anywhere for app users), so every "who is this"
// indicator — nav, footer, habit collaborators — is initials-on-a-color-circle,
// colored from the same 4 brand accents everywhere for consistency.

export function initialsOf(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "?";
  const namePart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = namePart.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return namePart.slice(0, 2).toUpperCase();
}

export function displayNameOf(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  const namePart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const words = namePart.split(/[._-]+/).filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Index (0-3) into the 4-color brand accent set, stable per seed. */
export function accentIndexFor(seed: string): number {
  return hashSeed(seed) % 4;
}

/** Tailwind background classes for app-side (globals.css) components. */
export const AVATAR_ACCENT_BG_CLASSES = [
  "bg-rf-green-deep",
  "bg-rf-amber",
  "bg-rf-violet",
  "bg-rf-coral",
] as const;

/** CSS var() values for marketing-side (.redef scope) inline-styled components. */
export const AVATAR_ACCENT_VARS = [
  "var(--rf-green-deep)",
  "var(--rf-amber)",
  "var(--rf-violet)",
  "var(--rf-coral)",
] as const;
