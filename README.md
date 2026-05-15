# ExerciseGit

Generate a GitHub-style exercise contribution SVG from your Strava activity
history. This repo is currently scoped to the single-user static SVG workflow:
refresh `public/exercise.svg` locally or from GitHub Actions, then embed that SVG
in a README.

## Setup

Create a Strava API app at <https://www.strava.com/settings/api>, then copy the
example env file:

```bash
cp env.mvp.example .env.mvp
```

Fill in:

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
```

Get a refresh token:

```bash
npm run strava:token
```

Open the printed Strava authorization URL, approve access, copy the `code` value
from the redirected URL, then exchange it:

```bash
STRAVA_CODE=the-code-from-strava npm run strava:token
```

Put the printed `STRAVA_REFRESH_TOKEN` into `.env.mvp`.

## Generate SVG

```bash
npm run generate:svg
```

By default this writes:

```txt
public/exercise.svg
```

Embed it from a public URL or from raw GitHub content:

```md
![ExerciseGit](https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/public/exercise.svg)
```

## Options

| Variable | Default | Description |
| --- | --- | --- |
| `OUTPUT_SVG` | `public/exercise.svg` | Output file path |
| `SVG_THEME` | `github-strava` | Use `github`, `github-strava`, or `strava` |
| `STRAVA_REFRESH_TOKEN_FILE` | unset | File path where a rotated Strava refresh token should be written |

Strava may rotate refresh tokens. If the script prints or writes a new
`STRAVA_REFRESH_TOKEN`, use that value for the next run.

## GitHub Actions Refresh

The workflow in `.github/workflows/refresh-exercise-svg.yml` regenerates
`public/exercise.svg` every hour and commits it if the file changed.

Add these repository secrets under
**Settings > Secrets and variables > Actions > New repository secret**:

| Secret | Value |
| --- | --- |
| `STRAVA_CLIENT_ID` | Your Strava app client ID |
| `STRAVA_CLIENT_SECRET` | Your Strava app client secret |
| `STRAVA_REFRESH_TOKEN` | Your current Strava refresh token |
| `SECRET_UPDATER_TOKEN` | Optional GitHub token that can update repository secrets |

`SECRET_UPDATER_TOKEN` lets the workflow save Strava's rotated refresh token
back into `STRAVA_REFRESH_TOKEN`. Use a classic personal access token with
`repo` scope for a private repo, or `public_repo` scope for a public repo.

## Files

```txt
.github/workflows/refresh-exercise-svg.yml  Scheduled SVG refresh
env.mvp.example                            Local environment template
public/exercise.svg                        Generated SVG output
scripts/generate-exercise-svg.mjs          Strava fetch + SVG generator
scripts/get-strava-refresh-token.mjs       Strava refresh-token helper
```

## License

MIT
