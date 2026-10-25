"use client";

import { m } from "motion/react";
import { Truck } from "lucide-react";
import { Stamp } from "@/components/brand/stamp";

// One rescued load on a clock, 6 AM to 11 AM. Times are illustrative; the minute-long negotiation is what
// the agents actually take (about a minute on the live site).
const START = 6 * 60;
const END = 11 * 60;
const pct = (h: number, min: number) => `${(((h * 60 + min - START) / (END - START)) * 100).toFixed(2)}%`;

const EVENTS = [
  { at: pct(6, 40), stamp: "Rejected", tone: "spoiling" as const, time: "6:40 AM", text: "FreshMart DC turns Truck 14 away for cosmetic standards. 16 pallets, about 10 hours of shelf life." },
  { at: pct(6, 52), stamp: "Held $2,752", tone: "forest" as const, time: "6:52 AM", text: "Your agent and 3 buyer agents agree a price. You approve; PayPal holds the money." },
  { at: pct(8, 40), stamp: "Paid $2,752", tone: "forest" as const, time: "8:40 AM", text: "Valley Juice's dock accepts the load on a phone. PayPal captures the payment." },
];

export function LoadDay() {
  return (
    <div className="relative">
      {/* hour axis */}
      <div className="relative h-8 text-xs text-ink-muted">
        {[6, 7, 8, 9, 10, 11].map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h, 0) }}>
            {h === 11 ? "11" : h}<span className="hidden sm:inline"> AM</span>
          </span>
        ))}
      </div>
      {/* the road */}
      <div className="relative h-16">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-spoiling/70" style={{ left: pct(6, 40), width: `calc(${pct(6, 52)} - ${pct(6, 40)})` }} />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full border-y border-dashed border-forest bg-forest-tint" style={{ left: pct(7, 0), width: `calc(${pct(8, 40)} - ${pct(7, 0)})` }} />
        {[6, 7, 8, 9, 10, 11].map((h) => (
          <span key={h} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line" style={{ left: pct(h, 0) }} />
        ))}
        {EVENTS.map((e) => (
          <span key={e.time} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card-soft bg-ink" style={{ left: e.at }} />
        ))}
        <m.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-[130%] text-forest"
          initial={{ left: pct(6, 40) }}
          whileInView={{ left: pct(8, 40) }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 3.2, delay: 0.6, ease: [0.45, 0, 0.2, 1] }}
        >
          <Truck className="size-7" strokeWidth={1.6} />
        </m.div>
      </div>
      {/* what happened */}
      <ol className="mt-4 grid gap-5 md:grid-cols-3">
        {EVENTS.map((e, i) => (
          <m.li
            key={e.time}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.3 + i * 0.9 }}
            className="rounded-xl border border-line bg-card-soft p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-ink-muted">{e.time}</span>
              <Stamp tone={e.tone} className="text-sm">
                {e.stamp}
              </Stamp>
            </div>
            <p className="mt-3 text-[0.95rem] leading-relaxed">{e.text}</p>
          </m.li>
        ))}
      </ol>
    </div>
  );
}
