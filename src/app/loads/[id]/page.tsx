import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { FileText, Image as ImageIcon, Sheet } from "lucide-react";
import { TopBar } from "@/components/app/top-bar";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Landscape } from "@/components/brand/landscape";
import { Stamp } from "@/components/brand/stamp";
import { Buyers } from "@/components/load/buyers";
import { DealCard } from "@/components/load/deal-card";
import { LoadChat } from "@/components/load/load-chat";
import { PriceLadder } from "@/components/load/price-ladder";
import { RouteSteps } from "@/components/load/route-steps";
import { buildDay } from "@/lib/demo-day";
import { BUYERS, SAMPLE } from "@/lib/demo-load";

export const metadata = { title: "Truck 14" };

export default function LoadPage({ params }: PageProps<"/loads/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Load params={params} />
    </Suspense>
  );
}

const FILE_ICON = { pdf: FileText, jpg: ImageIcon, csv: Sheet } as const;

async function Load({ params }: { params: PageProps<"/loads/[id]">["params"] }) {
  await params;
  await connection();
  const now = Date.now();
  const { rejected } = buildDay(now);
  const { load, offers, outcomes, deal, chat } = SAMPLE;
  const buyer = BUYERS.find((b) => b.id === deal.buyerId)!;

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar now={now}>
        <nav className="hidden items-center gap-2 text-ink-muted md:flex" aria-label="Breadcrumb">
          <Link href="/today" className="hover:text-ink">Today</Link>
          <span>›</span>
          <span className="text-ink">{load.truck}</span>
        </nav>
      </TopBar>
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[2.6rem] leading-none tracking-tight">{load.truck}: rejected load</h1>
            <p className="mt-2 text-lg text-ink-muted">{load.crop} · {load.pallets} pallets · rejected by {load.rejectedBy} for {load.reason.toLowerCase()}</p>
          </div>
        </div>
        <div className="mt-7">
          <RouteSteps current={1} detail={{ 0: load.rejectedBy, 1: "3 buyer agents" }} />
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_23rem]">
          <aside className="space-y-5 rounded-xl border border-line bg-card-soft p-5 shadow-soft">
            <div className="relative grid place-items-center pt-4">
              <Stamp className="absolute -top-1 -left-1 z-10 whitespace-nowrap">Rejected</Stamp>
              <FreshnessRing spoilsAt={rejected.spoilsAt} totalMs={rejected.totalMs} now={now} />
            </div>
            <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              {[["Grade", load.grade], ["Soft", `${load.softPct}%`], ["Pulp temp", `${load.pulpF}°F`]].map(([k, v]) => (
                <div key={k}>
                  <dd className="font-heading text-lg">{v}</dd>
                  <dt className="text-xs text-ink-muted">{k}</dt>
                </div>
              ))}
            </dl>
            <dl className="space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">{load.rejectedBy} was paying</dt><dd className="tabular-nums">${load.originalPerPallet} a pallet</dd></div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Your floor</dt>
                <dd><button className="rounded-md border border-line px-2 py-0.5 tabular-nums hover:border-forest">${load.floorPerPallet} a pallet</button></dd>
              </div>
            </dl>
            <div className="border-t border-line pt-4">
              <h2 className="mb-2 text-sm text-ink-muted">Files</h2>
              <ul className="space-y-1.5">
                {load.files.map((f) => {
                  const Icon = FILE_ICON[f.split(".").pop() as keyof typeof FILE_ICON] ?? FileText;
                  return (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Icon className="size-4 text-kraft" />
                      {f}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <section className="space-y-5 rounded-xl border border-line bg-card-soft p-6 shadow-soft" aria-labelledby="neg">
            <div className="flex items-baseline justify-between">
              <h2 id="neg" className="font-heading text-2xl">Offers per pallet</h2>
              <span className="text-sm text-ink-muted">{Math.max(...offers.map((o) => o.round))} rounds · 2 min 14 s</span>
            </div>
            <PriceLadder offers={offers} buyers={BUYERS} floor={load.floorPerPallet} deal={deal} />
            <Buyers buyers={BUYERS} offers={offers} outcomes={outcomes} />
            <DealCard
              buyer={buyer.name}
              pallets={load.pallets}
              perPallet={deal.perPallet}
              floor={load.floorPerPallet}
              originalPerPallet={load.originalPerPallet}
              originalBuyer={load.rejectedBy}
              arriveBy={deal.arriveBy}
              marginBeforeSpoil={deal.marginBeforeSpoil}
            />
          </section>

          <div className="lg:col-span-2 xl:col-span-1">
            <LoadChat truck={load.truck} messages={chat} />
          </div>
        </div>
      </main>
      <Landscape className="mt-8" />
    </div>
  );
}
