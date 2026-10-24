// The visitor's run: their private copy of the farm's day. Created on first visit, kept in a cookie.
import "server-only";
import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { seedDay } from "@/lib/demo-day";
import { inspectionReport, tempLog } from "@/lib/sample-files";

const RUN_COOKIE = "sc_run";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function runId() {
  const id = (await cookies()).get(RUN_COOKIE)?.value;
  if (!id || !UUID.test(id)) throw new Error("No run cookie; proxy.ts sets it on every app route");
  return id;
}

/** Lays out a fresh day for this run if it doesn't have one yet. Safe to call concurrently. */
export async function ensureRun(id: string) {
  const anchor = Date.now();
  const created = await db.insert(schema.runs).values({ id, anchor: new Date(anchor) }).onConflictDoNothing().returning({ id: schema.runs.id });
  if (created.length === 0) return;
  const day = seedDay(anchor);
  await db.transaction(async (tx) => {
    const [load] = await tx.insert(schema.loads).values({ runId: id, ...day.load }).returning();
    await tx.insert(schema.trips).values(day.trips.map((t) => ({ runId: id, ...t, loadId: t.kind === "rejected" ? load.id : null })));
    const pickup = day.trips.find((t) => t.truckId === load.truckId && t.kind === "pickup")!;
    const report = inspectionReport(load);
    const log = tempLog(load, pickup.startAt);
    await tx.insert(schema.files).values([
      { loadId: load.id, name: "inspection-report.pdf", type: "application/pdf", bytes: report.length, text: report, sample: true },
      { loadId: load.id, name: "temperature-log.csv", type: "text/csv", bytes: log.length, text: log, sample: true },
    ]);
  });
}

/** Everything the Today board needs for this visitor. */
export async function getDay() {
  const id = await runId();
  await ensureRun(id);
  const [trips, loads] = await Promise.all([
    db.select().from(schema.trips).where(eq(schema.trips.runId, id)).orderBy(asc(schema.trips.startAt)),
    db.select().from(schema.loads).where(eq(schema.loads.runId, id)),
  ]);
  return { runId: id, trips, loads };
}

/** Starts the visitor's day over: a new rejected load, a fresh negotiation. */
export async function resetRun(id: string) {
  await db.delete(schema.runs).where(eq(schema.runs.id, id));
  await ensureRun(id);
}
