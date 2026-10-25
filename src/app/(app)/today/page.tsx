import { Suspense } from "react";
import Link from "next/link";
import { requestNow } from "@/lib/time";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/top-bar";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { Landscape } from "@/components/brand/landscape";
import { TodayBoard } from "@/components/today/today-board";
import { dayWindow, FARM, SAMPLE_FINDINGS, TRUCKS, type TripKind } from "@/lib/demo-day";
import { timeLeft } from "@/lib/freshness";
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
  rejected: "Rejected · needs a new buyer",
  reopened: "Needs a new buyer again",
  no_deal: "No deal yet · try again",
  negotiating: "Your agent is negotiating",
  deal_ready: "A deal is waiting for your approval",
  held: "Payment held · truck on its way",
};

async function Today() {
  const now = await requestNow();
  const { run, trips, loads } = await getDay();
  const open = loads.filter((l) => NEEDS[l.status] && l.spoilsAt.getTime() > now);

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Today" subtitle={`${new Date(now).toLocaleDateString("en-US", { timeZone: FARM.timeZone, weekday: "long", month: "long", day: "numeric" })} · day ${run.day} · ${TRUCKS.length} trucks on the road`} />
      <main className="w-full max-w-[1500px] flex-1 space-y-4 px-6 md:px-10">
        {open.map((l) => (
          <Link key={l.id} href={`/loads/${l.id}`} className="flex items-center gap-4 rounded-xl border border-line bg-card-soft px-5 py-3 shadow-soft transition-colors hover:border-forest/40">
            <FreshnessRing size="sm" spoilsAt={l.spoilsAt.getTime()} totalMs={l.spoilsAt.getTime() - l.rejectedAt.getTime()} now={now} />
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-xl">
                {TRUCKS.find((t) => t.id === l.truckId)?.name} · {l.crop.toLowerCase()} · {timeLeft(l.spoilsAt.getTime() - now)} left
              </span>
              <span className="block text-sm text-ink-muted">{NEEDS[l.status]}</span>
            </span>
            <span className="text-forest underline underline-offset-4">Open</span>
            <ChevronRight className="size-5 text-ink-muted" />
          </Link>
        ))}
        <TodayBoard
          trucks={TRUCKS}
          trips={trips.map((t) => ({ id: t.id, truckId: t.truckId, kind: t.kind as TripKind, place: t.place, start: t.startAt.getTime(), end: t.endAt.getTime(), loadId: t.loadId, crop: t.crop, pallets: t.pallets }))}
          window={dayWindow(now)}
          timeZone={FARM.timeZone}
          defaults={SAMPLE_FINDINGS}
        />
        <p className="text-sm text-ink-muted">{FARM.name} is a fictional farm, and its buyers are simulated agents · times in Salinas, CA</p>
      </main>
      <Landscape className="mt-6" />
    </div>
  );
}
