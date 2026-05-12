import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">ExerciseGit</h1>
        <p className="text-[#8b949e] text-lg mb-8">
          Your Strava activity history — as a GitHub contribution graph.
          Embed it anywhere.
        </p>
        <Link
          href="/api/auth/strava"
          className="inline-flex items-center gap-2 bg-[#fc4c02] hover:bg-[#e04400] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Connect with Strava
        </Link>
      </div>

      <div className="text-center text-sm text-[#8b949e] mt-4">
        <p>After connecting, you&apos;ll get a link like:</p>
        <code className="block mt-2 bg-[#161b22] px-4 py-2 rounded text-[#58a6ff] text-xs">
          ![My Workouts](https://exercisegit.io/api/graph/you.svg)
        </code>
        <p className="mt-2">Paste it into your GitHub README.</p>
      </div>
    </main>
  );
}
