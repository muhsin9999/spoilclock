// Everything on /architecture comes from this file: the life of one load, the parts, what the AI can't do, and
// the decisions. Only real facts: file paths are in this repo, numbers were measured on the live site on 25 Oct 2026.

export const REPO = "https://github.com/muhsin9999/spoilclock/blob/main/";

export type LaneId = "you" | "agent" | "rules" | "buyers" | "paypal" | "truck";

export const LANES: { id: LaneId; label: string; note: string }[] = [
  { id: "you", label: "You", note: "the grower" },
  { id: "agent", label: "Your agent", note: "OpenAI, plans and negotiates" },
  { id: "rules", label: "Code rules", note: "decide what stands" },
  { id: "buyers", label: "Buyer side", note: "3 buyer agents, then the dock" },
  { id: "paypal", label: "PayPal", note: "sandbox: holds and moves money" },
  { id: "truck", label: "The truck", note: "on the Bryntum board" },
];

export type Step = {
  id: string;
  lane: LaneId;
  title: string;
  /** One plain sentence: what happens. */
  what: string;
  /** The real call, request or rule, shown in mono. */
  call?: string;
  /** Measured on the live site, where it applies. */
  measured?: string;
  files: string[];
  /** Part of the safety story (the Trust tab lights these). */
  trust?: boolean;
};

export const STEPS: Step[] = [
  {
    id: "rejected",
    lane: "truck",
    title: "Turned away at the dock",
    what: "A receiver rejects a delivery. On the Today board its bar turns rust and a rescue clock starts.",
    files: ["src/components/today/board.tsx", "src/lib/demo-day.ts"],
  },
  {
    id: "report",
    lane: "you",
    title: "Report it, with the paperwork",
    what: "You click the delivery and attach the inspection report or a photo. The AI reads it and fills in the reason, grade, % soft and temperature; you check them before anything opens.",
    call: "readFindings(file) → { reason, grade, soft_pct, pulp_f }",
    measured: "1 model call, about 2 s; it converted 3 °C to 37 °F in the live test",
    files: ["src/server/ai/inspect.ts", "src/server/uploads.ts", "src/app/(app)/today/actions.ts"],
  },
  {
    id: "clock",
    lane: "rules",
    title: "The clock and the floor are set",
    what: "Shelf life comes from the crop, the floor from your farm's rules, and blocked buyers are ruled out. All of it is stored on the load, not in a prompt.",
    call: "openRejection(): spoilsAt = rejectedAt + shelfHours · floor = price × floorShare",
    files: ["src/server/run.ts", "src/lib/crops.ts"],
    trust: true,
  },
  {
    id: "start",
    lane: "you",
    title: "Find a buyer",
    what: "One click. The load is claimed in the database first, so it can only be negotiated once at a time, then the agents run in the background while the page updates live.",
    call: "claimNegotiation(loadId) → after(() => negotiate(loadId))",
    files: ["src/app/(app)/loads/[id]/actions.ts", "src/components/app/live-refresh.tsx"],
    trust: true,
  },
  {
    id: "plan",
    lane: "agent",
    title: "Plan, read, look around",
    what: "Your agent's first move is always a plan. Then it reads the inspection report and the temperature log, and checks which buyers can take the load before it spoils.",
    call: "write_plan → read_file → list_buyers → opening ask",
    files: ["src/server/ai/negotiate.ts", "src/server/ai/agent.ts"],
  },
  {
    id: "bids",
    lane: "buyers",
    title: "Buyer agents bid",
    what: "Each buyer agent is its own model call with a private brief: its top price, how many pallets it can take, the grades it accepts. Your agent never sees those limits.",
    call: "3 parallel calls a round · each sees only the ask and its own last bid",
    measured: "about 310 tokens in and 130 out per buyer turn",
    files: ["src/server/ai/negotiate.ts", "src/lib/buyers.ts"],
  },
  {
    id: "check",
    lane: "rules",
    title: "Every offer is checked",
    what: "Code clamps each ask to the floor and each bid to the buyer's own limit, and rules out a buyer that can't take the whole load or unload it before the fruit spoils.",
    call: "clampAsk · clampBid · cannotTake · dealAllowed",
    files: ["src/lib/rules.ts", "src/lib/rules.test.ts"],
    trust: true,
  },
  {
    id: "deal",
    lane: "agent",
    title: "Ask again, or accept",
    what: "Your agent sees every buyer's bid trail and either names a lower ask or accepts. Up to six rounds; on the last one, code takes the best allowed bid if the model doesn't.",
    measured: "16–20 model calls, 17–26 s, about 9,000 tokens in and 2,600 out per negotiation",
    files: ["src/server/ai/negotiate.ts"],
  },
  {
    id: "approve",
    lane: "you",
    title: "You approve",
    what: "The deal card spells out the maths: price, above your floor, share of the original price, and when it will be unloaded. Nothing is sold until you click.",
    files: ["src/components/load/deal-card.tsx"],
    trust: true,
  },
  {
    id: "hold",
    lane: "paypal",
    title: "Hold on the buyer's saved card",
    what: "PayPal authorizes the full price on the card the buyer agent keeps in PayPal's Vault. No card number is in Spoilclock, and no approval page is needed. Nothing is charged yet.",
    call: "POST /v2/checkout/orders { intent: AUTHORIZE, payment_source: { card: { vault_id } } }",
    files: ["src/server/paypal/money.ts", "scripts/setup-buyer-cards.ts"],
    trust: true,
  },
  {
    id: "drive",
    lane: "truck",
    title: "The truck heads to the new dock",
    what: "The new delivery appears on the Today board as a dashed bar, ending when it will be unloaded.",
    files: ["src/server/paypal/money.ts", "src/components/today/board.tsx"],
  },
  {
    id: "hook1",
    lane: "paypal",
    title: "PayPal confirms the hold",
    what: "PayPal's signed webhook arrives. Its signature is checked on the exact bytes PayPal sent, with PayPal's own certificate, before it counts.",
    call: "PAYMENT.AUTHORIZATION.CREATED · verified",
    measured: "15 of 15 live webhooks verified so far (8 holds, 3 captures, 4 voids)",
    files: ["src/server/paypal/webhooks.ts", "src/lib/paypal-signature.ts", "src/app/api/paypal/webhook/route.ts"],
    trust: true,
  },
  {
    id: "dock",
    lane: "buyers",
    title: "The dock checks the load",
    what: "The new buyer's receiver opens the dock check on a phone (a link or QR code) and taps: accept all, some pallets short, or reject.",
    files: ["src/app/dock/[key]/page.tsx", "src/components/dock/dock-actions.tsx"],
  },
  {
    id: "settle",
    lane: "paypal",
    title: "Capture, part-capture or release",
    what: "Accepted: PayPal captures it all. Short: it captures only what arrived and releases the rest. Rejected: it voids the hold, and your agent goes back to the other buyers.",
    call: "authorizations/{id}/capture { final_capture } · authorizations/{id}/void",
    files: ["src/server/paypal/money.ts"],
    trust: true,
  },
  {
    id: "hook2",
    lane: "paypal",
    title: "PayPal confirms the money",
    what: "A second signed webhook confirms the capture or the void. The Money page shows every step with PayPal's reference and its confirmation.",
    call: "PAYMENT.CAPTURE.COMPLETED · PAYMENT.AUTHORIZATION.VOIDED",
    files: ["src/app/(app)/money/page.tsx"],
  },
];

export const PARTS: { name: string; does: string; where: string }[] = [
  { name: "Next.js 16 on Vercel", does: "The app, server actions, the dock check, the PayPal webhook. Negotiations run after the response with after().", where: "src/app" },
  { name: "Neon Postgres", does: "Each visitor's run: trips, loads, every offer, deals, chat, files, PayPal events, model calls.", where: "src/db/schema.ts" },
  { name: "OpenAI gpt-5.4-mini", does: "Your agent, the three buyer agents, the chat, and the paperwork reader. Low reasoning effort, structured outputs.", where: "src/server/ai" },
  { name: "PayPal sandbox", does: "Orders v2 authorize, capture and void; Vault v3 saved cards for the buyer agents; signed webhooks.", where: "src/server/paypal" },
  { name: "Bryntum Scheduler", does: "The Today board: trucks as rows, trips as bars, the agent's new delivery appearing live. Trial build.", where: "src/components/today" },
  { name: "unpdf and pdf-lib", does: "Read the text of uploaded PDFs; typeset the sample paperwork.", where: "src/server/uploads.ts" },
];

export const CANNOT: { text: string; how: string; file: string }[] = [
  { text: "Sell below your floor", how: "Every ask is clamped to the floor and a deal is allowed only at or above it.", file: "src/lib/rules.ts" },
  { text: "Move money", how: "No agent has a PayPal tool. Only your Approve click and the dock's tap call PayPal.", file: "src/server/paypal/money.ts" },
  { text: "Charge twice", how: "Each step is claimed in the database first and sent with a fixed PayPal-Request-Id.", file: "src/server/paypal/money.ts" },
  { text: "Pick a buyer that can't deliver", how: "Whole load only, unloaded before it spoils, at an open dock.", file: "src/lib/rules.ts" },
  { text: "Let a buyer agent overpay", how: "Each bid is clamped to that buyer's own private limit.", file: "src/lib/rules.ts" },
  { text: "Change the deal once money is held", how: "Chat rule changes and floor edits are refused after the hold.", file: "src/server/ai/chat.ts" },
  { text: "See another visitor's loads", how: "Every read and action is scoped to your own run.", file: "src/server/load.ts" },
];

export const DECISIONS: { chose: string; why: string }[] = [
  { chose: "Authorize first, capture at the dock", why: "The buyer's money is held but not taken until the load is accepted, so a second rejection costs nobody anything." },
  { chose: "Buyer agents pay with Vault-saved cards", why: "An agent can't click a PayPal approval page, and Spoilclock never stores a card number, only PayPal's token." },
  { chose: "Rules in code, not in the prompt", why: "A model can be talked into anything; a clamp can't. The prompt says what's wise, the code says what's allowed." },
  { chose: "One model call per buyer, with a private brief", why: "So the buyer agents really don't know each other's limits, and your agent can't read them either." },
  { chose: "A private copy of the farm for each visitor", why: "Everyone gets their own rejected load and their own PayPal payments; nobody uses up anyone else's rescue." },
  { chose: "Live updates by re-reading the page", why: "Each new offer is stored as it lands and the page re-reads every 1.5 s. Simple, and it works on serverless." },
  { chose: "Bryntum served as a prebuilt file", why: "Bundling it took the build past 6 GB of memory; loading its ready-made module from public/ takes seconds." },
  { chose: "Webhooks checked on the exact bytes", why: "Re-serialising the JSON breaks PayPal's signature, so we verify offline with PayPal's certificate and fall back to its verify API." },
  { chose: "Sandbox, a fictional farm, simulated buyers", why: "The money flow is real PayPal; the businesses aren't. Every screen says so." },
];
