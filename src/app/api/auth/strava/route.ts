import { getStravaAuthUrl } from "@/lib/strava";
import { redirect } from "next/navigation";

export async function GET() {
  redirect(getStravaAuthUrl());
}
