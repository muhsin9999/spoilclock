"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "motion/react";
import { RotateCcw } from "lucide-react";
import { AgentCrate, type CrateMood } from "@/components/brand/agent-crate";

// A short replay of a real negotiation (25 Oct run): your agent's ask comes down, the buyer agents' bids come up.
const ROUNDS = [
  { ask: 195, bids: { valley: 140, bargain: 130, coastal: 120 } },
  { ask: 186, bids: { valley: 155, bargain: 140, coastal: 128 } },
  { ask: 178, bids: { valley: 165, bargain: 150, coastal: null } },
  { ask: 172, bids: { valley: 172, bargain: 155, coastal: null } },
] as const;
const BUYERS = [
  { id: "valley", name: "Valley Juice Co.", kind: "Juice processor", color: "var(--forest)", out: "" },
  { id: "bargain", name: "Bargain Fresh", kind: "Discount grocer", color: "var(--kraft)", out: "" },
  { id: "coastal", name: "Coastal Food Bank", kind: "Food bank", color: "#8f8a76", out: "Walked: room for 8 pallets only" },
] as const;

export function TablePreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [round, setRound] = useState(-1);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = ROUNDS.map((_, i) => setTimeout(() => setRound(i), 600 + i * 1300));
    return () => t.forEach(clearTimeout);
  }, [inView, run]);

  const r = round >= 0 ? ROUNDS[round] : null;
  const deal = round === ROUNDS.length - 1;
  const mood: CrateMood = deal ? "happy" : round >= 0 ? "working" : "idle";

  return (
    <div ref={ref} className="relative grid min-w-0 items-center gap-6 rounded-2xl border border-line bg-parchment/60 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
      <div className="text-center">
        <AgentCrate mood={mood} followCursor={round < 0} className="mx-auto w-36" />
        <p className="mt-2 font-heading text-lg">Your agent</p>
        <AnimatePresence mode="wait">
          <m.p key={r?.ask ?? "x"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ink-muted tabular-nums">
            {r ? (deal ? `Deal at $${r.ask} a pallet` : `asks $${r.ask} a pallet`) : "knows your floor"}
          </m.p>
        </AnimatePresence>
      </div>
      <ul className="min-w-0 space-y-3">
        {BUYERS.map((b) => {
          const bid = r ? r.bids[b.id] : undefined;
          const won = deal && b.id === "valley";
          const gone = r && bid === null;
          return (
            <li key={b.id} className={`flex items-center gap-3 rounded-xl border bg-card-soft p-3 transition-colors duration-500 ${won ? "border-forest" : "border-line"} ${gone ? "opacity-55" : ""}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm text-card-soft" style={{ background: b.color }} aria-hidden>
                {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{b.name}</p>
                <p className="truncate text-xs text-ink-muted">{gone ? b.out : `Buyer agent · ${b.kind} · limits private`}</p>
              </div>
              <AnimatePresence mode="wait">
                {bid != null && (
                  <m.span key={bid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-md px-2 py-0.5 font-heading tabular-nums ${won ? "bg-forest text-card-soft" : "bg-wheat"}`}>
                    ${bid}
                  </m.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      {deal && (
        <button
          type="button"
          onClick={() => {
            setRound(-1);
            setRun((x) => x + 1);
          }}
          className="absolute right-4 bottom-3 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <RotateCcw className="size-3" /> Replay
        </button>
      )}
    </div>
  );
}
