import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExerciseGit",
  description: "Turn Strava workouts into a GitHub-style exercise commit graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
