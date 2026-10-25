import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** The top of every app page: where you are, the page's title, and anything it needs on the right. */
export function PageHeader({ title, subtitle, crumbs, right }: { title: React.ReactNode; subtitle?: React.ReactNode; crumbs?: { href: string; label: string }[]; right?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-6 pt-7 pb-5 md:px-10">
      <div className="min-w-0">
        {crumbs && (
          <nav className="mb-2 flex items-center gap-1.5 text-sm text-ink-muted" aria-label="Breadcrumb">
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1.5">
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
                <ChevronRight className="size-3.5" />
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-heading text-[2.3rem] leading-none tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
