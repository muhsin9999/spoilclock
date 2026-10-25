"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CalendarClock, Handshake, Package, SlidersHorizontal, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/leaf-clock";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/today", label: "Today", icon: CalendarClock },
  { href: "/loads", label: "Loads", icon: Package },
  { href: "/buyers", label: "Buyers", icon: Handshake },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/rules", label: "Rules", icon: SlidersHorizontal },
] as const;

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function Sidebar({ farm, needs, sandbox }: { farm: string; needs?: React.ReactNode; sandbox: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-line bg-card-soft/70 px-3 py-5 md:flex">
      <Link href="/" aria-label="Spoilclock home page" className="rounded-md px-2">
        <Logo />
      </Link>
      <p className="mt-1.5 px-2 text-xs text-ink-muted">{farm}</p>
      <nav className="mt-7 flex flex-col gap-0.5" aria-label="App">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[0.95rem] text-ink-muted transition-colors hover:bg-wheat/60 hover:text-ink",
                active && "bg-forest-tint font-medium text-forest-deep hover:bg-forest-tint hover:text-forest-deep",
              )}
            >
              <Icon className="size-[1.1rem]" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      {needs && <div className="mt-6">{needs}</div>}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        {/* "How it's built" (/architecture) joins here once that page exists. */}
        <Link href="/" className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs text-ink-muted hover:bg-wheat/60 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          Spoilclock home
        </Link>
      </div>
      <div className="mt-2">{sandbox}</div>
    </aside>
  );
}
