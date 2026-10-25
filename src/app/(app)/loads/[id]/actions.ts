"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { chat } from "@/server/ai/chat";
import { claimNegotiation, negotiate, underCap } from "@/server/ai/negotiate";
import { ownsLoad } from "@/server/load";
import { holdPayment } from "@/server/paypal/money";
import { readUpload } from "@/server/uploads";

const Id = z.uuid();

type Result = { ok: true } | { ok: false; error: string };

/** "Find a buyer": the agent starts (or resumes) negotiating in the background; the page watches it live. */
export async function startNegotiation(loadId: string): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  if (!(await underCap())) return { ok: false, error: "The agents are busy with other visitors. Try again in a few minutes." };
  if (!(await claimNegotiation(loadId))) return { ok: false, error: "Your agent is already on it." };
  after(() => negotiate(loadId));
  refresh();
  return { ok: true };
}

const Message = z.object({ text: z.string().trim().max(1000) });

/** A message to the load's agent, with an optional file (inspection report, photo, temperature log). */
export async function sendMessage(loadId: string, form: FormData): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  const parsed = Message.safeParse({ text: form.get("text") ?? "" });
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!parsed.success || (!parsed.data.text && !hasFile)) return { ok: false, error: "Write a message or attach a file (up to 1,000 characters)." };
  if (!(await underCap())) return { ok: false, error: "Your agent is busy right now. Try again in a few minutes." };
  const up = hasFile ? await readUpload(file) : null;
  if (up && "error" in up) return { ok: false, error: up.error };
  try {
    if (up) await db.insert(s.files).values({ loadId, ...up, sample: false });
    const text = parsed.data.text || `I've attached ${up!.name}.`;
    const reopen = await chat(loadId, text, up ? [up.name] : [], up?.data ? [{ type: up.type, data: up.data }] : []);
    if (reopen && (await claimNegotiation(loadId))) after(() => negotiate(loadId));
  } catch (e) {
    console.error("chat failed", e);
    return { ok: false, error: "Your agent couldn't answer just now. Try again." };
  }
  refresh();
  return { ok: true };
}

/** The load's own floor, edited on its page. A floor above an agreed price withdraws that deal. */
export async function setFloor(loadId: string, dollars: number): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  const [load] = await db.select().from(s.loads).where(eq(s.loads.id, loadId));
  const cents = Math.round(dollars) * 100;
  if (!Number.isFinite(dollars) || cents < 100 || cents > load.originalCents * 1.5) return { ok: false, error: "Pick a floor between $1 and 150% of the original price." };
  const [deal] = await db.select().from(s.deals).where(eq(s.deals.loadId, loadId)).orderBy(desc(s.deals.createdAt)).limit(1);
  if (deal && deal.status !== "ready" && deal.status !== "voided") return { ok: false, error: "PayPal is already holding the payment, so the deal is locked." };
  if (cents === load.floorCents) return { ok: true };
  const breaks = deal?.status === "ready" && deal.perPalletCents < cents;
  await db.transaction(async (tx) => {
    await tx.update(s.loads).set({ floorCents: cents, ...(breaks && { status: "reopened" }) }).where(and(eq(s.loads.id, loadId)));
    if (breaks) await tx.delete(s.deals).where(eq(s.deals.id, deal.id));
    await tx.insert(s.messages).values({ loadId, kind: "rule", body: { text: `Floor changed · $${load.floorCents / 100} → $${cents / 100} a pallet` } });
    if (breaks) await tx.insert(s.messages).values({ loadId, kind: "agent", body: { text: `The agreed price is below your new floor, so I've withdrawn that deal and gone back to the buyers.` } });
  });
  if (breaks && (await claimNegotiation(loadId))) after(() => negotiate(loadId));
  refresh();
  return { ok: true };
}

/** "Approve and hold payment": PayPal authorizes the deal on the buyer agent's saved card. */
export async function approveDeal(loadId: string): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  const r = await holdPayment(loadId);
  refresh();
  return r;
}
