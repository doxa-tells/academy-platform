export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || "Asia/Almaty";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: APP_TZ, day: "numeric", month: "long" });
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: APP_TZ,
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});
const shortFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: APP_TZ,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | null | undefined) {
  return d ? dateFmt.format(d) : "";
}
export function formatDateTime(d: Date | null | undefined) {
  return d ? dateTimeFmt.format(d) : "";
}
export function formatShort(d: Date | null | undefined) {
  return d ? shortFmt.format(d) : "";
}

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

export function timeAgo(d: Date | null | undefined, now = new Date()) {
  if (!d) return "никогда";
  const diff = (d.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "только что";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d);
}

/** Human deadline: "через 2 дня", "сегодня в 18:00", "просрочено на 3 дня". */
export function deadlineLabel(due: Date | null | undefined, now = new Date()) {
  if (!due) return "";
  const diffMs = due.getTime() - now.getTime();
  const days = diffMs / 86400000;
  if (diffMs < 0) {
    const late = Math.max(1, Math.round(-days));
    return `просрочено на ${plural(late, "день", "дня", "дней")}`;
  }
  if (days < 1) {
    const hours = Math.max(1, Math.round(diffMs / 3600000));
    return `осталось ${plural(hours, "час", "часа", "часов")}`;
  }
  const d = Math.round(days);
  return `через ${plural(d, "день", "дня", "дней")}`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  const word = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${word}`;
}

/** Offset (minutes) of APP_TZ from UTC at the given instant. */
function tzOffsetMinutes(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-10-12T18:00" in APP_TZ → Date (UTC instant). */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = tzOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60000);
}

/** Date → "2026-10-12T18:00" in APP_TZ, for <input type="datetime-local">. */
export function toLocalInputValue(d: Date | null | undefined) {
  if (!d) return "";
  const shifted = new Date(d.getTime() + tzOffsetMinutes(d) * 60000);
  return shifted.toISOString().slice(0, 16);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
