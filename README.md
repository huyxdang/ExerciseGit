# ExerciseGit

A web service that connects your GitHub username to your Strava account and
generates a GitHub-style contribution heatmap of your workout history. Each day
is a single square: green if you worked out, empty if not. The graph is served
as a dynamic SVG you can embed anywhere with a single image link.

## User Flow

1. Enter your GitHub username on the home page.
2. Connect Strava and authorize activity read access.
3. ExerciseGit syncs your Strava activities and publishes your profile at
   `/profile/your-github-username`.
4. Copy the README snippet or SVG URL from your profile.

## Embed

Add this to your GitHub README, replacing `yourusername` with your GitHub username:

```md
![My Workouts](https://exercisegit.io/api/graph/yourusername.svg)
```

Two themes are available via the `?theme` query parameter:

| Theme | Parameter | Color |
|-------|-----------|-------|
| GitHub (default) | `?theme=github` | Green |
| Strava | `?theme=strava` | Orange |

```md
![My Workouts](https://exercisegit.io/api/graph/yourusername.svg?theme=strava)
```

## Static MVP

If you just want a quick single-user SVG for your own GitHub README, skip the
Supabase and OAuth app flow and generate a static file:

```bash
cp env.mvp.example .env.mvp
npm run strava:token
npm run generate:svg
```

Fill in `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in `.env.mvp` before
running the commands. `npm run strava:token` prints a Strava authorization URL.
After approving access, copy the `code` from the redirected URL and exchange it:

```bash
STRAVA_CODE=the-code-from-strava npm run strava:token
```

Put the printed `STRAVA_REFRESH_TOKEN` into `.env.mvp`, then run
`npm run generate:svg`.

This writes:

```txt
public/exercise.svg
```

Use either a deployed public URL:

```md
![ExerciseGit](https://your-domain.com/exercise.svg)
```

Or commit the file and embed it from raw GitHub content:

```md
![ExerciseGit](https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/public/exercise.svg)
```

Optional settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `OUTPUT_SVG` | `public/exercise.svg` | Output file path |
| `SVG_THEME` | `github-strava` | Use `github`, `github-strava`, or `strava` |

Strava can rotate refresh tokens. If the script prints a new
`STRAVA_REFRESH_TOKEN`, use that value for the next run.

## Tech Stack

- **Next.js** — App Router, TypeScript
- **Supabase** — Postgres database
- **Strava API v3** — OAuth 2.0, webhooks for real-time sync
- **Vercel** — deployment

## Self-Hosting

### 1. Supabase

Create a new Supabase project, then run the schema:

```bash
psql <your-supabase-connection-string> -f supabase/schema.sql
```

Or paste the contents of `supabase/schema.sql` into the Supabase SQL editor.

### 2. Strava API App

Go to [strava.com/settings/api](https://www.strava.com/settings/api) and create an application. Set the **Authorization Callback Domain** to your app's domain (e.g. `localhost` for local development).

### 3. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=

NEXT_PUBLIC_APP_URL=
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `STRAVA_CLIENT_ID` | Strava application client ID |
| `STRAVA_CLIENT_SECRET` | Strava application client secret |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | A secret string you choose; used to verify Strava webhook requests |
| `NEXT_PUBLIC_APP_URL` | Your app's base URL (e.g. `http://localhost:3000` or `https://yourdomain.com`) |

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Webhooks (Production)

To receive real-time activity updates, register your webhook URL with Strava. Point it to:

```
https://yourdomain.com/api/webhook/strava
```

Strava's webhook registration docs: [developers.strava.com/docs/webhooks](https://developers.strava.com/docs/webhooks/)

## Project Structure

```
src/
  app/
    api/
      auth/strava/          # OAuth redirect
      auth/strava/callback/ # OAuth callback, token storage, initial activity sync
      webhook/strava/       # Real-time Strava activity events
      graph/[username]/     # Embeddable SVG endpoint; accepts username.svg
  lib/
    github.ts               # GitHub username validation and URL helpers
    strava.ts               # Strava OAuth, token refresh, activity fetching
    svg.ts                  # SVG heatmap generator
supabase/
  schema.sql                # Database schema
```

## Database Schema

Two tables:

- **users** — `strava_user_id`, GitHub `username`, OAuth access/refresh tokens
- **activities** — `user_id`, `strava_activity_id`, `date`

## License

MIT
