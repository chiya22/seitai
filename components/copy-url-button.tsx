"use client";

import { useState } from "react";

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="min-w-0 flex-1 break-all rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800">
        {url}
      </p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm text-stone-800 hover:bg-stone-100"
      >
        {copied ? "コピーしました" : "コピー"}
      </button>
    </div>
  );
}
