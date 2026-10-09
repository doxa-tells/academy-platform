"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, PenLine, Trash2, Undo2, X } from "lucide-react";
import type { AnnotationData } from "@/lib/db/schema";
import { AnnotationOverlay, AnnotationPins } from "./attachments";
import { Button, cn } from "./ui";

const COLORS = ["#e5322d", "#ffd400", "#19b45a", "#2945c7", "#ffffff"];

type Tool = "pen" | "pin";

/** Full-screen editor: draw over a photo and drop numbered pins. Stored as vectors (0–1000 space). */
export function Annotator({
  url,
  initial,
  onSave,
  onClose,
}: {
  url: string;
  initial?: AnnotationData;
  onSave: (data: AnnotationData) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AnnotationData>(initial ?? { strokes: [], pins: [] });
  const [history, setHistory] = useState<("stroke" | "pin")[]>(() => [
    ...(initial?.strokes.map(() => "stroke" as const) ?? []),
    ...(initial?.pins.map(() => "pin" as const) ?? []),
  ]);
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState<Tool>("pen");
  const drawing = useRef(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function point(e: React.PointerEvent): [number, number] {
    const rect = surface.current!.getBoundingClientRect();
    const x = Math.min(1000, Math.max(0, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = Math.min(1000, Math.max(0, ((e.clientY - rect.top) / rect.height) * 1000));
    return [Math.round(x), Math.round(y)];
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    const p = point(e);
    if (tool === "pin") {
      setData((d) => ({ ...d, pins: [...d.pins, { x: p[0], y: p[1], n: d.pins.length + 1, color }] }));
      setHistory((h) => [...h, "pin"]);
      return;
    }
    surface.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    setData((d) => ({ ...d, strokes: [...d.strokes, { color, width: 4, points: [p] }] }));
    setHistory((h) => [...h, "stroke"]);
  }

  function moveP(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = point(e);
    setData((d) => {
      const strokes = d.strokes.slice();
      const last = strokes[strokes.length - 1];
      const prev = last.points[last.points.length - 1];
      if (Math.abs(prev[0] - p[0]) + Math.abs(prev[1] - p[1]) < 3) return d;
      strokes[strokes.length - 1] = { ...last, points: [...last.points, p] };
      return { ...d, strokes };
    });
  }

  function up() {
    drawing.current = false;
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setData((d) => (last === "stroke" ? { ...d, strokes: d.strokes.slice(0, -1) } : { ...d, pins: d.pins.slice(0, -1) }));
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-0 size-full max-h-none max-w-none bg-ink/95 p-0 backdrop:bg-ink/80"
      aria-label="Пометки на фото"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-white">
          <div className="flex rounded-lg bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setTool("pen")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm", tool === "pen" && "bg-white text-ink")}
            >
              <PenLine className="size-4" aria-hidden /> Рисовать
            </button>
            <button
              type="button"
              onClick={() => setTool("pin")}
              className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm", tool === "pin" && "bg-white text-ink")}
            >
              <MapPin className="size-4" aria-hidden /> Метка с номером
            </button>
          </div>
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Цвет">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Цвет ${c}`}
                onClick={() => setColor(c)}
                className={cn("size-7 rounded-full border-2", color === c ? "border-white ring-2 ring-white/40" : "border-white/30")}
                style={{ background: c }}
              />
            ))}
          </div>
          <button type="button" onClick={undo} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-white/10">
            <Undo2 className="size-4" aria-hidden /> Отменить
          </button>
          <button
            type="button"
            onClick={() => {
              setData({ strokes: [], pins: [] });
              setHistory([]);
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-white/10"
          >
            <Trash2 className="size-4" aria-hidden /> Очистить
          </button>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" onClick={() => dialog.current?.close()}>
              <X className="size-4" aria-hidden /> Отмена
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onSave(data);
                dialog.current?.close();
              }}
            >
              Сохранить пометки
            </Button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
          <div
            ref={surface}
            className={cn("relative inline-block touch-none select-none", tool === "pen" ? "cursor-crosshair" : "cursor-copy")}
            onPointerDown={down}
            onPointerMove={moveP}
            onPointerUp={up}
            onPointerCancel={up}
            data-testid="annotator-surface"
          >
            <img src={url} alt="" draggable={false} className="block max-h-[calc(100dvh-90px)] max-w-full object-contain" />
            <AnnotationOverlay data={data} />
            <AnnotationPins data={data} />
          </div>
        </div>
      </div>
    </dialog>
  );
}
