"use client";

import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, m, useInView, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { RotateCcw, Truck } from "lucide-react";
import { Stamp } from "@/components/brand/stamp";

// One rescued load on a clock, 6 AM to 11 AM. The truck drives along it; as it reaches each stage, that stage's
// stamp lands and its card opens. Times are illustrative; the negotiation really takes about a minute.
const START = 6 * 60;
const END = 11 * 60;
const at = (h: number, min: number) => (h * 60 + min - START) / (END - START);

const STAGES = [
  { p: at(6, 40), stamp: "Rejected", tone: "spoiling" as const, time: "6:40 AM", title: "Turned away", text: "FreshMart DC rejects Truck 14 for cosmetic standards. 16 pallets, about 10 hours of shelf life." },
  { p: at(6, 52), stamp: "Held $2,752", tone: "forest" as const, time: "6:52 AM", title: "Sold, money held", text: "Your agent and 3 buyer agents agree $172 a pallet. You approve; PayPal holds the money." },
  { p: at(8, 40), stamp: "Paid $2,752", tone: "forest" as const, time: "8:40 AM", title: "Accepted, paid", text: "Valley Juice's receiver accepts the load on a phone. PayPal captures the payment." },
];

export function LoadDay() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const progress = useMotionValue(at(6, 30));
  const left = useTransform(progress, (v) => `${v * 100}%`);
  const [reached, setReached] = useState(-1);
  const [played, setPlayed] = useState(false);

  useMotionValueEvent(progress, "change", (v) => setReached(STAGES.filter((s) => v >= s.p).length - 1));

  // Quick to the rejection, a pause while the agents work, then the drive to the new dock.
  const drive = () => {
    progress.set(at(6, 30));
    animate(progress, [at(6, 30), at(6, 41), at(6, 41), at(6, 53), at(6, 53), at(8, 41)], { duration: 5.2, times: [0, 0.14, 0.28, 0.42, 0.52, 1], ease: "easeInOut" }).then(() => setPlayed(true));
  };
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    drive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div ref={ref} className="relative">
      <div className="relative h-8 text-xs text-ink-muted">
        {[6, 7, 8, 9, 10, 11].map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: `${at(h, 0) * 100}%` }}>
            {h}
            <span className="hidden sm:inline"> AM</span>
          </span>
        ))}
      </div>
      <div className="relative h-20">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {[6, 7, 8, 9, 10, 11].map((h) => (
          <span key={h} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line" style={{ left: `${at(h, 0) * 100}%` }} />
        ))}
        <m.div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-forest/50" style={{ left: `${at(6, 30) * 100}%`, width: useTransform(progress, (v) => `${(v - at(6, 30)) * 100}%`) }} />
        {STAGES.map((s, i) => (
          <m.span
            key={s.time}
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card-soft"
            style={{ left: `${s.p * 100}%` }}
            animate={{ backgroundColor: reached >= i ? (s.tone === "spoiling" ? "#b0452e" : "#2f5d3a") : "#e2d7c0", scale: reached === i ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 0.4 }}
          />
        ))}
        <m.div className="absolute top-1/2 -translate-x-1/2 -translate-y-[135%] text-forest-deep" style={{ left }}>
          <Truck className="size-8" strokeWidth={1.6} />
        </m.div>
      </div>
      <ol className="mt-4 grid gap-5 md:grid-cols-3">
        {STAGES.map((s, i) => (
          <li key={s.time} className={`relative min-h-40 rounded-xl border p-5 transition-colors duration-500 ${reached >= i ? "border-line bg-card-soft" : "border-dashed border-line/80 bg-transparent"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-ink-muted">{s.time}</span>
              <AnimatePresence>
                {reached >= i && (
                  <m.span initial={{ scale: 1.8, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: -4 }} transition={{ type: "spring", stiffness: 420, damping: 20 }}>
                    <Stamp tone={s.tone} className="text-sm">
                      {s.stamp}
                    </Stamp>
                  </m.span>
                )}
              </AnimatePresence>
            </div>
            <m.div initial={false} animate={{ opacity: reached >= i ? 1 : 0.25, y: reached >= i ? 0 : 6 }} transition={{ duration: 0.4 }}>
              <p className="mt-3 font-heading text-xl">{s.title}</p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-ink/80">{s.text}</p>
            </m.div>
          </li>
        ))}
      </ol>
      {played && (
        <button
          type="button"
          onClick={() => {
            setReached(-1);
            drive();
          }} className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <RotateCcw className="size-3.5" /> Replay the morning
        </button>
      )}
    </div>
  );
}
