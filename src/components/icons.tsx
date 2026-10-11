// Pixel icons from pixelarticons by Gerrit Halfmann — MIT License, https://pixelarticons.com
// Generated file: icon names mirror the previous lucide-react imports so call sites stay unchanged.
import type { CSSProperties, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { strokeWidth?: number };
export type IconComponent = (props: IconProps) => React.JSX.Element;

/** The art is drawn on a 12×12 grid (2 units per pixel): snap sizes to 12/24/36/48px so pixels stay crisp. */
function snap(px: number) {
  if (px <= 16) return 12;
  if (px <= 30) return 24;
  if (px <= 42) return 36;
  return 48;
}

function parseSize(className = ""): { rest: string; px: number | null } {
  let px: number | null = null;
  const rest = className
    .split(/\s+/)
    .filter((c) => {
      const m = c.match(/^size-(?:\[(\d+(?:\.\d+)?)px\]|(\d+(?:\.\d+)?))$/);
      if (!m) return true;
      px = m[1] ? Number(m[1]) : Number(m[2]) * 4;
      return false;
    })
    .join(" ");
  return { rest, px };
}

function make(d: string): IconComponent {
  return function PixelIcon({ className, style, strokeWidth: _sw, ...props }: IconProps) {
    const { rest, px } = parseSize(className);
    const size = snap(px ?? 16);
    const labelled = !!props["aria-label"];
    const s: CSSProperties = { width: size, height: size, flexShrink: 0, ...style };
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        shapeRendering="crispEdges"
        className={rest || undefined}
        style={s}
        role={labelled ? "img" : undefined}
        aria-hidden={labelled ? undefined : true}
        {...props}
      >
        <path d={d} />
      </svg>
    );
  };
}

export const AlertCircle = make("M2 10h2v2H2zm0 4h2v-2H2zm20-4h-2v2h2zm0 4h-2v-2h2zM4 8h2v2H4zm0 8h2v-2H4zm16-8h-2v2h2zm0 8h-2v-2h2zM6 6h2v2H6zm0 12h2v-2H6zM18 6h-2v2h2zm0 12h-2v-2h2zM8 4h2v2H8zm0 16h2v-2H8zm8-16h-2v2h2zm0 16h-2v-2h2zM10 2h2v2h-2zm0 20h2v-2h-2zm4-20h-2v2h2zm0 20h-2v-2h2zm-3-5h2v-2h-2zm0-4h2V7h-2z"); // warning-diamond
export const AlertTriangle = make("M2 10h2v2H2zm0 4h2v-2H2zm20-4h-2v2h2zm0 4h-2v-2h2zM4 8h2v2H4zm0 8h2v-2H4zm16-8h-2v2h2zm0 8h-2v-2h2zM6 6h2v2H6zm0 12h2v-2H6zM18 6h-2v2h2zm0 12h-2v-2h2zM8 4h2v2H8zm0 16h2v-2H8zm8-16h-2v2h2zm0 16h-2v-2h2zM10 2h2v2h-2zm0 20h2v-2h-2zm4-20h-2v2h2zm0 20h-2v-2h2zm-3-5h2v-2h-2zm0-4h2V7h-2z"); // warning-diamond
export const ArrowDown = make("M13 12h6v2h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2h6V4h2v8Z"); // arrow-down
export const ArrowLeft = make("M20 11v2H4v-2zM8 13v2H6v-2zm2 2v2H8v-2zm2 2v2h-2v-2zm-4-6V9H6v2z M10 15V7H8v8zm2 2V5h-2v12z"); // arrow-left
export const ArrowRight = make("M4 11v2h16v-2zm12 2v2h2v-2zm-2 2v2h2v-2zm-2 2v2h2v-2zm4-6V9h2v2z M14 15V7h2v8zm-2 2V5h2v12z"); // arrow-right
export const ArrowUp = make("M11 20h2V4h-2zm2-12h2V6h-2zm2 2h2V8h-2zm2 2h2v-2h-2zm-6-4H9V6h2z M15 10H7V8h8zm2 2H5v-2h12z"); // arrow-up
export const BarChart3 = make("M4 20h18v2H4zM2 2h2v18H2zm16 11v3h-2v-3zM8 13v3H6v-3zm8-2v2H8v-2zm0 5v2H8v-2zm4-12v3h-2V4zM8 4v3H6V4zm10-2v2H8V2zm0 5v2H8V7z"); // chart-bar-big
export const BellRing = make("M14 22H10V20H14V22ZM10 20H8V18H10V20ZM16 20H14V18H16V20ZM5 15H19V13H21V17H3V13H5V15ZM7 13H5V6H7V13ZM19 13H17V6H19V13ZM3 6H1V4H3V6ZM9 6H7V4H9V6ZM17 6H15V4H17V6ZM23 6H21V4H23V6ZM5 4H3V2H5V4ZM15 4H9V2H15V4ZM21 4H19V2H21V4Z"); // bell-ring
export const BookOpen = make("M2 3h9v2H2zM0 19h11v2H0zM13 3h9v2h-9zm0 16h11v2H13zM11 5h2v18h-2zM0 5h2v14H0zm22 0h2v14h-2zm-7 2h5v2h-5zm0 4h5v2h-5zm0 4h2v2h-2z"); // book-open
export const CalendarClock = make("M21 23h-8v-2h8v2ZM9 21H3v-2h6v2Zm4 0h-2v-8h2v8Zm10 0h-2v-8h2v8ZM3 7h14V5h2v4H3v10H1V5h2v2Zm15 10h2v2h-2v-1h-2v-4h2v3Zm3-4h-8v-2h8v2ZM7 3h6V1h2v2h2v2H3V3h2V1h2v2Z"); // date-time
export const Check = make("M10 18H8v-2h2v2Zm-2-2H6v-2h2v2Zm4-2v2h-2v-2h2Zm-6 0H4v-2h2v2Zm8 0h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2V8h2v2Zm2-2h-2V6h2v2Z"); // check
export const CheckCircle2 = make("M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zM7 12h2v2H7zm2 2h2v2H9zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2z"); // checkbox-on
export const Circle = make("M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2z"); // checkbox
export const ClipboardList = make("M20 12h2v8h-2zm-8-2h8v2h-8zm0 10h8v2h-8zm-2-8h2v8h-2zM6 2h8v2H6zm0 4h8v2H6zm0-2h2v2H6zm6 0h2v2h-2zm2 0h2v2h-2z M16 6h2v5h-2zM4 4h2v2H4zM2 6h2v12H2zm2 12h6v2H4zm2-8h4v2H6zm0 4h2v2H6zm11 2h5v2h-5z M16 16h2v6h-2z"); // clipboard-note
export const Clock = make("M6 2h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zM4 4h2v2H4zm2 18h12v-2H6zm12-2h2v-2h-2zM4 20h2v-2H4zm7-14h2v7h-2zm2 7h2v2h-2zm2 2h2v2h-2z"); // clock
export const Copy = make("M8 6h12v2H8zM4 2h12v2H4zm2 6h2v12H6zM2 4h2v12H2zm6 16h12v2H8zM20 8h2v12h-2zm-4-4h2v2h-2zM4 16h2v2H4z"); // copy
export const ExternalLink = make("M11 5H5v2h6V5ZM5 7H3v12h2V7Zm12 12H5v2h12v-2Zm2-6h-2v6h2v-6Zm-8 0H9v2h2v-2Zm2-2h-2v2h2v-2Zm2-2h-2v2h2V9Zm2-2h-2v2h2V7Zm2-2h-2v2h2V5Zm2-2h-2v8h2V3Z M21 3h-8v2h8V3Z"); // external-link
export const FileAudio = make("M4 12h4v2H4zm-2 2h2v4H2zm2 4h4v2H4zM8 6h2v12H8zm10 0h2v12h-2zm-6 8h2v4h-2zm2-2h4v2h-4zm0 6h4v2h-4zM10 4h8v2h-8z"); // music
export const FileVideo = make("M20 17V7h2v10zm-2-2V9h2v6zM2 7h2v10H2zm14 0h2v10h-2zM4 5h12v2H4zm0 12h12v2H4z"); // video
export const Home = make("M4 20h16v2H4zm16-10h2v10h-2zM2 10h2v10H2zm2-2h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM8 14h2v6H8zm2-2h4v2h-4zm4 2h2v6h-2z"); // home
export const ImagePlus = make("M4 2h10v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 6h2v10h-2zm-6 0h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm-6 2h2v2h-2zm8 0h2v2h-2zM8 16h2v2H8zm-2 2h2v2H6zM8 6h2v2H8zM6 8h2v2H6zm2 2h2v2H8zm2-2h2v2h-2zm8-6h2v6h-2z M16 4h6v2h-6z"); // image-2-plus
export const Inbox = make("M2 4h2v16H2zm2 16h16v2H4zM20 4h2v16h-2zM4 2h16v2H4zm0 12h4v2H4zm4 2h8v2H8zm8-2h4v2h-4z"); // inbox
export const Layers = make("M3 4h2v17H3zm4 4h2v13H7zm4-2h2v15h-2zm4 0h2v5h-2zm2 5h2v5h-2zm2 5h2v5h-2z"); // library
export const LayoutDashboard = make("M20 20H4v-2h4v-8H4v8H2V6h2v2h16V6h2v12h-2v-8H10v8h10v2Zm0-14H4V4h16v2Z"); // layout
export const Link2 = make("M4 6h7v2H4zm0 10h7v2H4zM2 8h2v8H2zm18-2h-7v2h7zm0 10h-7v2h7zm2-8h-2v8h2zM7 11h10v2H7z"); // link
export const Loader2 = make("M13 22h-2v-6h2v6Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2ZM9 17H7v-2h2v2Zm8 0h-2v-2h2v2Zm-9-4H2v-2h6v2Zm14 0h-6v-2h6v2ZM9 9H7V7h2v2Zm8 0h-2V7h2v2Zm-4-1h-2V2h2v6ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Z"); // loader
export const LogOut = make("M8 11h12v2H8zm8-2h2v2h-2z M14 7h2v10h-2zm2 6h2v2h-2zM6 2h12v2H6zm0 18h12v2H6zM4 4h2v16H4zm14 0h2v3h-2zm0 13h2v3h-2z"); // logout
export const MapPin = make("M7 2h10v2H7zM5 4h2v2H5zm14 0h-2v2h2zM7 17h2v2H7zm2 2h2v2H9zm6-2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-6-7h2v3H5zm12 0h2v3h-2zM3 6h2v8H3zm18 0h-2v8h2zM10 6h4v2h-4zM8 8h2v4H8zm2 4h4v2h-4zm4-4h2v4h-2z"); // map-pin
export const Megaphone = make("M4 6h12v2H4zM2 8h2v6H2zm2 6h12v2H4zM20 2h2v18h-2zm-2 16h2v2h-2zm-2-2h2v2h-2zm0-12h2v2h-2zm2-2h2v2h-2zM8 8h2v6H8zm-2 8h2v4H6zm2 4h4v2H8zm2-4h2v4h-2z"); // megaphone
export const MessageCircleWarning = make("M4 2h16v2H4zm0 18h16v2H4zM20 4h2v16h-2zM2 4h2v16H2zm9 2h2v8h-2zm0 10h2v2h-2z"); // square-alert
export const MessageSquare = make("M20 2H4v2h16zm0 14H6v2h14zm2-12h-2v12h2zM4 4H2v18h2zm2 14H4v2h2z"); // message
export const MessageSquareText = make("M20 2H4v2h16zm0 14H6v2h14zm2-12h-2v12h2zM4 4H2v18h2zm2 14H4v2h2zm0-6h4v2H6zm0-4h8v2H6z"); // message-text
export const Mic = make("M10 2h4v2h-4zM8 4h2v10H8zm2 10h4v2h-4zm4-10h2v10h-2zM4 10h2v6H4zm2 6h2v2H6zm2 2h8v2H8zm8-2h2v2h-2zm2-6h2v6h-2zm-7 10h2v2h-2z"); // mic
export const Paperclip = make("M7 7v10H5V7zm12 0v12h-2V7zm-8 2v10H9V9zm4 0v8h-2V9zm0-6v2H9V3zm-2 4v2h-2V7zm4 12v2h-6v-2zm0-14v2h-2V5zM9 5v2H7V5z"); // attachment
export const PartyPopper = make("M4 20H6V22H2V18H4V20ZM20 21H18V19H20V21ZM10 20H6V18H10V20ZM6 18H4V14H6V18ZM14 18H10V16H14V18ZM10 16H8V14H10V16ZM16 16H14V12H16V16ZM22 16H20V14H22V16ZM8 14H6V10H8V14ZM20 14H18V12H20V14ZM14 12H12V10H14V12ZM12 10H8V8H12V10ZM20 9H16V7H20V9ZM5 8H3V6H5V8ZM22 7H20V5H22V7ZM12 6H10V4H12V6ZM10 4H8V2H10V4ZM17 4H15V2H17V4Z"); // party-popper
export const PenLine = make("M4 16H6V18H8V20H10V22H2V14H4V16ZM12 20H10V18H12V20ZM14 18H12V16H14V18ZM10 16H8V14H10V16ZM16 16H14V14H16V16ZM6 14H4V12H6V14ZM12 14H10V12H12V14ZM18 14H16V12H18V14ZM8 12H6V10H8V12ZM14 12H12V10H14V12ZM20 12H18V10H20V12ZM10 10H8V8H10V10ZM18 10H16V8H18V10ZM22 10H20V8H22V10ZM12 8H10V6H12V8ZM16 8H14V6H16V8ZM20 8H18V6H20V8ZM14 6H12V4H14V6ZM18 6H16V4H18V6ZM16 4H14V2H16V4Z"); // pencil
export const Pencil = make("M5 3h6v2H5zM3 5h2v14H3zm16 8h2v6h-2zM5 19h14v2H5zm3-9h2v6H8zm2 4h4v2h-4zm0-6h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-4 0h2v2h-2z"); // pen-square
export const Pin = make("M6 2h12v2H6zM4 4h2v18H4zm14 0h2v18h-2zm-2 16h2v2h-2zm-2-2h2v2h-2zm-8 2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4z"); // bookmark
export const PinOff = make("M6 2h12v2H6zm0 18h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2H8zm-2 2h2v2H6zm12 2h2v2h-2zM4 4h2v2H4zm0 14h2v2H4z"); // cancel
export const PlayCircle = make("M15 11h-2V9h2zm0 4h-2v-2h2zm-2 2h-2v-2h2zm0-8h-2V7h2zm-2-2H9V5h2zM9 21H7V3h2zm6-8h2v-2h-2zm-6 4h2v2H9z"); // play
export const RotateCcw = make("M16 4h2v6h-2zm-2-2h2v2h-2zm0 2h2v8h-2zM4 8H2v5h2z M4 6h16v2H4zm4 14H6v-6h2zm2 2H8v-2h2zm0-2H8v-8h2zm10-4h2v-5h-2z M20 18H4v-2h16z"); // reload
export const Route = make("M4 20h2v2H2V6h2v14Zm12 0h2v2h-4v-2h-2v-2h2V8h-2V6h4v14Zm-8 0H6v-2h2v2Zm12 0h-2v-2h2v2ZM10 4h2v2h-2v10h2v2H8V4H6V2h4v2Zm12 14h-2V4h-2V2h4v16ZM6 6H4V4h2v2Zm12 0h-2V4h2v2Z"); // map
export const Send = make("M4 19h4v2H2v-8h2v6Zm8 0H8v-2h4v2Zm4-2h-4v-2h4v2Zm4-2h-4v-2h4v2Zm-10-2H4v-2h6v2Zm12 0h-2v-2h2v2ZM8 5H4v6H2V3h6v2Zm12 6h-4V9h4v2Zm-4-2h-4V7h4v2Zm-4-2H8V5h4v2Z"); // send
export const Telegram = make("M19 23H5V21H19V23ZM5 21H3V19H5V21ZM21 21H19V19H21V21ZM3 19H1V5H3V19ZM17 19H15V17H11V15H15V7H12V5H17V19ZM23 19H21V5H23V19ZM13 11V13H11V15H9V17H7V13H9V11H13ZM7 13H4V11H7V13ZM9 11H7V9H9V11ZM12 9H9V7H12V9ZM5 5H3V3H5V5ZM21 5H19V3H21V5ZM19 3H5V1H19V3Z"); // telegram
export const Settings = make("M4 20h3v-2h4v4h2v-4h4v2h-2v4H9v-4H7v2H2v-5h2v3Zm18 2h-5v-2h3v-3h2v5ZM6 11H2v2h4v4H4v-2H0V9h4V7h2v4Zm14-2h4v6h-4v2h-2v-4h4v-2h-4V7h2v2Zm-6 7h-4v-2h4v2Zm-4-2H8v-4h2v4Zm6 0h-2v-4h2v4Zm-2-4h-4V8h4v2ZM7 4H4v3H2V2h5v2Zm8 0h2V2h5v5h-2V4h-3v2h-4V2h-2v4H7V4h2V0h6v4Z"); // settings-cog
export const Sparkle = make("M11 1h2v4h-2zm0 22h2v-4h-2zM9 5h2v4H9zm0 14h2v-4H9zm4-14h2v4h-2zm0 14h2v-4h-2zM5 9h4v2H5zm14 0h-4v2h4zM1 11h4v2H1zm22 0h-4v2h4zM5 13h4v2H5zm14 0h-4v2h4z"); // sparkle
export const Sparkles = make("M11 1h2v4h-2zm0 22h2v-4h-2zM9 5h2v4H9zm0 14h2v-4H9zm4-14h2v4h-2zm0 14h2v-4h-2zM5 9h4v2H5zm14 0h-4v2h4zM1 11h4v2H1zm22 0h-4v2h4zM5 13h4v2H5zm14 0h-4v2h4zm0-12h2v6h-2z M17 3h6v2h-6zM3 17h2v2H3zm-2 2h2v2H1zm2 2h2v2H3zm2-2h2v2H5z"); // sparkles
export const Square = make("M20 20H4V4H20V20ZM10 14H14V10H10V14Z"); // stop-solid
export const StickyNote = make("M4 4H2v16h2zm12-2H4v2h12zm6 6h-2v12h2zm-2 12H4v2h16zM18 6h2v2h-2zm-2-2h2v2h-2zm-4 0h2v6h-2zm0 6h8v2h-8z"); // sticky-note
export const Trash2 = make("M18 22H6V20H18V22ZM9 6H15V4H17V6H22V8H20V20H18V8H6V20H4V8H2V6H7V4H9V6ZM15 4H9V2H15V4Z"); // trash
export const Undo2 = make("M18 20h-6v-2h6v2Zm2-2h-2v-8h2v8Zm-10-4H8v-2H6v-2H4V8h2V6h2V4h2v4h8v2h-8v4Z"); // undo
export const User = make("M9 2h6v2H9zm0 8h6v2H9zm6-6h2v6h-2zM7 4h2v6H7zM4 18h2v4H4zm14 0h2v4h-2zM8 14h8v2H8zm-2 2h2v2H6zm10 0h2v2h-2z"); // user
export const Users = make("M5 2h6v2H5zm10 0h4v2h-4zM5 10h6v2H5zm10 0h4v2h-4zm4-6h2v6h-2zm-8 0h2v6h-2zM3 4h2v6H3zM0 18h2v4H0zm14 0h2v4h-2zm8 0h2v4h-2zM4 14h8v2H4zm12 0h4v2h-4zM2 16h2v2H2zm10 0h2v2h-2zm8 0h2v2h-2z"); // users
export const Video = make("M20 17V7h2v10zm-2-2V9h2v6zM2 7h2v10H2zm14 0h2v10h-2zM4 5h12v2H4zm0 12h12v2H4z"); // video
export const VideoOff = make("M20 17V7h2v10zm-2-2V9h2v6zM2 7h2v10H2zm14 0h2v10h-2zM4 5h12v2H4zm0 12h12v2H4z"); // video
export const X = make("M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z"); // close
export const Terminal = make("M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zM6 16h2v2H6zm2-2h2v2H8zm-2-2h2v2H6z"); // terminal
export const Camera = make("M4 5h4v2H4zm4-2h8v2H8zm8 2h4v2h-4zM2 7h2v12H2zm2 12h16v2H4zM20 7h2v12h-2zM10 8h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z"); // camera
export const Picture = make("M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-4 8h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm-8 0h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2z M20 16h2v2h-2zM8 16h2v2H8zm-2 2h2v2H6zM8 6h2v2H8zM6 8h2v2H6zm2 2h2v2H8zm2-2h2v2h-2z"); // image
export const Brush = make("M7 2h10v2H7zM5 4h2v10H5zm12-2h2v12h-2z M13 2h2v6h-2zM9 2h2v4H9zm-4 8h14v2H5zm2 4h10v2H7zm2 2h2v4H9zm4 0h2v4h-2zm-4 4h6v2H9z"); // brush
export const Crop = make("M18 16h4v2h-4v4h-2V8h2v8Zm-4 2H8v-2h6v2Zm-6-2H6v-6h2v6ZM8 6h8v2H2V6h4V2h2v4Z"); // crop
export const RobotHappy = make("M4 6h16v2H4zm0 14h16v2H4zM2 8h2v12H2zm18 0h2v12h-2z M11 4h2v4h-2zm-3 6h2v2H8zm6 0h2v2h-2zm-1-8h4v2h-4zM0 12h2v2H0zm22 0h2v2h-2zM7 14h10v2H7zm2 2h6v2H9z"); // robot-face-happy
export const Factory = make("M2 4h2v16H2zm2 16h16v2H4zM20 7h2v13h-2zm-2 0h2v2h-2zm-6 0h2v2h-2zm4 2h2v2h-2zm-6 0h2v2h-2zm4-2h2v6h-2zM8 4h2v9H8zM4 2h6v2H4zm3 13h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"); // factory
export const Webcam = make("M4 20H20V18H22V22H2V18H4V20ZM6 18H4V16H6V18ZM16 18H8V16H16V18ZM20 18H18V16H20V18ZM8 16H6V14H8V16ZM18 16H16V14H18V16ZM6 14H4V6H6V14ZM14 8H16V12H14V14H10V12H8V8H10V10H12V8H10V6H14V8ZM20 14H18V6H20V14ZM8 6H6V4H8V6ZM18 6H16V4H18V6ZM16 4H8V2H16V4Z"); // webcam
export const Robot = make("M5 7h14v2H5zm0 12h14v2H5zM3 9h2v10H3zm16 0h2v10h-2zM1 13h2v2H1zm20 0h2v2h-2zM11 5h2v2h-2zM7 3h4v2H7zm1 9h2v4H8zm6 0h2v4h-2z"); // robot
export const Human = make("M10 2h4v4h-4zM3 7h18v2H3zm6 2h2v7H9zm4 0h2v7h-2zm-4 7h2v6H9zm4 0h2v6h-2zm-2-2h2v2h-2z"); // human
export const Monitor = make("M4 2h16v2H4zm0 14h16v2H4zM2 4h2v12H2zm18 0h2v12h-2zm-9 14h2v2h-2zm-3 2h8v2H8z"); // monitor
export const Code = make("M11 18H9v-4h2v4Zm-4-1H5v-2h2v2Zm12-2v2h-2v-2h2ZM5 15H3v-2h2v2Zm16 0h-2v-2h2v2Zm-8-1h-2v-4h2v4ZM3 13H1v-2h2v2Zm20 0h-2v-2h2v2ZM5 11H3V9h2v2Zm16 0h-2V9h2v2Zm-6-1h-2V6h2v4ZM7 9H5V7h2v2Zm12 0h-2V7h2v2Z"); // code
export const Laptop = make("M3 18h18v-2h2v4H1v-4h2v2Zm2-4h14V6h2v10H3V6h2v8Zm14-8H5V4h14v2Z"); // laptop
export const Clapperboard = make("M4 3h16v2H4zm0 6h16v2H4zM2 5h2v14H2zm18 0h2v14h-2zM4 19h16v2H4zM18 7h-2v2h2zm-8 0H8v2h2zm6-2h-2v2h2zM8 5H6v2h2z"); // clapperboard
export const Scissors = make("M5 2h4v2H5zm0 12h4v2H5zm0-6h4v2H5zm0 12h4v2H5zM3 4h2v4H3zm0 12h2v4H3zM9 4h2v4H9zm0 12h2v4H9zm0-8h2v2H9zm2 2h2v2h-2zm-2 4h2v2H9zm2-2h2v2h-2zm2-2h2v2h-2zm2 4h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM15 8h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2z"); // scissors
export const Music = make("M4 12h4v2H4zm-2 2h2v4H2zm2 4h4v2H4zM8 6h2v12H8zm10 0h2v12h-2zm-6 8h2v4h-2zm2-2h4v2h-4zm0 6h4v2h-4zM10 4h8v2h-8z"); // music
export const Target = make("M5 1h14v2H5zM3 3h2v2H3zm0 16h2v2H3zm16 0h2v2h-2zm0-16h2v2h-2zm2 2h2v14h-2zM5 21h14v2H5zM1 5h2v14H1zm8 0h6v2H9zM5 9h2v6H5zm4 8h6v2H9zm8-8h2v6h-2zm-6 0h2v2h-2zM7 7h2v2H7zm0 8h2v2H7zm8 0h2v2h-2zm0-8h2v2h-2zm-6 4h2v2H9zm2 2h2v2h-2zm2-2h2v2h-2z"); // target
export const TrendingUp = make("M4 18H2v-2h2v2Zm2-2H4v-2h2v2Zm8 0h-2v-2h2v2Zm-6-2H6v-2h2v2Zm4 0h-2v-2h2v2Zm4 0h-2v-2h2v2Zm6-8v8h-2v-4h-2V8h-4V6h8Zm-12 6H8v-2h2v2Zm8 0h-2v-2h2v2Z"); // trending-up
export const Zap = make("M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z"); // zap
export const Gear = make("M18 22H13V24H11V22H6V20H18V22ZM4 22H2V20H4V22ZM22 22H20V20H22V22ZM6 20H4V18H6V20ZM20 20H18V18H20V20ZM4 18H2V13H0V11H2V6H4V18ZM8 18H6V16H8V18ZM22 11H24V13H22V18H20V13H16V16H8V8H16V11H20V6H22V11ZM10 10V14H14V10H10ZM8 8H6V6H8V8ZM6 6H4V4H6V6ZM20 6H18V4H20V6ZM4 4H2V2H4V4ZM13 2H18V4H6V2H11V0H13V2ZM22 4H20V2H22V4Z"); // gear
export const Wand = make("M14 22H12V20H14V22ZM20 22H18V20H20V22ZM5 19H9V21H3V15H5V19ZM18 20H16V18H18V20ZM22 20H20V18H22V20ZM11 19H9V16H11V19ZM20 18H18V16H20V18ZM13 16H11V13H13V16ZM8 15H5V13H8V15ZM11 13H8V11H11V13ZM15 13H13V11H15V13ZM21 13H19V11H21V13ZM4 12H2V10H4V12ZM13 11H11V9H13V11ZM17 11H15V9H17V11ZM15 9H13V7H15V9ZM19 9H17V7H19V9ZM6 8H4V6H6V8ZM17 7H15V5H17V7ZM21 7H19V5H17V3H21V7ZM4 6H2V4H4V6ZM8 6H6V4H8V6ZM13 5H11V3H13V5ZM6 4H4V2H6V4Z"); // wand
export const Presentation = make("M1 3h22v2H1zm1 2h2v11H2zm2 11h16v2H4zM20 5h2v11h-2zM9 18h2v2H9zm-2 2h2v2H7zm6-2h2v2h-2zm2 2h2v2h-2z"); // presentation
export const Briefcase = make("M2 8h2v12H2zm18 0h2v12h-2zM4 6h16v2H4zm0 14h16v2H4zM8 4h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2z"); // briefcase
export const Coins = make("M6 2h6v2H6zM4 4h2v2H4zm8 0h2v2h-2zm-8 8h2v2H4zm8 0h2v2h-2zm-6 2h6v2H6zM2 6h2v6H2zm12 0h2v6h-2z M14 8h4v2h-4zm-4 10h2v2h-2zm8-8h2v2h-2zm-6 10h2v2h-2zm6-2h2v2h-2z M12 20h6v2h-6zm-4-6h2v4H8zm12-2h2v6h-2zM7 6h4v2H7z M9 6h2v6H9zm6 8h2v4h-2zm-1-2h3v2h-3z"); // coins
export const Mail = make("M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z"); // mail
export const Cloud = make("M22 10h-4v2h4v-2Zm2 2h-2v6h2v-6Zm-2 6H2v2h20v-2ZM2 12H0v6h2v-6Zm2-2H2v2h2v-2Zm4-2H4v2h4V8Zm8-4h-6v2h6V4Zm-6 2H8v2h2V6Zm0 4H8v2h2v-2Zm8-4h-2v2h2V6Z M20 8h-2v4h2V8Zm-2 4h-2v2h2v-2Z"); // cloud
export const Spray = make("M4 9h6v2H4zm2-2h2v2H6zm-4 4h2v10H2zm2 8h6v2H4zm6-8h2v10h-2zm2-4h2v2h-2zm2-2h2v2h-2zm0 6h2V9h-2zm2-8h2v2h-2zm0 10h2v-2h-2zm2-12h2v2h-2zm0 14h2v-2h-2zm-2-8h2v2h-2zm2-2h2v2h-2zm0 4h2v2h-2z"); // spray
export const Star = make("M5 20H8V22H3V16H5V20ZM21 22H16V20H19V16H21V22ZM10 20H8V18H10V20ZM16 20H14V18H16V20ZM14 18H10V16H14V18ZM7 16H5V13H7V16ZM19 16H17V13H19V16ZM5 13H3V11H5V13ZM21 13H19V11H21V13ZM9 9H3V11H1V7H9V9ZM23 11H21V9H15V7H23V11ZM11 7H9V3H11V7ZM15 7H13V3H15V7ZM13 3H11V1H13V3Z"); // star
export const Lightbulb = make("M9 4h6v2H9zM7 6h2v2H7zm8 0h2v2h-2zm4-2h2v2h-2zm2-2h2v2h-2zM0 10h3v2H0zm21 0h3v2h-3zM3 4h2v2H3zM1 2h2v2H1zm6 12h2v2H7zm8 0h2v2h-2zM5 8h2v6H5zm12 0h2v6h-2zm-8 8h6v2H9zm0 4h6v2H9zm0-2h2v2H9zm4 0h2v2h-2zM11 0h2v3h-2z"); // lightbulb
export const Rocket = make("M5 19H3v-2h2v2Zm16 0h-2v-2h2v2ZM3 17H1v-6h2v6Zm11 0h-4v-4h4v4Zm9 0h-2v-6h2v6Zm-7-4h-2v-2h2v2ZM5 11H3V9h2v2Zm13 0h-2V9h2v2ZM9 9H5V7h4v2Zm11 0h-2V7h2v2Zm-5-2H9V5h6v2Z"); // speed-fast
