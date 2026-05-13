import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/strava";
import { NextRequest, NextResponse } from "next/server";

// Strava webhook verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

// Strava pushes new activity events here
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { object_type, object_id, owner_id, aspect_type } = body;

  if (object_type !== "activity") return NextResponse.json({ ok: true });

  const db = createAdminClient();
  const { data: user } = await db
    .from("users")
    .select("id, access_token, refresh_token, token_expires_at")
    .eq("strava_user_id", owner_id)
    .single();

  if (!user) return NextResponse.json({ ok: true });

  if (aspect_type === "delete") {
    await db.from("activities").delete().eq("strava_activity_id", object_id);
    return NextResponse.json({ ok: true });
  }

  // Refresh token if expired
  let token = user.access_token;
  if (Date.now() / 1000 > user.token_expires_at - 300) {
    const fresh = await refreshAccessToken(user.refresh_token);
    token = fresh.access_token;
    await db
      .from("users")
      .update({ access_token: fresh.access_token, refresh_token: fresh.refresh_token, token_expires_at: fresh.expires_at })
      .eq("id", user.id);
  }

  const res = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json({ ok: true });
  const activity = await res.json();

  await db.from("activities").upsert(
    {
      user_id: user.id,
      strava_activity_id: activity.id,
      date: (activity.start_date_local ?? activity.start_date).slice(0, 10),
    },
    { onConflict: "strava_activity_id" }
  );

  return NextResponse.json({ ok: true });
}
