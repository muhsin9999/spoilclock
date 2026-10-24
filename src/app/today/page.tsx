import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { TopBar } from "@/components/app/top-bar";
import { Landscape } from "@/components/brand/landscape";
import { Board } from "@/components/today/board";
import { dayWindow, FARM, TRUCKS } from "@/lib/demo-day";
import { getDay } from "@/server/run";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Today />
    </Suspense>
  );
}

const NEEDS: Record<string, string> = {
  rejected: "1 load needs you",
  negotiating: "Your agent is finding a buyer",
  reopened: "1 load needs you",
  no_deal: "1 load needs you",
  deal_ready: "A deal is waiting for your approval",
  held: "Payment held · truck on its way",
};

async function Today() {
  await connection();
  const now = Date.now();
  const { trips, loads } = await getDay();
  const load = loads[0];
  const open = load && load.spoilsAt.getTime() > now && NEEDS[load.status];
  const href = load ? `/loads/${load.id}` : "/today";

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar now={now} urgent={load && open ? { spoilsAt: load.spoilsAt.getTime(), totalMs: load.spoilsAt.getTime() - load.rejectedAt.getTime(), href } : undefined} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-4 px-6 md:px-10">
        {open && (
          <Link href={href} className="flex items-center gap-3 rounded-xl border border-line bg-card-soft px-6 py-4 shadow-soft transition-colors hover:bg-card">
            <span className={load.status === "held" ? "size-2.5 rounded-full bg-forest" : "size-2.5 rounded-full bg-spoiling"} />
            <span className="font-heading text-xl">{open}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-forest underline underline-offset-4">Open</span>
            <ChevronRight className="ml-auto size-5 text-ink-muted" />
          </Link>
        )}
        <section className="overflow-hidden rounded-xl border border-line bg-card-soft p-2 shadow-soft" aria-label={`Today's trucks at ${FARM.name}`}>
          <Board
            trucks={TRUCKS}
            trips={trips.map((t) => ({ id: t.id, truckId: t.truckId, kind: t.kind as never, place: t.place, start: t.startAt.getTime(), end: t.endAt.getTime() }))}
            window={dayWindow(now)}
            timeZone={FARM.timeZone}
          />
        </section>
        <p className="text-sm text-ink-muted">{FARM.name} is a fictional farm, and its buyers are simulated agents · times in Salinas, CA</p>
      </main>
      <Landscape className="mt-6" />
    </div>
  );
}
