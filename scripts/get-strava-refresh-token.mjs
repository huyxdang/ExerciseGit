#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";

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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function printAuthorizeUrl() {
  const redirectUri = process.env.STRAVA_REDIRECT_URI ?? "http://localhost";
  const scope = process.env.STRAVA_SCOPES ?? "activity:read_all";
  const params = new URLSearchParams({
    client_id: requireEnv("STRAVA_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
  });

  console.log("Open this URL, approve access, then copy the code= value from the redirected URL:");
  console.log(`${STRAVA_AUTHORIZE_URL}?${params}`);
  console.log("");
  console.log("Then run:");
  console.log("STRAVA_CODE=the-code npm run strava:token");
}

async function exchangeCode(code) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava code exchange failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function main() {
  await loadEnvFile();

  if (!process.env.STRAVA_CODE) {
    printAuthorizeUrl();
    return;
  }

  const tokens = await exchangeCode(process.env.STRAVA_CODE);
  console.log("Put this in .env.mvp:");
  console.log(`STRAVA_REFRESH_TOKEN=${tokens.refresh_token}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
