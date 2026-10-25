// The architecture map's single source of truth: every lane, part, connection, journey, guarantee and decision on
// /architecture comes from here. Facts only: file paths are real, numbers were measured on the live site (25 Oct 2026).

export const REPO = "https://github.com/muhsin9999/spoilclock/blob/main";

export type LaneId = "people" | "web" | "agent" | "ai" | "paypal" | "data";
export type Logo = "paypal" | "vercel" | "neon" | "nextjs" | "openai" | "agent" | "person" | "webhook" | "chat" | "shield" | "gauge" | "phone" | "schedule" | "buyers" | "money" | "read";

export const LANES: { id: LaneId; title: string; blurb: string }[] = [
  { id: "people", title: "People", blurb: "Who uses it" },
  { id: "web", title: "Spoilclock web", blurb: "Next.js 16 on Vercel" },
  { id: "agent", title: "Agents & money", blurb: "Run after a click, or after an approval" },
  { id: "ai", title: "AI & rules", blurb: "The model, and the code that checks it" },
  { id: "paypal", title: "PayPal sandbox", blurb: "What Spoilclock calls and hears from" },
  { id: "data", title: "Data & schedule", blurb: "Records, and the trucks' day" },
];

export type ArchNode = {
  id: string;
  lane: LaneId;
  title: string;
  /** One mono line: a route, a function or a model. */
  sub: string;
  logo: Logo;
  summary: string;
  facts: [string, string][];
  source?: string[];
  /** Shown on the Trust lens. */
  trust?: string;
};

export const NODES: ArchNode[] = [
  {
    id: "grower",
    lane: "people",
    title: "Grower",
    sub: "Salinas Ridge Farms (fictional)",
    logo: "person",
    summary: "Reports a rejected delivery, sends the agent to find a buyer, talks to it in the load's chat, and approves the deal before any money is held.",
    facts: [["Approves", "Every deal, before PayPal holds anything"], ["Works in", "Today, Loads, Buyers, Money, Rules"]],
  },
  {
    id: "receiver",
    lane: "people",
    title: "Receiver at the new dock",
    sub: "the buyer's warehouse",
    logo: "phone",
    summary: "Checks the load when the truck arrives, on a phone, and taps: accept all, some pallets short, or reject. That tap decides what PayPal does with the held money.",
    facts: [["Opens", "A dock-check link or QR code"], ["Decides", "Capture, part-capture or void"]],
  },
  {
    id: "app",
    lane: "web",
    title: "Spoilclock app",
    sub: "Next.js 16 · server actions",
    logo: "nextjs",
    summary: "Today, Loads, Buyers, Money and Rules, for each visitor's private copy of the farm. The load page re-reads itself every 1.5 s while the agents work, so each offer appears as it lands.",
    facts: [["Runs on", "Vercel, deployed from GitHub"], ["Find a buyer", "claimNegotiation() → after(negotiate)"], ["Approve", "approveDeal() → holdPayment()"]],
    source: ["src/app/(app)", "src/app/(app)/loads/[id]/actions.ts"],
  },
  {
    id: "report",
    lane: "web",
    title: "Report a rejection",
    sub: "click a delivery · upload",
    logo: "read",
    summary: "On the Today board, click a delivery and attach the receiver's inspection report or a photo. The AI fills in what it found; the grower checks it, and a rescue opens with its clock running.",
    facts: [["Accepts", "PDF, photo or CSV up to 3.5 MB"], ["Then", "openRejection(): load, clock, floor, paperwork"]],
    source: ["src/app/(app)/today/actions.ts", "src/server/uploads.ts", "src/server/run.ts"],
  },
  {
    id: "webhook",
    lane: "web",
    title: "Webhook receiver",
    sub: "POST /api/paypal/webhook",
    logo: "webhook",
    summary: "Receives PayPal's events. Each delivery's signature is checked on the exact bytes PayPal sent before it counts, then it's stored once and tied to its deal.",
    facts: [["Checks", "PayPal's certificate + CRC32 of the raw body; PayPal's verify API as a fallback"], ["Live so far", "15 of 15 verified (8 holds, 3 captures, 4 voids)"]],
    source: ["src/app/api/paypal/webhook/route.ts", "src/server/paypal/webhooks.ts", "src/lib/paypal-signature.ts"],
    trust: "Signature verified on raw bytes",
  },
  {
    id: "dock",
    lane: "web",
    title: "Dock check",
    sub: "/dock/[key] · phone-first",
    logo: "phone",
    summary: "The receiver's page. A private link per deal, opened by QR code. Three big buttons, each confirmed before anything moves.",
    facts: [["Link", "A random key per deal"], ["Calls", "settle(): capture, partial capture or void"]],
    source: ["src/app/dock/[key]/page.tsx", "src/components/dock/dock-actions.tsx"],
  },
  {
    id: "chat",
    lane: "agent",
    title: "Load chat",
    sub: "chat(loadId, text, files)",
    logo: "chat",
    summary: "Talk to your agent about one load, and attach files. It answers from the load's facts, and can change the floor or the buyers allowed when you ask; code decides which changes stand.",
    facts: [["Can change", "The floor · which buyers are allowed"], ["Locked", "Once PayPal is holding the money"]],
    source: ["src/server/ai/chat.ts"],
  },
  {
    id: "inspect",
    lane: "agent",
    title: "Paperwork reader",
    sub: "readFindings(file)",
    logo: "read",
    summary: "Turns an inspection report or a photo of one into reason, grade, % soft and pulp temperature. It refuses documents that aren't about a rejected load.",
    facts: [["Live test", "Read a lettuce rejection notice and converted 3 °C to 37 °F"], ["Model calls", "1, about 2 s"]],
    source: ["src/server/ai/inspect.ts"],
  },
  {
    id: "negotiate",
    lane: "agent",
    title: "Your agent",
    sub: "negotiate(loadId)",
    logo: "agent",
    summary: "Sells the load for the grower. Its first move is a written plan; then it reads the paperwork, checks which buyers can take the load in time, and trades asks with the buyer agents round by round.",
    facts: [
      ["Tools", "read_file · list_buyers"],
      ["Rounds", "Up to 6, then code takes the best allowed bid"],
      ["Measured", "16–20 model calls, 17–26 s per negotiation"],
      ["Tokens", "About 9,000 in and 2,600 out"],
    ],
    source: ["src/server/ai/negotiate.ts", "src/server/ai/agent.ts"],
  },
  {
    id: "buyers",
    lane: "agent",
    title: "Buyer agents",
    sub: "3 · private briefs",
    logo: "buyers",
    summary: "Valley Juice Co., Bargain Fresh and Coastal Food Bank: simulated businesses, each a separate model call with its own private limits. They see the seller's ask and their own last bid, never each other.",
    facts: [["Each turn", "About 310 tokens in, 130 out, under 2 s"], ["Pays with", "A card saved in PayPal's Vault"]],
    source: ["src/lib/buyers.ts", "src/server/ai/negotiate.ts"],
  },
  {
    id: "money",
    lane: "agent",
    title: "Hold & settle",
    sub: "holdPayment() · settle()",
    logo: "money",
    summary: "The only code that calls PayPal for money. Approve holds it; the dock's tap captures it, captures part of it, or releases it. Each step is claimed in the database first and sent with a fixed request id.",
    facts: [["Request ids", "hold-<deal> · capture-<deal> · void-<deal>"], ["On a void", "The buyer is ruled out; the agent can try the others"]],
    source: ["src/server/paypal/money.ts"],
    trust: "Claimed before the call; never sent twice",
  },
  {
    id: "openai",
    lane: "ai",
    title: "OpenAI",
    sub: "Responses API · gpt-5.4-mini",
    logo: "openai",
    summary: "The model behind your agent, the buyer agents, the chat and the paperwork reader. Low reasoning effort and structured outputs; every call is recorded with its tokens and time.",
    facts: [["Outputs", "zod-checked JSON for every move"], ["Recorded in", "ai_calls"]],
    source: ["src/server/ai/client.ts"],
  },
  {
    id: "rules",
    lane: "ai",
    title: "Rules in code",
    sub: "rules.ts · not a model",
    logo: "shield",
    summary: "Whatever a model says: asks never go below the floor, bids never above the buyer's own limit, and a deal needs one buyer for the whole load, unloaded before it spoils, at an open dock.",
    facts: [["Functions", "clampAsk · clampBid · cannotTake · dealAllowed"], ["Tests", "src/lib/rules.test.ts"]],
    source: ["src/lib/rules.ts", "src/lib/rules.test.ts"],
    trust: "Floor, limits, whole load and clock enforced in code",
  },
  {
    id: "caps",
    lane: "ai",
    title: "Spend cap",
    sub: "1,500 model calls an hour",
    logo: "gauge",
    summary: "The public demo can't run up the AI bill: model calls are counted in the database, and new negotiations and chats wait when the hour's cap is reached.",
    facts: [["Cap", "1,500 calls an hour, across all visitors"], ["Counted in", "ai_calls"]],
    source: ["src/server/ai/negotiate.ts"],
    trust: "Hourly cap on every AI route",
  },
  {
    id: "events",
    lane: "paypal",
    title: "Webhooks",
    sub: "events + signing certificates",
    logo: "paypal",
    summary: "PayPal signs every delivery. Spoilclock listens for holds, captures and voids.",
    facts: [["Events", "PAYMENT.AUTHORIZATION.CREATED, PAYMENT.AUTHORIZATION.VOIDED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED"]],
    source: ["scripts/register-webhook.mjs"],
  },
  {
    id: "vault",
    lane: "paypal",
    title: "Vault v3",
    sub: "/v3/vault/payment-tokens",
    logo: "paypal",
    summary: "Each buyer agent's card is saved once in PayPal's Vault. Spoilclock keeps only the token and the last four digits, so an agent can pay without a card number and without an approval page.",
    facts: [["Saved by", "scripts/setup-buyer-cards.ts"], ["Stored", "vault_id, brand, last 4"]],
    source: ["scripts/setup-buyer-cards.ts"],
  },
  {
    id: "orders",
    lane: "paypal",
    title: "Orders v2",
    sub: "intent: AUTHORIZE",
    logo: "paypal",
    summary: "The approved deal becomes an order authorized on the buyer's Vault card. PayPal holds the money; nothing is charged yet.",
    facts: [["Call", "POST /v2/checkout/orders · payment_source.card.vault_id"], ["Valid for", "29 days (sandbox)"]],
    source: ["src/server/paypal/money.ts"],
  },
  {
    id: "payments",
    lane: "paypal",
    title: "Payments v2",
    sub: "capture · void",
    logo: "paypal",
    summary: "Settles the hold when the dock decides: capture in full, capture only what arrived with final_capture (the rest is released), or void.",
    facts: [["Capture", "POST /v2/payments/authorizations/{id}/capture"], ["Void", "POST /v2/payments/authorizations/{id}/void"]],
    source: ["src/server/paypal/money.ts"],
  },
  {
    id: "neon",
    lane: "data",
    title: "Neon Postgres",
    sub: "runs · loads · offers · deals · events",
    logo: "neon",
    summary: "Each visitor's private run: trips, loads, every offer, buyer states, deals, the chat, files, PayPal events and model calls.",
    facts: [["Branches", "dev for local work, main for the live site"], ["Private", "Everything is scoped to the visitor's run"]],
    source: ["src/db/schema.ts"],
    trust: "Each visitor sees only their own run",
  },
  {
    id: "board",
    lane: "data",
    title: "Bryntum Scheduler",
    sub: "the Today board",
    logo: "schedule",
    summary: "Trucks as rows, trips as bars, a live now line. A rejected delivery turns rust; an approved deal's new delivery appears as a dashed bar.",
    facts: [["Build", "Trial, served from public/"], ["Clicks", "A delivery → report a rejection; a rescue → open it"]],
    source: ["src/components/today/board.tsx", "scripts/copy-bryntum.mjs"],
  },
];

export type ArchEdge = { id: string; from: string; to: string; label: string; kind?: "flow" | "event" | "gate" };

export const EDGES: ArchEdge[] = [
  { id: "grower-app", from: "grower", to: "app", label: "finds a buyer, approves" },
  { id: "grower-report", from: "grower", to: "report", label: "reports a rejection" },
  { id: "receiver-dock", from: "receiver", to: "dock", label: "checks the load" },
  { id: "report-inspect", from: "report", to: "inspect", label: "reads the paperwork" },
  { id: "inspect-openai", from: "inspect", to: "openai", label: "text or photo" },
  { id: "report-neon", from: "report", to: "neon", label: "opens a rescue" },
  { id: "app-negotiate", from: "app", to: "negotiate", label: "after(): negotiate" },
  { id: "app-chat", from: "app", to: "chat", label: "messages, files" },
  { id: "chat-openai", from: "chat", to: "openai", label: "answer + rule changes" },
  { id: "chat-rules", from: "chat", to: "rules", label: "changes checked" },
  { id: "negotiate-openai", from: "negotiate", to: "openai", label: "plan, tools, each move" },
  { id: "negotiate-buyers", from: "negotiate", to: "buyers", label: "asks" },
  { id: "buyers-openai", from: "buyers", to: "openai", label: "one call per buyer" },
  { id: "negotiate-rules", from: "negotiate", to: "rules", label: "every offer checked" },
  { id: "negotiate-caps", from: "negotiate", to: "caps", label: "hourly cap" },
  { id: "negotiate-neon", from: "negotiate", to: "neon", label: "every offer stored" },
  { id: "app-money", from: "app", to: "money", label: "grower approves", kind: "gate" },
  { id: "dock-money", from: "dock", to: "money", label: "receiver decides", kind: "gate" },
  { id: "money-neon", from: "money", to: "neon", label: "claim first" },
  { id: "money-orders", from: "money", to: "orders", label: "AUTHORIZE" },
  { id: "vault-orders", from: "vault", to: "orders", label: "card on file" },
  { id: "money-payments", from: "money", to: "payments", label: "capture · void" },
  { id: "money-board", from: "money", to: "board", label: "new delivery" },
  { id: "payments-events", from: "payments", to: "events", label: "PAYMENT.*", kind: "event" },
  { id: "events-webhook", from: "events", to: "webhook", label: "signed events", kind: "event" },
  { id: "webhook-neon", from: "webhook", to: "neon", label: "verified, stored" },
  { id: "app-neon", from: "app", to: "neon", label: "reads live" },
  { id: "app-board", from: "app", to: "board", label: "Today" },
];

export type JourneyStep = { title: string; sub: string; nodes: string[]; edges: string[]; call?: string };
export type Journey = { id: string; title: string; blurb: string; steps: JourneyStep[] };

export const JOURNEYS: Journey[] = [
  {
    id: "rescue",
    title: "A load is rescued",
    blurb: "Truck 14's strawberries, end to end",
    steps: [
      { title: "The grower clicks Find a buyer", sub: "The load is claimed so it runs once", nodes: ["grower", "app", "negotiate"], edges: ["grower-app", "app-negotiate"], call: "claimNegotiation(load) → after(negotiate)" },
      { title: "Your agent writes a plan", sub: "Its forced first move", nodes: ["negotiate", "openai"], edges: ["negotiate-openai"], call: "write_plan → read_file(inspection-report.pdf) → list_buyers" },
      { title: "It opens with an ask", sub: "Under the hourly cap", nodes: ["negotiate", "buyers", "caps"], edges: ["negotiate-buyers", "negotiate-caps"], call: "ask $195 a pallet · 16 pallets" },
      { title: "Buyer agents bid", sub: "One private call each", nodes: ["buyers", "openai"], edges: ["buyers-openai"], call: "Valley $140 · Bargain $130 · Coastal $120 for 8" },
      { title: "Code checks every offer", sub: "And stores it", nodes: ["negotiate", "rules", "neon"], edges: ["negotiate-rules", "negotiate-neon"], call: "clampAsk · clampBid · cannotTake(coastal) = only 8 of 16" },
      { title: "A deal is reached", sub: "After a few rounds", nodes: ["negotiate", "buyers", "neon"], edges: ["negotiate-buyers", "negotiate-neon"], call: "Valley Juice · $172 × 16 = $2,752 · $352 above the floor" },
      { title: "The grower approves", sub: "Nothing is held before this", nodes: ["grower", "app", "money"], edges: ["grower-app", "app-money"], call: "Approve and hold payment" },
      { title: "PayPal holds the money", sub: "On the buyer's Vault card", nodes: ["money", "orders", "vault", "neon"], edges: ["money-neon", "money-orders", "vault-orders"], call: "POST /v2/checkout/orders { intent: AUTHORIZE, vault_id } → CREATED" },
      { title: "The truck heads out", sub: "On the Today board", nodes: ["money", "board"], edges: ["money-board"], call: "new delivery · Valley Juice Co. · unloaded by 10:51 AM" },
      { title: "The dock accepts the load", sub: "On the receiver's phone", nodes: ["receiver", "dock", "money"], edges: ["receiver-dock", "dock-money"], call: "Accept all 16 pallets" },
      { title: "PayPal captures it", sub: "Claimed first, sent once", nodes: ["money", "payments"], edges: ["money-payments"], call: "authorizations/{id}/capture { final_capture: true } → COMPLETED" },
      { title: "PayPal confirms", sub: "A signed, verified event", nodes: ["payments", "events", "webhook", "neon"], edges: ["payments-events", "events-webhook", "webhook-neon"], call: "PAYMENT.CAPTURE.COMPLETED · signature verified" },
    ],
  },
  {
    id: "report",
    title: "A rejection is reported",
    blurb: "With the receiver's paperwork",
    steps: [
      { title: "The grower clicks a delivery", sub: "On the Today board", nodes: ["grower", "app", "board"], edges: ["grower-app", "app-board"], call: "Truck 08 · Delivery · Sunbelt Markets" },
      { title: "They attach the rejection notice", sub: "A PDF or a photo", nodes: ["grower", "report"], edges: ["grower-report"], call: "sunbelt-rejection.pdf" },
      { title: "The AI reads it", sub: "And the grower checks what it found", nodes: ["report", "inspect", "openai"], edges: ["report-inspect", "inspect-openai"], call: "tip burn · U.S. No. 2 · 9% soft · 3 °C → 37 °F" },
      { title: "A rescue opens", sub: "Clock from the crop's shelf life, floor from the farm's rules", nodes: ["report", "neon", "board"], edges: ["report-neon"], call: "openRejection(): lettuce · 30 h · floor 75% of $180" },
    ],
  },
  {
    id: "void",
    title: "The dock says no",
    blurb: "The hold is released, and the agent tries again",
    steps: [
      { title: "The receiver rejects the load", sub: "On the dock check", nodes: ["receiver", "dock", "money"], edges: ["receiver-dock", "dock-money"], call: "Reject load" },
      { title: "PayPal releases the hold", sub: "No money moves", nodes: ["money", "payments", "neon"], edges: ["money-payments", "money-neon"], call: "authorizations/{id}/void → VOIDED · buyer ruled out" },
      { title: "PayPal confirms", sub: "A signed, verified event", nodes: ["payments", "events", "webhook", "neon"], edges: ["payments-events", "events-webhook", "webhook-neon"], call: "PAYMENT.AUTHORIZATION.VOIDED · signature verified" },
      { title: "The agent goes back to the table", sub: "Without that buyer", nodes: ["grower", "app", "negotiate", "buyers"], edges: ["grower-app", "app-negotiate", "negotiate-buyers"], call: "Try again → Bargain Fresh at $164 a pallet (live test)" },
    ],
  },
  {
    id: "chat",
    title: "The grower talks to the agent",
    blurb: "A rule changed in plain words",
    steps: [
      { title: "A message, maybe with a file", sub: "In the load's chat", nodes: ["grower", "app", "chat"], edges: ["grower-app", "app-chat"], call: "“Don't sell to Bargain Fresh, they paid late”" },
      { title: "The agent answers", sub: "From the load's facts and files", nodes: ["chat", "openai"], edges: ["chat-openai"], call: "exclude_buyers: [bargain]" },
      { title: "Code decides what stands", sub: "And withdraws a deal it breaks", nodes: ["chat", "rules", "neon"], edges: ["chat-rules"], call: "Rule changed · Bargain Fresh excluded" },
    ],
  },
];

/** What the AI cannot do, and the part of the system that stops it. */
export const CANNOT: { title: string; how: string; node: string }[] = [
  { title: "Sell below the floor", how: "Every ask is clamped to the floor, and a deal is allowed only at or above it.", node: "rules" },
  { title: "Move money", how: "No agent has a PayPal tool. Only the grower's Approve and the receiver's tap reach PayPal.", node: "money" },
  { title: "Charge anyone twice", how: "Each step is claimed in the database first and sent with a fixed PayPal-Request-Id.", node: "money" },
  { title: "Pick a buyer that can't deliver", how: "One buyer for the whole load, unloaded before it spoils, at an open dock.", node: "rules" },
  { title: "Let a buyer agent overpay", how: "Each bid is clamped to that buyer's own private limit.", node: "rules" },
  { title: "Act on a forged PayPal event", how: "Every webhook is verified against PayPal's signature before it counts.", node: "webhook" },
  { title: "See another visitor's loads", how: "Every read and action is scoped to the visitor's own run.", node: "neon" },
  { title: "Run up the AI bill", how: "Model calls are counted and capped per hour across all visitors.", node: "caps" },
];

export type Decision = { area: string; chose: string; why: string };

export const DECISIONS: Decision[] = [
  { area: "Money", chose: "Authorize first, capture at the dock", why: "The buyer's money is held but not taken until the load is accepted, so a second rejection costs nobody anything, and short loads are charged only for what arrived." },
  { area: "Agent payments", chose: "Cards saved in PayPal's Vault", why: "An agent can't click a PayPal approval page, and Spoilclock never stores a card number, only PayPal's token and the last four digits." },
  { area: "Trust", chose: "Rules in code, not in the prompt", why: "The prompt says what's wise; code says what's allowed. A clamp can't be talked out of the floor." },
  { area: "Agent to agent", chose: "One model call per buyer, with a private brief", why: "So the buyer agents really don't know each other's limits, and the grower's agent can't read them either." },
  { area: "Model", chose: "gpt-5.4-mini, low reasoning effort", why: "Each move is a small, structured decision. A whole negotiation takes 17–26 seconds and about 11,600 tokens on the live site." },
  { area: "Demo", chose: "A private copy of the farm for each visitor", why: "Every judge gets their own rejected load and their own PayPal payments; nobody uses up anyone else's rescue." },
  { area: "Live updates", chose: "Store each offer, re-read the page", why: "Offers are written as they land and the page re-reads every 1.5 s, waiting for each read to finish. Simple, and it works on serverless." },
  { area: "Webhook security", chose: "Verify the signature on the raw bytes", why: "PayPal signs the exact body it sent, so the certificate check runs on the original bytes, with PayPal's verify API as a fallback." },
  { area: "Schedule", chose: "Bryntum Scheduler, served as a prebuilt file", why: "Bundling it took the build past 6 GB of memory; loading its ready-made module from public/ takes seconds." },
  { area: "Honesty", chose: "Sandbox, a fictional farm, simulated buyers", why: "The money flow is real PayPal and the agents are real model calls; the businesses aren't, and every screen says so." },
  { area: "Hosting", chose: "Vercel and Neon, deployed from GitHub", why: "Every push deploys; negotiations run after the response with after(), and local work uses a separate database branch." },
];
