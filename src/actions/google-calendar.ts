"use server";

import { currentOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/server";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Kicks off a separate, opt-in Google re-auth requesting the calendar
 * read-only scope — deliberately not bundled into normal sign-in, since
 * most users don't want an extra consent screen just to log in. Returns
 * the URL to redirect the browser to; the callback route
 * (src/app/auth/callback/route.ts) captures the resulting provider tokens.
 */
export async function connectGoogleCalendar(): Promise<{
  url?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const origin = await currentOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/app/calendar`,
      scopes: "https://www.googleapis.com/auth/calendar.readonly",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) return { error: error.message };
  return { url: data.url ?? undefined };
}

export async function disconnectGoogleCalendar(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("google_calendar_connections")
    .delete()
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };
  return {};
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data } = await supabase
    .from("google_calendar_connections")
    .select("user_id")
    .eq("user_id", user.user.id)
    .maybeSingle();
  return !!data;
}

interface StoredConnection {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection) return null;
  const conn = connection as StoredConnection;

  // 60s buffer so we don't hand back a token that expires mid-request.
  if (new Date(conn.expires_at).getTime() > Date.now() + 60_000) {
    return conn.access_token;
  }

  if (!conn.refresh_token || !CLIENT_ID || !CLIENT_SECRET) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  const newExpiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  await supabase
    .from("google_calendar_connections")
    .update({ access_token: json.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return json.access_token;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  /** "YYYY-MM-DD" for all-day events, full ISO datetime otherwise. */
  start: string;
  end: string;
  allDay: boolean;
}

export async function listGoogleCalendarEvents(
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GoogleCalendarEvent[]> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const accessToken = await getValidAccessToken(user.user.id);
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  let res: Response;
  try {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  } catch (err) {
    console.error("[listGoogleCalendarEvents]", err);
    return [];
  }
  if (!res.ok) return [];

  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
    }>;
  };

  return (json.items ?? []).map((item) => ({
    id: item.id,
    title: item.summary || "(No title)",
    start: item.start?.dateTime ?? item.start?.date ?? "",
    end: item.end?.dateTime ?? item.end?.date ?? "",
    allDay: !item.start?.dateTime,
  }));
}
