import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/top-bar";
import { StatusStamp } from "@/components/app/status-stamp";
import { buyer } from "@/lib/buyers";
import { TRUCKS } from "@/lib/demo-day";
import { timeLeft } from "@/lib/freshness";
import { clock, day, requestNow } from "@/lib/time";
import { history, loadState } from "@/server/history";

export const metadata = { title: "Loads" };

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function LoadsPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Loads />
    </Suspense>
  );
}

async function Loads() {
  const now = await requestNow();
  const { loads, deals } = await history();
  const sold = deals.filter((d) => d.status === "captured" || d.status === "partial");
  const recovered = sold.reduce((a, d) => a + (d.capturedCents ?? 0), 0);
  const atStake = sold.reduce((a, d) => a + d.pallets * (loads.find((l) => l.id === d.loadId)?.originalCents ?? 0), 0);
  const kpis = [
    ["Rescued", `${sold.length} of ${loads.length}`, "loads sold after a rejection"],
    ["Recovered", usd(recovered), "paid through PayPal"],
    ["Of the original price", atStake ? `${Math.round((recovered / atStake) * 100)}%` : "–", "what the rescued loads earned"],
    ["Spoiled", String(loads.filter((l) => loadState(l, now) === "spoiled").length), "loads that ran out of time"],
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Loads" subtitle="Every rejected load and what happened to it. Only what you've done in this copy of the farm." />
      <main className="w-full max-w-[1500px] space-y-6 px-6 pb-10 md:px-10">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(([k, v, note]) => (
            <div key={k} className="rounded-xl border border-line bg-card-soft p-5">
              <dt className="text-sm text-ink-muted">{k}</dt>
              <dd className="mt-1 font-heading text-[2rem] leading-none tabular-nums">{v}</dd>
              <dd className="mt-2 text-xs text-ink-muted">{note}</dd>
            </div>
          ))}
        </dl>
        <div className="overflow-x-auto rounded-xl border border-line bg-card-soft">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-ink-muted">
              <tr>
                {["Load", "Rejected by", "When", "State", "Sold to", "Earned", "Clock"].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loads.map((l) => {
                const d = deals.find((x) => x.loadId === l.id);
                const state = loadState(l, now);
                const truck = TRUCKS.find((t) => t.id === l.truckId)?.name;
                return (
                  <tr key={l.id} className="hover:bg-wheat/30">
                    <td className="px-4 py-3">
                      <Link href={`/loads/${l.id}`} className="font-medium hover:text-forest">
                        {truck} · {l.crop}
                      </Link>
                      <div className="text-xs text-ink-muted">{l.pallets} pallets · {l.reason.toLowerCase()}</div>
                    </td>
                    <td className="px-4 py-3">{l.rejectedBy}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {day(l.rejectedAt.getTime())}, {clock(l.rejectedAt.getTime())}
                    </td>
                    <td className="px-4 py-3">
                      <StatusStamp status={state} />
                    </td>
                    <td className="px-4 py-3">{d && d.status !== "voided" ? `${buyer(d.buyerId)?.name} · ${usd(d.perPalletCents)}/pallet` : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{d?.capturedCents ? usd(d.capturedCents) : "–"}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">
                      {state === "captured" || state === "partial" ? `sold with ${timeLeft(l.spoilsAt.getTime() - (d?.settledAt?.getTime() ?? now))} to spare` : state === "spoiled" ? "ran out" : `${timeLeft(l.spoilsAt.getTime() - now)} left`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-muted">Report a rejection from any delivery on Today, or start a new day there for another load.</p>
      </main>
    </div>
  );
}
