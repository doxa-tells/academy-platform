"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toggleLessonComplete } from "@/app/(student)/actions";
import { cn } from "./ui";

export function LessonDoneButton({ lessonId, done: initial }: { lessonId: string; done: boolean }) {
  const [done, setDone] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const next = !done;
          setDone(next);
          await toggleLessonComplete(lessonId, next);
        })
      }
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-4 text-[15px] font-medium transition-colors",
        done ? "bg-st-accepted-bg text-st-accepted" : "bg-cobalt text-white hover:bg-cobalt-dark",
      )}
      aria-pressed={done}
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
      {done ? "Урок пройден" : "Отметить как пройденный"}
    </button>
  );
}
