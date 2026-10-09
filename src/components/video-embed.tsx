import { PlayCircle } from "lucide-react";

type Embed = { type: "iframe"; src: string } | { type: "video"; src: string } | null;

export function parseVideoUrl(raw: string): Embed {
  const url = raw.trim();
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (host.endsWith("youtube.com")) {
    let id = u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    if (!id && m) id = m[1];
    return id ? { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (host.endsWith("vimeo.com")) {
    const m = u.pathname.match(/\/(\d+)(?:\/([a-z0-9]+))?/i);
    if (!m) return null;
    const hash = m[2] || u.searchParams.get("h");
    return { type: "iframe", src: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ""}` };
  }
  if (host.endsWith("loom.com")) {
    const m = u.pathname.match(/\/(?:share|embed)\/([a-z0-9]+)/i);
    return m ? { type: "iframe", src: `https://www.loom.com/embed/${m[1]}` } : null;
  }
  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] || u.searchParams.get("id");
    return id ? { type: "iframe", src: `https://drive.google.com/file/d/${id}/preview` } : null;
  }
  if (host.endsWith("rutube.ru")) {
    const m = u.pathname.match(/\/(?:video|play\/embed)\/([a-z0-9]+)/i);
    return m ? { type: "iframe", src: `https://rutube.ru/play/embed/${m[1]}` } : null;
  }
  if (host.endsWith("kinescope.io")) {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? { type: "iframe", src: `https://kinescope.io/embed/${id}` } : null;
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname) || host.endsWith("blob.vercel-storage.com")) {
    return { type: "video", src: url };
  }
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = parseVideoUrl(url);
  if (!embed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface text-muted">
        <PlayCircle className="size-10" aria-hidden />
        <p className="px-6 text-center text-sm">{url ? "Не получилось встроить это видео" : "Видео скоро появится"}</p>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-cobalt underline">
            Открыть по ссылке
          </a>
        ) : null}
      </div>
    );
  }
  if (embed.type === "video") {
    return (
      <video
        src={embed.src}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-[var(--radius-card)] bg-black"
      />
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-card)] bg-black">
      <iframe
        src={embed.src}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
