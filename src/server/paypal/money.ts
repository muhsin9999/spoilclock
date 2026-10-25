// The money side of a rescued load, on PayPal Orders v2:
//   approve → AUTHORIZE on the buyer agent's saved card (PayPal holds the money, nothing is charged)
//   dock accepts all → CAPTURE in full · some pallets short → CAPTURE only what arrived · dock rejects → VOID
// Each step is claimed in the database first and sent with a fixed PayPal-Request-Id, so a double click or a
// retry can never hold or charge twice.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { buyer as buyerById } from "@/lib/buyers";
import { arrival } from "@/lib/rules";
import { paypal, PayPalError } from "./rest";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const value = (cents: number) => (cents / 100).toFixed(2);

type Order = { id: string; status: string; purchase_units?: { payments?: { authorizations?: { id: string; status: string }[] } }[] };
type Capture = { id: string; status: string; amount?: { value: string } };

export type MoneyResult = { ok: true } | { ok: false; error: string };

const say = (loadId: string, kind: "agent" | "rule", text: string) => db.insert(s.messages).values({ loadId, kind, body: { text } });

/** A plain sentence for a PayPal refusal; internals stay in the server log. */
function explain(e: unknown) {
  console.error("PayPal call failed", e);
  if (e instanceof PayPalError) {
    if (e.status === 401 || e.status === 403) return "PayPal didn't accept our credentials. Nothing was charged.";
    if (e.status === 422) return `PayPal refused: ${e.message}. Nothing was charged.`;
    if (e.status >= 500) return "PayPal is having trouble right now. Nothing was charged; try again in a minute.";
    return `PayPal refused the request: ${e.message}`;
  }
  return "We couldn't reach PayPal. Nothing was charged; try again.";
}

/** The grower approved the deal: hold the money on the buyer agent's saved card. */
export async function holdPayment(loadId: string): Promise<MoneyResult> {
  const [deal] = await db.update(s.deals).set({ status: "holding" }).where(and(eq(s.deals.loadId, loadId), eq(s.deals.status, "ready"))).returning();
  if (!deal) return { ok: false, error: "This deal isn't waiting for approval any more." };
  const [load] = await db.select().from(s.loads).where(eq(s.loads.id, loadId));
  const b = buyerById(deal.buyerId)!;
  const [card] = await db.select().from(s.buyerCards).where(eq(s.buyerCards.buyerId, b.id));
  const back = () => db.update(s.deals).set({ status: "ready" }).where(eq(s.deals.id, deal.id));
  if (!card) {
    await back();
    return { ok: false, error: `${b.name} has no card on file yet.` };
  }
  const total = deal.perPalletCents * deal.pallets;

  let order: Order;
  try {
    order = await paypal<Order>("POST", "/v2/checkout/orders", {
      headers: { "PayPal-Request-Id": `hold-${deal.id}` },
      body: {
        intent: "AUTHORIZE",
        purchase_units: [
          {
            reference_id: load.id,
            custom_id: deal.id,
            invoice_id: `SPOILCLOCK-${deal.id}`,
            description: `${deal.pallets} pallets of ${load.crop.toLowerCase()} (Truck 14), resold after a dock rejection`,
            soft_descriptor: "SPOILCLOCK",
            amount: { currency_code: "USD", value: value(total), breakdown: { item_total: { currency_code: "USD", value: value(total) } } },
            items: [{ name: `${load.crop}, ${load.grade}`, quantity: String(deal.pallets), unit_amount: { currency_code: "USD", value: value(deal.perPalletCents) }, category: "PHYSICAL_GOODS" }],
          },
        ],
        payment_source: { card: { vault_id: card.vaultId } },
      },
    });
  } catch (e) {
    await back();
    return { ok: false, error: explain(e) };
  }

  const auth = order.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (order.status !== "COMPLETED" || auth?.status !== "CREATED") {
    await back();
    await say(loadId, "agent", `PayPal didn't approve the hold on ${b.name}'s card (${auth?.status ?? order.status}). Nothing was charged. I can try another buyer.`);
    return { ok: false, error: `PayPal didn't approve the hold (${auth?.status ?? order.status}).` };
  }

  // The truck heads for the new buyer: its delivery appears on the Today board.
  const now = Date.now();
  const { doneAt } = arrival(b, now);
  await db.transaction(async (tx) => {
    await tx.update(s.deals).set({ status: "held", paypalOrderId: order.id, authorizationId: auth.id, approvedAt: new Date(now) }).where(eq(s.deals.id, deal.id));
    await tx.update(s.loads).set({ status: "held" }).where(eq(s.loads.id, loadId));
    await tx.insert(s.trips).values({ runId: load.runId, truckId: load.truckId, kind: "redelivery", place: b.name, startAt: new Date(now + 15 * 60_000), endAt: new Date(doneAt), loadId });
    await tx.insert(s.messages).values({ loadId, kind: "rule", body: { text: `Payment held · ${usd(total)} on ${b.name}'s card` } });
    await tx.insert(s.messages).values({
      loadId,
      kind: "agent",
      body: { text: `Done. PayPal is holding ${usd(total)} on ${b.name}'s card, and Truck 14 is on its way. Nothing is charged until their dock checks the load. Send them the dock check link.` },
    });
  });
  return { ok: true };
}

export type DockOutcome = { kind: "accept" } | { kind: "short"; pallets: number } | { kind: "reject" };

/** The new buyer's dock checked the load: take the money, take part of it, or release the hold. */
export async function settle(dockKey: string, outcome: DockOutcome): Promise<MoneyResult> {
  const [deal] = await db.update(s.deals).set({ status: "settling" }).where(and(eq(s.deals.dockKey, dockKey), eq(s.deals.status, "held"))).returning();
  if (!deal || !deal.authorizationId) return { ok: false, error: "This load has already been checked." };
  const b = buyerById(deal.buyerId)!;
  const back = () => db.update(s.deals).set({ status: "held" }).where(eq(s.deals.id, deal.id));
  const now = new Date();

  try {
    if (outcome.kind === "reject") {
      await paypal("POST", `/v2/payments/authorizations/${deal.authorizationId}/void`, { headers: { "PayPal-Request-Id": `void-${deal.id}` } });
      await db.transaction(async (tx) => {
        await tx.update(s.deals).set({ status: "voided", settledAt: now }).where(eq(s.deals.id, deal.id));
        // Back to the table without this buyer: the grower can send the agent after the others.
        const [load] = await tx.select().from(s.loads).where(eq(s.loads.id, deal.loadId));
        await tx.update(s.loads).set({ status: "reopened", excluded: [...new Set([...load.excluded, b.id])] }).where(eq(s.loads.id, deal.loadId));
        await tx.insert(s.messages).values({ loadId: deal.loadId, kind: "rule", body: { text: `Rejected at ${b.name}'s dock · PayPal released the hold` } });
        await tx.insert(s.messages).values({ loadId: deal.loadId, kind: "agent", body: { text: `${b.name}'s dock rejected the load. PayPal voided the hold, so no money moved. I've ruled them out; I can try the other buyers if there's time.` } });
      });
      return { ok: true };
    }

    const pallets = outcome.kind === "short" ? Math.max(1, Math.min(deal.pallets - 1, Math.floor(outcome.pallets))) : deal.pallets;
    const cents = pallets * deal.perPalletCents;
    const cap = await paypal<Capture>("POST", `/v2/payments/authorizations/${deal.authorizationId}/capture`, {
      headers: { "PayPal-Request-Id": `capture-${deal.id}` },
      body: {
        amount: { currency_code: "USD", value: value(cents) },
        final_capture: true,
        invoice_id: `SPOILCLOCK-${deal.id}-C`,
        ...(pallets < deal.pallets && { note_to_payer: `${deal.pallets - pallets} of ${deal.pallets} pallets short; charged for ${pallets}.` }),
      },
    });
    if (cap.status !== "COMPLETED" && cap.status !== "PENDING") {
      await back();
      return { ok: false, error: `PayPal didn't complete the capture (${cap.status}).` };
    }
    const status = pallets < deal.pallets ? "partial" : "captured";
    await db.transaction(async (tx) => {
      await tx.update(s.deals).set({ status, captureId: cap.id, capturedCents: cents, settledAt: now }).where(eq(s.deals.id, deal.id));
      await tx.update(s.loads).set({ status }).where(eq(s.loads.id, deal.loadId));
      await tx.insert(s.messages).values({ loadId: deal.loadId, kind: "rule", body: { text: status === "captured" ? `Accepted at ${b.name} · ${usd(cents)} paid` : `${pallets} of ${deal.pallets} pallets accepted · ${usd(cents)} paid, the rest released` } });
      await tx.insert(s.messages).values({
        loadId: deal.loadId,
        kind: "agent",
        body: {
          text:
            status === "captured"
              ? `${b.name} accepted all ${deal.pallets} pallets. PayPal captured ${usd(cents)}. The load is sold.`
              : `${b.name} received ${pallets} of ${deal.pallets} pallets, so PayPal captured only ${usd(cents)} and released the other ${usd((deal.pallets - pallets) * deal.perPalletCents)}.`,
        },
      });
    });
    return { ok: true };
  } catch (e) {
    await back();
    return { ok: false, error: explain(e) };
  }
}
