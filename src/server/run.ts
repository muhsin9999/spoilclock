// The visitor's run: their private copy of the farm. Created on first visit, kept in a cookie. Each "day" lays
// out the trucks around the current time with one delivery just turned away; earlier loads are kept, so the
// Loads and Money pages show everything this visitor has really done.
import "server-only";
import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { CROPS, isCrop } from "@/lib/crops";
import { SAMPLE_FINDINGS, seedDay, TRUCKS, type RejectionDetails } from "@/lib/demo-day";
import { inspectionReport, tempLog } from "@/lib/sample-files";

const RUN_COOKIE = "sc_run";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const H = 3_600_000;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function runId() {
  const id = (await cookies()).get(RUN_COOKIE)?.value;
  if (!id || !UUID.test(id)) throw new Error("No run cookie; proxy.ts sets it on every app route");
  return id;
}

export async function getRun(id: string) {
  const [run] = await db.select().from(s.runs).where(eq(s.runs.id, id));
  return run;
}

/**
 * Turns one delivery into a rejected load: the load row with its shelf-life clock and floor, the trip marked
 * rejected, and the receiver's paperwork. `files` are uploaded documents; without them, sample paperwork is made.
 */
export async function openRejection(
  tx: Tx,
  run: { id: string; floorShare: number; blocked: string[] },
  trip: { id: string; truckId: string; place: string; startAt: Date; crop: string | null; pallets: number | null },
  found: RejectionDetails,
  rejectedAt: Date,
  files?: { name: string; type: string; text: string | null; data?: string | null; bytes: number }[],
) {
  const truck = TRUCKS.find((t) => t.id === trip.truckId)!;
  const crop = trip.crop && isCrop(trip.crop) ? trip.crop : truck.crop;
  const pallets = trip.pallets ?? truck.pallets;
  const { pricePerPallet, shelfHours } = CROPS[crop];
  const [load] = await tx
    .insert(s.loads)
    .values({
      runId: run.id,
      truckId: trip.truckId,
      crop,
      pallets,
      ...found,
      rejectedBy: trip.place,
      originalCents: pricePerPallet,
      floorCents: Math.round((pricePerPallet * run.floorShare) / 100 / 100) * 100,
      excluded: run.blocked,
      rejectedAt,
      spoilsAt: new Date(rejectedAt.getTime() + shelfHours * H),
    })
    .returning();
  await tx.update(s.trips).set({ kind: "rejected", loadId: load.id }).where(eq(s.trips.id, trip.id));
  if (files?.length) {
    await tx.insert(s.files).values(files.map((f) => ({ loadId: load.id, ...f, sample: false })));
  } else {
    const paper = { truckName: truck.name, crop, pallets, ...found, rejectedBy: trip.place, rejectedAt, shelfHours };
    const report = inspectionReport(paper);
    const log = tempLog(paper, new Date(trip.startAt.getTime() - 3 * H));
    await tx.insert(s.files).values([
      { loadId: load.id, name: "inspection-report.pdf", type: "application/pdf", bytes: report.length, text: report, sample: true },
      { loadId: load.id, name: "temperature-log.csv", type: "text/csv", bytes: log.length, text: log, sample: true },
    ]);
  }
  return load;
}

/** Lays out the day's trucks around now, with that day's scripted rejection. */
async function layOutDay(tx: Tx, run: { id: string; floorShare: number; blocked: string[] }, day: number) {
  const { trips } = seedDay(Date.now(), day);
  const rows = await tx
    .insert(s.trips)
    .values(trips.map((t) => ({ runId: run.id, ...t, kind: t.kind === "rejected" ? "delivery" : t.kind })))
    .returning();
  const trip = rows[trips.findIndex((t) => t.kind === "rejected")];
  await openRejection(tx, run, trip, SAMPLE_FINDINGS[trip.crop ?? "Strawberries"], trip.endAt);
}

/** Lays out a fresh run for this visitor if it doesn't have one yet. Safe to call concurrently: the run and its day
 *  are written in one transaction, so a second request's insert waits for the first to commit and then sees the whole
 *  day. (Inserting the run first let the sidebar and the board race on a first visit, and the board came up empty.) */
export async function ensureRun(id: string) {
  await db.transaction(async (tx) => {
    const created = await tx.insert(s.runs).values({ id, anchor: new Date() }).onConflictDoNothing().returning();
    if (created.length) await layOutDay(tx, created[0], 1);
  });
}

/** "Start a new day": a fresh set of trucks and a new rejection. Earlier loads, deals and payments stay. */
export async function newDay(id: string) {
  const run = await getRun(id);
  if (!run) return ensureRun(id);
  await db.transaction(async (tx) => {
    await tx.delete(s.trips).where(eq(s.trips.runId, id));
    const [next] = await tx.update(s.runs).set({ day: run.day + 1, anchor: new Date() }).where(eq(s.runs.id, id)).returning();
    await layOutDay(tx, next, next.day);
  });
}

/** This visitor's run, laid out first if they arrived on any page before Today. */
export async function currentRun() {
  const id = await runId();
  await ensureRun(id);
  return getRun(id);
}

/** Everything the Today board needs for this visitor. */
export async function getDay() {
  const id = await runId();
  await ensureRun(id);
  const [run, trips, loads] = await Promise.all([
    getRun(id),
    db.select().from(s.trips).where(eq(s.trips.runId, id)).orderBy(asc(s.trips.startAt)),
    db.select().from(s.loads).where(eq(s.loads.runId, id)).orderBy(asc(s.loads.spoilsAt)),
  ]);
  return { run, trips, loads };
}
