"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center justify-center rounded-md bg-[#24292f] px-4 text-sm font-semibold text-white transition hover:bg-[#0969da] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:ring-offset-2 focus:ring-offset-white"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
