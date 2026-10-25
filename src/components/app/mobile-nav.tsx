"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/leaf-clock";
import { cn } from "@/lib/utils";
import { isActive, NAV } from "./sidebar";

// Phones and small tablets, where the sidebar is hidden: a slim top bar and a tab bar along the bottom.
export function MobileTop({ sandbox }: { sandbox: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-parchment/95 px-4 backdrop-blur md:hidden">
      <Link href="/" aria-label="Spoilclock home page">
        <Logo size="sm" />
      </Link>
      {sandbox}
    </header>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-parchment/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-ink-muted", active && "font-medium text-forest-deep")}>
            <Icon className="size-5" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
