import { normalizeGithubUsername } from "@/lib/github";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const username = normalizeGithubUsername(req.nextUrl.searchParams.get("username"));

  if (!username) {
    redirect("/?error=invalid_username");
  }

  redirect(`/profile/${username}`);
}
