import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BadgeCheck, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/app/top-bar";
import { StatusStamp } from "@/components/app/status-stamp";
import { buyer } from "@/lib/buyers";
import { TRUCKS } from "@/lib/demo-day";
import { clock, day } from "@/lib/time";
import { history } from "@/server/history";

export const metadata = { title: "Money" };

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const EVENT: Record<string, string> = {
  "PAYMENT.AUTHORIZATION.CREATED": "Hold confirmed",
  "PAYMENT.AUTHORIZATION.VOIDED": "Release confirmed",
  "PAYMENT.CAPTURE.COMPLETED": "Capture confirmed",
  "PAYMENT.CAPTURE.REFUNDED": "Refund confirmed",
  "PAYMENT.CAPTURE.DENIED": "Capture denied",
};

export default function MoneyPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Money />
    </Suspense>
  );
}

type Row = { at: number; dealId: string; loadId: string; what: string; amount: number | null; sign: "+" | "hold" | "release"; ref: string | null; confirmed?: string };

async function Money() {
  await connection();
  const { loads, deals, events } = await history();
  const held = deals.filter((d) => d.status === "held").reduce((a, d) => a + d.pallets * d.perPalletCents, 0);
  const captured = deals.reduce((a, d) => a + (d.capturedCents ?? 0), 0);
  const released = deals.reduce((a, d) => a + (d.status === "voided" ? d.pallets * d.perPalletCents : d.status === "partial" ? d.pallets * d.perPalletCents - (d.capturedCents ?? 0) : 0), 0);

  const rows: Row[] = [];
  for (const d of deals) {
    const total = d.pallets * d.perPalletCents;
    const ev = (type: string) => events.find((e) => e.dealId === d.id && e.type === type);
    if (d.approvedAt) rows.push({ at: d.approvedAt.getTime(), dealId: d.id, loadId: d.loadId, what: `Held on ${buyer(d.buyerId)?.name}'s card`, amount: total, sign: "hold", ref: d.authorizationId, confirmed: ev("PAYMENT.AUTHORIZATION.CREATED") && EVENT["PAYMENT.AUTHORIZATION.CREATED"] });
    if (d.settledAt && d.status === "voided") rows.push({ at: d.settledAt.getTime(), dealId: d.id, loadId: d.loadId, what: "Hold released: rejected at the dock", amount: total, sign: "release", ref: d.authorizationId, confirmed: ev("PAYMENT.AUTHORIZATION.VOIDED") && EVENT["PAYMENT.AUTHORIZATION.VOIDED"] });
    if (d.settledAt && (d.status === "captured" || d.status === "partial"))
      rows.push({ at: d.settledAt.getTime(), dealId: d.id, loadId: d.loadId, what: d.status === "partial" ? `Captured for the pallets that arrived (${usd(total - (d.capturedCents ?? 0))} released)` : "Captured: accepted at the dock", amount: d.capturedCents, sign: "+", ref: d.captureId, confirmed: ev("PAYMENT.CAPTURE.COMPLETED") && EVENT["PAYMENT.CAPTURE.COMPLETED"] });
  }
  rows.sort((a, b) => b.at - a.at);

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Money" subtitle="Every PayPal step on your loads, with PayPal's own reference and its signed webhook. Sandbox only." />
      <main className="w-full max-w-[1500px] space-y-6 px-6 pb-10 md:px-10">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            ["Captured", usd(captured), "paid to Salinas Ridge Farms"],
            ["Held now", usd(held), "authorized, waiting for a dock"],
            ["Released", usd(released), "voided or short, never charged"],
          ].map(([k, v, note]) => (
            <div key={k} className="rounded-xl border border-line bg-card-soft p-5">
              <dt className="text-sm text-ink-muted">{k}</dt>
              <dd className="mt-1 font-heading text-[2rem] leading-none tabular-nums">{v}</dd>
              <dd className="mt-2 text-xs text-ink-muted">{note}</dd>
            </div>
          ))}
        </dl>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-ink-muted">
            No money has moved yet. Approve a deal on a <Link href="/loads" className="text-forest underline underline-offset-4">rejected load</Link> and PayPal&apos;s hold shows up here.
          </div>
        ) : (
          <ol className="divide-y divide-line rounded-xl border border-line bg-card-soft">
            {rows.map((r) => {
              const l = loads.find((x) => x.id === r.loadId)!;
              const d = deals.find((x) => x.id === r.dealId)!;
              return (
                <li key={`${r.dealId}-${r.sign}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                  <span className="text-sm text-ink-muted tabular-nums">
                    {day(r.at)}, {clock(r.at)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <Link href={`/loads/${l.id}`} className="font-medium hover:text-forest">
                        {TRUCKS.find((t) => t.id === l.truckId)?.name} · {l.crop}
                      </Link>
                      <StatusStamp status={d.status} />
                    </span>
                    <span className="block text-sm">{r.what}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 font-mono text-xs text-ink-muted">
                      {r.ref}
                      {r.confirmed ? (
                        <span className="inline-flex items-center gap-1 font-sans text-forest">
                          <BadgeCheck className="size-3.5" /> {r.confirmed} by PayPal&apos;s signed webhook
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans">
                          <Clock3 className="size-3.5" /> waiting for PayPal&apos;s webhook
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={`text-right font-heading text-xl tabular-nums ${r.sign === "+" ? "text-forest" : r.sign === "release" ? "text-ink-muted line-through decoration-1" : ""}`}>
                    {r.sign === "+" ? "+" : ""}
                    {r.amount !== null ? usd(r.amount) : "–"}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
