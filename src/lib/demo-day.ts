// The fictional farm's day, laid out around the moment a visitor's run starts, so the board is
// always "today". Salinas Ridge Farms, its trucks and its buyers are fictional (said on screen).

const H = 3_600_000;
const M = 60_000;

export const FARM = { name: "Salinas Ridge Farms", place: "Salinas, CA", timeZone: "America/Los_Angeles" };

export type Truck = { id: string; name: string; crop: string; pallets: number };
export type TripKind = "pickup" | "delivery" | "rejected" | "redelivery";

export const TRUCKS: Truck[] = [
  { id: "t14", name: "Truck 14", crop: "Strawberries", pallets: 16 },
  { id: "t08", name: "Truck 08", crop: "Lettuce", pallets: 10 },
  { id: "t22", name: "Truck 22", crop: "Tomatoes", pallets: 12 },
  { id: "t31", name: "Truck 31", crop: "Peaches", pallets: 8 },
];

/** Round to the quarter hour so bars line up neatly. */
const q = (t: number) => Math.round(t / (15 * M)) * 15 * M;

/** The day as it stands when a run starts at `anchor`: trips, and the load FreshMart just rejected. */
export function seedDay(anchor: number) {
  const at = (h: number) => new Date(q(anchor + h * H));
  const trip = (truckId: string, kind: TripKind, place: string, from: number, to: number) => ({ truckId, kind, place, startAt: at(from), endAt: at(to) });
  return {
    trips: [
      trip("t14", "pickup", "Field 3", -6.75, -4.75),
      trip("t14", "rejected", "FreshMart DC", -3.5, -1.25),
      trip("t08", "pickup", "Field 7", -5, -3),
      trip("t08", "delivery", "Sunbelt Markets", 0.75, 3.5),
      trip("t22", "pickup", "Packhouse", -3, -1),
      trip("t22", "delivery", "FreshMart DC", 2, 5),
      trip("t31", "pickup", "Orchard Ridge", -6, -4),
      trip("t31", "delivery", "Harbor Foods", -1.5, 1.5),
    ],
    load: {
      truckId: "t14",
      crop: "Strawberries",
      pallets: 16,
      grade: "U.S. No. 1",
      softPct: 6,
      pulpF: 38,
      rejectedBy: "FreshMart DC",
      reason: "Cosmetic standards",
      originalCents: 200_00,
      floorCents: 150_00,
      rejectedAt: at(-1.25),
      // Strawberries held near 38°F: about 10 hours of sellable life left when FreshMart turned them away.
      spoilsAt: new Date(anchor + 8 * H + 52 * M),
    },
  };
}

/** The board's time window around now. */
export function dayWindow(now: number) {
  return { start: q(now - 7 * H), end: q(now + 6 * H) };
}
