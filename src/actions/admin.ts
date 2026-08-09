"use server";

import { createAdminClient } from "@/lib/admin";
import { displayNameOf } from "@/lib/avatar";
import { referralCodeForUserId } from "@/lib/referral";
import { createClient } from "@/lib/server";

export type AdminRange = "1d" | "7d" | "30d" | "all";
export type AdminSort = "interactions" | "tokens" | "referrals" | "joined";

export interface AdminOverview {
  totalUsers: number;
  newSignups: number;
}

export interface AdminUserRow {
  userId: string;
  email: string | null;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  interactions: number;
  tokensUsed: number;
  referrals: number;
}

export interface UserActivityDetail {
  userId: string;
  email: string | null;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  breakdown: {
    habits: number;
    tasks: number;
    transactions: number;
    chats: number;
    deepworkSessions: number;
    goals: number;
  };
  tokens: { input: number; output: number; total: number };
  referrals: {
    userId: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    joinedAt: string | null;
  }[];
}

type AdminClient = ReturnType<typeof createAdminClient>;

function rangeStartIso(range: AdminRange): string | null {
  if (range === "all") return null;
  const days = range === "1d" ? 1 : range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Every /admin data function must call this first — the route is gated at
 * the layout level too, but these actions cross user boundaries (they read
 * every user's data via the service-role client), so they re-check rather
 * than trusting the layout alone.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.user.id)
    .maybeSingle();
  return Boolean(data);
}

async function fetchAllAuthUsers(admin: AdminClient) {
  // Default page size is 50 — bumped way up since this app doesn't expect
  // enough users yet to need real pagination. Revisit if that changes.
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 2000,
  });
  if (error) throw new Error(error.message);
  return data.users;
}

/**
 * Counts rows per user_id in `table`, optionally only those with
 * `dateColumn >= since`. Used for the "interactions" tally across every
 * domain table — there's no per-user filter here on purpose, this scans
 * once and groups client-side rather than running one query per user.
 */
async function countRowsSince(
  admin: AdminClient,
  table: string,
  dateColumn: string,
  since: string | null,
): Promise<Map<string, number>> {
  let query = admin.from(table).select("user_id");
  if (since) query = query.gte(dateColumn, since);
  const { data } = await query;

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { user_id: string | null }[]) {
    if (!row.user_id) continue;
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }
  return counts;
}

function mergeCounts(maps: Map<string, number>[]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const map of maps) {
    for (const [key, value] of map) {
      merged.set(key, (merged.get(key) ?? 0) + value);
    }
  }
  return merged;
}

async function tokensByUserSince(
  admin: AdminClient,
  since: string | null,
): Promise<Map<string, number>> {
  let query = admin
    .from("chat_usage")
    .select("user_id, input_tokens, output_tokens");
  if (since) query = query.gte("created_at", since);
  const { data } = await query;

  const totals = new Map<string, number>();
  for (const row of (data ?? []) as {
    user_id: string;
    input_tokens: number | null;
    output_tokens: number | null;
  }[]) {
    const tokens = (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + tokens);
  }
  return totals;
}

function resolveDisplayName(
  fullName: string | undefined,
  email: string | null,
  username: string | null,
): string {
  return fullName || (email ? displayNameOf(email) : username) || "Unknown";
}

/** Same avatar_url/picture fallback used in MobileTopHeader and getPublicProfile. */
function avatarUrlOf(userMetadata: Record<string, unknown> | undefined): string | null {
  const url = (userMetadata?.avatar_url ?? userMetadata?.picture) as
    | string
    | undefined;
  return url ?? null;
}

export async function getAdminOverview(range: AdminRange): Promise<AdminOverview> {
  if (!(await isCurrentUserAdmin())) return { totalUsers: 0, newSignups: 0 };

  const admin = createAdminClient();
  const users = await fetchAllAuthUsers(admin);
  const since = rangeStartIso(range);
  const newSignups = since
    ? users.filter((u) => u.created_at && u.created_at >= since).length
    : users.length;

  return { totalUsers: users.length, newSignups };
}

export async function listUsersForAdmin(
  range: AdminRange,
  sort: AdminSort,
): Promise<AdminUserRow[]> {
  if (!(await isCurrentUserAdmin())) return [];

  const admin = createAdminClient();
  const since = rangeStartIso(range);

  const [authUsers, profilesRes, interactionMaps, tokenMap, referredByRes] =
    await Promise.all([
      fetchAllAuthUsers(admin),
      admin.from("profiles").select("user_id, username"),
      Promise.all([
        countRowsSince(admin, "habits", "created_at", since),
        countRowsSince(admin, "tasks", "created_at", since),
        countRowsSince(admin, "transactions", "created_at", since),
        countRowsSince(admin, "chats", "updated_at", since),
        countRowsSince(admin, "deepwork_sessions", "created_at", since),
        countRowsSince(admin, "goals", "created_at", since),
      ]),
      tokensByUserSince(admin, since),
      admin.from("user_preferences").select("user_id, referred_by"),
    ]);

  const interactions = mergeCounts(interactionMaps);

  const usernameByUser = new Map(
    ((profilesRes.data ?? []) as { user_id: string; username: string }[]).map(
      (p) => [p.user_id, p.username],
    ),
  );

  // Referral credit is scoped to the same range by checking when the
  // REFERRED person signed up (not when the referrer did).
  const authCreatedById = new Map(authUsers.map((u) => [u.id, u.created_at]));
  const referralCounts = new Map<string, number>();
  for (const row of (referredByRes.data ?? []) as {
    user_id: string | null;
    referred_by: string | null;
  }[]) {
    if (!row.referred_by || !row.user_id) continue;
    const referredCreatedAt = authCreatedById.get(row.user_id);
    if (since && (!referredCreatedAt || referredCreatedAt < since)) continue;
    referralCounts.set(
      row.referred_by,
      (referralCounts.get(row.referred_by) ?? 0) + 1,
    );
  }

  const rows: AdminUserRow[] = authUsers.map((u) => {
    const email = u.email ?? null;
    const fullName = u.user_metadata?.full_name as string | undefined;
    const username = usernameByUser.get(u.id) ?? null;
    const code = referralCodeForUserId(u.id);
    return {
      userId: u.id,
      email,
      username,
      displayName: resolveDisplayName(fullName, email, username),
      avatarUrl: avatarUrlOf(u.user_metadata),
      joinedAt: u.created_at ?? null,
      lastActiveAt: u.last_sign_in_at ?? null,
      interactions: interactions.get(u.id) ?? 0,
      tokensUsed: tokenMap.get(u.id) ?? 0,
      referrals: referralCounts.get(code) ?? 0,
    };
  });

  rows.sort((a, b) => {
    switch (sort) {
      case "tokens":
        return b.tokensUsed - a.tokensUsed;
      case "referrals":
        return b.referrals - a.referrals;
      case "joined":
        return (b.joinedAt ?? "").localeCompare(a.joinedAt ?? "");
      default:
        return b.interactions - a.interactions;
    }
  });

  return rows;
}

/**
 * Drill-down for one user — always lifetime totals (not range-scoped like
 * the list view) since this is meant to answer "how active has this person
 * ever been", not "in the currently-selected window".
 */
export async function getUserActivityDetail(
  userId: string,
): Promise<UserActivityDetail | null> {
  if (!(await isCurrentUserAdmin())) return null;

  const admin = createAdminClient();
  const { data: userRes } = await admin.auth.admin.getUserById(userId);
  const authUser = userRes?.user;
  if (!authUser) return null;

  const countOf = (table: string) =>
    admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then((r) => r.count ?? 0);

  const [
    profileRes,
    habits,
    tasks,
    transactions,
    chats,
    deepworkSessions,
    goals,
    tokenRows,
    referredByRes,
  ] = await Promise.all([
    admin.from("profiles").select("username").eq("user_id", userId).maybeSingle(),
    countOf("habits"),
    countOf("tasks"),
    countOf("transactions"),
    countOf("chats"),
    countOf("deepwork_sessions"),
    countOf("goals"),
    admin
      .from("chat_usage")
      .select("input_tokens, output_tokens")
      .eq("user_id", userId),
    admin
      .from("user_preferences")
      .select("user_id, nickname")
      .eq("referred_by", referralCodeForUserId(userId)),
  ]);

  const tokens = ((tokenRows.data ?? []) as {
    input_tokens: number | null;
    output_tokens: number | null;
  }[]).reduce(
    (acc, r) => ({
      input: acc.input + (r.input_tokens ?? 0),
      output: acc.output + (r.output_tokens ?? 0),
    }),
    { input: 0, output: 0 },
  );

  const referredIds = ((referredByRes.data ?? []) as {
    user_id: string | null;
    nickname: string | null;
  }[])
    .map((r) => r.user_id)
    .filter((id): id is string => Boolean(id));

  let referredProfiles = new Map<
    string,
    { username: string; created_at: string }
  >();
  if (referredIds.length > 0) {
    const { data } = await admin
      .from("profiles")
      .select("user_id, username, created_at")
      .in("user_id", referredIds);
    referredProfiles = new Map(
      ((data ?? []) as { user_id: string; username: string; created_at: string }[]).map(
        (p) => [p.user_id, p],
      ),
    );
  }

  // One extra lookup per referred user for their avatar — fine at the
  // scale a single person's referral list runs at (this is the detail
  // page, not the full user list, which already has avatars for free from
  // its one listUsers() call).
  const referredAvatars = new Map(
    (
      await Promise.all(
        referredIds.map(async (id) => {
          const { data } = await admin.auth.admin.getUserById(id);
          return [id, avatarUrlOf(data?.user?.user_metadata)] as const;
        }),
      )
    ),
  );

  const referrals = ((referredByRes.data ?? []) as {
    user_id: string | null;
    nickname: string | null;
  }[])
    .filter((r) => r.user_id)
    .map((r) => {
      const profile = referredProfiles.get(r.user_id as string);
      return {
        userId: r.user_id as string,
        displayName: r.nickname || profile?.username || "A new member",
        username: profile?.username ?? null,
        avatarUrl: referredAvatars.get(r.user_id as string) ?? null,
        joinedAt: profile?.created_at ?? null,
      };
    });

  const email = authUser.email ?? null;
  const username = (profileRes.data as { username: string } | null)?.username ?? null;
  const fullName = authUser.user_metadata?.full_name as string | undefined;

  return {
    userId,
    email,
    username,
    displayName: resolveDisplayName(fullName, email, username),
    avatarUrl: avatarUrlOf(authUser.user_metadata),
    joinedAt: authUser.created_at ?? null,
    lastActiveAt: authUser.last_sign_in_at ?? null,
    breakdown: { habits, tasks, transactions, chats, deepworkSessions, goals },
    tokens: { ...tokens, total: tokens.input + tokens.output },
    referrals,
  };
}
