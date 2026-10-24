// Shelf life → the freshness ramp. Used by every freshness ring, bar and label.

const RAMP: [number, [number, number, number]][] = [
  [0, [0xb0, 0x45, 0x2e]], // spoiling
  [0.4, [0xc8, 0x95, 0x2b]], // turning
  [1, [0x4e, 0x8a, 0x3e]], // fresh
];

/** Colour for a share of shelf life left (1 = just picked, 0 = spoiled). */
export function rampColor(t: number) {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < RAMP.length; i++) {
    const [t1, c1] = RAMP[i];
    const [t0, c0] = RAMP[i - 1];
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${c.join(" ")})`;
    }
  }
  return "rgb(78 138 62)";
}

export type FreshnessState = "fresh" | "turning" | "spoiling" | "spoiled";

export function freshnessState(leftMs: number, totalMs: number): FreshnessState {
  if (leftMs <= 0) return "spoiled";
  const t = leftMs / totalMs;
  return t > 0.5 ? "fresh" : t > 0.2 ? "turning" : "spoiling";
}

/** "8 h 52 m", "42 m", "1 d 4 h", "Spoiled". */
export function timeLeft(ms: number) {
  if (ms <= 0) return "Spoiled";
  const m = Math.floor(ms / 60_000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m % 60} m`;
  return `${Math.max(1, m)} m`;
}
