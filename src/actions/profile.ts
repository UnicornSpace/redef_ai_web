"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import { displayNameOf } from "@/lib/avatar";
import type { ModuleKey } from "@/lib/modules";
import type { Profile, PublicProfile } from "@/lib/types/profile";

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

// Loose E.164-ish check — full validation/OTP verification is a follow-up;
// this just keeps obviously-malformed input out.
const PHONE_PATTERN = /^\+?[0-9()\-.\s]{7,20}$/;

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
  ageRange?: string | null;
  phoneNumber?: string | null;
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

  const phoneNumber = input.phoneNumber?.trim() || null;
  if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    return { error: "That phone number doesn't look right" };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.user.id,
      username,
      enabled_modules: input.enabledModules,
      age_range: input.ageRange || null,
      phone_number: phoneNumber,
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

/**
 * Editable version of the onboarding questions (age, phone, enabled tools) —
 * surfaced in Settings so a user can change their answers after the initial
 * onboarding flow without re-doing the whole thing. Username isn't included
 * here; changing it has its own uniqueness UX (checkUsernameAvailable) and
 * isn't part of this ask.
 */
export async function updatePreferences(input: {
  ageRange?: string | null;
  phoneNumber?: string | null;
  enabledModules: ModuleKey[];
  publicActivityVisible?: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const phoneNumber = input.phoneNumber?.trim() || null;
  if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    return { error: "That phone number doesn't look right" };
  }

  // Only touch public_activity_visible if the caller passed it explicitly —
  // an undefined shouldn't null it out.
  const patch: Record<string, unknown> = {
    age_range: input.ageRange || null,
    phone_number: phoneNumber,
    enabled_modules: input.enabledModules,
  };
  if (input.publicActivityVisible !== undefined) {
    patch.public_activity_visible = input.publicActivityVisible;
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/profile/preferences");
  revalidatePath("/app");
  return {};
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
