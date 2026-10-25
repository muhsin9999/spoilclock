"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, Store } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type SandboxInfo = { cards: { buyer: string; card: string }[]; verified: number; lastEventAt: string | null };

/** "PayPal sandbox": what's connected, what's real and what's simulated. */
export function SandboxPanel({ info, compact = false }: { info: SandboxInfo; compact?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger className={compact ? "inline-flex items-center gap-1.5 rounded-md border border-line bg-card-soft px-2.5 py-1 text-xs text-ink-muted" : "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-ink-muted hover:bg-wheat/60 hover:text-ink"}>
        <span className="size-1.5 rounded-full bg-fresh" />
        {compact ? "PayPal sandbox" : "Connected to PayPal · Sandbox"}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">PayPal sandbox</DialogTitle>
          <DialogDescription>Real PayPal sandbox calls on fictional loads. No real money moves.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Store className="mt-0.5 size-4 shrink-0 text-kraft" />
            <div>
              <p className="font-medium">Salinas Ridge Farms gets paid</p>
              <p className="text-ink-muted">A sandbox business account receives every captured payment.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-kraft" />
            <div>
              <p className="font-medium">Buyer agents pay with cards saved in PayPal&apos;s Vault</p>
              <ul className="mt-1 space-y-0.5 text-ink-muted">
                {info.cards.map((c) => (
                  <li key={c.buyer} className="flex justify-between gap-3">
                    <span>{c.buyer}</span>
                    <span className="font-mono text-xs">{c.card}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-ink-muted">Spoilclock stores only PayPal&apos;s token, never a card number.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-forest" />
            <div>
              <p className="font-medium">{info.verified} signed webhooks verified</p>
              <p className="text-ink-muted">
                Each one checked against PayPal&apos;s certificate before it counts{info.lastEventAt ? ` · last ${info.lastEventAt}` : ""}.
              </p>
            </div>
          </li>
        </ul>
        <div className="rounded-lg bg-wheat/50 p-3 text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Real:</span> the AI agents, PayPal holds, captures, voids and webhooks. <span className="font-medium text-ink">Simulated:</span> the farm, its trucks, and the buyers&apos; businesses.
        </div>
        <Link href="/money" className="text-sm text-forest underline underline-offset-4">
          Open the money ledger
        </Link>
      </DialogContent>
    </Dialog>
  );
}
