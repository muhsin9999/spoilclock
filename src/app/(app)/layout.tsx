import { Suspense } from "react";
import Link from "next/link";
import { requestNow } from "@/lib/time";
import { MobileTabs, MobileTop } from "@/components/app/mobile-nav";
import { SandboxPanel } from "@/components/app/sandbox-panel";
import { Sidebar } from "@/components/app/sidebar";
import { FreshnessRing } from "@/components/brand/freshness-ring";
import { FARM, TRUCKS } from "@/lib/demo-day";
import { timeLeft } from "@/lib/freshness";
import { chromeData } from "@/server/chrome";

// Desktop: sidebar | page. Phones: a top bar, the page, and a tab bar along the bottom.
// Bryntum's stylesheets are served from public/bryntum (scripts/copy-bryntum.mjs).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-svh md:flex">
      {/* Bryntum ships prebuilt CSS; it is served from public/ rather than bundled (see scripts/copy-bryntum.mjs). */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/bryntum/scheduler.css" precedence="low" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/bryntum/svalbard-light.css" precedence="low" />
      <Suspense fallback={<div className="hidden w-60 border-r border-line bg-card-soft/70 md:block" />}>
        <Chrome />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</div>
      <Suspense fallback={null}>
        <MobileTabs />
      </Suspense>
    </div>
  );
}

const NEEDS: Record<string, string> = {
  rejected: "Rejected · needs a buyer",
  reopened: "Needs a buyer again",
  no_deal: "No deal yet",
  negotiating: "Your agent is negotiating",
  deal_ready: "Deal waiting for you",
  held: "Payment held · on its way",
  voided: "Needs a buyer again",
};

async function Chrome() {
  const now = await requestNow();
  const { needs, sandbox } = await chromeData();
  const live = needs && needs.spoilsAt.getTime() > now;
  const card = live ? (
    <Link href={`/loads/${needs.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-card-soft p-3 shadow-soft transition-colors hover:border-forest/40">
      <FreshnessRing size="sm" spoilsAt={needs.spoilsAt.getTime()} totalMs={needs.spoilsAt.getTime() - needs.rejectedAt.getTime()} now={now} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{TRUCKS.find((t) => t.id === needs.truckId)?.name} · {timeLeft(needs.spoilsAt.getTime() - now)}</span>
        <span className="block truncate text-xs text-ink-muted">{NEEDS[needs.status] ?? "Open"}</span>
      </span>
    </Link>
  ) : undefined;
  return (
    <>
      <Sidebar farm={`${FARM.name} · ${FARM.place}`} needs={card} sandbox={<SandboxPanel info={sandbox} />} />
      <MobileTop sandbox={<SandboxPanel info={sandbox} compact />} />
    </>
  );
}
