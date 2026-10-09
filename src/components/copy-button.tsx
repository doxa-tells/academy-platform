"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "./ui";

export function CopyButton({ text, label = "Скопировать", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older mobile browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-testid="copy-button"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
        copied ? "bg-st-accepted-bg text-st-accepted" : "bg-surface text-ink border border-line-strong hover:border-ink-2",
        className,
      )}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Скопировано" : label}
    </button>
  );
}
