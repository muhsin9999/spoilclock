// What the app chrome shows on every page: the load that needs the grower, and the PayPal connection.
import "server-only";
import { and, asc, count, desc, eq, notInArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { BUYERS, buyer as buyerById } from "@/lib/buyers";
import { clock } from "@/lib/time";
import { ensureRun, runId } from "./run";

export async function chromeData() {
  const run = await runId();
  await ensureRun(run);
  const [open, cards, [{ n }], [last], recent, notes] = await Promise.all([
    db.select().from(s.loads).where(and(eq(s.loads.runId, run), notInArray(s.loads.status, ["captured", "partial", "spoiled"]))).orderBy(s.loads.spoilsAt).limit(1),
    db.select().from(s.buyerCards),
    db.select({ n: count() }).from(s.paypalEvents).where(eq(s.paypalEvents.verified, true)),
    db.select({ at: s.paypalEvents.receivedAt }).from(s.paypalEvents).where(eq(s.paypalEvents.verified, true)).orderBy(desc(s.paypalEvents.receivedAt)).limit(1),
    db.select().from(s.farmMessages).where(eq(s.farmMessages.runId, run)).orderBy(desc(s.farmMessages.createdAt)).limit(300),
    db.select().from(s.notes).where(eq(s.notes.runId, run)).orderBy(asc(s.notes.createdAt)),
  ]);
  return {
    messages: recent.reverse().map((m) => ({ id: m.id, thread: m.thread, at: m.createdAt.toISOString(), kind: m.kind, body: m.body as Record<string, never> })),
    notes: notes.map((x) => ({ id: x.id, text: x.text, about: x.buyerId ? (buyerById(x.buyerId)?.name ?? null) : null })),
    needs: open[0] ?? null,
    sandbox: {
      cards: BUYERS.map((b) => {
        const c = cards.find((x) => x.buyerId === b.id);
        return { buyer: b.name, card: c ? `${c.brand} ····${c.last4}` : "not set up" };
      }),
      verified: n,
      lastEventAt: last ? clock(last.at.getTime()) : null,
    },
  };
}
