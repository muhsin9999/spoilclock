// Everything this visitor's run has really done: loads, deals, PayPal steps. Read by Loads, Buyers and Money.
import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { currentRun } from "./run";

export async function history() {
  const { id: run } = await currentRun();
  const loads = await db.select().from(s.loads).where(eq(s.loads.runId, run)).orderBy(desc(s.loads.rejectedAt));
  const ids = loads.map((l) => l.id);
  const deals = ids.length ? await db.select().from(s.deals).where(inArray(s.deals.loadId, ids)) : [];
  const dealIds = deals.map((d) => d.id);
  const events = dealIds.length ? await db.select().from(s.paypalEvents).where(and(inArray(s.paypalEvents.dealId, dealIds), eq(s.paypalEvents.verified, true))).orderBy(desc(s.paypalEvents.receivedAt)) : [];
  return { loads, deals, events };
}

/** The status a load is really in, including "spoiled" once its clock runs out unsold. */
export function loadState(l: { status: string; spoilsAt: Date }, now = Date.now()) {
  const sold = l.status === "captured" || l.status === "partial";
  if (!sold && l.status !== "held" && l.spoilsAt.getTime() <= now) return "spoiled";
  return l.status;
}
