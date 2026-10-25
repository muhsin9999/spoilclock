import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Lock } from "lucide-react";
import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/leaf-clock";
import { Stamp } from "@/components/brand/stamp";
import { HeroCard } from "@/components/landing/hero-card";
import { LoadDay } from "@/components/landing/load-day";
import { BUYERS } from "@/lib/buyers";

export const metadata = {
  title: { absolute: "Spoilclock: rejected at the dock, sold before it spoils" },
};

const SEE = "/today";

function SeeItLive({ className = "" }: { className?: string }) {
  return (
    <Link href={SEE} className={`inline-flex h-12 items-center gap-2 rounded-lg bg-forest px-6 text-base text-card-soft shadow-soft transition-colors hover:bg-forest-deep ${className}`}>
      See it live <ArrowRight className="size-4" />
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="min-h-svh overflow-x-clip">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 md:px-10">
        <Logo size="lg" />
        <span className="hidden sm:block">
          <SeeItLive />
        </span>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 pt-6 pb-4 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
        <div className="min-w-0">
          <h1 className="font-heading text-[2.6rem] leading-[1.04] font-medium tracking-[-0.025em] text-forest-deep sm:text-[3.4rem] xl:text-[3.9rem]">
            Rejected at the dock.
            <br />
            Sold before it spoils.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink/80">
            An AI agent finds your rejected load a new buyer by negotiating with the buyers&apos; own agents. PayPal holds the money until the new dock accepts it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <SeeItLive />
            <span className="text-sm text-ink-muted">No sign-up · your own copy of the farm&apos;s day</span>
          </div>
        </div>
        <Suspense fallback={<div className="h-[26rem] rounded-2xl border border-line bg-card-soft" />}>
          <Hero />
        </Suspense>
      </section>
      <Landscape className="mt-4" />

      {/* One load, one morning */}
      <section className="mx-auto max-w-[1240px] px-6 py-20 md:px-10" aria-labelledby="day">
        <p className="text-sm tracking-[0.14em] text-kraft uppercase">How a rescue goes</p>
        <h2 id="day" className="mt-2 max-w-3xl font-heading text-[2.4rem] leading-tight tracking-tight">
          One truck, one morning, two hours from rejected to paid.
        </h2>
        <div className="mt-12">
          <LoadDay />
        </div>
      </section>

      {/* Agents on both sides */}
      <section className="border-y border-line bg-card-soft/70" aria-labelledby="table">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-20 md:px-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="min-w-0">
            <p className="text-sm tracking-[0.14em] text-kraft uppercase">Agents on both sides of the table</p>
            <h2 id="table" className="mt-2 font-heading text-[2.4rem] leading-tight tracking-tight">
              Your agent haggles. Code holds the line.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
              Your agent reads the inspection report, then trades offers with every buyer&apos;s agent at once, the way a broker would on the phone, but in about a minute. Each buyer agent keeps its own limits private.
            </p>
            <ul className="mt-7 space-y-3">
              {["Never below your floor", "The whole load, to one buyer", "Unloaded before the fruit spoils", "Nothing is sold until you approve"].map((r) => (
                <li key={r} className="flex items-center gap-3">
                  <Lock className="size-4 shrink-0 text-forest" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-muted">Tell your agent anything in the load&apos;s chat, like a buyer to avoid or a new floor, and it negotiates by the new rule.</p>
          </div>
          <div className="relative grid min-w-0 items-center gap-6 rounded-2xl border border-line bg-parchment/60 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
            <div className="text-center">
              <Image src="/art/crate.webp" alt="" width={132} height={135} className="mx-auto" />
              <p className="mt-2 font-heading text-lg">Your agent</p>
              <p className="text-xs text-ink-muted">knows your floor</p>
            </div>
            <ul className="min-w-0 space-y-3">
              {BUYERS.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl border border-line bg-card-soft p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm text-card-soft" style={{ background: b.color }} aria-hidden>
                    {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="truncate text-xs text-ink-muted">Buyer agent · {b.kind} · limits private</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The money */}
      <section className="mx-auto max-w-[1240px] px-6 py-20 md:px-10" aria-labelledby="money">
        <p className="text-sm tracking-[0.14em] text-kraft uppercase">PayPal holds the money</p>
        <h2 id="money" className="mt-2 max-w-3xl font-heading text-[2.4rem] leading-tight tracking-tight">
          The new dock decides. PayPal does the rest.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/80">
          Buyer agents pay with cards saved in PayPal&apos;s Vault: no card numbers in Spoilclock and no approval pages for an agent to click. Every step is confirmed by PayPal&apos;s signed webhook.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { stamp: "Held", tone: "forest" as const, title: "You approve the deal", text: "PayPal authorizes the full price on the buyer's card. Nothing is charged yet.", api: "Orders v2 · AUTHORIZE" },
            { stamp: "Paid", tone: "forest" as const, title: "Dock accepts the load", text: "PayPal captures the payment. The load is sold.", api: "authorizations/capture" },
            { stamp: "Part paid", tone: "forest" as const, title: "Some pallets short", text: "PayPal captures only what arrived and releases the rest.", api: "partial capture · final_capture" },
            { stamp: "Voided", tone: "spoiling" as const, title: "Dock rejects it again", text: "PayPal releases the hold. No money moves; your agent tries the others.", api: "authorizations/void" },
          ].map((c) => (
            <div key={c.stamp} className="flex flex-col rounded-xl border border-line bg-card-soft p-5">
              <Stamp tone={c.tone} className="self-start text-base">
                {c.stamp}
              </Stamp>
              <p className="mt-5 font-heading text-xl">{c.title}</p>
              <p className="mt-1.5 flex-1 text-[0.95rem] leading-relaxed text-ink/80">{c.text}</p>
              <p className="mt-4 font-mono text-xs text-ink-muted">{c.api}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-t border-line" aria-labelledby="why">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1fr_1fr]">
          <div className="min-w-0">
            <p className="text-sm tracking-[0.14em] text-kraft uppercase">Why it matters</p>
            <h2 id="why" className="mt-2 font-heading text-[2.4rem] leading-tight tracking-tight">
              Good food goes to waste because nobody buys it in time.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">
              A rejected truck has hours, not days. Today a broker phones buyers one by one while the fruit warms up, and whoever answers first sets the price.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <a href="https://refed.org/food-waste/the-problem/" target="_blank" rel="noreferrer" className="group rounded-xl border border-line bg-card-soft p-6 transition-colors hover:border-forest">
              <p className="font-heading text-[3.2rem] leading-none tracking-tight text-forest-deep">29%</p>
              <p className="mt-3 leading-relaxed">of the US food supply went unsold or uneaten in 2024, worth $381 billion.</p>
              <p className="mt-4 text-sm text-ink-muted group-hover:text-forest">ReFED, 2024 ↗</p>
            </a>
            <a href="https://refed.org/articles/key-findings-from-the-refed-insights-engine" target="_blank" rel="noreferrer" className="group rounded-xl border border-line bg-card-soft p-6 transition-colors hover:border-forest">
              <p className="font-heading text-[3.2rem] leading-none tracking-tight text-forest-deep">Over half</p>
              <p className="mt-3 leading-relaxed">of surplus food on US farms in 2019 was edible. Strict cosmetic standards leave imperfect-looking produce without buyers.</p>
              <p className="mt-4 text-sm text-ink-muted group-hover:text-forest">ReFED Insights Engine ↗</p>
            </a>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-forest-deep text-card-soft" aria-labelledby="try">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 id="try" className="font-heading text-[2.2rem] leading-tight tracking-tight">
              Rescue Truck 14 yourself.
            </h2>
            <p className="mt-2 max-w-xl text-card-soft/75">
              You get your own copy of the farm&apos;s day: real agents, real PayPal sandbox payments, and nobody else&apos;s rescue is touched.
            </p>
          </div>
          <Link href={SEE} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-card-soft px-6 text-base text-forest-deep hover:bg-wheat">
            See it live <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="relative">
        <Landscape />
        <div className="mx-auto grid max-w-[1240px] gap-8 px-6 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-sm text-ink-muted">
              A hackathon project on the PayPal sandbox. Salinas Ridge Farms is fictional and its buyers are simulated agents; no real money moves. Not affiliated with PayPal.
            </p>
          </div>
          <div>
            <p className="font-medium">The app</p>
            <ul className="mt-2 space-y-1.5 text-ink-muted">
              <li>
                <Link href="/today" className="hover:text-ink">
                  Today&apos;s trucks
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Built with</p>
            <p className="mt-2 text-ink-muted">PayPal Orders v2 &amp; Vault · OpenAI · Bryntum Scheduler · Next.js · Neon · Vercel</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

async function Hero() {
  await connection();
  return <HeroCard now={Date.now()} />;
}
