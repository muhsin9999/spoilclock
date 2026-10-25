// The rules code enforces around the agents. The models propose; these decide what actually stands.
import { limits, type Buyer } from "./buyers";

const MIN = 60_000;

export type LoadFacts = { pallets: number; softPct: number; floorCents: number; spoilsAt: number; excluded: string[] };

/** The seller's ask can't go below the floor or back up above its last ask, and moves in whole dollars. */
export function clampAsk(askCents: number, floorCents: number, lastAskCents?: number) {
  let a = Math.round(askCents / 100) * 100;
  if (lastAskCents !== undefined) a = Math.min(a, lastAskCents);
  return Math.max(a, floorCents);
}

/** A buyer agent bids within its own brief: never above its max, never below its last bid. */
export function clampBid(b: Buyer, originalCents: number, bidCents: number, lastBidCents?: number) {
  let v = Math.round(bidCents / 100) * 100;
  v = Math.min(v, limits(b, originalCents).maxCents);
  if (lastBidCents !== undefined) v = Math.max(v, lastBidCents);
  return v;
}

/** When the truck would finish unloading at this buyer if it left now (plus 15 minutes to turn around). */
export function arrival(b: Buyer, now: number) {
  const leave = now + 15 * MIN;
  return { arriveAt: leave + b.driveMin * MIN, doneAt: leave + (b.driveMin + b.unloadMin) * MIN };
}

/** Pacific hour of a timestamp (0–23). */
export function pacificHour(t: number) {
  return Number(new Date(t).toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }));
}

/** Why this buyer can't take this load right now, or null if it can. */
export function cannotTake(b: Buyer, load: LoadFacts, now: number): string | null {
  if (load.excluded.includes(b.id)) return "Removed by you";
  if (b.brief.capacity < load.pallets) return `Can take only ${b.brief.capacity} of ${load.pallets} pallets`;
  if (b.brief.maxSoftPct !== undefined && load.softPct > b.brief.maxSoftPct) return `Won't take fruit over ${b.brief.maxSoftPct}% soft`;
  const { arriveAt, doneAt } = arrival(b, now);
  if (doneAt > load.spoilsAt) return "Can't unload before the fruit spoils";
  const hours = b.brief.dockHours;
  if (hours && (pacificHour(arriveAt) < hours[0] || pacificHour(arriveAt) >= hours[1])) return "Dock closed by the time the truck arrives";
  return null;
}

/** A deal stands only at or above the floor, with a buyer who can still take the whole load in time. */
export function dealAllowed(b: Buyer, perPalletCents: number, load: LoadFacts, now: number) {
  return perPalletCents >= load.floorCents && cannotTake(b, load, now) === null;
}
