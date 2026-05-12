import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const db = createAdminClient();

  const { data: user } = await db
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!user) notFound();

  const stravaUrl = `/api/graph/${username}.svg?theme=strava`;
  const githubUrl = `/api/graph/${username}.svg?theme=github`;
  const embedSnippet = `![My Workouts](https://exercisegit.io/api/graph/${username}.svg)`;

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center gap-10 px-4 py-16">
      <h1 className="text-2xl font-bold">{username}</h1>

      <section className="w-full max-w-3xl flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-widest text-[#888]">Your Graph</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stravaUrl} alt="Exercise graph" className="rounded-lg w-full" />
      </section>

      <section className="w-full max-w-3xl flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-widest text-[#888]">Embed in GitHub README</h2>
        <p className="text-sm text-[#aaa]">Copy this into your README.md:</p>
        <pre className="bg-[#0d1117] rounded-lg px-5 py-4 text-[#58a6ff] text-sm overflow-x-auto">
          {embedSnippet}
        </pre>
        <p className="text-xs text-[#666]">
          Preview:{" "}
          <a href={githubUrl} className="underline text-[#58a6ff]">
            {githubUrl}
          </a>
        </p>
      </section>
    </main>
  );
}
