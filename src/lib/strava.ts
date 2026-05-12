const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
};

export type StravaTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number; username: string; firstname: string; lastname: string };
};

export function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/strava/callback`,
    response_type: "code",
    scope: "activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Failed to exchange Strava code");
  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Strava token");
  return res.json() as Promise<Omit<StravaTokens, "athlete">>;
}

export async function fetchActivities(
  accessToken: string,
  page = 1,
  perPage = 200
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Strava activities");
  return res.json();
}

export async function fetchAllActivities(accessToken: string): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;
  while (true) {
    const batch = await fetchActivities(accessToken, page);
    all.push(...batch);
    if (batch.length < 200) break;
    page++;
  }
  return all;
}
