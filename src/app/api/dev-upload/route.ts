import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { STORAGE_MODE } from "@/lib/config";

// Local-development replacement for Vercel Blob.
export async function POST(req: NextRequest) {
  if (STORAGE_MODE !== "local") return NextResponse.json({ error: "disabled" }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  const pathname = String(form.get("pathname") || file.name).replace(/[^a-zA-Z0-9/._-]/g, "_").replace(/\.\./g, "");
  const dir = path.join(process.cwd(), ".data", "uploads");
  const name = `${randomBytes(6).toString("hex")}-${pathname.replace(/\//g, "_")}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  // Remember the content type next to the file
  await writeFile(path.join(dir, `${name}.type`), file.type || "application/octet-stream");
  return NextResponse.json({ url: `/api/dev-files/${name}` });
}
