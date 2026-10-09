"use client";

import { useCallback, useRef, useState } from "react";
import { FileAudio, FileVideo, ImagePlus, Loader2, X, AlertCircle } from "lucide-react";
import { uploadFile, kindOf, type Uploaded } from "@/lib/upload-client";
import { MAX_UPLOAD_MB } from "@/lib/config";
import { cn } from "./ui";

export type UploadItem = {
  id: string;
  name: string;
  kind: Uploaded["kind"];
  previewUrl: string | null;
  progress: number;
  status: "uploading" | "done" | "error";
  result?: Uploaded;
  error?: string;
};

export function useUploader(folder: string) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const id = Math.random().toString(36).slice(2);
        const kind = kindOf(file.type);
        const previewUrl = kind === "image" || kind === "video" ? URL.createObjectURL(file) : null;
        setItems((prev) => [...prev, { id, name: file.name, kind, previewUrl, progress: 0, status: "uploading" }]);
        uploadFile(file, folder, (progress) => patch(id, { progress }))
          .then((result) => patch(id, { status: "done", result, progress: 100 }))
          .catch((e: Error) => patch(id, { status: "error", error: e.message || "Ошибка загрузки" }));
      }
    },
    [folder, patch],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const reset = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
      return [];
    });
  }, []);

  const busy = items.some((i) => i.status === "uploading");
  const results = items.filter((i) => i.status === "done" && i.result).map((i) => i.result!);
  return { items, addFiles, remove, reset, busy, results };
}

export function UploadPicker({
  uploader,
  accept = "image/*,video/*",
  label = "Добавить фото или видео",
}: {
  uploader: ReturnType<typeof useUploader>;
  accept?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploader.addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-[var(--radius-card)] border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragOver ? "border-cobalt bg-cobalt-soft" : "border-line-strong bg-paper/60",
        )}
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-surface px-4 py-2.5 text-[15px] font-medium text-ink shadow-[0_1px_0_var(--color-line-strong)] ring-1 ring-line-strong hover:ring-ink-2"
        >
          <ImagePlus className="size-5 text-cobalt" aria-hidden />
          {label}
        </button>
        <p className="mt-2 text-xs text-muted">Можно несколько файлов, до {MAX_UPLOAD_MB} МБ каждый. Фото сожмутся автоматически.</p>
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          data-testid="file-input"
          onChange={(e) => {
            uploader.addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {uploader.items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {uploader.items.map((it) => (
            <li key={it.id} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
              {it.kind === "image" && it.previewUrl ? (
                <img src={it.previewUrl} alt={it.name} className="size-full object-cover" />
              ) : it.kind === "video" && it.previewUrl ? (
                <video src={it.previewUrl} className="size-full object-cover" muted playsInline />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  {it.kind === "audio" ? <FileAudio className="size-7" /> : <FileVideo className="size-7" />}
                </div>
              )}
              {it.status === "uploading" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/45 text-white">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  <span className="text-sm font-semibold tabular-nums">{it.progress}%</span>
                </div>
              ) : null}
              {it.status === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-st-revision/85 p-2 text-center text-white">
                  <AlertCircle className="size-5" aria-hidden />
                  <span className="text-[11px] leading-tight">{it.error}</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => uploader.remove(it.id)}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white hover:bg-ink"
                aria-label={`Убрать ${it.name}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
