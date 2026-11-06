// "Ask your agent": the farm-wide conversation, on every page. The agent answers from this visitor's own records
// (loads, offers, deals, PayPal steps, rules, notes), files attachments to the right load, remembers what the
// grower tells it, and can take safe actions. Anything that moves money still needs the grower's Approve button.
import "server-only";
import { after } from "next/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { BUYERS, buyer as buyerById } from "@/lib/buyers";
import { TRUCKS } from "@/lib/demo-day";
import { timeLeft } from "@/lib/freshness";
import { clock, day } from "@/lib/time";
import type { Upload } from "@/server/uploads";
import { loadState } from "@/server/history";
import { runAgent, type AgentStep, type AgentTool } from "./agent";
import { MODEL, openai } from "./client";
import { claimNegotiation, negotiate } from "./negotiate";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const truckName = (id: string) => TRUCKS.find((t) => t.id === id)?.name ?? id;

const Answer = z.object({
  answer: z.string().describe("Your reply to the grower: short, plain words, from what the tools returned"),
  links: z.array(z.object({ label: z.string(), load_id: z.string() })).describe("Loads worth opening, by id from the tools; empty if none"),
});

const INSTRUCTIONS = `You are the sales agent for Salinas Ridge Farms (a fictional farm on the PayPal sandbox). The grower talks to you from any page of the app.
- Answer only the grower's latest message; the conversation so far is context, don't repeat earlier answers.
- Answer only from what your tools return. If you don't know, say so. Never invent loads, prices or payments.
- "What did we do", "what happened" and similar: use recent_activity.
- When the grower tells you something worth keeping ("Bargain Fresh pays late", "never go under $160 for berries"), save it with remember. Use buyer ids: ${BUYERS.map((b) => `${b.id} = ${b.name}`).join(", ")}.
- If a file is attached, read what it says (you're given its text or the image). Before filing it with file_attachment, check it's about that load: the same truck and crop. If it names a different truck or crop, don't file it; say what it's about and offer the matching load instead.
- You may start a negotiation (find_buyer) or change the farm's standing rules (set_rules) when the grower asks. You cannot approve deals or move money: point the grower to the load's Approve button.
- Never write ids in your answer; refer to loads by truck and crop, and put the load in links instead.
- Short, calm, plain words. No emoji.`;

type Ctx = { runId: string; upload: Upload | null; filedTo: string | null; actions: string[] };

function tools(ctx: Ctx): AgentTool[] {
  // A load by its id, or by its truck ("Truck 14", "14", "t14"): that truck's latest load on this farm.
  const ownLoad = async (ref: string) => {
    const r = (ref ?? "").trim();
    if (UUID.test(r)) return (await db.select().from(s.loads).where(and(eq(s.loads.runId, ctx.runId), eq(s.loads.id, r))))[0];
    const num = r.match(/\d+/)?.[0];
    const truck = TRUCKS.find((t) => t.id === r.toLowerCase() || (num && t.name.endsWith(num.padStart(2, "0"))));
    if (!truck) return undefined;
    return (await db.select().from(s.loads).where(and(eq(s.loads.runId, ctx.runId), eq(s.loads.truckId, truck.id))).orderBy(desc(s.loads.rejectedAt)).limit(1))[0];
  };
  return [
    {
      name: "list_loads",
      description: "Every load this farm has had rejected, newest first: truck, crop, state, time left, and any deal.",
      run: async () => {
        const loads = await db.select().from(s.loads).where(eq(s.loads.runId, ctx.runId)).orderBy(desc(s.loads.rejectedAt));
        const deals = loads.length ? await db.select().from(s.deals).where(inArray(s.deals.loadId, loads.map((l) => l.id))).orderBy(desc(s.deals.createdAt)) : [];
        return loads.map((l) => {
          const d = deals.find((x) => x.loadId === l.id);
          return {
            load_id: l.id,
            truck: truckName(l.truckId),
            crop: l.crop,
            pallets: l.pallets,
            rejected_by: l.rejectedBy,
            rejected: `${day(l.rejectedAt.getTime())} ${clock(l.rejectedAt.getTime())}`,
            state: loadState(l),
            time_left: timeLeft(l.spoilsAt.getTime() - Date.now()),
            deal: d ? `${buyerById(d.buyerId)?.name} at ${usd(d.perPalletCents)} a pallet, ${d.status}` : null,
          };
        });
      },
      label: () => "Looked at your loads",
      detail: (out: unknown) => `${(out as unknown[]).length} loads`,
    },
    {
      name: "get_load",
      description: "One load in detail: facts, floor, every round of offers, where each buyer stands, the deal and its money.",
      parameters: { load_id: { type: "string" as const, description: "The load_id from list_loads, or the truck, e.g. Truck 14" } },
      run: async ({ load_id }: Record<string, string>) => {
        const l = await ownLoad(load_id);
        if (!l) return { error: "not_found", message: "No such load on this farm" };
        const [offers, states, deals, files] = await Promise.all([
          db.select().from(s.offers).where(eq(s.offers.loadId, l.id)).orderBy(asc(s.offers.round)),
          db.select().from(s.buyerStates).where(eq(s.buyerStates.loadId, l.id)),
          db.select().from(s.deals).where(eq(s.deals.loadId, l.id)).orderBy(desc(s.deals.createdAt)),
          db.select({ name: s.files.name }).from(s.files).where(eq(s.files.loadId, l.id)),
        ]);
        return {
          truck: truckName(l.truckId),
          crop: l.crop,
          pallets: l.pallets,
          grade: l.grade,
          soft_pct: l.softPct,
          pulp_f: l.pulpF,
          rejected_by: l.rejectedBy,
          reason: l.reason,
          was_paying: usd(l.originalCents),
          floor: usd(l.floorCents),
          state: loadState(l),
          time_left: timeLeft(l.spoilsAt.getTime() - Date.now()),
          rounds: offers.map((o) => `R${o.round} ${o.by === "seller" ? "you ask" : buyerById(o.by)?.name} ${usd(o.perPalletCents)}${o.pallets < l.pallets ? ` for ${o.pallets}` : ""}`),
          buyers: states.map((st) => `${buyerById(st.buyerId)?.name}: ${st.status}${st.note ? ` (${st.note})` : ""}`),
          deals: deals.map((d) => ({ buyer: buyerById(d.buyerId)?.name, per_pallet: usd(d.perPalletCents), total: usd(d.perPalletCents * d.pallets), status: d.status, captured: d.capturedCents ? usd(d.capturedCents) : null })),
          files: files.map((f) => f.name),
        };
      },
      label: () => "Opened a load",
      detail: (out: unknown) => (out as { truck?: string }).truck,
    },
    {
      name: "recent_activity",
      description: "What happened lately across the farm, newest first: rejections, negotiations, deals, PayPal holds, captures and voids, rule changes, notes.",
      run: async () => {
        const loads = await db.select().from(s.loads).where(eq(s.loads.runId, ctx.runId));
        const ids = loads.map((l) => l.id);
        const name = (id: string) => {
          const l = loads.find((x) => x.id === id);
          return l ? `${truckName(l.truckId)} (${l.crop})` : "a load";
        };
        const [lines, deals, notes] = await Promise.all([
          ids.length ? db.select().from(s.messages).where(and(inArray(s.messages.loadId, ids), inArray(s.messages.kind, ["rule", "agent"]))).orderBy(desc(s.messages.createdAt)).limit(25) : [],
          ids.length ? db.select().from(s.deals).where(inArray(s.deals.loadId, ids)) : [],
          db.select().from(s.notes).where(eq(s.notes.runId, ctx.runId)),
        ]);
        const events: { at: Date; what: string }[] = [
          ...loads.map((l) => ({ at: l.rejectedAt, what: `${name(l.id)} rejected by ${l.rejectedBy} (${l.reason.toLowerCase()})` })),
          ...deals.filter((d) => d.approvedAt).map((d) => ({ at: d.approvedAt!, what: `${name(d.loadId)}: you approved ${buyerById(d.buyerId)?.name} at ${usd(d.perPalletCents)} a pallet; PayPal held ${usd(d.perPalletCents * d.pallets)}` })),
          ...deals.filter((d) => d.settledAt).map((d) => ({ at: d.settledAt!, what: `${name(d.loadId)}: ${d.status === "voided" ? "rejected at the new dock, PayPal released the hold" : `PayPal paid ${usd(d.capturedCents ?? 0)}`}` })),
          ...lines.map((m) => ({ at: m.createdAt, what: `${name(m.loadId)}: ${(m.body as { text?: string }).text}` })),
          ...notes.map((n) => ({ at: n.createdAt, what: `You asked me to remember: ${n.text}` })),
        ];
        return events
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .slice(0, 25)
          .map((e) => `${day(e.at.getTime())} ${clock(e.at.getTime())} · ${e.what}`);
      },
      label: () => "Checked what happened lately",
    },
    {
      name: "money",
      description: "Every PayPal step on this farm's deals: holds, captures, releases, and whether PayPal's signed webhook confirmed each.",
      run: async () => {
        const loads = await db.select().from(s.loads).where(eq(s.loads.runId, ctx.runId));
        if (!loads.length) return [];
        const deals = await db.select().from(s.deals).where(inArray(s.deals.loadId, loads.map((l) => l.id)));
        const events = deals.length ? await db.select().from(s.paypalEvents).where(and(inArray(s.paypalEvents.dealId, deals.map((d) => d.id)), eq(s.paypalEvents.verified, true))) : [];
        return deals.map((d) => ({
          load: `${truckName(loads.find((l) => l.id === d.loadId)!.truckId)} (${loads.find((l) => l.id === d.loadId)!.crop})`,
          buyer: buyerById(d.buyerId)?.name,
          held: d.approvedAt ? usd(d.perPalletCents * d.pallets) : null,
          status: d.status,
          captured: d.capturedCents ? usd(d.capturedCents) : null,
          confirmed_by_paypal: events.filter((e) => e.dealId === d.id).map((e) => e.type),
        }));
      },
      label: () => "Checked the money",
    },
    {
      name: "get_rules",
      description: "The farm's standing rules and everything you've been asked to remember.",
      run: async () => {
        const [run] = await db.select().from(s.runs).where(eq(s.runs.id, ctx.runId));
        const ns = await db.select().from(s.notes).where(eq(s.notes.runId, ctx.runId)).orderBy(desc(s.notes.createdAt));
        return { floor_share_pct: run.floorShare, blocked: run.blocked.map((b) => buyerById(b)?.name), notes: ns.map((n) => n.text) };
      },
      label: () => "Read the farm's rules and notes",
    },
    {
      name: "remember",
      description: "Save a fact the grower wants you to keep. buyer_id if it's about one buyer, else empty. load_id if it's about one load, else empty.",
      parameters: { text: { type: "string" as const }, buyer_id: { type: "string" as const }, load_id: { type: "string" as const } },
      run: async ({ text, buyer_id, load_id }: Record<string, string>) => {
        const t = text.trim().slice(0, 300);
        if (!t) return { error: "empty", message: "Nothing to remember" };
        const buyerId = buyerById(buyer_id) ? buyer_id : null;
        const loadId = load_id && (await ownLoad(load_id)) ? load_id : null;
        await db.insert(s.notes).values({ runId: ctx.runId, text: t, buyerId, loadId });
        ctx.actions.push(`Remembered: ${t}`);
        return { saved: true };
      },
      label: () => "Saved a note",
    },
    {
      name: "file_attachment",
      description: "File the attached document to a load, so it's in that load's files and the negotiating agent can read it. Only when the document is about that load's truck and crop.",
      parameters: { load_id: { type: "string" as const, description: "The load_id from list_loads, or the truck, e.g. Truck 14" } },
      run: async ({ load_id }: Record<string, string>) => {
        if (!ctx.upload) return { error: "no_file", message: "No file was attached" };
        if (ctx.filedTo) return { done: true };
        const l = await ownLoad(load_id);
        if (!l) return { error: "not_found", message: "No such load on this farm" };
        await db.insert(s.files).values({ loadId: l.id, ...ctx.upload, sample: false });
        await db.insert(s.messages).values({ loadId: l.id, kind: "rule", body: { text: `File added from Ask your agent · ${ctx.upload.name}` } });
        ctx.filedTo = l.id;
        ctx.actions.push(`Filed ${ctx.upload.name} to ${truckName(l.truckId)}`);
        return { filed: true };
      },
      label: () => "Filed the attachment",
    },
    {
      name: "find_buyer",
      description: "Start (or restart) the negotiation for a load that needs a buyer. Doesn't move money.",
      parameters: { load_id: { type: "string" as const, description: "The load_id from list_loads, or the truck, e.g. Truck 14" } },
      run: async ({ load_id }: Record<string, string>) => {
        const l = await ownLoad(load_id);
        if (!l) return { error: "not_found", message: "No such load on this farm" };
        if (!(await claimNegotiation(l.id))) return { error: "not_now", message: `Can't start now: the load is ${loadState(l)}` };
        after(() => negotiate(l.id));
        ctx.actions.push(`Started negotiating ${truckName(l.truckId)}`);
        return { started: true, note: "Running in the background; the load's page shows it live" };
      },
      label: () => "Started a negotiation",
    },
    {
      name: "set_rules",
      description: "Change the farm's standing rules for new rejections. floor_share_pct 50–100 or 0 to leave it; block_buyer / allow_buyer a buyer id or empty.",
      parameters: { floor_share_pct: { type: "number" as const }, block_buyer: { type: "string" as const }, allow_buyer: { type: "string" as const } },
      run: async (a: Record<string, string>) => {
        const [run] = await db.select().from(s.runs).where(eq(s.runs.id, ctx.runId));
        let blocked = run.blocked;
        const share = Number(a.floor_share_pct);
        const floorShare = share >= 50 && share <= 100 ? Math.round(share) : run.floorShare;
        if (buyerById(a.block_buyer) && !blocked.includes(a.block_buyer)) blocked = [...blocked, a.block_buyer];
        if (buyerById(a.allow_buyer)) blocked = blocked.filter((b) => b !== a.allow_buyer);
        await db.update(s.runs).set({ floorShare, blocked }).where(eq(s.runs.id, ctx.runId));
        ctx.actions.push(`Rules: floor ${floorShare}% · blocked ${blocked.map((b) => buyerById(b)?.name).join(", ") || "nobody"}`);
        return { floor_share_pct: floorShare, blocked };
      },
      label: () => "Changed the farm's rules",
    },
  ];
}

/** One message from the grower to their agent, in one conversation. Stores both sides; the agent reads only this
 *  conversation's earlier turns (what it was told to remember is shared across all of them). */
export async function askAgent(runId: string, text: string, upload: Upload | null, thread: string | null = null) {
  await db.insert(s.farmMessages).values({ runId, thread, kind: "user", body: { text, files: upload ? [upload.name] : [] } });
  const inThread = thread ? eq(s.farmMessages.thread, thread) : isNull(s.farmMessages.thread);
  const recent = await db.select().from(s.farmMessages).where(and(eq(s.farmMessages.runId, runId), inThread)).orderBy(desc(s.farmMessages.createdAt)).limit(10);
  const history = recent
    .reverse()
    .slice(0, -1)
    .map((m) => `${m.kind === "user" ? "Grower" : "You"}: ${(m.body as { text?: string }).text ?? ""}`)
    .join("\n");

  const ctx: Ctx = { runId, upload, filedTo: null, actions: [] };
  const steps: string[] = [];
  const started = Date.now();
  const attachment = upload ? (upload.data ? `\n\nAttached image: ${upload.name} (shown below).` : `\n\nAttached file ${upload.name}:\n${(upload.text ?? "").slice(0, 8000)}`) : "";
  const run = await runAgent({
    client: openai(),
    model: MODEL,
    instructions: INSTRUCTIONS,
    input: `${history ? `Conversation so far:\n${history}\n\n` : ""}It's ${day(Date.now())}, ${clock(Date.now())} in Salinas.\nThe grower says: "${text}"${attachment}`,
    images: upload?.data ? [{ type: upload.type, data: upload.data }] : undefined,
    tools: tools(ctx),
    output: Answer,
    outputName: "answer",
    onStep: (st: AgentStep) => {
      const label = st.tool === "write_plan" ? "Made a plan" : st.label;
      if (!steps.includes(label)) steps.push(label);
    },
    maxTurns: 6,
  });
  await db.insert(s.aiCalls).values({ loadId: null, agent: "assistant", model: MODEL, inputTokens: run.usage.input, outputTokens: run.usage.output, ms: run.ms });

  // Only links to this farm's real loads survive.
  const own = new Set((await db.select({ id: s.loads.id }).from(s.loads).where(eq(s.loads.runId, runId))).map((l) => l.id));
  const links = run.output.links.filter((l) => own.has(l.load_id)).slice(0, 3).map((l) => ({ label: l.label.slice(0, 40), href: `/loads/${l.load_id}` }));
  await db.insert(s.farmMessages).values({ runId, thread, kind: "agent", body: { text: run.output.answer, steps, seconds: Math.round((Date.now() - started) / 1000), links, actions: ctx.actions } });
}
