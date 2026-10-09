import "server-only";
import { z } from "zod";
import { STORAGE_MODE } from "./config";

export function isAllowedUploadUrl(url: string) {
  if (STORAGE_MODE === "local") return url.startsWith("/api/dev-files/");
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const attachmentSchema = z.object({
  url: z.string().min(1).max(2000),
  kind: z.enum(["image", "video", "audio", "file"]),
  contentType: z.string().max(200).default(""),
  size: z.number().int().nonnegative().default(0),
  name: z.string().max(300).default(""),
});

export type AttachmentInput = z.infer<typeof attachmentSchema>;

export function parseAttachments(raw: FormDataEntryValue | null): AttachmentInput[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = z.array(attachmentSchema).max(20).safeParse(data);
  if (!parsed.success) return [];
  return parsed.data.filter((a) => isAllowedUploadUrl(a.url));
}
