#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API = "https://www.strava.com/api/v3";

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const WEEKS = 52;
const DAYS = 7;
const PADDING = { top: 20, left: 28, right: 16, bottom: 8 };

// Minutes of moving time per day that map to the most intense color.
const INTENSITY_MAX_MINUTES = 90;
// Any workout gets at least this far along the empty -> active ramp, so short
// sessions (and workouts with no usable duration) stay visible.
const INTENSITY_FLOOR = 0.4;

const THEMES = {
  github: {
    bg: "#0d1117",
    empty: "#161b22",
    active: "#39d353",
    text: "#8b949e",
  },
  githubStrava: {
    bg: "#0d1117",
    empty: "#161b22",
    active: "#fc4c02",
    text: "#8b949e",
  },
  strava: {
    bg: "#1a1a1a",
    empty: "#2a2a2a",
    active: "#fc4c02",
    text: "#888888",
  },
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function mixColor(from, to, t) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t));
}

// Fraction (0-1) along the empty -> active ramp for a day's total minutes.
// A day with a workout but no usable duration falls back to the floor color.
function intensityFraction(minutes) {
  if (!minutes || minutes <= 0) return INTENSITY_FLOOR;
  const span = 1 - INTENSITY_FLOOR;
  return INTENSITY_FLOOR + span * Math.min(minutes / INTENSITY_MAX_MINUTES, 1);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function loadEnvFile(path = ".env.mvp") {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localActivityDate(activity) {
  return (activity.start_date_local ?? activity.start_date).slice(0, 10);
}

async function refreshAccessToken() {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      refresh_token: requireEnv("STRAVA_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava token refresh failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function fetchRecentActivities(accessToken) {
  const activities = [];
  const after = Math.floor((Date.now() - WEEKS * 7 * 24 * 60 * 60 * 1000) / 1000);

  for (let page = 1; ; page++) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: "200",
      after: String(after),
    });

    const response = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava activity fetch failed (${response.status}): ${body}`);
    }

    const batch = await response.json();
    activities.push(...batch);

    if (batch.length < 200) {
      return activities;
    }
  }
}

function generateSvg(dayMinutes, themeName) {
  const colors = THEMES[themeName] ?? THEMES.github;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const width = PADDING.left + WEEKS * STEP - GAP + PADDING.right;
  const height = PADDING.top + DAYS * STEP - GAP + PADDING.bottom;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabels = [];
  const cells = [];
  let lastMonth = -1;

  for (let week = 0; week < WEEKS; week++) {
    for (let day = 0; day < DAYS; day++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + week * 7 + day);
      if (date > today) continue;

      const key = dateKey(date);
      const x = PADDING.left + week * STEP;
      const y = PADDING.top + day * STEP;
      const fill = dayMinutes.has(key)
        ? mixColor(colors.empty, colors.active, intensityFraction(dayMinutes.get(key)))
        : colors.empty;

      cells.push(
        `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"><title>${key}</title></rect>`
      );

      const month = date.getMonth();
      if (day === 0 && month !== lastMonth) {
        monthLabels.push({ x, label: months[month] });
        lastMonth = month;
      }
    }
  }

  const monthSvg = monthLabels
    .map(
      ({ x, label }) =>
        `<text x="${x}" y="12" fill="${colors.text}" font-size="10" font-family="system-ui,sans-serif">${label}</text>`
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="6" fill="${colors.bg}"/>
  ${monthSvg}
  ${cells.join("\n  ")}
</svg>
`;
}

async function main() {
  await loadEnvFile();

  const outputPath = resolve(process.env.OUTPUT_SVG ?? "public/exercise.svg");
  const theme =
    process.env.SVG_THEME === "strava"
      ? "strava"
      : process.env.SVG_THEME === "github-strava"
        ? "githubStrava"
        : "github";
  const tokens = await refreshAccessToken();
  const activities = await fetchRecentActivities(tokens.access_token);

  // Sum moving time (minutes) per day. A day stays in the map even with 0
  // minutes, so a workout with no usable duration still gets the floor color.
  const dayMinutes = new Map();
  for (const activity of activities) {
    const key = localActivityDate(activity);
    const minutes = (activity.moving_time ?? 0) / 60;
    dayMinutes.set(key, (dayMinutes.get(key) ?? 0) + minutes);
  }

  const svg = generateSvg(dayMinutes, theme);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, svg, "utf8");

  console.log(`Wrote ${outputPath}`);
  console.log(`Active days in the last 52 weeks: ${dayMinutes.size}`);
  console.log("");
  console.log("README examples:");
  console.log("![ExerciseGit](https://YOUR_DOMAIN.com/exercise.svg)");
  console.log("![ExerciseGit](https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/public/exercise.svg)");

  if (tokens.refresh_token && tokens.refresh_token !== process.env.STRAVA_REFRESH_TOKEN) {
    if (process.env.STRAVA_REFRESH_TOKEN_FILE) {
      await writeFile(process.env.STRAVA_REFRESH_TOKEN_FILE, tokens.refresh_token, "utf8");
    } else {
      console.log("");
      console.log("Update STRAVA_REFRESH_TOKEN before the next run:");
      console.log(tokens.refresh_token);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
