"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { checkLoad } from "@/app/dock/[key]/actions";

/** Accept all · some pallets short · reject. Each one asks before it moves money. */
export function DockActions({ dockKey, pallets }: { dockKey: string; pallets: number }) {
  const [arrived, setArrived] = useState(pallets - 2);
  const [pending, start] = useTransition();
  const run = (outcome: Parameters<typeof checkLoad>[1], confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      const r = await checkLoad(dockKey, outcome);
      if (!r.ok) toast.error(r.error);
    });
  };
  return (
    <div className="space-y-3">
      <button
        disabled={pending}
        onClick={() => run({ kind: "accept" }, `Accept all ${pallets} pallets? PayPal will take the full payment.`)}
        className="flex h-16 w-full items-center justify-between rounded-xl bg-forest px-6 font-heading text-2xl text-card-soft shadow-soft hover:bg-forest-deep disabled:opacity-60"
      >
        Accept all {pallets} pallets
        <ArrowRight className="size-6" />
      </button>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card-soft px-5 py-3">
        <button disabled={pending} onClick={() => run({ kind: "short", pallets: arrived }, `Only ${arrived} of ${pallets} pallets arrived? PayPal will take payment for ${arrived} and release the rest.`)} className="text-left font-heading text-xl hover:text-forest disabled:opacity-60">
          Some pallets short
        </button>
        <div className="flex items-center rounded-lg border border-line">
          <button aria-label="One fewer" className="grid size-10 place-items-center" onClick={() => setArrived((n) => Math.max(1, n - 1))}>
            <Minus className="size-4" />
          </button>
          <span className="w-20 text-center tabular-nums">
            {arrived} of {pallets}
          </span>
          <button aria-label="One more" className="grid size-10 place-items-center" onClick={() => setArrived((n) => Math.min(pallets - 1, n + 1))}>
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <button
        disabled={pending}
        onClick={() => run({ kind: "reject" }, "Reject the load? PayPal will release the hold and no money moves.")}
        className="flex h-14 w-full items-center justify-between rounded-xl border border-spoiling/60 bg-card-soft px-6 font-heading text-xl text-spoiling hover:bg-spoiling-tint disabled:opacity-60"
      >
        Reject load
        <ArrowRight className="size-5" />
      </button>
      {pending && <p className="shimmer-text text-center text-sm">Telling PayPal…</p>}
    </div>
  );
}
