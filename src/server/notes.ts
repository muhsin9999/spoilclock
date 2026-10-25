// What the grower asked the agent to remember, as one block of text for the agents' prompts.
import "server-only";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { buyer } from "@/lib/buyers";

export async function notesFor(runId: string, loadId?: string) {
  const rows = await db
    .select()
    .from(s.notes)
    .where(and(eq(s.notes.runId, runId), loadId ? or(isNull(s.notes.loadId), eq(s.notes.loadId, loadId)) : isNull(s.notes.loadId)))
    .orderBy(desc(s.notes.createdAt))
    .limit(20);
  if (!rows.length) return "";
  return `The grower asked you to remember:\n${rows.map((n) => `- ${n.buyerId ? `(about ${buyer(n.buyerId)?.name}) ` : ""}${n.text}`).join("\n")}`;
}
