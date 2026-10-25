import { Suspense } from "react";
import { connection } from "next/server";
import { Lock } from "lucide-react";
import { BlockToggle } from "@/components/app/block-toggle";
import { FloorShareForm } from "@/components/app/floor-share-form";
import { PageHeader } from "@/components/app/top-bar";
import { BUYERS } from "@/lib/buyers";
import { currentRun } from "@/server/run";

export const metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Rules />
    </Suspense>
  );
}

async function Rules() {
  await connection();
  const run = await currentRun();
  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Rules" subtitle="How your agent sells every rejected load. Change one load's rules on its page or in its chat." />
      <main className="grid w-full max-w-[1500px] gap-5 px-6 pb-10 md:px-10 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card-soft p-6 shadow-soft">
          <h2 className="font-heading text-2xl">Floor price</h2>
          <p className="mt-1 text-ink-muted">Your agent never sells below this share of what the original buyer was paying. Applies to new rejections.</p>
          <FloorShareForm value={run.floorShare} />
        </section>
        <section className="rounded-xl border border-line bg-card-soft p-6 shadow-soft">
          <h2 className="font-heading text-2xl">Who it may sell to</h2>
          <p className="mt-1 text-ink-muted">Blocked buyers are left out of new negotiations.</p>
          <ul className="mt-4 divide-y divide-line">
            {BUYERS.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-medium">{b.name}</span>
                  <span className="block text-xs text-ink-muted">{b.kind}</span>
                </span>
                <BlockToggle buyerId={b.id} blocked={run.blocked.includes(b.id)} name={b.name} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-card-soft p-6 lg:col-span-2">
          <h2 className="font-heading text-2xl">Always, whatever the AI says</h2>
          <p className="mt-1 text-ink-muted">These are enforced in code (src/lib/rules.ts), not left to the model.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Never below the floor",
              "One buyer takes the whole load",
              "Unloaded before the fruit spoils, at a dock that's open",
              "Each buyer agent stays within its own limits",
              "Nothing is sold until you approve",
              "PayPal charges only when the new dock accepts the load",
            ].map((r) => (
              <li key={r} className="flex items-center gap-3">
                <Lock className="size-4 shrink-0 text-forest" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
