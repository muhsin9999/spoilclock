// Spoilclock's tables. Each visitor gets a run: a private copy of the farm's day with one rejected
// load to rescue. PayPal holds the money; these rows hold the day, the negotiation and the trail.
import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const at = (name = "created_at") => timestamp(name, { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

// One visitor's copy of Salinas Ridge Farms' day, laid out around the moment it started.
export const runs = pgTable("runs", {
  id: uuid("id").primaryKey(), // the visitor's cookie
  anchor: ts("anchor").notNull(), // "now" when the current day was laid out
  // The farm's standing rules, applied to every new rejected load.
  floorShare: integer("floor_share").notNull().default(75), // floor as % of what the original buyer was paying
  blocked: text("blocked").array().notNull().default(sql`'{}'::text[]`), // buyer ids never to sell to
  day: integer("day").notNull().default(1), // how many days this visitor has run
  createdAt: at(),
});

export const trips = pgTable(
  "trips",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    truckId: text("truck_id").notNull(),
    kind: text("kind").notNull(), // pickup | delivery | rejected | redelivery
    place: text("place").notNull(),
    startAt: ts("start_at").notNull(),
    endAt: ts("end_at").notNull(),
    loadId: uuid("load_id"),
    crop: text("crop"),
    pallets: integer("pallets"),
    createdAt: at(),
  },
  (t) => [index("trips_run").on(t.runId)],
);

// A load that was rejected at the dock and needs a new buyer before it spoils.
export const loads = pgTable(
  "loads",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    truckId: text("truck_id").notNull(),
    crop: text("crop").notNull(),
    pallets: integer("pallets").notNull(),
    grade: text("grade").notNull(),
    softPct: integer("soft_pct").notNull(),
    pulpF: integer("pulp_f").notNull(),
    rejectedBy: text("rejected_by").notNull(),
    reason: text("reason").notNull(),
    originalCents: integer("original_cents").notNull(), // per pallet, what the rejecting buyer was paying
    floorCents: integer("floor_cents").notNull(), // per pallet, never sell below
    excluded: text("excluded").array().notNull().default(sql`'{}'::text[]`), // buyer ids the grower ruled out
    rejectedAt: ts("rejected_at").notNull(),
    spoilsAt: ts("spoils_at").notNull(),
    // rejected → negotiating → deal_ready → held → captured | partial | voided ; or spoiled
    status: text("status").notNull().default("rejected"),
    createdAt: at(),
  },
  (t) => [index("loads_run").on(t.runId)],
);

// Every ask and bid, one row per agent per round.
export const offers = pgTable(
  "offers",
  {
    id: id(),
    loadId: uuid("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    by: text("by").notNull(), // "seller" or a buyer id
    perPalletCents: integer("per_pallet_cents").notNull(),
    pallets: integer("pallets").notNull(),
    message: text("message").notNull(),
    createdAt: at(),
  },
  (t) => [index("offers_load").on(t.loadId)],
);

// Where each buyer agent stands on a load.
export const buyerStates = pgTable(
  "buyer_states",
  {
    loadId: uuid("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id").notNull(),
    status: text("status").notNull(), // talking | deal | out | removed
    note: text("note").notNull(),
    updatedAt: at("updated_at"),
  },
  (t) => [uniqueIndex("buyer_states_pk").on(t.loadId, t.buyerId)],
);

// The agreed sale and its money trail on PayPal.
export const deals = pgTable("deals", {
  id: id(),
  loadId: uuid("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }), // one load can have a voided deal, then a new one
  buyerId: text("buyer_id").notNull(),
  pallets: integer("pallets").notNull(),
  perPalletCents: integer("per_pallet_cents").notNull(),
  arriveAt: ts("arrive_at").notNull(), // when the truck is unloaded at the buyer's dock
  // ready → held → captured | partial | voided
  status: text("status").notNull().default("ready"),
  paypalOrderId: text("paypal_order_id"),
  authorizationId: text("authorization_id"),
  captureId: text("capture_id"),
  capturedCents: integer("captured_cents"),
  dockKey: text("dock_key").notNull().default(sql`replace(gen_random_uuid()::text, '-', '')`), // the receiver's dock-check link
  approvedAt: ts("approved_at"),
  settledAt: ts("settled_at"),
  createdAt: at(),
});

// The load's chat: the grower, the agent, the agent's work and rule changes.
export const messages = pgTable(
  "messages",
  {
    id: id(),
    loadId: uuid("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // user | agent | work | rule
    body: jsonb("body").notNull(),
    createdAt: at(),
  },
  (t) => [index("messages_load").on(t.loadId)],
);

// Files the grower attached (inspection report, photos, temperature log).
export const files = pgTable("files", {
  id: id(),
  loadId: uuid("load_id").notNull().references(() => loads.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  bytes: integer("bytes").notNull(),
  text: text("text"), // extracted text the agent can read
  data: text("data"), // small images only, base64, so the agent can look at them
  sample: boolean("sample").notNull().default(false), // part of the demo day, not uploaded
  createdAt: at(),
});

// PayPal webhook deliveries, verified before they're trusted.
export const paypalEvents = pgTable("paypal_events", {
  id: id(),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  resourceId: text("resource_id"),
  dealId: uuid("deal_id"),
  verified: boolean("verified").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: at("received_at"),
});

// Every model call, for cost and the architecture page.
export const aiCalls = pgTable("ai_calls", {
  id: id(),
  loadId: uuid("load_id"),
  agent: text("agent").notNull(), // seller | buyer:<id> | chat
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  ms: integer("ms").notNull(),
  createdAt: at(),
});

// Each buyer agent's card on file, saved in PayPal's Vault. We keep only PayPal's token, never a card number.
export const buyerCards = pgTable("buyer_cards", {
  buyerId: text("buyer_id").primaryKey(),
  vaultId: text("vault_id").notNull(),
  brand: text("brand").notNull(),
  last4: text("last4").notNull(),
  createdAt: at(),
});

// The farm-wide conversation with your agent ("Ask your agent", on every page).
export const farmMessages = pgTable(
  "farm_messages",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    // One conversation. Null for messages from before conversations existed (shown as one earlier conversation).
    thread: uuid("thread"),
    kind: text("kind").notNull(), // user | agent
    body: jsonb("body").notNull(), // { text, files?, steps?, seconds?, links? }
    createdAt: at(),
  },
  (t) => [index("farm_messages_run").on(t.runId), index("farm_messages_thread").on(t.runId, t.thread, t.createdAt)],
);

// What your agent remembers: facts you told it, used in its later work (negotiations, the load chat).
export const notes = pgTable(
  "notes",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    buyerId: text("buyer_id"), // about one buyer, if any
    loadId: uuid("load_id"), // about one load, if any
    createdAt: at(),
  },
  (t) => [index("notes_run").on(t.runId)],
);
