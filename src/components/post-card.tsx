import { ExternalLink, Megaphone, Pin, Sparkle, StickyNote, Link2 } from "lucide-react";
import { Markdown, PromptBlock } from "./markdown";
import { formatShort } from "@/lib/format";
import type { Post } from "@/lib/db/schema";
import { cn } from "./ui";

const kindMeta = {
  note: { label: "Заметка", icon: StickyNote },
  prompt: { label: "Промпт", icon: Sparkle },
  link: { label: "Ссылка", icon: Link2 },
  announcement: { label: "Объявление", icon: Megaphone },
} as const;

export function PostCard({
  post,
  unread,
  footer,
  personal,
}: {
  post: Post;
  unread?: boolean;
  footer?: React.ReactNode;
  personal?: boolean;
}) {
  const meta = kindMeta[post.kind];
  const Icon = meta.icon;
  return (
    <article
      id={`post-${post.id}`}
      data-testid="post"
      className={cn(
        "scroll-mt-20 rounded-[var(--radius-card)] border bg-surface p-5",
        post.kind === "announcement" ? "border-cobalt/30" : "border-line",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
        <Icon className="size-4" aria-hidden />
        <span>{meta.label}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.createdAt.toISOString()}>{formatShort(post.createdAt)}</time>
        {post.pinned ? (
          <span className="inline-flex items-center gap-1 text-ink-2">
            <Pin className="size-3.5" aria-hidden /> закреплено
          </span>
        ) : null}
        {personal ? <span className="rounded-full bg-cobalt-soft px-2 py-0.5 text-cobalt">лично тебе</span> : null}
        {unread ? <span className="rounded-full bg-mark px-2 py-0.5 font-medium text-ink">новое</span> : null}
      </div>
      <h3 className="text-[17px] font-semibold leading-snug text-ink">
        <span className={unread ? "mark" : undefined}>{post.title}</span>
      </h3>
      <div className="mt-3 space-y-3">
        {post.kind === "prompt" ? <PromptBlock text={post.body} /> : <Markdown>{post.body}</Markdown>}
        {post.url ? (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-cobalt hover:border-cobalt"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{post.url.replace(/^https?:\/\//, "")}</span>
          </a>
        ) : null}
      </div>
      {footer ? <div className="mt-4 border-t border-line pt-3">{footer}</div> : null}
    </article>
  );
}
