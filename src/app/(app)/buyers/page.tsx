import { Suspense } from "react";
import { connection } from "next/server";
import { CreditCard, Lock } from "lucide-react";
import { db, schema as s } from "@/db";
import { BlockToggle } from "@/components/app/block-toggle";
import { PageHeader } from "@/components/app/top-bar";
import { BUYERS } from "@/lib/buyers";
import { history } from "@/server/history";
import { currentRun } from "@/server/run";

export const metadata = { title: "Buyers" };

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function BuyersPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Buyers />
    </Suspense>
  );
}

async function Buyers() {
  await connection();
  const [{ deals }, cards, run] = await Promise.all([history(), db.select().from(s.buyerCards), currentRun()]);
  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Buyers" subtitle="The buyer agents your agent negotiates with. Simulated businesses, each with its own private limits." />
      <main className="grid w-full max-w-[1500px] gap-5 px-6 pb-10 md:px-10 lg:grid-cols-3">
        {BUYERS.map((b) => {
          const card = cards.find((c) => c.buyerId === b.id);
          const won = deals.filter((d) => d.buyerId === b.id && d.status !== "voided" && d.status !== "ready");
          const paid = won.reduce((a, d) => a + (d.capturedCents ?? 0), 0);
          const voided = deals.filter((d) => d.buyerId === b.id && d.status === "voided").length;
          return (
            <article key={b.id} className="flex flex-col rounded-xl border border-line bg-card-soft p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full font-heading text-lg text-card-soft" style={{ background: b.color }} aria-hidden>
                  {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl leading-tight">{b.name}</h2>
                  <p className="text-sm text-ink-muted">Buyer agent · {b.kind}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-ink-muted">Drive from the dock</dt>
                <dd>{b.driveMin} min</dd>
                <dt className="text-ink-muted">Takes up to</dt>
                <dd>{b.brief.capacity} pallets</dd>
                <dt className="text-ink-muted">Receives</dt>
                <dd>{b.brief.dockHours ? `${b.brief.dockHours[0]} AM to ${b.brief.dockHours[1] - 12} PM` : "around the clock"}</dd>
                {b.brief.maxSoftPct !== undefined && (
                  <>
                    <dt className="text-ink-muted">Refuses</dt>
                    <dd>fruit over {b.brief.maxSoftPct}% soft</dd>
                  </>
                )}
              </dl>
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-wheat/50 px-3 py-2 text-sm">
                <CreditCard className="size-4 text-kraft" />
                {card ? (
                  <span>
                    Pays with a {card.brand} ····{card.last4} saved in PayPal&apos;s Vault
                  </span>
                ) : (
                  <span>No card on file yet</span>
                )}
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                <Lock className="size-3.5" /> Its price limits are private to its own agent.
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                {[
                  ["Deals", String(won.length)],
                  ["Paid you", usd(paid)],
                  ["Rejected again", String(voided)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dd className="font-heading text-xl tabular-nums">{v}</dd>
                    <dt className="text-xs text-ink-muted">{k}</dt>
                  </div>
                ))}
              </dl>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm text-ink-muted">Sell to them on new loads</span>
                <BlockToggle buyerId={b.id} blocked={run.blocked.includes(b.id)} name={b.name} />
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
