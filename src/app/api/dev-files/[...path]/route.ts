import { type NextRequest } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { STORAGE_MODE } from "@/lib/config";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (STORAGE_MODE !== "local") return new Response("Not found", { status: 404 });
  const { path: parts } = await params;
  const name = path.basename(parts.join("/"));
  const file = path.join(process.cwd(), ".data", "uploads", name);
  try {
    const info = await stat(file);
    const type = await readFile(`${file}.type`, "utf8").catch(() => "application/octet-stream");
    const data = await readFile(file);
    const range = req.headers.get("range");
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m?.[1] ? Number(m[1]) : 0;
      const end = m?.[2] ? Number(m[2]) : info.size - 1;
      return new Response(data.subarray(start, end + 1), {
        status: 206,
        headers: {
          "content-type": type,
          "content-range": `bytes ${start}-${end}/${info.size}`,
          "accept-ranges": "bytes",
          "content-length": String(end - start + 1),
        },
      });
    }
    return new Response(data, {
      headers: { "content-type": type, "content-length": String(info.size), "accept-ranges": "bytes" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
