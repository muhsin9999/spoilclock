// Reads one load with everything its page shows. Only the visitor's own run's loads are visible.
import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { runId } from "./run";

export async function getLoad(loadId: string) {
  const run = await runId();
  const [load] = await db.select().from(s.loads).where(and(eq(s.loads.id, loadId), eq(s.loads.runId, run)));
  if (!load) return null;
  const [offers, states, deals, messages, files] = await Promise.all([
    db.select().from(s.offers).where(eq(s.offers.loadId, loadId)).orderBy(asc(s.offers.round), asc(s.offers.createdAt)),
    db.select().from(s.buyerStates).where(eq(s.buyerStates.loadId, loadId)),
    db.select().from(s.deals).where(eq(s.deals.loadId, loadId)),
    db.select().from(s.messages).where(eq(s.messages.loadId, loadId)).orderBy(asc(s.messages.createdAt)),
    db.select({ id: s.files.id, name: s.files.name, type: s.files.type, sample: s.files.sample }).from(s.files).where(eq(s.files.loadId, loadId)).orderBy(asc(s.files.createdAt)),
  ]);
  return { load, offers, states, deal: deals[0] ?? null, messages, files };
}

export type LoadView = NonNullable<Awaited<ReturnType<typeof getLoad>>>;

/** True if this load belongs to the visitor's run. */
export async function ownsLoad(loadId: string) {
  const run = await runId();
  const [row] = await db.select({ id: s.loads.id }).from(s.loads).where(and(eq(s.loads.id, loadId), eq(s.loads.runId, run)));
  return !!row;
}
