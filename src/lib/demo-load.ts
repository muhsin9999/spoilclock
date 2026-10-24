// DEV SAMPLE: the shape the negotiation engine will produce, used to design the load page.
// Replaced by real engine output (stored per run) before anything ships.

export type Buyer = { id: string; name: string; kind: string; color: string };
export type Offer = { round: number; by: "seller" | string; perPallet: number };
export type BuyerOutcome = { buyerId: string; status: "deal" | "out" | "removed"; note: string };
export type ChatMessage =
  | { kind: "user"; text: string; files?: string[] }
  | { kind: "agent"; text: string }
  | { kind: "work"; steps: string[]; seconds: number }
  | { kind: "rule"; text: string };

export const BUYERS: Buyer[] = [
  { id: "valley", name: "Valley Juice Co.", kind: "Juice processor · 38 mi", color: "var(--forest)" },
  { id: "bargain", name: "Bargain Fresh", kind: "Discount grocer · 61 mi", color: "var(--kraft)" },
  { id: "coastal", name: "Coastal Food Bank", kind: "Food bank · 14 mi", color: "#8f8a76" },
];

export const SAMPLE = {
  load: {
    truck: "Truck 14",
    crop: "Strawberries",
    pallets: 16,
    grade: "U.S. No. 1",
    softPct: 6,
    pulpF: 38,
    rejectedBy: "FreshMart DC",
    reason: "Cosmetic standards",
    originalPerPallet: 200,
    floorPerPallet: 150,
    files: ["inspection-14.pdf", "dock-photo-1.jpg", "temp-log.csv"],
  },
  offers: [
    ...[210, 196, 186, 178, 172].map((p, i) => ({ round: i + 1, by: "seller", perPallet: p })),
    ...[140, 152, 162, 168, 172].map((p, i) => ({ round: i + 1, by: "valley", perPallet: p })),
    ...[130, 145, 155].map((p, i) => ({ round: i + 1, by: "bargain", perPallet: p })),
    ...[120, 128, 135].map((p, i) => ({ round: i + 1, by: "coastal", perPallet: p })),
  ] as Offer[],
  outcomes: [
    { buyerId: "valley", status: "deal", note: "Agreed $172 a pallet · can unload by 1:40 PM" },
    { buyerId: "bargain", status: "removed", note: "Removed by you · paid late last time" },
    { buyerId: "coastal", status: "out", note: "Can take only 8 of 16 pallets" },
  ] as BuyerOutcome[],
  deal: { buyerId: "valley", perPallet: 172, arriveBy: "1:40 PM", marginBeforeSpoil: "3 h 50 m" },
  chat: [
    { kind: "work", steps: ["Read the inspection report", "Graded the lot: U.S. No. 1, 6% soft", "Found 3 buyers within reach", "Opened talks with all 3"], seconds: 41 },
    { kind: "agent", text: "FreshMart rejected Truck 14 on cosmetic standards. The berries are sound for juice and discount retail. I'm talking to 3 buyers and won't go under your $150 floor." },
    { kind: "user", text: "Don't sell to Bargain Fresh, they paid late last time.", files: ["inspection-14.pdf"] },
    { kind: "rule", text: "Rule changed · Bargain Fresh excluded" },
    { kind: "agent", text: "Understood. Bargain Fresh is out. Valley Juice is at $172 a pallet and can unload by 1:40 PM. That's the deal I'd take." },
  ] as ChatMessage[],
};
