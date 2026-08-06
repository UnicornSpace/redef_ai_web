"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import { displayNameOf } from "@/lib/avatar";
import type { ModuleKey } from "@/lib/modules";

export async function updateProfile({
  fullName,
}: {
  fullName: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const trimmed = fullName.trim();
  if (!trimmed) return { error: "Display name can't be empty" };

  const { error } = await supabase.auth.updateUser({
    data: { full_name: trimmed },
  });
  if (error) {
    console.error("[updateProfile]", error);
    return { error: error.message };
  }

  revalidatePath("/app/profile/account");
  return {};
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export interface Profile {
  user_id: string;
  username: string;
  enabled_modules: ModuleKey[];
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export async function checkUsernameAvailable(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      available: false,
      error: "3-20 lowercase letters, numbers, or underscores",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", normalized)
    .maybeSingle();
  return { available: !data };
}

export async function completeOnboarding(input: {
  username: string;
  enabledModules: ModuleKey[];
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username must be 3-20 lowercase letters, numbers, or underscores",
    };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.user.id,
      username,
      enabled_modules: input.enabledModules,
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    if (error.code === "23505") return { error: "That username is taken" };
    return { error: error.message };
  }

  revalidatePath("/app");
  return {};
}

export interface PublicProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  memberSince: string | null;
}

/**
 * Looks up another user's public-facing identity for a shareable page
 * (/u/[username]). Regular RLS-scoped clients can only ever read the
 * caller's own auth.users row, so this uses the service-role admin client
 * — same pattern already established in src/actions/habits.ts for invite
 * links — to resolve the profile owner's display name/avatar without
 * exposing anything beyond what's already shown elsewhere in the app.
 */
export async function getPublicProfile(
  username: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, username")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error || !profile) return null;

  const admin = createAdminClient();
  const { data: userRes } = await admin.auth.admin.getUserById(
    profile.user_id,
  );
  const user = userRes?.user;
  const email = user?.email;
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = (user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture) as string | undefined;

  return {
    userId: profile.user_id,
    username: profile.username,
    displayName: fullName || (email ? displayNameOf(email) : profile.username),
    avatarUrl: avatarUrl ?? null,
    memberSince: user?.created_at ?? null,
  };
}
