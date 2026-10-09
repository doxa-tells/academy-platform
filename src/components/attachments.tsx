"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { AnnotationData } from "@/lib/db/schema";

export type AttachmentView = {
  id: string;
  kind: "image" | "video" | "audio" | "file" | "annotation";
  url: string;
  name: string;
  annotation: AnnotationData | null;
};

export function AnnotationOverlay({ data }: { data: AnnotationData }) {
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {data.strokes.map((s, i) => (
        <polyline
          key={i}
          points={s.points.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function AnnotationPins({ data }: { data: AnnotationData }) {
  return (
    <>
      {data.pins.map((p) => (
        <span
          key={p.n}
          className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[13px] font-bold text-white shadow-md"
          style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, background: p.color }}
        >
          {p.n}
        </span>
      ))}
    </>
  );
}

function Lightbox({ item, onClose }: { item: AttachmentView; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto max-h-[92dvh] max-w-[94vw] bg-transparent p-0 backdrop:bg-ink/80"
    >
      <div className="relative inline-block">
        <img src={item.url} alt={item.name} className="block max-h-[90dvh] max-w-[94vw] rounded-lg object-contain" />
        {item.annotation ? (
          <>
            <AnnotationOverlay data={item.annotation} />
            <AnnotationPins data={item.annotation} />
          </>
        ) : null}
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-white"
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </button>
      </div>
    </dialog>
  );
}

export function AttachmentGrid({ items, renderExtra }: { items: AttachmentView[]; renderExtra?: (a: AttachmentView) => React.ReactNode }) {
  const [open, setOpen] = useState<AttachmentView | null>(null);
  const visual = items.filter((a) => a.kind === "image" || a.kind === "annotation");
  const videos = items.filter((a) => a.kind === "video");
  const audios = items.filter((a) => a.kind === "audio");
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {visual.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visual.map((a) => (
            <li key={a.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => setOpen(a)}
                className="relative block w-full overflow-hidden rounded-xl border border-line bg-paper"
                aria-label={a.kind === "annotation" ? "Открыть фото с пометками" : `Открыть ${a.name || "фото"}`}
              >
                <span className="relative block">
                  <img src={a.url} alt={a.name} className="block w-full" loading="lazy" />
                  {a.annotation ? (
                    <>
                      <AnnotationOverlay data={a.annotation} />
                      <AnnotationPins data={a.annotation} />
                    </>
                  ) : null}
                </span>
                {a.kind === "annotation" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-mark px-2 py-0.5 text-xs font-semibold text-ink">С пометками</span>
                ) : null}
              </button>
              {renderExtra?.(a)}
            </li>
          ))}
        </ul>
      ) : null}
      {videos.map((a) => (
        <div key={a.id} className="space-y-1.5">
          <video src={a.url} controls playsInline preload="metadata" className="max-h-[70dvh] w-full rounded-xl bg-black" />
        </div>
      ))}
      {audios.map((a) => (
        <audio key={a.id} src={a.url} controls preload="metadata" className="w-full" />
      ))}
      {open ? <Lightbox item={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
