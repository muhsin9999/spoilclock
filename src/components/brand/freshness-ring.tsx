"use client";

import { useNow } from "@/hooks/use-now";
import { rampColor, timeLeft } from "@/lib/freshness";
import { cn } from "@/lib/utils";
import { Leaf } from "./leaf-clock";

type Props = {
  /** When the load spoils (ms since epoch). */
  spoilsAt: number;
  /** Total shelf life the ring represents, in ms. */
  totalMs: number;
  /** Server time at render, so the first client render matches. */
  now: number;
  size?: "sm" | "lg";
  /** When the load was sold: the clock stops there and shows the time to spare. */
  stoppedAt?: number;
  className?: string;
};

const SEGMENTS = 96;

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * The freshness clock: what's left of the shelf life runs clockwise from 12 o'clock,
 * fresh green at the start and the current freshness colour at its end.
 * `sm` puts the leaf hand inside (top bar); `lg` puts the time inside (load cards).
 */
export function FreshnessRing({ spoilsAt, totalMs, now: serverNow, size = "lg", stoppedAt, className }: Props) {
  const ticking = useNow(serverNow, size === "sm" ? 15_000 : 1000);
  const now = stoppedAt ?? ticking;
  const left = Math.max(0, spoilsAt - now);
  const f = Math.min(1, left / totalMs);
  const r = size === "sm" ? 19 : 20.5;
  const stroke = size === "sm" ? 5 : 3.2;
  const n = Math.ceil(f * SEGMENTS);
  const label = timeLeft(left);

  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", size === "sm" ? "size-12" : "size-56", className)} role="img" aria-label={left > 0 ? (stoppedAt ? `Sold with ${label} to spare` : `${label} left before it spoils`) : "Spoiled"}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--wheat)" strokeWidth={stroke} />
        {Array.from({ length: n }, (_, i) => {
          const p0 = i / SEGMENTS;
          const p1 = Math.min(f, (i + 1) / SEGMENTS);
          return <path key={i} d={arc(24, 24, r, p0 * 2 * Math.PI, p1 * 2 * Math.PI + 0.004)} fill="none" stroke={rampColor(1 - (p0 / Math.max(f, 1e-6)) * (1 - f))} strokeWidth={stroke} />;
        })}
        {size === "sm" && <Leaf angle={f * 360} />}
      </svg>
      {size === "lg" && (
        <div className="relative text-center font-heading leading-none text-ink">
          <div className="text-[2.6rem] font-medium tracking-tight tabular-nums">{label}</div>
          {left > 0 && <div className="mt-1.5 text-2xl">{stoppedAt ? "to spare" : "left"}</div>}
        </div>
      )}
    </div>
  );
}

/** Top-bar version: the small ring with the leaf hand, then the time. */
export function FreshnessChip(props: Omit<Props, "size">) {
  const now = useNow(props.now, 15_000);
  return (
    <span className="inline-flex items-center gap-2.5">
      <FreshnessRing {...props} size="sm" />
      <span className="font-heading text-2xl font-medium tracking-tight text-ink tabular-nums">{timeLeft(props.spoilsAt - now)}</span>
    </span>
  );
}
