import { Suspense } from "react";
import Link from "next/link";
import { requestNow } from "@/lib/time";
import { ArrowRight, Lock } from "lucide-react";
import { Landscape } from "@/components/brand/landscape";
import { Logo } from "@/components/brand/leaf-clock";
import { DockDemo } from "@/components/landing/dock-demo";
import { HeaderCta } from "@/components/landing/header-cta";
import { HeroCard } from "@/components/landing/hero-card";
import { LoadDay } from "@/components/landing/load-day";
import { TablePreview } from "@/components/landing/table-preview";

export const metadata = {
  title: { absolute: "Spoilclock: rejected at the dock, sold before it spoils" },
};

const SEE = "/today";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm tracking-[0.14em] text-kraft uppercase">{children}</p>;
}

export default function Landing() {
  return (
    <div className="min-h-svh overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-transparent bg-parchment/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-6 md:px-10">
          <Logo size="lg" />
          <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex" aria-label="Page">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#agents" className="hover:text-ink">The agents</a>
            <a href="#money" className="hover:text-ink">The money</a>
            <a href="#why" className="hover:text-ink">Why</a>
          </nav>
          <HeaderCta watch="hero-cta" />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 pt-8 pb-4 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
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
            <Link id="hero-cta" href={SEE} className="inline-flex h-12 items-center gap-2 rounded-lg bg-forest px-6 text-base text-card-soft shadow-soft transition-colors hover:bg-forest-deep">
              See it live <ArrowRight className="size-4" />
            </Link>
            <span className="text-sm text-ink-muted">No sign-up · your own copy of the farm</span>
          </div>
        </div>
        <Suspense fallback={<div className="h-[28rem] rounded-2xl border border-line bg-card-soft" />}>
          <Hero />
        </Suspense>
      </section>
      <Landscape className="mt-4" />

      {/* One load, one morning */}
      <section id="how" className="mx-auto max-w-[1240px] scroll-mt-24 px-6 py-20 md:px-10" aria-labelledby="day">
        <Eyebrow>How a rescue goes</Eyebrow>
        <h2 id="day" className="mt-2 max-w-3xl font-heading text-[2.4rem] leading-tight tracking-tight">
          From rejected to paid in one morning.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink/80">A truck of strawberries is turned away at 6:40 AM with about ten hours of shelf life left. Watch what happens next.</p>
        <div className="mt-12">
          <LoadDay />
        </div>
      </section>

      {/* Agents on both sides */}
      <section id="agents" className="scroll-mt-24 border-y border-line bg-card-soft/70" aria-labelledby="table">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-20 md:px-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="min-w-0">
            <Eyebrow>Agents on both sides of the table</Eyebrow>
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
            <p className="mt-6 text-sm text-ink-muted">Tell your agent anything in the load&apos;s chat, or attach the inspection report, and it negotiates by the new rule.</p>
          </div>
          <TablePreview />
        </div>
      </section>

      {/* The money, as a phone you can tap */}
      <section id="money" className="mx-auto max-w-[1240px] scroll-mt-24 px-6 py-20 md:px-10" aria-labelledby="money-h">
        <Eyebrow>PayPal holds the money</Eyebrow>
        <h2 id="money-h" className="mt-2 max-w-3xl font-heading text-[2.4rem] leading-tight tracking-tight">
          The new dock decides. PayPal does the rest.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink/80">Buyer agents pay with cards saved in PayPal&apos;s Vault: no card numbers in Spoilclock, and no approval page for an agent to click.</p>
        <div className="mt-12">
          <DockDemo />
        </div>
      </section>

      {/* Why it matters */}
      <section id="why" className="scroll-mt-24 border-t border-line" aria-labelledby="why-h">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1fr_1fr]">
          <div className="min-w-0">
            <Eyebrow>Why it matters</Eyebrow>
            <h2 id="why-h" className="mt-2 font-heading text-[2.4rem] leading-tight tracking-tight">
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
            <p className="mt-2 max-w-xl text-card-soft/75">You get your own copy of the farm: real agents, real PayPal sandbox payments, and nobody else&apos;s rescue is touched.</p>
          </div>
          <Link href={SEE} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-card-soft px-6 text-base text-forest-deep hover:bg-wheat">
            See it live <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer>
        <Landscape />
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 text-sm md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-10">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-sm leading-relaxed text-ink-muted">
              When a produce load is rejected at the dock, Spoilclock&apos;s AI agent finds it a new buyer, and PayPal holds the money until the new dock accepts it.
            </p>
          </div>
          <FooterCol
            title="The app"
            links={[
              ["Today's trucks", "/today"],
              ["Loads", "/loads"],
              ["Buyers", "/buyers"],
              ["Money", "/money"],
              ["Rules", "/rules"],
              ["How it's built", "/architecture"],
            ]}
          />
          <FooterCol
            title="On this page"
            links={[
              ["How a rescue goes", "#how"],
              ["The agents", "#agents"],
              ["The money", "#money"],
              ["Why it matters", "#why"],
            ]}
          />
          <div>
            <p className="font-medium">Built with</p>
            <ul className="mt-3 space-y-1.5 text-ink-muted">
              <li>PayPal Orders v2, Vault &amp; Webhooks</li>
              <li>OpenAI agents</li>
              <li>Bryntum Scheduler</li>
              <li>Next.js · Neon · Vercel</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-[1240px] px-6 py-5 text-xs leading-relaxed text-ink-muted md:px-10">
            A hackathon project on the PayPal sandbox; no real money moves. Salinas Ridge Farms, its trucks and its buyers are fictional; the buyers are simulated AI agents. Figures on this page are from ReFED, linked above. Not affiliated with or endorsed by PayPal.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="mt-3 space-y-1.5 text-ink-muted">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("#") ? (
              <a href={href} className="hover:text-ink">
                {label}
              </a>
            ) : (
              <Link href={href} className="hover:text-ink">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Hero() {
  return <HeroCard now={await requestNow()} />;
}
