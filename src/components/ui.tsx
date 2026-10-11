import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { initials } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/db/schema";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-cobalt text-black font-semibold shadow-[3px_3px_0_0_rgb(0_253_255/0.28)] hover:bg-white hover:shadow-[3px_3px_0_0_rgb(255_255_255/0.25)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:bg-cobalt/40 disabled:shadow-none",
  secondary:
    "bg-black/40 text-ink border border-line-strong hover:border-cobalt hover:text-cobalt disabled:opacity-50",
  ghost: "text-ink-2 hover:bg-cobalt/10 hover:text-cobalt disabled:opacity-50",
  danger: "bg-black/40 text-st-revision border border-st-revision/50 hover:bg-st-revision-bg disabled:opacity-50",
  success: "bg-st-accepted text-black font-semibold hover:bg-st-accepted/85 disabled:opacity-50",
};
const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap disabled:cursor-not-allowed",
    variantClass[variant],
    sizeClass[size],
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const fieldClass =
  "w-full border border-line-strong bg-black/60 px-3 text-[14px] text-ink placeholder:text-muted focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldClass, "h-10 pr-8", className)} {...props} />;
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">
        <span className="text-cobalt" aria-hidden>
          ${" "}
        </span>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("border border-line bg-surface backdrop-blur-[2px]", className)} {...props} />;
}

/** Pixel title with a blinking cursor — the signature element of the interface. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="cursor glow font-display text-[15px] leading-[1.7] text-cobalt sm:text-[19px]">{title}</h1>
        {subtitle ? <div className="mt-2 text-[14px] text-ink-2">{subtitle}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold text-ink">
        <span className="text-muted" aria-hidden>
          {"// "}
        </span>
        {children}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong bg-black/50 px-6 py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {text ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">{text}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

const statusStyles: Record<SubmissionStatus | "todo", string> = {
  todo: "bg-st-todo-bg text-st-todo",
  submitted: "bg-st-submitted-bg text-st-submitted",
  in_review: "bg-st-review-bg text-st-review",
  revision: "bg-st-revision-bg text-st-revision",
  accepted: "bg-st-accepted-bg text-st-accepted",
};
const statusText: Record<SubmissionStatus | "todo", string> = {
  todo: "Не сдано",
  submitted: "Отправлено",
  in_review: "На проверке",
  revision: "Доработать",
  accepted: "Принято",
};

export function StatusBadge({ status, className }: { status: SubmissionStatus | "todo"; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center px-2 text-[12px] font-semibold tracking-wide", statusStyles[status], className)}>
      <span aria-hidden className="opacity-60">
        [
      </span>
      <span className="px-1">{statusText[status]}</span>
      <span aria-hidden className="opacity-60">
        ]
      </span>
    </span>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "cobalt" | "mark" | "danger" | "success" | "warn"; className?: string }) {
  const tones = {
    neutral: "bg-st-todo-bg text-ink-2",
    cobalt: "bg-cobalt-soft text-cobalt",
    mark: "bg-mark text-black",
    danger: "bg-st-revision-bg text-st-revision",
    success: "bg-st-accepted-bg text-st-accepted",
    warn: "bg-st-review-bg text-st-review",
  } as const;
  return <span className={cn("inline-flex h-6 items-center px-2 text-[12px] font-semibold", tones[tone], className)}>{children}</span>;
}

const avatarColors = ["#00fdff", "#3dfc8a", "#ffc94d", "#ff6a5f", "#c58bff", "#5cc8ff"];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = avatarColors[h % avatarColors.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center border font-display"
      style={{ width: size, height: size, color, borderColor: color, background: `${color}1f`, fontSize: Math.max(8, size * 0.26) }}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}

/** Segmented, pixel-style progress bar. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-3 w-full border border-line-strong bg-black/60 p-[2px]", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full transition-[width]"
        style={{ width: `${v}%`, background: "repeating-linear-gradient(90deg, var(--color-cobalt) 0 6px, transparent 6px 8px)" }}
      />
    </div>
  );
}

/** Big terminal progress readout: [██████░░░░] 60% */
export function ProgressRing({ value }: { value: number; size?: number }) {
  const v = Math.min(100, Math.max(0, value));
  const cells = 16;
  const filled = Math.round((v / 100) * cells);
  return (
    <div className="shrink-0" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <p className="glow font-display text-[22px] leading-none text-cobalt">{v}%</p>
      <p className="mt-3 whitespace-pre font-mono text-[15px] leading-none tracking-[-0.05em] text-cobalt" aria-hidden>
        [{"█".repeat(filled)}
        <span className="text-line-strong">{"░".repeat(cells - filled)}</span>]
      </p>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const tones = {
    info: "border-cobalt/40 bg-cobalt-soft text-cobalt",
    success: "border-st-accepted/40 bg-st-accepted-bg text-st-accepted",
    error: "border-st-revision/40 bg-st-revision-bg text-st-revision",
  } as const;
  const prefix = { info: "i", success: "✓", error: "!" }[tone];
  return (
    <div className={cn("flex gap-2 border px-3.5 py-2.5 text-sm", tones[tone])}>
      <span aria-hidden className="font-semibold">
        [{prefix}]
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
