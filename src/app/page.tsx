const previewWeeks = [
  [0, 1, 0, 0, 1, 0, 0],
  [1, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 1, 0],
  [1, 1, 0, 0, 1, 0, 1],
  [0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 1],
  [0, 0, 1, 0, 1, 0, 0],
  [1, 1, 0, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 1, 0],
];

const errorMessages: Record<string, string> = {
  invalid_username: "Use a valid GitHub username: letters, numbers, and hyphens only.",
  missing_username: "Start again with your GitHub username before connecting Strava.",
  strava_denied: "Strava authorization was cancelled.",
  db: "That username could not be saved. It may already be claimed.",
};

type HomeProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { error } = await searchParams;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#24292f]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_520px] lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d0d7de] bg-white px-3 py-1 text-sm font-medium text-[#57606a]">
            <span className="h-2 w-2 rounded-full bg-[#2da44e]" />
            Strava workouts, GitHub style
          </div>

          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight text-[#0d1117] sm:text-6xl">
            ExerciseGit
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#57606a]">
            Turn runs, rides, swims, and gym days into a contribution graph for
            your GitHub profile.
          </p>

          <form
            action="/api/auth/strava"
            method="GET"
            className="mt-9 rounded-lg border border-[#d0d7de] bg-white p-3 shadow-sm"
          >
            <label htmlFor="github_username" className="sr-only">
              GitHub username
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-4 focus-within:border-[#0969da] focus-within:ring-2 focus-within:ring-[#0969da]/15">
                <span className="select-none text-[#57606a]">@</span>
                <input
                  id="github_username"
                  name="github_username"
                  type="text"
                  required
                  pattern="[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}"
                  placeholder="github-username"
                  className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base font-medium text-[#24292f] outline-none placeholder:text-[#8c959f]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#fc4c02] px-5 text-base font-bold text-white transition hover:bg-[#d84300] focus:outline-none focus:ring-2 focus:ring-[#fc4c02] focus:ring-offset-2"
              >
                Connect Strava
              </button>
            </div>
            {errorMessage ? (
              <p className="mt-3 text-sm font-medium text-[#cf222e]">{errorMessage}</p>
            ) : null}
          </form>

          <form action="/profile" method="GET" className="mt-5 flex max-w-xl gap-2">
            <label htmlFor="profile_username" className="sr-only">
              Find an ExerciseGit profile
            </label>
            <input
              id="profile_username"
              name="username"
              type="text"
              placeholder="Find a profile"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-[#d0d7de] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/15"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#d0d7de] bg-white px-4 text-sm font-semibold transition hover:border-[#0969da] hover:text-[#0969da]"
            >
              View
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-[#d0d7de] bg-[#0d1117] p-5 shadow-2xl shadow-[#1f2328]/15">
          <div className="mb-5 flex items-center justify-between border-b border-[#30363d] pb-4">
            <div>
              <p className="text-sm font-semibold text-white">exercise commits</p>
              <p className="text-xs text-[#8b949e]">52 week activity history</p>
            </div>
            <div className="rounded-full bg-[#238636] px-3 py-1 text-xs font-bold text-white">
              live svg
            </div>
          </div>

          <div className="overflow-hidden rounded-md bg-[#010409] p-4">
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {previewWeeks.flatMap((week, weekIndex) =>
                week.map((active, dayIndex) => (
                  <span
                    key={`${weekIndex}-${dayIndex}`}
                    className={`h-3 w-3 rounded-[3px] ${
                      active ? "bg-[#39d353]" : "bg-[#161b22]"
                    }`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-white">
            <div className="rounded-md bg-[#161b22] p-3">
              <p className="text-2xl font-bold">146</p>
              <p className="text-xs text-[#8b949e]">active days</p>
            </div>
            <div className="rounded-md bg-[#161b22] p-3">
              <p className="text-2xl font-bold">18</p>
              <p className="text-xs text-[#8b949e]">week streak</p>
            </div>
            <div className="rounded-md bg-[#161b22] p-3">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-[#8b949e]">themes</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
