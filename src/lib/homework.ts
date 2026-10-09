import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import type { AttachmentView } from "@/components/attachments";
import type { Entry } from "./db/schema";

export type ThreadEntry = {
  entry: Entry;
  author: { id: string; name: string; role: "admin" | "student" };
  attachments: AttachmentView[];
};

export async function getThread(submissionId: string): Promise<ThreadEntry[]> {
  const rows = await db
    .select({ entry: schema.entries, author: { id: schema.users.id, name: schema.users.name, role: schema.users.role } })
    .from(schema.entries)
    .innerJoin(schema.users, eq(schema.users.id, schema.entries.authorId))
    .where(eq(schema.entries.submissionId, submissionId))
    .orderBy(asc(schema.entries.createdAt));
  if (rows.length === 0) return [];
  const atts = await db
    .select()
    .from(schema.attachments)
    .where(
      inArray(
        schema.attachments.entryId,
        rows.map((r) => r.entry.id),
      ),
    )
    .orderBy(asc(schema.attachments.createdAt));
  return rows.map((r) => ({
    entry: r.entry,
    author: r.author,
    attachments: atts
      .filter((a) => a.entryId === r.entry.id)
      .map((a) => ({ id: a.id, kind: a.kind, url: a.url, name: a.name, annotation: a.annotation ?? null })),
  }));
}
