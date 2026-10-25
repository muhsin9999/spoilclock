"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { BUYERS } from "@/lib/buyers";
import { currentRun, runId } from "@/server/run";

const Rules = z.object({ floorShare: z.coerce.number().int().min(50).max(100) });

/** The farm's standing floor, as a share of what the original buyer was paying. Applies to new rejections. */
export async function saveFloorShare(form: FormData) {
  const parsed = Rules.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false as const, error: "Pick a floor between 50% and 100%." };
  await db.update(s.runs).set({ floorShare: parsed.data.floorShare }).where(eq(s.runs.id, await runId()));
  refresh();
  return { ok: true as const };
}

/** Never (or again) sell to this buyer. Applies to new rejections; open loads keep their own rules. */
export async function setBlocked(buyerId: string, blocked: boolean) {
  if (!BUYERS.some((b) => b.id === buyerId)) return { ok: false as const, error: "Unknown buyer." };
  const run = await currentRun();
  const id = run.id;
  const next = blocked ? [...new Set([...run.blocked, buyerId])] : run.blocked.filter((b) => b !== buyerId);
  await db.update(s.runs).set({ blocked: next }).where(eq(s.runs.id, id));
  refresh();
  return { ok: true as const };
}
