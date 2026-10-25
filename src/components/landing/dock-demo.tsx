"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, BadgeCheck, Lock, Minus, Plus, RotateCcw } from "lucide-react";
import { Stamp } from "@/components/brand/stamp";

// A tappable preview of the receiver's dock check. In the app the same three buttons make real PayPal sandbox
// calls (src/server/paypal/money.ts); here they only show what each call does.
const PRICE = 172;
const PALLETS = 16;
type Outcome = { kind: "accept" } | { kind: "short"; n: number } | { kind: "reject" };

function explain(o: Outcome) {
  if (o.kind === "reject")
    return {
      stamp: "Voided",
      tone: "spoiling" as const,
      call: "POST /v2/payments/authorizations/{id}/void",
      result: "VOIDED",
      hook: "PAYMENT.AUTHORIZATION.VOIDED",
      lines: [["Buyer charged", "$0"], ["Farm receives", "$0"], ["Your agent", "goes back to the other buyers"]],
    };
  const n = o.kind === "short" ? o.n : PALLETS;
  const usd = (x: number) => `$${x.toLocaleString("en-US")}`;
  return {
    stamp: n < PALLETS ? `Part paid ${usd(n * PRICE)}` : `Paid ${usd(n * PRICE)}`,
    tone: "forest" as const,
    call: `POST /v2/payments/authorizations/{id}/capture  { amount: ${usd(n * PRICE)}, final_capture: true }`,
    result: "COMPLETED",
    hook: "PAYMENT.CAPTURE.COMPLETED",
    lines: [["Buyer charged", usd(n * PRICE)], ["Farm receives", usd(n * PRICE)], ...(n < PALLETS ? [["Released, never charged", usd((PALLETS - n) * PRICE)]] : [])],
  };
}

export function DockDemo() {
  const [n, setN] = useState(14);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const e = outcome && explain(outcome);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
      {/* the phone */}
      <div className="mx-auto w-[310px] max-w-full rounded-[2.4rem] border-[10px] border-ink bg-parchment p-4 shadow-soft">
        <p className="text-center text-xs text-ink-muted">Dock check · Valley Juice Co.</p>
        <p className="mt-2 font-heading text-xl">Truck 14 · 16 pallets</p>
        <div className="relative mt-3 grid h-24 place-items-center rounded-xl border border-line bg-card-soft">
          <AnimatePresence mode="wait">
            <m.span key={e?.stamp ?? "held"} initial={{ scale: 1.8, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -5 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 20 }}>
              <Stamp tone={e?.tone ?? "forest"} className="text-lg">
                {e?.stamp ?? "Held $2,752"}
              </Stamp>
            </m.span>
          </AnimatePresence>
        </div>
        <div className="mt-3 space-y-2">
          <button disabled={!!outcome} onClick={() => setOutcome({ kind: "accept" })} className="flex h-12 w-full items-center justify-between rounded-xl bg-forest px-4 font-heading text-lg text-card-soft disabled:opacity-50">
            Accept all 16 <ArrowRight className="size-4" />
          </button>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card-soft px-3 py-2">
            <button disabled={!!outcome} onClick={() => setOutcome({ kind: "short", n })} className="text-left font-heading text-[0.95rem] disabled:opacity-50">
              Some short
            </button>
            <span className="flex items-center rounded-lg border border-line text-sm">
              <button aria-label="One fewer" disabled={!!outcome} onClick={() => setN((x) => Math.max(1, x - 1))} className="grid size-8 place-items-center">
                <Minus className="size-3.5" />
              </button>
              <span className="w-16 text-center whitespace-nowrap tabular-nums">{n} of 16</span>
              <button aria-label="One more" disabled={!!outcome} onClick={() => setN((x) => Math.min(15, x + 1))} className="grid size-8 place-items-center">
                <Plus className="size-3.5" />
              </button>
            </span>
          </div>
          <button disabled={!!outcome} onClick={() => setOutcome({ kind: "reject" })} className="flex h-11 w-full items-center justify-between rounded-xl border border-spoiling/60 px-4 font-heading text-[0.95rem] text-spoiling disabled:opacity-50">
            Reject load <ArrowRight className="size-4" />
          </button>
        </div>
        <p className="mt-3 flex gap-2 text-[0.7rem] text-ink-muted">
          <Lock className="size-3 shrink-0" /> PayPal is holding the payment. Money moves only when you confirm.
        </p>
      </div>

      {/* what PayPal did */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {e ? (
            <m.div key={e.stamp} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm tracking-[0.14em] text-kraft uppercase">What PayPal does</p>
              <pre className="overflow-x-auto rounded-xl border border-line bg-card-soft p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {e.call}
                {"\n"}→ {e.result}
              </pre>
              <p className="flex items-center gap-2 text-sm text-forest">
                <BadgeCheck className="size-4" /> {e.hook}, signature checked before it counts
              </p>
              <dl className="divide-y divide-line rounded-xl border border-line bg-card-soft">
                {e.lines.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-heading text-lg tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <button onClick={() => setOutcome(null)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
                <RotateCcw className="size-3.5" /> Try another outcome
              </button>
            </m.div>
          ) : (
            <m.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="font-heading text-2xl leading-snug">You&apos;re the receiver at Valley Juice&apos;s dock. Check the load, then tap.</p>
              <p className="text-ink/80">PayPal is already holding $2,752 on the buyer agent&apos;s saved card. What you tap decides what PayPal does with it.</p>
              <p className="text-sm text-ink-muted">A preview: in the app, these buttons make real PayPal sandbox calls.</p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
