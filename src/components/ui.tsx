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
  primary: "bg-cobalt text-white hover:bg-cobalt-dark disabled:bg-cobalt/50",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink-2 disabled:opacity-50",
  ghost: "text-ink-2 hover:bg-ink/5 hover:text-ink disabled:opacity-50",
  danger: "bg-surface text-st-revision border border-st-revision/40 hover:bg-st-revision-bg disabled:opacity-50",
  success: "bg-st-accepted text-white hover:bg-st-accepted/90 disabled:opacity-50",
};
const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-[15px] gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-colors select-none whitespace-nowrap disabled:cursor-not-allowed",
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
  "w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/20";

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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] bg-surface border border-line", className)} {...props} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[26px]">{title}</h1>
        {subtitle ? <div className="mt-1.5 text-[15px] text-ink-2">{subtitle}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
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
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium",
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {statusText[status]}
    </span>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "cobalt" | "mark" | "danger" | "success" | "warn"; className?: string }) {
  const tones = {
    neutral: "bg-st-todo-bg text-ink-2",
    cobalt: "bg-cobalt-soft text-cobalt",
    mark: "bg-mark text-ink",
    danger: "bg-st-revision-bg text-st-revision",
    success: "bg-st-accepted-bg text-st-accepted",
    warn: "bg-st-review-bg text-st-review",
  } as const;
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

const avatarColors = ["#2945c7", "#19794b", "#9a6213", "#b93a26", "#6a3fb5", "#0f6f86"];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bg = avatarColors[h % avatarColors.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-cobalt transition-[width]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 76 }: { value: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-cobalt)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, value)) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[17px] font-semibold tabular-nums text-ink">
        {value}%
      </span>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const tones = {
    info: "bg-cobalt-soft text-cobalt-dark",
    success: "bg-st-accepted-bg text-st-accepted",
    error: "bg-st-revision-bg text-st-revision",
  } as const;
  return <div className={cn("rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}
