"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { TRUCKS } from "@/lib/demo-day";
import { readFindings } from "@/server/ai/inspect";
import { underCap } from "@/server/ai/negotiate";
import { getRun, newDay, openRejection, runId } from "@/server/run";
import { readUpload } from "@/server/uploads";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const H = 3_600_000;

async function ownTrip(tripId: string) {
  if (!z.uuid().safeParse(tripId).success) return null;
  const run = await runId();
  const [trip] = await db.select().from(s.trips).where(and(eq(s.trips.id, tripId), eq(s.trips.runId, run)));
  return trip ?? null;
}

/** Step 1 of "Report a rejection": the AI reads the receiver's paperwork so the grower can check what it found. */
export async function readReport(form: FormData): Promise<Result<{ findings: { reason: string; grade: string; softPct: number; pulpF: number } }>> {
  const trip = await ownTrip(String(form.get("tripId")));
  if (!trip || trip.kind !== "delivery") return { ok: false, error: "Only a delivery can be rejected." };
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Attach the inspection report or a photo of it." };
  const up = await readUpload(file);
  if ("error" in up) return { ok: false, error: up.error };
  if (!(await underCap())) return { ok: false, error: "The AI is busy right now. Fill the details in yourself." };
  try {
    const f = await readFindings(up, trip.crop ?? "produce");
    if (!f?.is_rejection_document) return { ok: false, error: "That doesn't look like an inspection report or rejection notice. Fill the details in yourself." };
    return { ok: true, findings: { reason: f.reason, grade: f.grade, softPct: Math.round(f.soft_pct), pulpF: Math.round(f.pulp_f) } };
  } catch (e) {
    console.error("readFindings failed", e);
    return { ok: false, error: "The AI couldn't read it just now. Fill the details in yourself." };
  }
}

const Rejection = z.object({
  tripId: z.uuid(),
  reason: z.string().trim().min(2).max(120),
  grade: z.string().trim().min(1).max(40),
  softPct: z.coerce.number().int().min(0).max(100),
  pulpF: z.coerce.number().int().min(20).max(90),
});

/** Step 2: the delivery is turned away. A rescue opens with the shelf-life clock running from now. */
export async function reportRejection(form: FormData): Promise<Result<{ loadId: string }>> {
  const parsed = Rejection.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: "Check the details: reason, grade, % soft and pulp temperature." };
  const trip = await ownTrip(parsed.data.tripId);
  if (!trip || trip.kind !== "delivery") return { ok: false, error: "Only a delivery can be rejected." };
  const file = form.get("file");
  const up = file instanceof File && file.size > 0 ? await readUpload(file) : null;
  if (up && "error" in up) return { ok: false, error: up.error };
  const run = await getRun(trip.runId);
  const now = new Date();
  const found = { reason: parsed.data.reason, grade: parsed.data.grade, softPct: parsed.data.softPct, pulpF: parsed.data.pulpF };
  const load = await db.transaction(async (tx) => {
    // The truck is at the receiver's dock now: its delivery ends here.
    await tx.update(s.trips).set({ endAt: now, startAt: trip.startAt < now ? trip.startAt : new Date(now.getTime() - H) }).where(eq(s.trips.id, trip.id));
    return openRejection(tx, run, { ...trip, startAt: trip.startAt < now ? trip.startAt : new Date(now.getTime() - H) }, found, now, up ? [up] : undefined);
  });
  await db.insert(s.messages).values({ loadId: load.id, kind: "rule", body: { text: `Rejected at ${trip.place} · reported by you${up ? ` with ${up.name}` : ""}` } });
  refresh();
  return { ok: true, loadId: load.id };
}

const Delivery = z.object({
  truckId: z.enum(TRUCKS.map((t) => t.id) as [string, ...string[]]),
  place: z.string().trim().min(2).max(60),
  startIn: z.coerce.number().min(-6).max(10),
  hours: z.coerce.number().min(1).max(8),
});

/** "New delivery": put a truck's next delivery on the board. */
export async function addDelivery(form: FormData): Promise<Result> {
  const parsed = Delivery.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: "Pick a truck, a receiver and a time." };
  const run = await runId();
  const t = TRUCKS.find((x) => x.id === parsed.data.truckId)!;
  const start = Math.round((Date.now() + parsed.data.startIn * H) / (15 * 60_000)) * 15 * 60_000;
  await db.insert(s.trips).values({ runId: run, truckId: t.id, kind: "delivery", place: parsed.data.place, startAt: new Date(start), endAt: new Date(start + parsed.data.hours * H), crop: t.crop, pallets: t.pallets });
  refresh();
  return { ok: true };
}

/** "Start a new day": fresh trucks and a new rejection; everything done so far stays on Loads and Money. */
export async function startNewDay(): Promise<Result> {
  await newDay(await runId());
  refresh();
  return { ok: true };
}
