import type { ModuleKey } from "@/lib/modules";

/**
 * Shared with client code (settings pages, onboarding). Kept OUT of the
 * `"use server"` file `src/actions/profile.ts` because Next.js server-action
 * files may only export async functions — interface exports there have
 * intermittently triggered dev-server errors ("An unexpected response was
 * received from the server") on any action call, even though TypeScript
 * strips interfaces at compile time. Cheap to isolate; not worth debugging.
 */
export interface Profile {
  user_id: string;
  username: string;
  enabled_modules: ModuleKey[];
  age_range: string | null;
  phone_number: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  memberSince: string | null;
}
