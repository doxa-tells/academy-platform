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
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-xs font-bold tabular-nums",
        tone === "mark" ? "bg-mark text-black" : "bg-cobalt text-black",
      )}
    >
      {n}
    </span>
  );
}

function Brand({ appName, sub }: { appName: string; sub: string }) {
  return (
    <div className="px-4">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="size-10 shrink-0 drop-shadow-[0_0_10px_rgb(0_253_255/0.45)]" />
        <p className="glow truncate font-display text-[11px] leading-none text-cobalt">{appName}</p>
      </div>
      {/* The logo file has ~8px of empty space under the mark: tuck the name right under it */}
      <p className="-mt-1.5 truncate pl-[52px] text-xs leading-tight text-muted">{sub}</p>
    </div>
  );
}

function LogoutButton({ compact }: { compact?: boolean }) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={cn(
          "flex items-center gap-3 text-[14px] text-ink-2 hover:bg-cobalt/10 hover:text-cobalt",
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
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-black/75 py-6 backdrop-blur-sm md:flex">
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
                "flex items-center gap-3 px-3 py-2 text-[14px] transition-colors",
                active ? "bg-cobalt font-semibold text-black" : "text-ink-2 hover:bg-cobalt/10 hover:text-cobalt",
              )}
            >
              <span aria-hidden className={active ? "text-black" : "text-muted"}>
                {active ? ">" : " "}
              </span>
              <Icon className="size-[17px]" aria-hidden />
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-black/85 px-4 py-2.5 backdrop-blur md:hidden">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="" className="size-8" />
        <span className="glow font-display text-[11px] text-cobalt">{appName}</span>
      </div>
      <LogoutButton compact />
    </header>
  );
}

function BottomBar({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-black/92 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
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
                  "relative flex flex-col items-center gap-1 border-t-2 pb-2 pt-2 text-[11px] font-medium",
                  active ? "border-cobalt text-cobalt" : "border-transparent text-muted",
                )}
              >
                <Icon className="size-[22px]" aria-hidden />
                {item.label}
                {item.badge ? (
                  <span className="absolute left-1/2 top-1.5 ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-bold text-black">
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
