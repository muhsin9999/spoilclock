// Runs one real negotiation on a fresh throwaway run in the DEV database and prints what happened.
// npx tsx --conditions=react-server --env-file=.env.local scripts/spikes/negotiate-once.ts
import { eq, asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { ensureRun } from "@/server/run";
import { claimNegotiation, negotiate } from "@/server/ai/negotiate";

if (process.env.DATABASE_URL === process.env.DATABASE_URL_PROD) throw new Error("refusing to run against the live database");
const runId = crypto.randomUUID();
await ensureRun(runId);
const [load] = await db.select().from(s.loads).where(eq(s.loads.runId, runId));
const t0 = Date.now();
console.log("claimed", await claimNegotiation(load.id));
await negotiate(load.id);
const offers = await db.select().from(s.offers).where(eq(s.offers.loadId, load.id)).orderBy(asc(s.offers.round), asc(s.offers.createdAt));
for (const o of offers) console.log(`R${o.round} ${o.by.padEnd(8)} $${o.perPalletCents / 100} x${o.pallets}  ${o.message}`);
for (const st of await db.select().from(s.buyerStates).where(eq(s.buyerStates.loadId, load.id))) console.log("state", st.buyerId, st.status, "-", st.note);
for (const m of await db.select().from(s.messages).where(eq(s.messages.loadId, load.id)).orderBy(asc(s.messages.createdAt))) console.log("msg", m.kind, JSON.stringify(m.body));
const [l] = await db.select().from(s.loads).where(eq(s.loads.id, load.id));
const deal = await db.select().from(s.deals).where(eq(s.deals.loadId, load.id));
const calls = await db.select().from(s.aiCalls).where(eq(s.aiCalls.loadId, load.id));
console.log("status", l.status, "deal", deal[0] && `${deal[0].buyerId} $${deal[0].perPalletCents / 100}`);
console.log(`calls ${calls.length} · in ${calls.reduce((a, c) => a + c.inputTokens, 0)} · out ${calls.reduce((a, c) => a + c.outputTokens, 0)} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await db.delete(s.runs).where(eq(s.runs.id, runId));
process.exit(0);
