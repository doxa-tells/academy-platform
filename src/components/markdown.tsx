import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { cn } from "./ui";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  if (!children?.trim()) return null;
  return (
    <div className={cn("prose-academy text-[15px]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          pre: ({ children }) => {
            const text = textOf(children).replace(/\n$/, "");
            return (
              <div className="relative rounded-xl border border-line bg-paper">
                <div className="absolute right-2 top-2">
                  <CopyButton text={text} />
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 pr-36 font-mono text-[13.5px] leading-relaxed text-ink">
                  {children}
                </pre>
              </div>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Prompt block: the whole text is copyable. */
export function PromptBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="text-sm font-medium text-ink-2">Промпт</span>
        <CopyButton text={text} label="Скопировать промпт" />
      </div>
      <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[13.5px] leading-relaxed text-ink">{text}</pre>
    </div>
  );
}
