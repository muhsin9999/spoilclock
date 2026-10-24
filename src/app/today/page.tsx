import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { TopBar } from "@/components/app/top-bar";
import { Landscape } from "@/components/brand/landscape";
import { Board } from "@/components/today/board";
import { buildDay, FARM, TRUCKS } from "@/lib/demo-day";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Today />
    </Suspense>
  );
}

async function Today() {
  await connection();
  const now = Date.now();
  const day = buildDay(now);
  const href = `/loads/${day.rejected.truckId}`;

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar now={now} urgent={{ spoilsAt: day.rejected.spoilsAt, totalMs: day.rejected.totalMs, href }} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-4 px-6 md:px-10">
        <Link href={href} className="flex items-center gap-3 rounded-xl border border-line bg-card-soft px-6 py-4 shadow-soft transition-colors hover:bg-card">
          <span className="size-2.5 rounded-full bg-spoiling" />
          <span className="font-heading text-xl">1 load needs you</span>
          <span className="text-ink-muted">·</span>
          <span className="text-forest underline underline-offset-4">Open</span>
          <ChevronRight className="ml-auto size-5 text-ink-muted" />
        </Link>
        <section className="overflow-hidden rounded-xl border border-line bg-card-soft p-2 shadow-soft" aria-label={`Today's trucks at ${FARM.name}`}>
          <Board trucks={TRUCKS} trips={day.trips} window={day.window} timeZone={FARM.timeZone} />
        </section>
        <p className="text-sm text-ink-muted">{FARM.name} is a fictional farm · times in Salinas, CA</p>
      </main>
      <Landscape className="mt-6" />
    </div>
  );
}
