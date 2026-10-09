"use client";

import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_MB, STORAGE_MODE } from "./config";

export type UploadKind = "image" | "video" | "audio" | "file";

export type Uploaded = {
  url: string;
  kind: UploadKind;
  contentType: string;
  size: number;
  name: string;
};

export function kindOf(type: string): UploadKind {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

/** Downscale big photos in the browser before upload (phone photos are often 5–12 MB). */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const MAX_SIDE = 2400;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // e.g. HEIC in a browser that can't decode it — upload as is
  }
}

function safeName(name: string) {
  const ext = (name.match(/\.[a-z0-9]{1,6}$/i)?.[0] || "").toLowerCase();
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "file"}${ext}`;
}

export async function uploadFile(
  original: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<Uploaded> {
  const file = await compressImage(original);
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`Файл «${original.name}» больше ${MAX_UPLOAD_MB} МБ. Сожми видео или сними покороче.`);
  }
  const contentType = file.type || "application/octet-stream";
  const pathname = `${folder}/${Date.now()}-${safeName(file.name)}`;

  let url: string;
  if (STORAGE_MODE === "local") {
    url = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      form.append("pathname", pathname);
      xhr.open("POST", "/api/dev-upload");
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).url);
        else reject(new Error("Не удалось загрузить файл"));
      };
      xhr.onerror = () => reject(new Error("Нет соединения. Проверь интернет и попробуй ещё раз."));
      xhr.send(form);
    });
  } else {
    const res = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType,
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
    });
    url = res.url;
  }
  onProgress?.(100);
  return { url, kind: kindOf(contentType), contentType, size: file.size, name: original.name };
}
