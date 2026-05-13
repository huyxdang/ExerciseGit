import { exchangeCodeForTokens, fetchAllActivities } from "@/lib/strava";
import { normalizeGithubUsername } from "@/lib/github";
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

  const cookieStore = await cookies();
  const githubUsername = normalizeGithubUsername(
    cookieStore.get("pending_github_username")?.value ?? null
  );

  if (!githubUsername) {
    return NextResponse.redirect(new URL("/?error=missing_username", req.nextUrl.origin));
  }

  const tokens = await exchangeCodeForTokens(code);
  const db = createAdminClient();

  const { data: user, error: upsertErr } = await db
    .from("users")
    .upsert(
      {
        strava_user_id: tokens.athlete.id,
        username: githubUsername,
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

  await syncActivities(user.id, tokens.access_token);

  cookieStore.delete("pending_github_username");
  cookieStore.set("user_id", user.id, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.redirect(new URL(`/profile/${githubUsername}`, req.nextUrl.origin));
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
    if (rows.length > 0) {
      await db.from("activities").upsert(rows, { onConflict: "strava_activity_id" });
    }
  } catch (e) {
    console.error("Activity sync failed:", e);
  }
}
