const GITHUB_USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function normalizeGithubUsername(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") return null;

  const username = value.trim().replace(/^@/, "").toLowerCase();
  if (!GITHUB_USERNAME_RE.test(username)) return null;

  return username;
}

export function stripSvgExtension(username: string) {
  return username.endsWith(".svg") ? username.slice(0, -4) : username;
}
