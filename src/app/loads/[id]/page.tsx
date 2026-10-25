import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FileText, Sheet } from "lucide-react";
import { LiveRefresh } from "@/components/app/live-refresh";
import { TopBar } from "@/components/app/top-bar";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Landscape } from "@/components/brand/landscape";
import { Stamp } from "@/components/brand/stamp";
import { Buyers } from "@/components/load/buyers";
import { DealCard } from "@/components/load/deal-card";
import { FindBuyerButton } from "@/components/load/find-buyer";
import { LoadChat, type ChatMessage } from "@/components/load/load-chat";
import { MoneyTrail } from "@/components/load/money-trail";
import { PriceLadder } from "@/components/load/price-ladder";
import { RouteSteps } from "@/components/load/route-steps";
import { BUYERS, buyer as buyerById } from "@/lib/buyers";
import { TRUCKS } from "@/lib/demo-day";
import { timeLeft } from "@/lib/freshness";
import { clock } from "@/server/ai/negotiate";
import { getLoad, type LoadView } from "@/server/load";

export const metadata = { title: "Load" };

export default function LoadPage({ params }: PageProps<"/loads/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Load params={params} />
    </Suspense>
  );
}

const STEP: Record<string, number> = { rejected: 1, negotiating: 1, reopened: 1, no_deal: 1, deal_ready: 1, held: 3, captured: 5, partial: 5 };

async function Load({ params }: { params: PageProps<"/loads/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const view = await getLoad(id);
  if (!view) notFound();
  const now = Date.now();
  const { load, offers, states, deal, messages, files, events, card } = view;
  const settledOrHeld = deal && deal.status !== "ready";
  const truck = TRUCKS.find((t) => t.id === load.truckId)!;
  const working = load.status === "negotiating";
  const rounds = offers.length ? Math.max(...offers.map((o) => o.round)) : 0;

  return (
    <div className="flex min-h-svh flex-col">
      <LiveRefresh
        active={working || deal?.status === "held" || deal?.status === "settling" || (!!settledOrHeld && events.length < 2)}
        everyMs={working ? 1500 : 3000}
      />
      <TopBar now={now}>
        <nav className="hidden items-center gap-2 text-ink-muted md:flex" aria-label="Breadcrumb">
          <Link href="/today" className="hover:text-ink">Today</Link>
          <span>›</span>
          <span className="text-ink">{truck.name}</span>
        </nav>
      </TopBar>
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 md:px-10">
        <h1 className="font-heading text-[2.6rem] leading-none tracking-tight">{truck.name}: rejected load</h1>
        <p className="mt-2 text-lg text-ink-muted">
          {load.crop} · {load.pallets} pallets · rejected by {load.rejectedBy} for {load.reason.toLowerCase()}
        </p>
        <div className="mt-7">
          <RouteSteps
            current={STEP[load.status] ?? 1}
            detail={{
              0: load.rejectedBy,
              1: working ? "Talking to buyer agents" : deal && deal.status !== "voided" ? buyerById(deal.buyerId)?.name : `${BUYERS.length} buyer agents`,
              2: deal && settledOrHeld && deal.status !== "voided" ? `$${((deal.perPalletCents * deal.pallets) / 100).toLocaleString("en-US")} on PayPal` : undefined,
              3: deal?.status === "held" ? `Unloaded by ${clock(deal.arriveAt.getTime())}` : undefined,
              4: deal?.status === "captured" || deal?.status === "partial" ? `$${((deal.capturedCents ?? 0) / 100).toLocaleString("en-US")} captured` : undefined,
            }}
          />
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_23rem]">
          <LoadFacts view={view} now={now} />

          <section className="space-y-5 rounded-xl border border-line bg-card-soft p-6 shadow-soft" aria-labelledby="neg">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="neg" className="font-heading text-2xl">Offers per pallet</h2>
              {rounds > 0 && <span className="text-sm text-ink-muted">{rounds} {rounds === 1 ? "round" : "rounds"}{working && " · live"}</span>}
            </div>
            {offers.length > 0 ? (
              <PriceLadder
                offers={offers.map((o) => ({ round: o.round, by: o.by, perPallet: o.perPalletCents / 100 }))}
                buyers={BUYERS}
                floor={load.floorCents / 100}
                deal={deal ? { buyerId: deal.buyerId, perPallet: deal.perPalletCents / 100 } : undefined}
              />
            ) : (
              <Start view={view} working={working} />
            )}
            {(offers.length > 0 || working) && <Buyers buyers={BUYERS} offers={offers} states={states} live={working} />}
            {deal && settledOrHeld && <MoneyTrail deal={deal} events={events} card={card} />}
            {deal && !settledOrHeld && (
              <DealCard
                loadId={load.id}
                card={card}
                buyer={buyerById(deal.buyerId)!.name}
                pallets={deal.pallets}
                perPallet={deal.perPalletCents / 100}
                floor={load.floorCents / 100}
                originalPerPallet={load.originalCents / 100}
                originalBuyer={load.rejectedBy}
                arriveBy={clock(deal.arriveAt.getTime())}
                marginBeforeSpoil={timeLeft(load.spoilsAt.getTime() - deal.arriveAt.getTime())}
              />
            )}
            {(load.status === "no_deal" || load.status === "reopened") && offers.length > 0 && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-5">
                <p className="text-ink-muted">{load.status === "reopened" ? "You changed the rules, so the deal was withdrawn." : "No buyer met your floor for the whole load."}</p>
                <FindBuyerButton loadId={load.id} again />
              </div>
            )}
          </section>

          <div className="lg:col-span-2 xl:col-span-1">
            <LoadChat loadId={load.id} truck={truck.name} messages={messages as ChatMessage[]} working={working} />
          </div>
        </div>
      </main>
      <Landscape className="mt-8" />
    </div>
  );
}

function Start({ view, working }: { view: LoadView; working: boolean }) {
  if (working)
    return (
      <div className="grid place-items-center gap-3 py-12 text-center">
        <Image src="/art/crate.webp" alt="" width={120} height={123} className="animate-bounce [animation-duration:1.6s]" />
        <p className="shimmer-text font-heading text-xl">Reading the paperwork and calling buyers…</p>
      </div>
    );
  return (
    <div className="grid items-center gap-6 py-6 md:grid-cols-[auto_1fr]">
      <Image src="/art/crate.webp" alt="" width={150} height={153} />
      <div>
        <p className="font-heading text-2xl leading-snug">Your agent is ready to sell these {view.load.crop.toLowerCase()}.</p>
        <p className="mt-2 text-ink-muted">
          It reads the inspection report, then negotiates with {BUYERS.length} buyer agents at once. It never goes below your floor of ${view.load.floorCents / 100} a pallet, and nothing is sold until you approve.
        </p>
        <div className="mt-5">
          <FindBuyerButton loadId={view.load.id} />
        </div>
      </div>
    </div>
  );
}

const FILE_ICON: Record<string, typeof FileText> = { "text/csv": Sheet };

function LoadFacts({ view, now }: { view: LoadView; now: number }) {
  const { load, files } = view;
  return (
    <aside className="space-y-5 rounded-xl border border-line bg-card-soft p-5 shadow-soft">
      <div className="relative grid place-items-center pt-4">
        <Stamp className="absolute -top-1 -left-1 z-10">Rejected</Stamp>
        <FreshnessRing
          spoilsAt={load.spoilsAt.getTime()}
          totalMs={load.spoilsAt.getTime() - load.rejectedAt.getTime()}
          now={now}
          stoppedAt={(view.deal?.status === "captured" || view.deal?.status === "partial") && view.deal.settledAt ? view.deal.settledAt.getTime() : undefined}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
        {[
          ["Grade", load.grade],
          ["Soft", `${load.softPct}%`],
          ["Pulp temp", `${load.pulpF}°F`],
        ].map(([k, v]) => (
          <div key={k}>
            <dd className="font-heading text-lg">{v}</dd>
            <dt className="text-xs text-ink-muted">{k}</dt>
          </div>
        ))}
      </dl>
      <dl className="space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">{load.rejectedBy} was paying</dt>
          <dd className="tabular-nums">${load.originalCents / 100} a pallet</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Your floor</dt>
          <dd className="tabular-nums">${load.floorCents / 100} a pallet</dd>
        </div>
        {load.excluded.length > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Ruled out</dt>
            <dd className="text-right">{load.excluded.map((b) => buyerById(b)?.name).join(", ")}</dd>
          </div>
        )}
      </dl>
      <div className="border-t border-line pt-4">
        <h2 className="mb-2 text-sm text-ink-muted">Files</h2>
        <ul className="space-y-1.5">
          {files.map((f) => {
            const Icon = FILE_ICON[f.type] ?? FileText;
            return (
              <li key={f.id}>
                <a href={`/api/files/${f.id}`} target="_blank" className="flex items-center gap-2 text-sm hover:text-forest">
                  <Icon className="size-4 text-kraft" />
                  {f.name}
                  {f.sample && <span className="text-xs text-ink-muted">sample</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
