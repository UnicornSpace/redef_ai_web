"use server";

import type { UIMessage } from "ai";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/admin";
import { referralCodeForUserId } from "@/lib/referral";
import { createClient } from "@/lib/server";

export interface ChatSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

export interface ChatRecord extends ChatSummary {
  messages: UIMessage[];
  created_at: string;
}

export async function listChats(): Promise<ChatSummary[]> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return [];

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .eq("user_id", user.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[listChats]", error);
    return [];
  }
  return data ?? [];
}

export async function getChat(chatId: string): Promise<ChatRecord | null> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return null;

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, messages, created_at, updated_at")
    .eq("id", chatId)
    .eq("user_id", user.user.id)
    .single();
  if (error || !data) return null;
  return data as ChatRecord;
}

export async function createChat(): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data, error } = await supabase
    .from("chats")
    .insert({ id: crypto.randomUUID(), user_id: user.user.id, messages: [] })
    .select("id")
    .single();
  if (error || !data)
    return { error: error?.message ?? "Could not start chat" };

  revalidatePath("/app/talk");
  return { id: data.id };
}

export async function saveChatMessages(
  chatId: string,
  messages: UIMessage[],
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("chats")
    .select("title")
    .eq("id", chatId)
    .eq("user_id", user.user.id)
    .maybeSingle();

  const update: { messages: UIMessage[]; updated_at: string; title?: string } =
    {
      messages,
      updated_at: new Date().toISOString(),
    };

  if (!existing?.title) {
    const firstUserMessage = messages.find((m) => m.role === "user");
    const text = firstUserMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim();
    if (text) update.title = text.slice(0, 60);
  }

  const { error } = await supabase
    .from("chats")
    .update(update)
    .eq("id", chatId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  return {};
}

/**
 * Logs one AI Talk turn's token usage — called from the streamText onFinish
 * in src/app/api/chat/route.ts, which already has the authenticated user's
 * id from the request, so this trusts it rather than re-deriving it from
 * cookies. Uses the service-role admin client: this app's tables generally
 * don't rely on RLS for correctness (see other actions files), but
 * chat_usage is a brand-new table and whatever default RLS policy applies
 * to it blocks a plain authenticated insert, so bypass it the same way
 * every other cross-boundary write in this app already does. Purely
 * additive (never blocks the chat response): a failed insert here
 * shouldn't ever surface as a chat error to the user.
 */
export async function recordChatUsage(
  chatId: string,
  userId: string,
  usage: { inputTokens: number; outputTokens: number },
): Promise<void> {
  if (usage.inputTokens === 0 && usage.outputTokens === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("chat_usage").insert({
    chat_id: chatId,
    user_id: userId,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
  });
  if (error) console.error("[recordChatUsage]", error);
}

export async function deleteChat(chatId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/talk");
  return {};
}

export type Enthusiasm = "low" | "medium" | "high";
export type Verbosity = "concise" | "balanced" | "detailed";

export interface UserTraits {
  enthusiasm?: Enthusiasm;
  verbosity?: Verbosity;
  useImages?: boolean;
}

export interface UserPreferences {
  user_id: string;
  nickname: string | null;
  occupation: string | null;
  traits: UserTraits;
  custom_instructions: string | null;
  memory_summary: string | null;
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserPreferences;
}

/**
 * Persist a `?ref=CODE` value the user came in with. First-write-wins —
 * a user's referred_by is only set once, so re-visiting a referral link
 * after signup doesn't overwrite the original source. Silently no-ops if
 * the user already has a referred_by, or if the code matches their own.
 */
export async function captureReferral(
  code: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return {};

  // don't let a user refer themselves
  const ownCode = referralCodeForUserId(user.user.id);
  if (trimmed === ownCode) return {};

  const { data: existing } = await supabase
    .from("user_preferences")
    .select("referred_by")
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (existing?.referred_by) return {}; // first-write-wins

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.user.id,
    referred_by: trimmed,
  });
  if (error) return { error: error.message };
  return {};
}

export interface ReferredUser {
  userId: string;
  username: string | null;
  displayName: string;
  joinedAt: string | null;
}

/**
 * Everyone whose referred_by matches the caller's own code — the "who did I
 * bring in" list for the referral page. Crosses user boundaries by design
 * (reading other people's user_preferences/profiles rows), so this uses the
 * service-role admin client rather than relying on RLS, same pattern as
 * getPublicProfile/getHabitCollaborators for other legitimate cross-user
 * lookups.
 */
export async function getMyReferrals(): Promise<{
  code: string;
  referrals: ReferredUser[];
}> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { code: "", referrals: [] };

  const code = referralCodeForUserId(user.user.id);
  const admin = createAdminClient();

  const { data: referredPrefs } = await admin
    .from("user_preferences")
    .select("user_id, nickname")
    .eq("referred_by", code);

  const userIds = (referredPrefs ?? [])
    .map((r) => r.user_id as string | null)
    .filter((id): id is string => Boolean(id));
  if (userIds.length === 0) return { code, referrals: [] };

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, username, created_at")
    .in("user_id", userIds);
  const profileByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id as string, p]),
  );

  const referrals: ReferredUser[] = (referredPrefs ?? [])
    .filter((r) => r.user_id)
    .map((r) => {
      const profile = profileByUser.get(r.user_id as string);
      return {
        userId: r.user_id as string,
        username: profile?.username ?? null,
        displayName:
          (r.nickname as string | null) || profile?.username || "A new member",
        joinedAt: (profile?.created_at as string | undefined) ?? null,
      };
    });

  return { code, referrals };
}

export async function updateUserPreferences(input: {
  nickname?: string | null;
  occupation?: string | null;
  traits?: UserTraits;
  customInstructions?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.user.id,
    nickname: input.nickname ?? null,
    occupation: input.occupation ?? null,
    traits: input.traits ?? {},
    custom_instructions: input.customInstructions ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/profile/personalization");
  return {};
}
