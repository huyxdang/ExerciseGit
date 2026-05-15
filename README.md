# ExerciseGit

<p align="center">
  <strong><em>Github tracker for your Strava workouts!</em></strong>
</p>

## Setup

1. Fork this repo.

2. Create a Strava API app at <https://www.strava.com/settings/api>.

3. Get your Strava refresh token locally:

```bash
cp env.mvp.example .env.mvp
npm run strava:token
```

Open the printed Strava authorization URL, approve access, copy the `code` value
from the redirected URL, then exchange it:

```bash
STRAVA_CODE=the-code-from-strava npm run strava:token
```

4. Add these secrets to your fork under
**Settings > Secrets and variables > Actions > New repository secret**:

| Secret | Value |
| --- | --- |
| `STRAVA_CLIENT_ID` | Your Strava app client ID |
| `STRAVA_CLIENT_SECRET` | Your Strava app client secret |
| `STRAVA_REFRESH_TOKEN` | The refresh token printed by `npm run strava:token` |

5. Add this image to your GitHub profile README repo, usually
`YOUR_USERNAME/YOUR_USERNAME`:

```md
![ExerciseGit](https://raw.githubusercontent.com/YOUR_USERNAME/ExerciseGit/main/public/exercise.svg)
```

If you renamed the fork, replace `ExerciseGit` with your repo name.

6. Create a fine-grained GitHub personal access token so this workflow can bump
the cache key in your profile `README.md`:

| Setting | Value |
| --- | --- |
| Resource owner | Your GitHub account |
| Repository access | Only selected repositories |
| Selected repository | `YOUR_USERNAME/YOUR_USERNAME` |
| Repository permission | Contents: Read and write |

Save that token in your fork as:

```txt
PROFILE_README_TOKEN
```

If your profile README repo is not `YOUR_USERNAME/YOUR_USERNAME`, add a repo
variable named `PROFILE_README_REPOSITORY` with the real repo name, for example:

```txt
YOUR_USERNAME/my-readme-repo
```

7. Run the workflow manually once:

**Actions > Refresh exercise SVG > Run workflow**

After that, GitHub Actions refreshes `public/exercise.svg` every hour.

## Local Generation

For local generation, fill in `.env.mvp`:

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REFRESH_TOKEN=
```

Then run:

```bash
npm run generate:svg
```

By default this writes:

```txt
public/exercise.svg
```

## Manual Embed

Embed the SVG from raw GitHub content:

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

Optional extras:

| Secret | Value |
| --- | --- |
| `PROFILE_README_TOKEN` | Fine-grained PAT that can update your profile README |
| `SECRET_UPDATER_TOKEN` | Optional token that can update this repo's Actions secrets |

`PROFILE_README_TOKEN` is for pushing the cache-busted SVG URL to your profile
README. `SECRET_UPDATER_TOKEN` is only for saving Strava's rotated refresh token
back into `STRAVA_REFRESH_TOKEN`; if it is missing or underpowered, the workflow
prints a warning and you can update `STRAVA_REFRESH_TOKEN` manually.

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
