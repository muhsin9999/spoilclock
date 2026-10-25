"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { RotateCcw } from "lucide-react";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Stamp } from "@/components/brand/stamp";

// A replay of one rescue as the product shows it. The figures come from a real run of the agents (25 Oct).
const PHASES = [
  { at: 0, stamp: "Rejected", tone: "spoiling", line: "Rejected for cosmetic standards at 6:40 AM" },
  { at: 2600, stamp: "Rejected", tone: "spoiling", line: "Your agent is talking to 3 buyer agents…" },
  { at: 5600, stamp: "Rejected", tone: "spoiling", line: "Deal: Valley Juice Co. at $172 a pallet" },
  { at: 8200, stamp: "Held $2,752", tone: "forest", line: "You approved · PayPal is holding $2,752" },
  { at: 11200, stamp: "Paid $2,752", tone: "forest", line: "Accepted at the new dock · payment captured" },
] as const;

export function HeroCard({ now }: { now: number }) {
  const [run, setRun] = useState(0);
  const [i, setI] = useState(0);
  useEffect(() => {
    const timers = PHASES.map((p, k) => setTimeout(() => setI(k), p.at + 500));
    return () => timers.forEach(clearTimeout);
  }, [run]);
  const phase = PHASES[i];
  const done = i === PHASES.length - 1;

  return (
    <div className="relative rounded-2xl border border-line bg-card-soft p-7 shadow-soft">
      <div className="flex items-baseline justify-between gap-4 pr-28 sm:pr-40">
        <p className="font-heading text-xl">
          Truck 14 <span className="text-ink-muted">· strawberries<span className="hidden sm:inline"> · 16 pallets</span></span>
        </p>
      </div>
      <AnimatePresence mode="popLayout">
        <m.div
          key={phase.stamp}
          initial={{ scale: 1.6, opacity: 0, rotate: -14 }}
          animate={{ scale: 1, opacity: 1, rotate: -6 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="absolute -top-4 right-4"
        >
          <Stamp tone={phase.tone} className="text-lg">
            {phase.stamp}
          </Stamp>
        </m.div>
      </AnimatePresence>
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <FreshnessRing spoilsAt={now + 8 * 3_600_000 + 52 * 60_000} totalMs={10 * 3_600_000} now={now} className="mx-auto size-52" />
        <dl className="space-y-3 text-sm">
          {[
            ["Grade", "U.S. No. 1 · 6% soft"],
            ["Pulp temperature", "38°F"],
            ["Rejected by", "FreshMart DC"],
            ["Your floor", "$150 a pallet"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs tracking-[0.12em] text-ink-muted uppercase">{k}</dt>
              <dd className="text-[0.95rem]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
        <span className={done ? "size-2 rounded-full bg-forest" : "size-2 animate-pulse rounded-full bg-turning"} />
        <AnimatePresence mode="wait">
          <m.p key={phase.line} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex-1 text-[0.95rem]">
            {phase.line}
          </m.p>
        </AnimatePresence>
        {done && (
          <button
            type="button"
            onClick={() => {
              setI(0);
              setRun((r) => r + 1);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <RotateCcw className="size-3.5" /> Replay
          </button>
        )}
      </div>
    </div>
  );
}
