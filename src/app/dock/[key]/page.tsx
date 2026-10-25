import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import { db, schema as s } from "@/db";
import { DockActions } from "@/components/dock/dock-actions";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/leaf-clock";
import { Stamp } from "@/components/brand/stamp";
import { buyer as buyerById } from "@/lib/buyers";
import { TRUCKS } from "@/lib/demo-day";

export const metadata = { title: "Dock check" };

export default function DockPage({ params }: PageProps<"/dock/[key]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Dock params={params} />
    </Suspense>
  );
}

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const DONE: Record<string, string> = { captured: "Accepted · paid", partial: "Part accepted · paid", voided: "Rejected · hold released" };

/** The receiver at the new buyer's dock, on a phone: check the load, then tell PayPal. */
async function Dock({ params }: { params: PageProps<"/dock/[key]">["params"] }) {
  const { key } = await params;
  await connection();
  if (!/^[0-9a-f]{32}$/.test(key)) notFound();
  const [row] = await db.select({ deal: s.deals, load: s.loads }).from(s.deals).innerJoin(s.loads, eq(s.loads.id, s.deals.loadId)).where(eq(s.deals.dockKey, key));
  if (!row || row.deal.status === "ready" || row.deal.status === "holding") notFound();
  const { deal, load } = row;
  const b = buyerById(deal.buyerId)!;
  const truck = TRUCKS.find((t) => t.id === load.truckId)!;
  const total = deal.pallets * deal.perPalletCents;
  const now = Date.now();
  const done = DONE[deal.status];

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <Logo size="sm" />
        <span className="text-sm text-ink-muted">Dock check</span>
      </header>
      <main className="flex-1 space-y-5 px-5 py-5">
        <h1 className="font-heading text-[1.9rem] leading-tight">
          {truck.name} · {b.name}
        </h1>
        <section className="relative rounded-xl border border-line bg-card-soft p-5 shadow-soft">
          <Stamp tone={deal.status === "voided" ? "spoiling" : "forest"} className="absolute -top-2 right-3 rotate-6 text-lg">
            {done ? (deal.status === "voided" ? "Voided" : `Paid ${usd(deal.capturedCents ?? total)}`) : `Held ${usd(total)}`}
          </Stamp>
          <p className="text-xs tracking-[0.14em] text-ink-muted uppercase">Freshness</p>
          <div className="grid place-items-center py-3">
            <FreshnessRing spoilsAt={load.spoilsAt.getTime()} totalMs={load.spoilsAt.getTime() - load.rejectedAt.getTime()} now={now} stoppedAt={done && deal.settledAt ? deal.settledAt.getTime() : undefined} className="size-48" />
          </div>
          <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            {[
              [`${deal.pallets} pallets`, "Load"],
              [`${load.softPct}%`, "Soft"],
              [`${load.pulpF}°F`, "Pulp temp"],
            ].map(([v, k]) => (
              <div key={k}>
                <dd className="font-heading text-lg">{v}</dd>
                <dt className="text-[0.7rem] tracking-[0.12em] text-ink-muted uppercase">{k}</dt>
              </div>
            ))}
          </dl>
        </section>
        {done ? (
          <p className="rounded-xl border border-line bg-card-soft p-5 text-center font-heading text-xl">{done}</p>
        ) : (
          <DockActions dockKey={key} pallets={deal.pallets} />
        )}
        <p className="flex items-start gap-3 border-t border-line pt-4 text-sm text-ink-muted">
          <Lock className="mt-0.5 size-4 shrink-0 text-kraft" />
          <span>
            {done ? `Settled on PayPal for ${b.name}.` : `PayPal is holding ${b.name.replace(/\.$/, "")}'s payment. Money moves only when you confirm.`} <span className="block text-xs">Sandbox · simulated buyer</span>
          </span>
        </p>
      </main>
      <Landscape />
    </div>
  );
}
