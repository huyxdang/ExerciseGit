import { getStravaAuthUrl } from "@/lib/strava";
import { normalizeGithubUsername } from "@/lib/github";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const username = normalizeGithubUsername(req.nextUrl.searchParams.get("github_username"));

  if (!username) {
    redirect("/?error=invalid_username");
  }

  const cookieStore = await cookies();
  cookieStore.set("pending_github_username", username, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 15,
    sameSite: "lax",
  });

  return NextResponse.redirect(getStravaAuthUrl());
}
