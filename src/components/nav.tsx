"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Route,
  Settings,
  StickyNote,
  User,
  Users,
  Inbox,
  BarChart3,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./ui";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

function isActive(pathname: string, item: Item) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

function Count({ n, tone = "mark" }: { n?: number; tone?: "mark" | "cobalt" }) {
  if (!n) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
        tone === "mark" ? "bg-mark text-ink" : "bg-cobalt text-white",
      )}
    >
      {n}
    </span>
  );
}

function Brand({ appName, sub }: { appName: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <img src="/icon.svg" alt="" className="size-8" />
      <div className="min-w-0">
        <p className="truncate font-display text-[15px] font-semibold leading-none text-ink">{appName}</p>
        <p className="mt-1 truncate text-xs text-muted">{sub}</p>
      </div>
    </div>
  );
}

function LogoutButton({ compact }: { compact?: boolean }) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={cn(
          "flex items-center gap-3 rounded-lg text-[15px] text-ink-2 hover:bg-ink/5 hover:text-ink",
          compact ? "p-2" : "w-full px-3 py-2",
        )}
        aria-label="Выйти"
      >
        <LogOut className="size-[18px]" aria-hidden />
        {compact ? null : "Выйти"}
      </button>
    </form>
  );
}

function Sidebar({ items, appName, sub }: { items: Item[]; appName: string; sub: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface py-6 md:flex">
      <Brand appName={appName} sub={sub} />
      <nav className="mt-8 flex-1 space-y-0.5 px-3" aria-label="Разделы">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors",
                active ? "bg-cobalt-soft font-medium text-cobalt-dark" : "text-ink-2 hover:bg-ink/5 hover:text-ink",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {item.label}
              <Count n={item.badge} />
            </Link>
          );
        })}
      </nav>
      <div className="px-3">
        <LogoutButton />
      </div>
    </aside>
  );
}

function MobileTop({ appName }: { appName: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-2.5 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <img src="/icon.svg" alt="" className="size-7" />
        <span className="font-display text-[15px] font-semibold text-ink">{appName}</span>
      </div>
      <LogoutButton compact />
    </header>
  );
}

function BottomBar({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Разделы"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium",
                  active ? "text-cobalt" : "text-muted",
                )}
              >
                <Icon className="size-[22px]" aria-hidden />
                {item.label}
                {item.badge ? (
                  <span className="absolute left-1/2 top-1.5 ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-bold text-ink">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function StudentNav({ appName, name, unread, todo }: { appName: string; name: string; unread: number; todo: number }) {
  const items: Item[] = [
    { href: "/", label: "Главная", icon: Home, exact: true },
    { href: "/board", label: "Доска", icon: StickyNote, badge: unread },
    { href: "/lessons", label: "Уроки", icon: BookOpen },
    { href: "/homework", label: "Домашки", icon: ClipboardList, badge: todo },
    { href: "/progress", label: "Прогресс", icon: Route },
  ];
  const sideItems: Item[] = [...items, { href: "/profile", label: "Профиль", icon: User }];
  const mobileItems: Item[] = [items[0], items[1], items[2], items[3], { href: "/profile", label: "Профиль", icon: User }];
  return (
    <>
      <Sidebar items={sideItems} appName={appName} sub={name} />
      <MobileTop appName={appName} />
      <BottomBar items={mobileItems} />
    </>
  );
}

export function AdminNav({ appName, name, toReview }: { appName: string; name: string; toReview: number }) {
  const items: Item[] = [
    { href: "/admin", label: "Сводка", icon: LayoutDashboard, exact: true },
    { href: "/admin/reviews", label: "Домашки", icon: Inbox, badge: toReview },
    { href: "/admin/board", label: "Доска", icon: MessageSquareText },
    { href: "/admin/course", label: "Курс", icon: Layers },
    { href: "/admin/students", label: "Студенты", icon: Users },
    { href: "/admin/surveys", label: "Опросы", icon: BarChart3 },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
  ];
  const mobileItems: Item[] = [items[0], items[1], items[2], items[3], items[4]];
  return (
    <>
      <Sidebar items={items} appName={appName} sub={`Админка · ${name}`} />
      <MobileTop appName={appName} />
      <BottomBar items={mobileItems} />
    </>
  );
}
