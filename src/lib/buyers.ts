// The buyer agents on the other side of the table. Simulated, and labelled so on screen.
// `public` is what the grower's agent may see; `brief` is private to each buyer agent.

export type BuyerId = "valley" | "bargain" | "coastal";

export type Buyer = {
  id: BuyerId;
  name: string;
  kind: string;
  color: string;
  driveMin: number; // from FreshMart DC, where Truck 14 is waiting
  unloadMin: number;
  brief: {
    maxCents: number; // per pallet, never above
    openCents: number; // first bid
    capacity: number; // pallets it can take
    maxSoftPct?: number; // refuses softer fruit
    dockHours?: [number, number]; // Pacific [open, close) for arrivals; none = receives around the clock
    style: string;
  };
};

export const BUYERS: Buyer[] = [
  {
    id: "valley",
    name: "Valley Juice Co.",
    kind: "Juice processor · 38 mi",
    color: "var(--forest)",
    driveMin: 55,
    unloadMin: 45,
    brief: { maxCents: 180_00, openCents: 140_00, capacity: 20, style: "A juice plant. Looks don't matter to you, soundness and sugar do. Patient and fair; you raise in steady steps when the seller moves too." },
  },
  {
    id: "bargain",
    name: "Bargain Fresh",
    kind: "Discount grocer · 61 mi",
    color: "var(--kraft)",
    driveMin: 80,
    unloadMin: 40,
    brief: { maxCents: 165_00, openCents: 130_00, capacity: 16, maxSoftPct: 8, style: "A discount grocery chain. A hard haggler who moves in small steps and likes to remind the seller the fruit was rejected." },
  },
  {
    id: "coastal",
    name: "Coastal Food Bank",
    kind: "Food bank · 14 mi",
    color: "#8f8a76",
    driveMin: 25,
    unloadMin: 30,
    brief: { maxCents: 135_00, openCents: 120_00, capacity: 8, dockHours: [8, 16], style: "A regional food bank on a tight budget. Warm and direct. You can only store 8 pallets today." },
  },
];

export const buyer = (id: string) => BUYERS.find((b) => b.id === id);
