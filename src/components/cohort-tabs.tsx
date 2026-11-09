"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { createCohort, selectCohort } from "@/app/admin/actions";
import type { CohortInfo } from "@/lib/cohorts";
import { cn } from "./ui";

/** Разделы, которые не зависят от потока: там переключатель не нужен. */
const SHARED = ["/admin/program", "/admin/settings", "/admin/course/lesson", "/admin/course/assignment", "/admin/course/module"];

export function CohortTabs({ cohorts, current }: { cohorts: CohortInfo[]; current: number }) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  if (SHARED.some((p) => pathname.startsWith(p))) return null;
  const next = Math.max(...cohorts.map((c) => c.id)) + 1;

  return (
    <div className={cn("mb-7 border-b border-line pb-3", pending && "opacity-60")} data-testid="cohort-tabs">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Потоки">
        <span className="shrink-0 pr-1 text-xs uppercase tracking-[0.14em] text-muted">Поток</span>
        {cohorts.map((c) => {
          const active = c.id === current;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`cohort-tab-${c.id}`}
              disabled={pending}
              onClick={() => !active && start(() => selectCohort(c.id))}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-semibold",
                active ? "bg-cobalt text-black" : "text-ink-2 ring-1 ring-line-strong hover:bg-cobalt/10 hover:text-cobalt",
              )}
            >
              {c.title}
              <span className={cn("font-normal", active ? "text-black/70" : "text-muted")}>· {c.students}</span>
              {c.toReview ? (
                <span className="bg-mark px-1.5 text-xs font-bold text-black" title="Работ ждут проверки">
                  {c.toReview}
                </span>
              ) : null}
            </button>
          );
        })}
        {asking ? (
          <span className="flex shrink-0 items-center gap-2 pl-1 text-sm">
            <span className="text-ink-2">Создать Поток {next}?</span>
            <button
              type="button"
              data-testid="confirm-new-cohort"
              disabled={pending}
              onClick={() => start(async () => {
                await createCohort();
                setAsking(false);
              })}
              className="bg-cobalt px-2.5 py-1 font-semibold text-black"
            >
              Создать
            </button>
            <button type="button" onClick={() => setAsking(false)} className="px-2 py-1 text-ink-2 hover:text-ink">
              Отмена
            </button>
          </span>
        ) : (
          <button
            type="button"
            data-testid="new-cohort"
            onClick={() => setAsking(true)}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-cobalt hover:underline"
          >
            + Новый поток
          </button>
        )}
      </div>
    </div>
  );
}
