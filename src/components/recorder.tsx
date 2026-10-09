"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Video, X } from "lucide-react";
import { Button, cn } from "./ui";

type Mode = "audio" | "video";

function pickMime(mode: Mode) {
  const candidates =
    mode === "audio"
      ? ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
      : ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
}

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Records a voice or video note in the browser and hands the file back. */
export function Recorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setSeconds(0);
  }

  useEffect(() => cleanup, []);

  async function start(m: Mode) {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia(
        m === "audio" ? { audio: true } : { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      );
      stream.current = s;
      setMode(m);
      if (m === "video" && preview.current) {
        preview.current.srcObject = s;
        await preview.current.play().catch(() => {});
      }
      const mime = pickMime(m);
      const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const type = rec.mimeType || (m === "audio" ? "audio/webm" : "video/webm");
        const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunks.current, { type });
        if (blob.size > 0) {
          onRecorded(new File([blob], `${m === "audio" ? "golosovoe" : "video-razbor"}-${Date.now()}.${ext}`, { type: type.split(";")[0] }));
        }
        cleanup();
        setMode(null);
      };
      rec.start(1000);
      recorder.current = rec;
      setRecording(true);
      const startedAt = Date.now();
      timer.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500);
    } catch {
      cleanup();
      setMode(null);
      setError(m === "audio" ? "Нет доступа к микрофону. Разреши его в настройках браузера." : "Нет доступа к камере. Разреши её в настройках браузера.");
    }
  }

  function stop() {
    recorder.current?.stop();
  }

  function cancel() {
    if (recorder.current) {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    cleanup();
    setMode(null);
  }

  return (
    <div className="space-y-2">
      {!recording ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => start("audio")}>
            <Mic className="size-4 text-st-revision" aria-hidden /> Записать голосовое
          </Button>
          <Button variant="secondary" size="sm" onClick={() => start("video")}>
            <Video className="size-4 text-st-revision" aria-hidden /> Записать видео-разбор
          </Button>
        </div>
      ) : null}
      <div className={cn("overflow-hidden rounded-xl bg-black", mode === "video" ? "block" : "hidden")}>
        <video ref={preview} muted playsInline className="aspect-video w-full -scale-x-100 object-cover" />
      </div>
      {recording ? (
        <div className="flex items-center gap-3 rounded-xl border border-st-revision/30 bg-st-revision-bg px-3 py-2">
          <span className="size-2.5 animate-pulse rounded-full bg-st-revision" aria-hidden />
          <span className="text-sm font-medium tabular-nums text-st-revision">
            {mode === "audio" ? "Идёт запись голоса" : "Идёт запись видео"} · {fmt(seconds)}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancel} aria-label="Отменить запись">
              <X className="size-4" aria-hidden />
            </Button>
            <Button size="sm" onClick={stop}>
              <Square className="size-3.5" aria-hidden /> Готово
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-st-revision">{error}</p> : null}
    </div>
  );
}
