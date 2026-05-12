# ExerciseGit — Plan

## What We're Building

A web service where users connect their Strava account and get a GitHub-style contribution heatmap of their exercise history. The heatmap is served as a dynamic SVG that can be embedded directly in a GitHub README.md via a single image link.

## How It Works (User Flow)

1. User visits the site and logs in with Strava (OAuth)
2. Site syncs their activity history from Strava and stores it
3. User gets a shareable embed link, e.g.:
   ```
   ![My Exercise Grid](https://exercisegit.io/graph/huyxdang.svg)
   ```
4. They paste that into their GitHub README — GitHub fetches the URL and renders the SVG live

## SVG Themes

- `?theme=github` (default) — green palette, matches GitHub's contribution graph aesthetic
- `?theme=strava` — orange palette, for displaying on the ExerciseGit website profile

## Architecture

### Stack
- **Next.js** — website + API routes (including the SVG endpoint)
- **Supabase** — Postgres DB (users, cached activities) + handles auth session
- **Strava API v3** — OAuth 2.0 + `GET /athlete/activities` for activity data
- **Vercel** — deployment, edge caching for SVG responses

### Key Components

**Strava OAuth**
- One registered Strava app (single client ID + secret) — users don't need their own API keys
- Standard OAuth 2.0 flow: user authorizes → get access token + refresh token
- Scope needed: `activity:read_all`
- Access tokens expire every 6 hours — refresh silently using stored refresh token

**Activity Sync**
- On first login: bulk fetch user's activity history via `GET /athlete/activities`
- Going forward: use **Strava Webhooks** (push-based) so new activities arrive in real-time without polling
- Store activities in DB (date, type, duration/distance) — never hit Strava live on SVG requests

**Rate Limits**
- Strava limit: 100 requests / 15 min, 1000 / day — shared across ALL users on your app
- Mitigated by: webhooks (no polling) + serving SVGs from cached DB data
- At scale: batch background syncs, prioritize webhook-driven updates

**SVG Endpoint**
- `GET /graph/[username].svg` — reads from DB, renders heatmap, returns SVG with proper cache headers
- 52 columns (weeks) × 7 rows (days) grid, last 52 weeks
- Cell color intensity = activity on that day (binary or scaled by duration/distance)

### Data Model (simplified)
```
users
  id, strava_athlete_id, username, access_token, refresh_token, token_expires_at

activities
  id, user_id, strava_activity_id, date, type, duration_seconds, distance_meters
```

## Build Order (MVP)

1. Strava OAuth login + token storage
2. Initial activity history sync
3. Strava webhook setup for real-time updates
4. SVG heatmap generation endpoint
5. Website: profile page with graph preview + embed snippet
6. README embed works end-to-end

## Open Questions

- Do we scale intensity by duration/distance, or keep it binary (did they exercise today)?
- Support multiple activity types with different colors (run, ride, swim)?
- Custom date ranges or always last 52 weeks?
