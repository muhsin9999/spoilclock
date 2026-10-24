// The fictional farm's day, laid out around the current time so the board is always "today".
// Salinas Ridge Farms and its buyers are fictional (said on every screen that shows them).

const H = 3_600_000;
const M = 60_000;

export const FARM = { name: "Salinas Ridge Farms", place: "Salinas, CA", timeZone: "America/Los_Angeles" };

export type Truck = { id: string; name: string; crop: string; pallets: number };
export type Trip = {
  id: string;
  truckId: string;
  kind: "pickup" | "delivery" | "rejected" | "redelivery";
  place: string;
  start: number;
  end: number;
};

export const TRUCKS: Truck[] = [
  { id: "t14", name: "Truck 14", crop: "Strawberries", pallets: 16 },
  { id: "t08", name: "Truck 08", crop: "Lettuce", pallets: 10 },
  { id: "t22", name: "Truck 22", crop: "Tomatoes", pallets: 12 },
  { id: "t31", name: "Truck 31", crop: "Peaches", pallets: 8 },
];

/** Round to the quarter hour so bars line up neatly. */
const q = (t: number) => Math.round(t / (15 * M)) * 15 * M;

export function buildDay(now: number) {
  const at = (h: number) => q(now + h * H);
  const trips: Trip[] = [
    { id: "a", truckId: "t14", kind: "pickup", place: "Field 3", start: at(-6.75), end: at(-4.75) },
    { id: "b", truckId: "t14", kind: "rejected", place: "FreshMart DC", start: at(-3.5), end: at(-1.25) },
    { id: "c", truckId: "t08", kind: "pickup", place: "Field 7", start: at(-5), end: at(-3) },
    { id: "d", truckId: "t08", kind: "delivery", place: "Sunbelt Markets", start: at(0.75), end: at(3.5) },
    { id: "e", truckId: "t22", kind: "pickup", place: "Packhouse", start: at(-3), end: at(-1) },
    { id: "f", truckId: "t22", kind: "delivery", place: "FreshMart DC", start: at(2), end: at(5) },
    { id: "g", truckId: "t31", kind: "pickup", place: "Orchard Ridge", start: at(-6), end: at(-4) },
    { id: "h", truckId: "t31", kind: "delivery", place: "Harbor Foods", start: at(-1.5), end: at(1.5) },
  ];
  return {
    trips,
    window: { start: q(now - 7 * H), end: q(now + 6 * H) },
    // The rescue window runs from the rejection to the moment the berries spoil: 8 h 52 m of it left.
    rejected: { truckId: "t14", rejectedAt: at(-1.25), spoilsAt: now + 8 * H + 52 * M, totalMs: 8 * H + 52 * M + (now - at(-1.25)), buyer: "FreshMart DC" },
  };
}
