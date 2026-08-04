"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

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
