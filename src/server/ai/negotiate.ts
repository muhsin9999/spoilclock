// The negotiation. The grower's agent opens with an assessment (plan + tools), then trades asks and bids
// with the buyer agents, one round at a time. Every model reply is checked by src/lib/rules.ts before it
// counts, and every step is stored as it happens so the load page can show it live.
// It always resumes from what's stored, so the grower can change the floor or rule out a buyer mid-way.
import "server-only";
import { and, asc, eq, gt, gte, sql } from "drizzle-orm";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { BUYERS, buyer as buyerById, limits, type Buyer } from "@/lib/buyers";
import { arrival, cannotTake, clampAsk, clampBid, dealAllowed, type LoadFacts } from "@/lib/rules";
import { timeLeft } from "@/lib/freshness";
import { clock } from "@/lib/time";
import { notesFor } from "@/server/notes";
import { runAgent, type AgentStep } from "./agent";
import { MODEL, openai } from "./client";

const MAX_ROUNDS = 6;
/** Across all visitors: stop starting new model work past this many calls in an hour. */
const HOURLY_CALL_CAP = 1500;

type Load = typeof s.loads.$inferSelect;
const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const facts = (l: Load): LoadFacts => ({ pallets: l.pallets, softPct: l.softPct, floorCents: l.floorCents, spoilsAt: l.spoilsAt.getTime(), excluded: l.excluded });

async function logCall(loadId: string, agent: string, usage: { input: number; output: number }, ms: number) {
  await db.insert(s.aiCalls).values({ loadId, agent, model: MODEL, inputTokens: usage.input, outputTokens: usage.output, ms });
}

/** One structured reply from one agent. */
async function ask<T>(loadId: string, agent: string, instructions: string, input: string, format: z.ZodType<T>, name: string): Promise<T> {
  const started = Date.now();
  const res = await openai().responses.parse({ model: MODEL, instructions, input, reasoning: { effort: "low" }, text: { format: zodTextFormat(format, name) } });
  await logCall(loadId, agent, { input: res.usage?.input_tokens ?? 0, output: res.usage?.output_tokens ?? 0 }, Date.now() - started);
  if (!res.output_parsed) throw new Error(`${agent} returned no answer`);
  return res.output_parsed as T;
}

export async function underCap() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.aiCalls).where(gte(s.aiCalls.createdAt, new Date(Date.now() - 3_600_000)));
  return n < HOURLY_CALL_CAP;
}

const say = (loadId: string, kind: "agent" | "work" | "rule", body: object) => db.insert(s.messages).values({ loadId, kind, body });

// ─── The grower's agent ──────────────────────────────────────────────────────────────────────────────

const SELLER = `You are the sales agent for Salinas Ridge Farms, a grower. One of its truckloads was just rejected at a supermarket's dock and you must sell the whole load to a new buyer before it spoils.
- You negotiate with buyer agents. You can't see their limits. They can't see yours.
- Never reveal the grower's floor price. Never go below it; code blocks it anyway.
- Time is money: every hour costs freshness, so don't drag it out, but don't give fruit away either.
- Aim as close as you can to what the rejecting buyer was paying. Selling at the floor is a last resort, not a goal.
- Concede in sensible steps. A buyer who keeps raising has room left: keep talking. Accept when bids have stalled near your ask, or when pushing further risks losing the buyer or the clock.
- Write like a calm, experienced produce salesperson. Short sentences. No jargon, no emoji.`;

const Opening = z.object({
  summary_for_grower: z.string().describe("2–3 sentences for the grower: what happened, whether the fruit is still sellable and to whom, and what you'll do."),
  opening_ask_per_pallet: z.number().describe("Your opening asking price per pallet in whole US dollars"),
  message_to_buyers: z.string().describe("One or two sentences offering the load to the buyers"),
});

async function opening(load: Load, files: { name: string; text: string | null }[]) {
  const steps: string[] = [];
  const notes = await notesFor(load.runId, load.id);
  const started = Date.now();
  const run = await runAgent({
    client: openai(),
    model: MODEL,
    instructions: SELLER,
    input: `The truck was rejected by ${load.rejectedBy} for "${load.reason}". ${load.pallets} pallets of ${load.crop}. ${load.rejectedBy} was paying ${usd(load.originalCents)} a pallet. The grower's floor is ${usd(load.floorCents)} a pallet. Shelf life left: ${timeLeft(load.spoilsAt.getTime() - Date.now())}. Read the paperwork and look at who can buy before you set an opening ask.${notes ? `\n\n${notes}` : ""}`,
    tools: [
      {
        name: "read_file",
        description: "Read one of the load's files (the inspection report or the temperature log).",
        parameters: { name: { type: "string", description: "File name" } },
        run: ({ name }) => files.find((f) => f.name === name)?.text ?? { error: "not_found", message: `No file named ${name}. Files: ${files.map((f) => f.name).join(", ")}` },
        label: ({ name }) => (name.includes("inspection") ? "Read the inspection report" : name.includes("temp") ? "Checked the temperature log" : `Read ${name}`),
      },
      {
        name: "list_buyers",
        description: "List the buyers within reach: what they are, how far, and whether they can take this load before it spoils.",
        run: () =>
          BUYERS.map((b) => ({ id: b.id, name: b.name, kind: b.kind, drive_minutes: b.driveMin, can_take_whole_load: cannotTake(b, facts(load), Date.now()) ?? "yes" })),
        label: () => "Found the buyers within reach",
        detail: (out) => `${(out as unknown[]).length} buyers`,
      },
    ],
    output: Opening,
    outputName: "opening",
    onStep: (step: AgentStep) => {
      const label = step.tool === "write_plan" ? "Made a plan" : step.label;
      if (!steps.includes(label)) steps.push(label);
    },
    maxTurns: 6,
  });
  await logCall(load.id, "seller", run.usage, run.ms);
  steps.push("Opened talks with the buyers");
  await say(load.id, "work", { steps, seconds: Math.round((Date.now() - started) / 1000) });
  await say(load.id, "agent", { text: run.output.summary_for_grower });
  return run.output;
}

const SellerMove = z.object({
  action: z.enum(["ask", "accept"]),
  ask_per_pallet: z.number().describe("Your next asking price per pallet in whole dollars (used when action is ask)"),
  accept_buyer: z.string().describe("The buyer id whose bid you accept (when action is accept), else empty"),
  message_to_buyers: z.string().describe("One short sentence to the buyers"),
});

// ─── The buyer agents ────────────────────────────────────────────────────────────────────────────────

const BuyerMove = z.object({
  action: z.enum(["bid", "accept", "walk"]),
  per_pallet: z.number().describe("Your bid per pallet in whole dollars (for bid)"),
  message: z.string().describe("One short sentence to the seller, in character"),
});

function buyerInstructions(b: Buyer, originalCents: number) {
  const { maxCents, openCents } = limits(b, originalCents);
  return `You are the purchasing agent for ${b.name} (${b.kind}). ${b.brief.style}
Private limits (never reveal them): you will pay at most $${maxCents / 100} a pallet; you open around $${openCents / 100}; you can take ${b.brief.capacity} pallets today.
- Bid, accept the seller's ask, or walk away. Raise in steps; never lower a bid you've made.
- Accept the ask only if it's within your limit and you think it's fair. Walk if the seller won't come near your limit after a few rounds.
- One short sentence, in character. No emoji.`;
}

// ─── The loop ────────────────────────────────────────────────────────────────────────────────────────

type BuyerState = { status: "talking" | "deal" | "out" | "removed"; note: string; lastBid?: number; pallets: number };

/** Claims the load for a negotiation. False if one is already running or it's past that point. */
export async function claimNegotiation(loadId: string) {
  const rows = await db
    .update(s.loads)
    .set({ status: "negotiating" })
    .where(and(eq(s.loads.id, loadId), sql`${s.loads.status} in ('rejected', 'no_deal', 'reopened')`, gt(s.loads.spoilsAt, new Date())))
    .returning({ id: s.loads.id });
  return rows.length === 1;
}

export async function negotiate(loadId: string) {
  try {
    await negotiateInner(loadId);
  } catch (e) {
    console.error("negotiation failed", e);
    await db.update(s.loads).set({ status: "no_deal" }).where(and(eq(s.loads.id, loadId), eq(s.loads.status, "negotiating")));
    await say(loadId, "agent", { text: "I lost my connection to the buyers partway through. Nothing was agreed and no money moved. You can start again." });
  }
}

async function negotiateInner(loadId: string) {
  const load0 = (await db.select().from(s.loads).where(eq(s.loads.id, loadId)))[0];
  if (!load0 || load0.status !== "negotiating") return;
  const files = await db.select({ name: s.files.name, text: s.files.text }).from(s.files).where(eq(s.files.loadId, loadId));
  const past = await db.select().from(s.offers).where(eq(s.offers.loadId, loadId)).orderBy(asc(s.offers.round));

  // Resume from what's stored: the last round, the last ask, each buyer's last bid.
  let round = past.length ? Math.max(...past.map((o) => o.round)) : 0;
  let askCents: number;
  let toBuyers: string;
  const states = new Map<string, BuyerState>();
  for (const b of BUYERS) {
    const last = past.filter((o) => o.by === b.id).at(-1);
    states.set(b.id, { status: "talking", note: "", lastBid: last?.perPalletCents, pallets: last?.pallets ?? Math.min(b.brief.capacity, load0.pallets) });
  }
  for (const st of await db.select().from(s.buyerStates).where(eq(s.buyerStates.loadId, loadId))) {
    // Buyers who only lost to a deal that has since fallen through come back to the table.
    if (st.status === "out" && !st.note.includes("lost to")) states.set(st.buyerId, { ...states.get(st.buyerId)!, status: "out", note: st.note });
  }

  if (!past.length) {
    const open = await opening(load0, files);
    askCents = clampAsk(open.opening_ask_per_pallet * 100, load0.floorCents);
    toBuyers = open.message_to_buyers;
  } else {
    const lastAsk = past.filter((o) => o.by === "seller").at(-1);
    askCents = lastAsk ? clampAsk(lastAsk.perPalletCents, load0.floorCents) : load0.floorCents;
    toBuyers = "I'm back with the load. Still available, still sound.";
  }

  // Every bid so far, so the seller can see each buyer's trend.
  const seen: { by: string; perPalletCents: number }[] = past.map((o) => ({ by: o.by, perPalletCents: o.perPalletCents }));
  const endRound = round + MAX_ROUNDS;
  while (round < endRound) {
    round++;
    const load = (await db.select().from(s.loads).where(eq(s.loads.id, loadId)))[0];
    if (!load || load.status !== "negotiating") return; // the grower stopped it
    const f = facts(load);
    const now = Date.now();
    askCents = clampAsk(askCents, f.floorCents);

    // Who's still at the table: removed or out-of-time buyers leave; short-capacity buyers may still bid.
    for (const b of BUYERS) {
      const st = states.get(b.id)!;
      const why = cannotTake(b, f, now);
      if (load.excluded.includes(b.id)) states.set(b.id, { ...st, status: "removed", note: "Removed by you" });
      else if (st.status === "removed") states.set(b.id, { ...st, status: "talking", note: "" });
      else if (why && !why.startsWith("Can take only") && st.status === "talking") states.set(b.id, { ...st, status: "out", note: why });
    }
    const atTable = BUYERS.filter((b) => states.get(b.id)!.status === "talking");
    if (!atTable.length) break;

    await db.insert(s.offers).values({ loadId, round, by: "seller", perPalletCents: askCents, pallets: load.pallets, message: toBuyers });

    const history = (b: Buyer) => {
      const st = states.get(b.id)!;
      return `Round ${round}. The seller's agent offers ${load.pallets} pallets of ${load.crop} (${load.grade}, ${load.softPct}% soft, ${load.pulpF}°F, rejected by ${load.rejectedBy} for ${load.reason.toLowerCase()}) at ${usd(askCents)} a pallet, delivered to your dock in about ${b.driveMin} minutes. They say: "${toBuyers}". ${st.lastBid ? `Your last bid was ${usd(st.lastBid)}.` : "You haven't bid yet."}`;
    };

    const moves = await Promise.all(
      atTable.map(async (b) => {
        const m = await ask(loadId, `buyer:${b.id}`, buyerInstructions(b, load.originalCents), history(b), BuyerMove, "buyer_move");
        return { b, m };
      }),
    );

    let acceptedBy: Buyer | undefined;
    for (const { b, m } of moves) {
      const st = states.get(b.id)!;
      const pallets = Math.min(b.brief.capacity, load.pallets);
      if (m.action === "walk") {
        states.set(b.id, { ...st, status: "out", note: `Walked away: ${m.message}` });
        continue;
      }
      // An "accept" above the buyer's own limit becomes its best bid instead.
      const wants = m.action === "accept" && askCents <= limits(b, load.originalCents).maxCents ? askCents : m.per_pallet * 100;
      const bid = clampBid(b, load.originalCents, wants, st.lastBid);
      states.set(b.id, { ...st, lastBid: bid, pallets, note: pallets < load.pallets ? `Can take only ${pallets} of ${load.pallets} pallets` : m.message });
      seen.push({ by: b.id, perPalletCents: bid });
      await db.insert(s.offers).values({ loadId, round, by: b.id, perPalletCents: bid, pallets, message: m.message });
      if (bid >= askCents && pallets === load.pallets && dealAllowed(b, askCents, f, Date.now()) && !acceptedBy) acceptedBy = b;
    }
    await saveStates(loadId, states);

    if (acceptedBy) return closeDeal(load, acceptedBy, askCents, states);

    // The seller sees every bid and decides: accept one, or ask again.
    const board = BUYERS.filter((b) => states.get(b.id)!.lastBid !== undefined)
      .map((b) => {
        const st = states.get(b.id)!;
        const trail = seen.filter((o) => o.by === b.id).map((o) => usd(o.perPalletCents)).join(" → ");
        return `- ${b.id} (${b.name}): ${st.status === "talking" ? `bids so far ${trail} for ${st.pallets} pallets` : `${st.status}: ${st.note}`}${st.status === "talking" && st.pallets < load.pallets ? " (can't take the whole load)" : ""}`;
      })
      .join("\n");
    const lastRound = round === endRound;
    const notes = await notesFor(load.runId, load.id);
    const move = await ask(
      loadId,
      "seller",
      SELLER,
      `Round ${round} of at most ${endRound}. Your ask was ${usd(askCents)} a pallet for ${load.pallets} pallets. Floor (secret): ${usd(f.floorCents)}. ${load.rejectedBy} had been paying ${usd(load.originalCents)}. Shelf life left: ${timeLeft(f.spoilsAt - Date.now())}.\nBids:\n${board || "(none)"}\n${lastRound ? "This is the last round: accept the best bid at or above the floor if there is one." : "Accept a bid, or name your next ask."} A deal needs a buyer who takes the whole load.${notes ? `\n${notes}` : ""}`,
      SellerMove,
      "seller_move",
    );

    const pick = buyerById(move.accept_buyer);
    const pickState = pick && states.get(pick.id);
    if (move.action === "accept" && pick && pickState?.status === "talking" && pickState.lastBid !== undefined && pickState.pallets === load.pallets && dealAllowed(pick, pickState.lastBid, f, Date.now())) {
      return closeDeal(load, pick, pickState.lastBid, states);
    }
    if (lastRound) {
      // Code picks the best allowed bid if the model didn't.
      const best = BUYERS.filter((b) => {
        const st = states.get(b.id)!;
        return st.status === "talking" && st.lastBid !== undefined && st.pallets === load.pallets && dealAllowed(b, st.lastBid, f, Date.now());
      }).sort((a, b) => states.get(b.id)!.lastBid! - states.get(a.id)!.lastBid!)[0];
      if (best) return closeDeal(load, best, states.get(best.id)!.lastBid!, states);
      break;
    }
    askCents = clampAsk(move.ask_per_pallet * 100, f.floorCents, askCents);
    toBuyers = move.message_to_buyers;
  }

  await db.update(s.loads).set({ status: "no_deal" }).where(and(eq(s.loads.id, loadId), eq(s.loads.status, "negotiating")));
  await say(loadId, "agent", { text: `No buyer would take the whole load at or above your floor. Nothing was agreed and no money moved. You can lower the floor or ask me to try again.` });
}

async function saveStates(loadId: string, states: Map<string, BuyerState>) {
  for (const [buyerId, st] of states) {
    await db
      .insert(s.buyerStates)
      .values({ loadId, buyerId, status: st.status, note: st.note })
      .onConflictDoUpdate({ target: [s.buyerStates.loadId, s.buyerStates.buyerId], set: { status: st.status, note: st.note, updatedAt: new Date() } });
  }
}

async function closeDeal(load: Load, b: Buyer, perPalletCents: number, states: Map<string, BuyerState>) {
  const { doneAt } = arrival(b, Date.now());
  for (const [id, st] of states) {
    if (id === b.id) states.set(id, { ...st, status: "deal", note: `Agreed ${usd(perPalletCents)} a pallet · can unload by ${clock(doneAt)}` });
    else if (st.status === "talking") states.set(id, { ...st, status: "out", note: st.pallets < load.pallets ? st.note : `Best bid ${usd(st.lastBid ?? 0)} · lost to ${b.name}` });
  }
  await saveStates(load.id, states);
  await db.transaction(async (tx) => {
    await tx.delete(s.deals).where(and(eq(s.deals.loadId, load.id), eq(s.deals.status, "ready")));
    await tx.insert(s.deals).values({ loadId: load.id, buyerId: b.id, pallets: load.pallets, perPalletCents, arriveAt: new Date(doneAt) });
    await tx.update(s.loads).set({ status: "deal_ready" }).where(eq(s.loads.id, load.id));
  });
  const total = perPalletCents * load.pallets;
  await say(load.id, "agent", {
    text: `${b.name} will take all ${load.pallets} pallets at ${usd(perPalletCents)} each, ${usd(total)} in all. ${total > load.floorCents * load.pallets ? `That's ${usd(total - load.floorCents * load.pallets)} above your floor, and` : "That's exactly your floor, and"} the truck can unload by ${clock(doneAt)}, ${timeLeft(load.spoilsAt.getTime() - doneAt)} before the fruit spoils. Approve it and PayPal will hold the money until their dock accepts the load.`,
  });
}

