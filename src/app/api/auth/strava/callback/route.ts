import { exchangeCodeForTokens, fetchAllActivities } from "@/lib/strava";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=strava_denied", req.nextUrl.origin));
  }

  const tokens = await exchangeCodeForTokens(code);
  const db = createAdminClient();

  const username =
    tokens.athlete.username ||
    `${tokens.athlete.firstname}${tokens.athlete.lastname}`.toLowerCase().replace(/\s/g, "");

  const { data: user, error: upsertErr } = await db
    .from("users")
    .upsert(
      {
        strava_user_id: tokens.athlete.id,
        username,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_at,
      },
      { onConflict: "strava_user_id" }
    )
    .select("id")
    .single();

  if (upsertErr || !user) {
    return NextResponse.redirect(new URL("/?error=db", req.nextUrl.origin));
  }

  // Sync all activities in the background (non-blocking)
  syncActivities(user.id, tokens.access_token);

  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.redirect(new URL(`/profile/${username}`, req.nextUrl.origin));
}

async function syncActivities(userId: string, accessToken: string) {
  try {
    const db = createAdminClient();
    const activities = await fetchAllActivities(accessToken);
    const rows = activities.map((a) => ({
      user_id: userId,
      strava_activity_id: a.id,
      date: a.start_date.slice(0, 10),
    }));
    await db.from("activities").upsert(rows, { onConflict: "strava_activity_id" });
  } catch (e) {
    console.error("Activity sync failed:", e);
  }
}
