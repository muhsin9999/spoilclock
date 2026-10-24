import Link from "next/link";
import { Logo } from "@/components/brand/leaf-clock";
import { FreshnessChip } from "@/components/brand/freshness-ring";

type Urgent = { spoilsAt: number; totalMs: number; href: string };

export function TopBar({ urgent, now, children }: { urgent?: Urgent; now: number; children?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-6 px-6 py-4 md:px-10">
      <Link href="/" aria-label="Spoilclock home">
        <Logo size="lg" />
      </Link>
      <div className="min-w-0 flex-1">{children}</div>
      {urgent && (
        <Link href={urgent.href} className="rounded-full pr-1 hover:opacity-80" aria-label="Most urgent load">
          <FreshnessChip spoilsAt={urgent.spoilsAt} totalMs={urgent.totalMs} now={now} />
        </Link>
      )}
      <span className="rounded-lg border border-line bg-card-soft px-3 py-1.5 text-sm text-ink-muted">PayPal sandbox</span>
    </header>
  );
}
