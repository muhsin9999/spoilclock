"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { checkLoad } from "@/app/dock/[key]/actions";
import { cn } from "@/lib/utils";

type Outcome = Parameters<typeof checkLoad>[1];
const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Accept all · some pallets short · reject. Each one shows what PayPal will do with the money, in the page, before
 *  it moves anything (no browser pop-up: those are blocked or ugly in phone web views). */
export function DockActions({ dockKey, pallets, perPalletCents }: { dockKey: string; pallets: number; perPalletCents: number }) {
  const [arrived, setArrived] = useState(pallets - 2);
  const [asking, setAsking] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const confirm = () =>
    asking &&
    start(async () => {
      const r = await checkLoad(dockKey, asking);
      if (!r.ok) {
        toast.error(r.error);
        setAsking(null);
      }
    });

  if (asking) {
    const short = asking.kind === "short" ? asking.pallets : 0;
    const view =
      asking.kind === "accept"
        ? { title: `Accept all ${pallets} pallets?`, money: `PayPal takes ${usd(pallets * perPalletCents)}`, detail: "The full payment.", yes: "Yes, accept and get paid", tone: "forest" }
        : asking.kind === "short"
          ? { title: `Only ${short} of ${pallets} arrived?`, money: `PayPal takes ${usd(short * perPalletCents)}`, detail: `and releases ${usd((pallets - short) * perPalletCents)} back to the buyer.`, yes: `Yes, take payment for ${short}`, tone: "forest" }
          : { title: "Reject the whole load?", money: "No money moves", detail: "PayPal releases the hold on the buyer’s card.", yes: "Yes, reject the load", tone: "spoiling" };
    return (
      <div role="alertdialog" aria-labelledby="dock-confirm" className="space-y-4 rounded-xl border border-line bg-card-soft p-5 shadow-soft">
        <p id="dock-confirm" className="font-heading text-2xl leading-tight">{view.title}</p>
        <p>
          <span className={cn("block font-heading text-3xl tabular-nums", view.tone === "spoiling" ? "text-spoiling" : "text-forest")}>{view.money}</span>
          <span className="text-sm text-ink-muted">{view.detail}</span>
        </p>
        <button
          disabled={pending}
          onClick={confirm}
          className={cn(
            "flex h-14 w-full items-center justify-between rounded-xl px-5 font-heading text-xl text-card-soft disabled:opacity-60",
            view.tone === "spoiling" ? "bg-spoiling hover:opacity-90" : "bg-forest hover:bg-forest-deep",
          )}
        >
          {pending ? "Telling PayPal…" : view.yes}
          <ArrowRight className="size-5" />
        </button>
        <button disabled={pending} onClick={() => setAsking(null)} className="h-11 w-full rounded-xl text-base text-ink-muted hover:bg-muted disabled:opacity-60">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setAsking({ kind: "accept" })} className="flex h-16 w-full items-center justify-between rounded-xl bg-forest px-6 font-heading text-2xl text-card-soft shadow-soft hover:bg-forest-deep">
        Accept all {pallets} pallets
        <ArrowRight className="size-6" />
      </button>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card-soft px-5 py-3">
        <button onClick={() => setAsking({ kind: "short", pallets: arrived })} className="text-left font-heading text-xl hover:text-forest">
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
      <button onClick={() => setAsking({ kind: "reject" })} className="flex h-14 w-full items-center justify-between rounded-xl border border-spoiling/60 bg-card-soft px-6 font-heading text-xl text-spoiling hover:bg-spoiling-tint">
        Reject load
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}
