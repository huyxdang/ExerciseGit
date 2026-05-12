import { createAdminClient } from "@/lib/supabase/admin";
import { generateSvg, Theme } from "@/lib/svg";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const theme = (req.nextUrl.searchParams.get("theme") ?? "github") as Theme;

  const db = createAdminClient();
  const { data: user } = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: rows } = await db
    .from("activities")
    .select("date")
    .eq("user_id", user.id);

  const activeDates = new Set((rows ?? []).map((r) => r.date as string));
  const svg = generateSvg(activeDates, theme);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
