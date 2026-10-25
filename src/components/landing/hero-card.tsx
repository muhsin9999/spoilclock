"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "motion/react";
import { RotateCcw } from "lucide-react";
import { AgentCrate, type CrateMood } from "@/components/brand/agent-crate";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Stamp } from "@/components/brand/stamp";

// A fast-forward replay of one rescue, as the product shows it. It starts when the card comes into view;
// the ring drains as the minutes pass. The figures come from a real run of the agents (25 Oct).
const H = 3_600_000;
const WINDOW = 10 * H;
const PHASES: { at: number; minutes: number; stamp: string; tone: "spoiling" | "forest"; mood: CrateMood; line: string }[] = [
  { at: 0, minutes: 0, stamp: "Rejected", tone: "spoiling", mood: "worried", line: "FreshMart DC turned Truck 14 away for cosmetic standards" },
  { at: 2200, minutes: 4, stamp: "Rejected", tone: "spoiling", mood: "working", line: "Your agent is talking to 3 buyer agents…" },
  { at: 5200, minutes: 9, stamp: "Rejected", tone: "spoiling", mood: "thinking", line: "Deal: Valley Juice Co. at $172 a pallet" },
  { at: 7800, minutes: 12, stamp: "Held $2,752", tone: "forest", mood: "happy", line: "You approved · PayPal is holding $2,752" },
  { at: 10600, minutes: 128, stamp: "Paid $2,752", tone: "forest", mood: "happy", line: "Accepted at the new dock · payment captured" },
];

export function HeroCard({ now }: { now: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [run, setRun] = useState(0);
  const [i, setI] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = PHASES.map((p, k) => setTimeout(() => setI(k), p.at + 300));
    // The clock runs fast between phases, so the ring visibly drains.
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const el = t - start - 300;
      const k = PHASES.findLastIndex((p) => p.at <= el);
      const a = PHASES[Math.max(0, k)];
      const b = PHASES[Math.min(PHASES.length - 1, k + 1)];
      const f = b === a ? 1 : Math.min(1, (el - a.at) / (b.at - a.at));
      setMinutes(a.minutes + (b.minutes - a.minutes) * Math.max(0, f));
      if (el < PHASES.at(-1)!.at) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [inView, run]);

  const phase = PHASES[i];
  const done = i === PHASES.length - 1;
  const rejectedAt = now;

  return (
    <div ref={ref} className="relative rounded-2xl border border-line bg-card-soft p-6 shadow-soft sm:p-7">
      <div className="pr-28 sm:pr-40">
        <p className="font-heading text-xl">
          Truck 14 <span className="text-ink-muted">· strawberries<span className="hidden sm:inline"> · 16 pallets</span></span>
        </p>
      </div>
      <AnimatePresence mode="popLayout">
        <m.div
          key={phase.stamp}
          initial={{ scale: 1.7, opacity: 0, rotate: -14 }}
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
        <FreshnessRing spoilsAt={rejectedAt + WINDOW} totalMs={WINDOW} now={now} clockAt={rejectedAt + minutes * 60_000} className="mx-auto size-52" />
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <AgentCrate mood={phase.mood} className="w-36" label="Your agent" />
          <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Grade", "U.S. No. 1"],
              ["Pulp temp", "38°F"],
              ["Was paying", "$200 / pallet"],
              ["Your floor", "$150 / pallet"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.7rem] tracking-[0.12em] text-ink-muted uppercase">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
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
              setMinutes(0);
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
