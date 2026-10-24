// The load's chat. The grower talks to their agent in plain words; the agent answers and may change the
// rules it negotiates by (the floor, which buyers are allowed). Code checks every change before it stands,
// and a change that breaks the agreed deal sends the agent back to the table.
import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { BUYERS, buyer as buyerById } from "@/lib/buyers";
import { timeLeft } from "@/lib/freshness";
import { MODEL, openai } from "./client";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const Reply = z.object({
  reply: z.string().describe("Your answer to the grower: 1–3 short sentences, plain words"),
  new_floor_per_pallet: z.number().nullable().describe("A new floor price per pallet in whole dollars, only if the grower asked to change it, else null"),
  exclude_buyers: z.array(z.string()).describe("Buyer ids the grower wants ruled out, else empty"),
  include_buyers: z.array(z.string()).describe("Buyer ids the grower wants allowed back in, else empty"),
});

const INSTRUCTIONS = `You are the grower's sales agent at Salinas Ridge Farms, talking with the grower about one rejected truckload you are selling.
- Answer from the facts given. If you don't know, say so.
- You can change two rules when the grower asks: the floor price per pallet, and which buyers are allowed. Only change them when the grower clearly asks.
- Buyer ids: ${BUYERS.map((b) => `${b.id} = ${b.name}`).join(", ")}.
- Once PayPal is holding the payment, the deal is locked: say so if asked to change it.
- Short, calm, plain words. No emoji.`;

/** Handles one message from the grower. Returns true if the agent should (re)start negotiating. */
export async function chat(loadId: string, text: string, fileNames: string[]) {
  const [load] = await db.select().from(s.loads).where(eq(s.loads.id, loadId));
  if (!load) throw new Error("load not found");
  await db.insert(s.messages).values({ loadId, kind: "user", body: { text, files: fileNames } });

  const [files, offers, states, deals, recent] = await Promise.all([
    db.select({ name: s.files.name, text: s.files.text }).from(s.files).where(eq(s.files.loadId, loadId)),
    db.select().from(s.offers).where(eq(s.offers.loadId, loadId)).orderBy(asc(s.offers.round)),
    db.select().from(s.buyerStates).where(eq(s.buyerStates.loadId, loadId)),
    db.select().from(s.deals).where(eq(s.deals.loadId, loadId)),
    db.select().from(s.messages).where(eq(s.messages.loadId, loadId)).orderBy(desc(s.messages.createdAt)).limit(12),
  ]);
  const deal = deals[0];
  const locked = !!deal && deal.status !== "ready";
  const context = [
    `Load: ${load.pallets} pallets of ${load.crop}, ${load.grade}, ${load.softPct}% soft, ${load.pulpF}°F. Rejected by ${load.rejectedBy} (${load.reason}); they were paying ${usd(load.originalCents)} a pallet.`,
    `Floor: ${usd(load.floorCents)} a pallet. Ruled out: ${load.excluded.map((id) => buyerById(id)?.name ?? id).join(", ") || "nobody"}. Shelf life left: ${timeLeft(load.spoilsAt.getTime() - Date.now())}. Status: ${load.status}.`,
    `Buyers: ${BUYERS.map((b) => {
      const st = states.find((x) => x.buyerId === b.id);
      const last = offers.filter((o) => o.by === b.id).at(-1);
      return `${b.name} (${b.kind})${last ? ` last bid ${usd(last.perPalletCents)}` : ""}${st ? `, ${st.status}${st.note ? `: ${st.note}` : ""}` : ""}`;
    }).join("; ")}.`,
    deal ? `Deal: ${buyerById(deal.buyerId)?.name} at ${usd(deal.perPalletCents)} a pallet, ${deal.status === "ready" ? "waiting for the grower's approval" : `payment ${deal.status}`}.` : "No deal yet.",
    `Files: ${files.map((f) => `\n--- ${f.name}${fileNames.includes(f.name) ? " (just attached)" : ""} ---\n${(f.text ?? "(no text)").slice(0, 4000)}`).join("")}`,
    `Recent chat (newest last):\n${recent
      .reverse()
      .map((m) => `${m.kind}: ${(m.body as { text?: string }).text ?? ""}`)
      .join("\n")}`,
  ].join("\n");

  const started = Date.now();
  const res = await openai().responses.parse({ model: MODEL, instructions: INSTRUCTIONS, input: `${context}\n\nThe grower says: "${text}"`, reasoning: { effort: "low" }, text: { format: zodTextFormat(Reply, "reply") } });
  await db.insert(s.aiCalls).values({ loadId, agent: "chat", model: MODEL, inputTokens: res.usage?.input_tokens ?? 0, outputTokens: res.usage?.output_tokens ?? 0, ms: Date.now() - started });
  const r = res.output_parsed;
  if (!r) throw new Error("chat returned no answer");

  // Code decides which rule changes stand.
  const rules: string[] = [];
  let floor = load.floorCents;
  let excluded = [...load.excluded];
  if (!locked) {
    if (r.new_floor_per_pallet !== null && r.new_floor_per_pallet > 0 && r.new_floor_per_pallet * 100 <= load.originalCents * 1.5) {
      const next = Math.round(r.new_floor_per_pallet) * 100;
      if (next !== floor) rules.push(`Floor changed · ${usd(floor)} → ${usd(next)} a pallet`);
      floor = next;
    }
    for (const id of r.exclude_buyers) if (buyerById(id) && !excluded.includes(id)) (excluded = [...excluded, id]), rules.push(`Rule changed · ${buyerById(id)!.name} excluded`);
    for (const id of r.include_buyers) if (excluded.includes(id)) (excluded = excluded.filter((x) => x !== id)), rules.push(`Rule changed · ${buyerById(id)!.name} allowed again`);
  }

  // A ready deal that no longer fits the rules is withdrawn and the agent goes back to the table.
  const breaksDeal = !!deal && deal.status === "ready" && (excluded.includes(deal.buyerId) || deal.perPalletCents < floor);
  await db.transaction(async (tx) => {
    if (rules.length) await tx.update(s.loads).set({ floorCents: floor, excluded, ...(breaksDeal && { status: "reopened" }) }).where(eq(s.loads.id, loadId));
    if (breaksDeal) await tx.delete(s.deals).where(eq(s.deals.loadId, loadId));
    for (const rule of rules) await tx.insert(s.messages).values({ loadId, kind: "rule", body: { text: rule } });
    await tx.insert(s.messages).values({ loadId, kind: "agent", body: { text: r.reply } });
  });
  return breaksDeal;
}
