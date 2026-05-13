import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/app/components/CopyButton";
import { normalizeGithubUsername } from "@/lib/github";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ username: string }> };

type ActivityRow = {
  date: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getStats(activeDates: Set<string>) {
  const today = startOfToday();
  const yearStart = new Date(today.getTime() - 364 * DAY_MS);
  const yearStartKey = toDateKey(yearStart);
  const todayKey = toDateKey(today);
  const activeDays = [...activeDates].filter((date) => date >= yearStartKey && date <= todayKey);

  let currentStreak = 0;
  for (let cursor = new Date(today); ; cursor = new Date(cursor.getTime() - DAY_MS)) {
    if (!activeDates.has(toDateKey(cursor))) break;
    currentStreak++;
  }

  const activeWeeks = new Set(
    activeDays.map((date) => {
      const timestamp = new Date(`${date}T00:00:00.000Z`).getTime();
      return Math.floor(timestamp / (7 * DAY_MS));
    })
  ).size;

  return {
    activeDays: activeDays.length,
    currentStreak,
    activeWeeks,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = normalizeGithubUsername(rawUsername);

  if (!username) notFound();

  const db = createAdminClient();

  const { data: user } = await db
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!user) notFound();

  const { data: rows } = await db
    .from("activities")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const activityRows = (rows ?? []) as ActivityRow[];
  const activeDates = new Set(activityRows.map((row) => row.date));
  const stats = getStats(activeDates);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://exercisegit.io").replace(/\/$/, "");
  const graphUrl = `/api/graph/${username}.svg`;
  const stravaUrl = `/api/graph/${username}.svg?theme=strava`;
  const githubUrl = `/api/graph/${username}.svg?theme=github`;
  const absoluteGraphUrl = `${appUrl}${graphUrl}`;
  const embedSnippet = `![${username}'s exercise commits](${absoluteGraphUrl})`;

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#24292f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[#d0d7de] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-bold text-[#0969da]">
            ExerciseGit
          </Link>
          <form action="/profile" method="GET" className="flex max-w-sm gap-2">
            <label htmlFor="username" className="sr-only">
              GitHub username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="GitHub username"
              className="min-h-10 min-w-0 flex-1 rounded-md border border-[#d0d7de] bg-white px-3 text-sm font-medium outline-none transition focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/15"
            />
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#24292f] px-4 text-sm font-semibold text-white transition hover:bg-[#0969da]"
            >
              View
            </button>
          </form>
        </header>

        <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#57606a]">
                GitHub username
              </p>
              <h1 className="mt-2 break-words text-4xl font-bold tracking-tight text-[#0d1117]">
                @{username}
              </h1>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
                <p className="text-2xl font-bold text-[#0d1117]">{stats.activeDays}</p>
                <p className="mt-1 text-xs font-medium text-[#57606a]">active days</p>
              </div>
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
                <p className="text-2xl font-bold text-[#0d1117]">{stats.currentStreak}</p>
                <p className="mt-1 text-xs font-medium text-[#57606a]">day streak</p>
              </div>
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
                <p className="text-2xl font-bold text-[#0d1117]">{stats.activeWeeks}</p>
                <p className="mt-1 text-xs font-medium text-[#57606a]">weeks hit</p>
              </div>
            </div>

            <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#0d1117]">README embed</h2>
                <CopyButton value={embedSnippet} />
              </div>
              <pre className="overflow-x-auto rounded-md bg-[#f6f8fa] p-3 text-xs font-semibold text-[#0969da]">
                {embedSnippet}
              </pre>
            </div>
          </aside>

          <section className="flex flex-col gap-5">
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4 shadow-xl shadow-[#1f2328]/10">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Exercise commits</h2>
                  <p className="text-sm text-[#8b949e]">Last 52 weeks</p>
                </div>
                <a
                  href={githubUrl}
                  className="text-sm font-semibold text-[#58a6ff] transition hover:text-white"
                >
                  Open SVG
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stravaUrl}
                alt={`${username}'s exercise commit graph`}
                className="w-full rounded-md border border-[#30363d] bg-[#1a1a1a]"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#0d1117]">GitHub theme</h2>
                  <CopyButton value={`${absoluteGraphUrl}?theme=github`} label="Copy URL" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={githubUrl} alt="GitHub theme preview" className="w-full rounded-md" />
              </div>

              <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#0d1117]">Strava theme</h2>
                  <CopyButton value={`${appUrl}${stravaUrl}`} label="Copy URL" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stravaUrl} alt="Strava theme preview" className="w-full rounded-md" />
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
