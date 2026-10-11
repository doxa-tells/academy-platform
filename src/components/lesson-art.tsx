import type { CSSProperties } from "react";
import {
  Briefcase,
  Camera,
  Clapperboard,
  Cloud,
  Code,
  Coins,
  Crop,
  Brush,
  Factory,
  Gear,
  Human,
  Lightbulb,
  Mail,
  Megaphone,
  Mic,
  Monitor,
  Music,
  Picture,
  Robot,
  RobotHappy,
  Scissors,
  Sparkles,
  Star,
  Target,
  Terminal,
  Webcam,
  Zap,
  type IconComponent,
} from "./icons";
import { cn } from "./ui";

type Scene = { main: IconComponent; a: IconComponent; b: IconComponent; color: string };

/** One small pixel "scene" per lesson topic, so lessons don't blur into each other. */
const SCENES: { match: RegExp; scene: Scene }[] = [
  { match: /промпт|модел/i, scene: { main: Terminal, a: Sparkles, b: Camera, color: "#00fdff" } },
  { match: /постер|исправлен|склейк|артефакт/i, scene: { main: Picture, a: Brush, b: Crop, color: "#ff6fd8" } },
  { match: /аватар|контент/i, scene: { main: RobotHappy, a: Mic, b: Factory, color: "#3dfc8a" } },
  { match: /гибрид|съёмк|съемк/i, scene: { main: Webcam, a: Robot, b: Human, color: "#ffc94d" } },
  { match: /сайт|веб|web/i, scene: { main: Monitor, a: Code, b: Cloud, color: "#5cc8ff" } },
  { match: /монтаж/i, scene: { main: Clapperboard, a: Scissors, b: Music, color: "#c58bff" } },
  { match: /позицион|продаж|рынк/i, scene: { main: Target, a: Megaphone, b: Coins, color: "#ff8a5c" } },
  { match: /автоматиз|crm|срм/i, scene: { main: Gear, a: Zap, b: Mail, color: "#c6ff4d" } },
];

const FALLBACK: Scene[] = [
  { main: Lightbulb, a: Star, b: Briefcase, color: "#00fdff" },
  { main: Star, a: Sparkles, b: Lightbulb, color: "#ffc94d" },
];

export function sceneFor(title: string, index: number): Scene {
  return SCENES.find((s) => s.match.test(title))?.scene ?? SCENES[index]?.scene ?? FALLBACK[index % FALLBACK.length];
}

function tileStyle(color: string): CSSProperties {
  return {
    borderColor: `${color}80`,
    backgroundColor: "rgb(0 0 0 / 0.72)",
    backgroundImage: `radial-gradient(circle at 35% 40%, ${color}26, transparent 62%), linear-gradient(rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.045) 1px, transparent 1px)`,
    backgroundSize: "100% 100%, 8px 8px, 8px 8px",
    boxShadow: `0 0 18px ${color}22, inset 0 0 0 2px rgb(0 0 0 / 0.6)`,
  };
}

/**
 * Pixel scene for a lesson.
 * - "lg": 88px tile with a main icon, two props and a lesson number
 * - "sm": 40px tile with the main icon only
 */
export function LessonArt({
  title,
  index,
  size = "lg",
  className,
}: {
  title: string;
  index: number;
  size?: "lg" | "sm";
  className?: string;
}) {
  const { main: Main, a: A, b: B, color } = sceneFor(title, index);
  if (size === "sm") {
    return (
      <span className={cn("relative inline-flex size-10 shrink-0 items-center justify-center border", className)} style={tileStyle(color)} aria-hidden>
        <Main className="size-6" style={{ color, filter: `drop-shadow(0 0 4px ${color}88)` }} />
      </span>
    );
  }
  return (
    <span className={cn("relative block size-[88px] shrink-0 border", className)} style={tileStyle(color)} aria-hidden>
      {/* pixel stars */}
      <span className="absolute left-[14px] top-[12px] size-1" style={{ background: color, opacity: 0.7 }} />
      <span className="absolute left-[46px] top-[6px] size-1 bg-white/40" />
      <span className="absolute right-[10px] bottom-[34px] size-1 bg-white/30" />
      <A className="absolute right-[6px] top-[6px] size-6 text-ink-2" />
      <Main className="absolute left-[18px] top-[22px] size-12" style={{ color, filter: `drop-shadow(0 0 6px ${color}99)` }} />
      <B className="absolute bottom-[6px] left-[4px] size-6 text-ink-2/80" />
      <span className="absolute bottom-[5px] right-[6px] font-display text-[8px] leading-none" style={{ color }}>
        {String(index + 1).padStart(2, "0")}
      </span>
    </span>
  );
}
