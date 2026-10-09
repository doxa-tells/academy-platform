import { Avatar, StatusBadge, cn } from "./ui";
import { AttachmentGrid } from "./attachments";
import { formatShort } from "@/lib/format";
import type { ThreadEntry } from "@/lib/homework";

const statusPhrase = {
  submitted: "отправил работу",
  in_review: "взял на проверку",
  revision: "попросил доработать",
  accepted: "принял работу",
} as const;

export function Thread({ entries, viewerRole }: { entries: ThreadEntry[]; viewerRole: "admin" | "student" }) {
  if (entries.length === 0) return null;
  return (
    <ol className="space-y-4" data-testid="thread">
      {entries.map(({ entry, author, attachments }) => {
        const fromMentor = author.role === "admin";
        const isFeedback = entry.kind === "feedback";
        return (
          <li
            key={entry.id}
            className={cn(
              "rounded-[var(--radius-card)] border p-4 sm:p-5",
              fromMentor ? "border-cobalt/25 bg-cobalt-soft/60" : "border-line bg-surface",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Avatar name={author.name} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-tight text-ink">
                  {fromMentor && viewerRole === "student" ? "Разбор от преподавателя" : author.name}
                </p>
                <p className="text-xs text-muted">
                  {formatShort(entry.createdAt)}
                  {isFeedback ? " · обратная связь" : " · попытка"}
                </p>
              </div>
              {entry.statusChange && entry.statusChange !== "submitted" ? (
                <span className="flex items-center gap-2 text-xs text-ink-2">
                  <span className="hidden sm:inline">{statusPhrase[entry.statusChange]}</span>
                  <StatusBadge status={entry.statusChange} />
                </span>
              ) : null}
            </div>
            {entry.text ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{entry.text}</p> : null}
            {attachments.length > 0 ? (
              <div className={entry.text ? "mt-3" : ""}>
                <AttachmentGrid items={attachments} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
