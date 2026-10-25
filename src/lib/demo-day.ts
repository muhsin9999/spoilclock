// The fictional farm's day, laid out around the moment a visitor's run starts, so the board is
// always "today". Salinas Ridge Farms, its trucks and its buyers are fictional (said on screen).

const H = 3_600_000;
const M = 60_000;

export const FARM = { name: "Salinas Ridge Farms", place: "Salinas, CA", timeZone: "America/Los_Angeles" };

export type Truck = { id: string; name: string; crop: "Strawberries" | "Lettuce" | "Tomatoes" | "Peaches"; pallets: number };
export type TripKind = "pickup" | "delivery" | "rejected" | "redelivery";

export const TRUCKS: Truck[] = [
  { id: "t14", name: "Truck 14", crop: "Strawberries", pallets: 16 },
  { id: "t08", name: "Truck 08", crop: "Lettuce", pallets: 10 },
  { id: "t22", name: "Truck 22", crop: "Tomatoes", pallets: 12 },
  { id: "t31", name: "Truck 31", crop: "Peaches", pallets: 8 },
];

/** Round to the quarter hour so bars line up neatly. */
const q = (t: number) => Math.round(t / (15 * M)) * 15 * M;

const TRIPS: [truckId: string, kind: TripKind, place: string, from: number, to: number][] = [
  ["t14", "pickup", "Field 3", -6.75, -4.75],
  ["t14", "delivery", "FreshMart DC", -3.5, -1.25],
  ["t08", "pickup", "Field 7", -5, -3],
  ["t08", "delivery", "Sunbelt Markets", 0.75, 3.5],
  ["t22", "pickup", "Packhouse", -3, -1],
  ["t22", "delivery", "FreshMart DC", 2, 5],
  ["t31", "pickup", "Orchard Ridge", -6, -4],
  ["t31", "delivery", "Harbor Foods", -1.5, 1.5],
];

/** Which delivery is turned away on each day the visitor runs: Truck 14's strawberries first, then the others. */
const REJECTED_BY_DAY = ["t14", "t31", "t08", "t22"];

export type RejectionDetails = { grade: string; softPct: number; pulpF: number; reason: string };

/** What the receiving inspector found, per crop, for the day's scripted rejection. */
export const SAMPLE_FINDINGS: Record<string, RejectionDetails> = {
  Strawberries: { grade: "U.S. No. 1", softPct: 6, pulpF: 38, reason: "Cosmetic standards" },
  Lettuce: { grade: "U.S. No. 1", softPct: 4, pulpF: 36, reason: "Tip burn on outer leaves" },
  Tomatoes: { grade: "U.S. No. 2", softPct: 7, pulpF: 55, reason: "Colour stage too advanced" },
  Peaches: { grade: "U.S. Extra No. 1", softPct: 5, pulpF: 34, reason: "Undersized fruit" },
};

/** The day as it stands when it starts at `anchor`: every trip, and which delivery was just turned away. */
export function seedDay(anchor: number, day = 1) {
  const at = (h: number) => new Date(q(anchor + h * H));
  const rejectedTruck = REJECTED_BY_DAY[(day - 1) % REJECTED_BY_DAY.length];
  const trips = TRIPS.map(([truckId, kind, place, from, to]) => {
    const t = TRUCKS.find((x) => x.id === truckId)!;
    return { truckId, kind, place, startAt: at(from), endAt: at(to), crop: kind === "delivery" ? t.crop : null, pallets: kind === "delivery" ? t.pallets : null };
  });
  // The rejected delivery ends just before now: the truck is standing at the receiver's dock.
  const i = trips.findIndex((t) => t.truckId === rejectedTruck && t.kind === "delivery");
  const len = trips[i].endAt.getTime() - trips[i].startAt.getTime();
  trips[i] = { ...trips[i], kind: "rejected", startAt: at(-1.25 - len / H), endAt: at(-1.25) };
  return { trips, rejected: trips[i] };
}

/** The board's time window around now. */
export function dayWindow(now: number) {
  return { start: q(now - 7 * H), end: q(now + 6 * H) };
}
