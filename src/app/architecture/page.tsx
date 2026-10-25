import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Explorer } from "@/components/architecture/explorer";
import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/leaf-clock";

export const metadata = {
  title: "How it's built",
  description: "The life of one rejected load in Spoilclock: the agents, the rules in code, PayPal's hold and capture, and the signed webhooks.",
};

export default function ArchitecturePage() {
  return (
    <div className="min-h-svh overflow-x-clip">
      <header className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="Spoilclock home page">
          <Logo size="lg" />
        </Link>
        <Link href="/today" className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest px-4 text-sm text-card-soft hover:bg-forest-deep">
          See it live <ArrowRight className="size-4" />
        </Link>
      </header>
      <main className="mx-auto max-w-[1240px] px-6 pt-6 pb-16 md:px-10">
        <p className="text-sm tracking-[0.14em] text-kraft uppercase">How it&apos;s built</p>
        <h1 className="mt-2 font-heading text-[2.6rem] leading-tight tracking-tight">The life of one rejected load</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink/80">
          From the dock that turned it away to PayPal&apos;s signed confirmation, step by step: who does what, the real call, the file that does it, and what we measured on the live site.
        </p>
        <div className="mt-10">
          <Explorer />
        </div>
        <p className="mt-10 text-sm text-ink-muted">Every fact on this page comes from one file, src/lib/architecture.ts. Code links open the public repository.</p>
      </main>
      <Landscape />
    </div>
  );
}
