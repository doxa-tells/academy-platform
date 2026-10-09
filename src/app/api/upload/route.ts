import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { MAX_UPLOAD_MB } from "@/lib/config";

// Issues short-lived client tokens so the browser uploads straight to Vercel Blob
// (big videos never pass through our server function).
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Нужно войти заново");
        const allowedFolders = user.role === "admin" ? ["homework", "feedback", "lessons", "posts"] : ["homework"];
        if (!allowedFolders.some((f) => pathname.startsWith(`${f}/`))) throw new Error("Недопустимая папка");
        return {
          allowedContentTypes: ["image/*", "video/*", "audio/*"],
          maximumSizeInBytes: MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uid: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Attachments are saved by the form action right after upload; nothing to do here.
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
