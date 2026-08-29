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
 * Drill-down for one user, scoped to `range` the same way the list view is
 * — "how active has this person been in the last 7 days" vs the default
 * "all" for the original lifetime-totals view.
 */
export async function getUserActivityDetail(
  userId: string,
  range: AdminRange = "all",
): Promise<UserActivityDetail | null> {
  if (!(await isCurrentUserAdmin())) return null;

  const admin = createAdminClient();
  const { data: userRes } = await admin.auth.admin.getUserById(userId);
  const authUser = userRes?.user;
  if (!authUser) return null;

  const since = rangeStartIso(range);

  const countOf = (table: string, dateColumn: string) => {
    let query = admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (since) query = query.gte(dateColumn, since);
    return query.then((r) => r.count ?? 0);
  };

  let tokenQuery = admin
    .from("chat_usage")
    .select("input_tokens, output_tokens")
    .eq("user_id", userId);
  if (since) tokenQuery = tokenQuery.gte("created_at", since);

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
    countOf("habits", "created_at"),
    countOf("tasks", "created_at"),
    countOf("transactions", "created_at"),
    countOf("chats", "updated_at"),
    countOf("deepwork_sessions", "created_at"),
    countOf("goals", "created_at"),
    tokenQuery,
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

  // One extra lookup per referred user for their avatar (and, same call,
  // their auth-side created_at — the same range-gating source
  // listUsersForAdmin uses for referral credit, rather than profiles'
  // created_at which can lag signup slightly). Fine at the scale a single
  // person's referral list runs at (this is the detail page, not the full
  // user list, which already has avatars for free from its one
  // listUsers() call).
  const referredAuthInfo = new Map(
    (
      await Promise.all(
        referredIds.map(async (id) => {
          const { data } = await admin.auth.admin.getUserById(id);
          return [
            id,
            {
              avatarUrl: avatarUrlOf(data?.user?.user_metadata),
              createdAt: data?.user?.created_at ?? null,
            },
          ] as const;
        }),
      )
    ),
  );

  const referrals = ((referredByRes.data ?? []) as {
    user_id: string | null;
    nickname: string | null;
  }[])
    .filter((r) => r.user_id)
    // Same range as everything else on this page — a referral only counts
    // toward the selected window if the REFERRED person signed up in it.
    .filter((r) => {
      const createdAt = referredAuthInfo.get(r.user_id as string)?.createdAt;
      return !since || (createdAt != null && createdAt >= since);
    })
    .map((r) => {
      const profile = referredProfiles.get(r.user_id as string);
      const authInfo = referredAuthInfo.get(r.user_id as string);
      return {
        userId: r.user_id as string,
        displayName: r.nickname || profile?.username || "A new member",
        username: profile?.username ?? null,
        avatarUrl: authInfo?.avatarUrl ?? null,
        joinedAt: profile?.created_at ?? authInfo?.createdAt ?? null,
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

export interface DailyModuleUsage {
  date: string;
  habits: number;
  tasks: number;
  deepWork: number;
  personalFinance: number;
  chats: number;
}

export interface ModuleTotal {
  module: string;
  count: number;
}

export interface TopReferrer {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  referralCount: number;
}

export interface UsageAnalytics {
  /** Zero-filled, oldest first, fixed 30-day window — a daily chart over
      "all time" would be unusable, so this doesn't take an AdminRange. */
  daily: DailyModuleUsage[];
  /** All-time row count per module/table, sorted most-used first. */
  totalsByModule: ModuleTotal[];
  topReferrers: TopReferrer[];
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const USAGE_WINDOW_DAYS = 30;

/**
 * "Which feature is actually used, and on which days" — the whole point is
 * answering that from data this app already has (habits/tasks/deep-work/
 * finance row counts + chat activity), not PostHog: nothing in the app
 * sends a custom PostHog event today, only its default autocapture
 * (pageviews/clicks), which can't answer a per-feature usage question.
 */
export async function getUsageAnalytics(): Promise<UsageAnalytics> {
  if (!(await isCurrentUserAdmin())) {
    return { daily: [], totalsByModule: [], topReferrers: [] };
  }
  const admin = createAdminClient();

  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (USAGE_WINDOW_DAYS - 1));
  const windowStartIso = windowStart.toISOString();

  const [
    habitsWindow,
    tasksWindow,
    deepWorkWindow,
    financeWindow,
    chatsWindow,
    habitsTotal,
    tasksTotal,
    deepWorkTotal,
    financeTotal,
    chatsTotal,
    authUsers,
    referredByRes,
    profilesRes,
  ] = await Promise.all([
    admin.from("habits").select("created_at").gte("created_at", windowStartIso),
    admin.from("tasks").select("created_at").gte("created_at", windowStartIso),
    admin
      .from("deepwork_sessions")
      .select("created_at")
      .gte("created_at", windowStartIso),
    admin
      .from("transactions")
      .select("created_at")
      .gte("created_at", windowStartIso),
    admin.from("chats").select("updated_at").gte("updated_at", windowStartIso),
    admin.from("habits").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    admin.from("tasks").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    admin
      .from("deepwork_sessions")
      .select("id", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
    admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
    admin.from("chats").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    fetchAllAuthUsers(admin),
    admin.from("user_preferences").select("referred_by").not("referred_by", "is", null),
    admin.from("profiles").select("user_id, username"),
  ]);

  const buckets = new Map<string, DailyModuleUsage>();
  for (let i = 0; i < USAGE_WINDOW_DAYS; i++) {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + i);
    const key = localDayKey(d);
    buckets.set(key, {
      date: key,
      habits: 0,
      tasks: 0,
      deepWork: 0,
      personalFinance: 0,
      chats: 0,
    });
  }
  function bump(
    rows: Record<string, unknown>[] | null,
    field: Exclude<keyof DailyModuleUsage, "date">,
    dateColumn: string,
  ) {
    for (const row of rows ?? []) {
      const iso = row[dateColumn] as string | null;
      if (!iso) continue;
      const bucket = buckets.get(localDayKey(new Date(iso)));
      if (bucket) bucket[field]++;
    }
  }
  bump(habitsWindow.data, "habits", "created_at");
  bump(tasksWindow.data, "tasks", "created_at");
  bump(deepWorkWindow.data, "deepWork", "created_at");
  bump(financeWindow.data, "personalFinance", "created_at");
  bump(chatsWindow.data, "chats", "updated_at");

  const daily = Array.from(buckets.values());

  const totalsByModule: ModuleTotal[] = [
    { module: "Habits", count: habitsTotal },
    { module: "Tasks", count: tasksTotal },
    { module: "Deep Work", count: deepWorkTotal },
    { module: "Personal Finance", count: financeTotal },
    { module: "AI Talk", count: chatsTotal },
  ].sort((a, b) => b.count - a.count);

  const referralCounts = new Map<string, number>();
  for (const row of (referredByRes.data ?? []) as { referred_by: string | null }[]) {
    if (!row.referred_by) continue;
    referralCounts.set(row.referred_by, (referralCounts.get(row.referred_by) ?? 0) + 1);
  }
  const usernameByUser = new Map(
    ((profilesRes.data ?? []) as { user_id: string; username: string }[]).map(
      (p) => [p.user_id, p.username],
    ),
  );
  const topReferrers: TopReferrer[] = authUsers
    .map((u) => {
      const code = referralCodeForUserId(u.id);
      const email = u.email ?? null;
      const fullName = u.user_metadata?.full_name as string | undefined;
      const username = usernameByUser.get(u.id) ?? null;
      return {
        userId: u.id,
        displayName: resolveDisplayName(fullName, email, username),
        username,
        avatarUrl: avatarUrlOf(u.user_metadata),
        referralCount: referralCounts.get(code) ?? 0,
      };
    })
    .filter((r) => r.referralCount > 0)
    .sort((a, b) => b.referralCount - a.referralCount)
    .slice(0, 5);

  return { daily, totalsByModule, topReferrers };
}
