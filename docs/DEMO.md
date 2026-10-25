# Presentation

## What judges get

1. **A video under 3 minutes.** Most judges will only watch this, so it carries the story.
2. **The live site** (`spoilclock-app.vercel.app`): the landing page, then **See it live**, with no sign-up. Each visitor gets a private copy of the farm. It has to stay live until judging ends.
3. **The public GitHub repo** with an MIT licence, the README, the architecture picture and `.env.example`.
4. **The Devpost write-up** (skeleton below).

## What to film

Everything in the video is real: real model calls for every agent, real PayPal sandbox authorizations, captures and voids, and PayPal's own signed webhooks. The farm, its trucks and its buyers are fictional, and the buyers are simulated agents; say so once.

**The story in one line:** a truck of strawberries is turned away at the dock. Your agent sells it to another buyer's agent in under a minute, PayPal holds the money, and the new dock decides whether it's taken.

| Time | Screen (what to click) | Voice-over |
| --- | --- | --- |
| 0:00–0:12 | Landing hero: the card replays, REJECTED stamp, the freshness ring draining | "A truck of strawberries was just turned away at the dock. Cosmetic standards. It has about ten hours before it spoils." |
| 0:12–0:20 | Scroll to "Why it matters" (29% · ReFED) | "Today a broker phones buyers one by one while the fruit warms up. Nearly a third of America's food goes unsold or uneaten." |
| 0:20–0:32 | **See it live** → **Today**: the Bryntum board, Truck 14's rust bar, the "needs you" card with its ring | "This is Spoilclock, for a farm in Salinas. Every truck on today's schedule. Truck 14 was rejected an hour ago." |
| 0:32–0:40 | Open the rescue: the facts strip, the ring, the inspection report PDF | "The rescue clock is running. The agent has the inspection report: grade, softness, temperature." |
| 0:40–1:10 | **Find a buyer**. The crate starts working; the price ladder fills round by round; buyer rows update; Coastal walks away | "My agent negotiates with three buyers' agents at once. Each has its own private limits. Mine asks high and comes down; theirs bid low and come up. Code holds the line: never below my floor, the whole load, unloaded before it spoils." |
| 1:10–1:20 | The deal card: 16 × $172, above your floor, % of the original price, unloaded by… | "About twenty seconds. Valley Juice, $172 a pallet, $352 above my floor." |
| 1:20–1:30 | Chat: type *"Why should I take this one?"* → answer (optional, cut if long) | "I can ask it anything, or change a rule in plain words." |
| 1:30–1:45 | **Approve and hold payment** → HELD stamp, money trail. Cut to **Today**: the new dashed delivery on the board | "I approve. PayPal holds the money on the buyer agent's card, saved in PayPal's Vault, so no agent clicks a payment page. And the truck's new delivery is on the schedule." |
| 1:45–2:10 | Phone (real phone, scanning the QR code): the dock check, HELD stamp → **Some pallets short, 15 of 16** → PART PAID | "At the new dock, the receiver checks the load on their phone. One pallet's missing, so PayPal captures fifteen and releases the rest. Nothing was charged until this tap." |
| 2:10–2:25 | Back on the load: route at **Paid**, ring stopped "to spare". **Money**: hold and capture, each "Confirmed by PayPal's signed webhook" | "Every step is PayPal's own signed webhook, checked before it counts." |
| 2:25–2:35 | (Pre-recorded) **Reject load** on another deal → VOIDED → **Try again** → a new buyer | "And if the new dock says no, PayPal voids the hold, no money moves, and the agent tries the others." |
| 2:35–2:50 | `/architecture` → **Trust**: the safety parts light up; "What the AI can't do" | "Under the hood: the agents propose; code and people decide. The AI can't move money, can't go below the floor, can't charge twice." |
| 2:50–2:58 | Landing hero; end card: **Spoilclock · spoilclock-app.vercel.app** | "Spoilclock. Rejected at the dock. Sold before it spoils." |

## Before recording

1. **A fresh copy of the farm.** Record in a new incognito window so Truck 14 is untouched. If you've already rescued it, use **Start a new day** on Today, or open a new incognito window.
2. **Real agents vary.** The price and the buyer change a little from run to run. Do two or three takes of the negotiation and keep the clearest. Live negotiations take about 20 seconds; speed up the middle in the edit if needed and say "about twenty seconds" honestly.
3. **The dock scene.** Open the dock check on a real phone by scanning the QR code on the money trail, and screen-record the phone. Prefer **Some pallets short** (it shows the partial capture), or **Accept all**.
4. **The void scene.** Record it separately on a second load: Today → click another delivery → **Report a rejection** (attach `docs/samples/sunbelt-rejection.pdf` to show the AI reading paperwork) → Find a buyer → Approve → dock **Reject load** → **Try again**.
5. **Webhooks take a few seconds.** Wait until the money trail shows "Confirmed by PayPal's signed webhook" before filming it.
6. Record at **1440×900, browser zoom 100%**, with the cursor visible. Record each scene separately and cut them together. Hide the bookmarks bar and close other tabs; turn notifications off.

**Rules:**
- Say "sandbox" once, and "the buyers are simulated agents" once.
- Burn in captions.
- No copyrighted music.
- No PayPal logo except where PayPal's own screens or the architecture map's parts show it.
- Record the voice separately and lay it over the screen recording.

**Scenes checklist:** ☐ landing replay ☐ why it matters ☐ Today board ☐ rescue facts ☐ live negotiation ☐ deal card ☐ chat ☐ approve + HELD ☐ new delivery on the board ☐ phone dock check (short) ☐ paid + money ledger ☐ void → try again ☐ trust lens ☐ end card

## Devpost write-up skeleton

- **Inspiration:** in 2024, 29% of the US food supply went unsold or uneaten, worth $381 billion (ReFED), and strict cosmetic standards leave imperfect-looking produce without buyers (ReFED Insights Engine). When a truck is rejected at the dock, the clock is the enemy: a broker phones buyers one by one while the fruit warms up.
- **What it does:** report a rejection (the AI reads the paperwork), let your agent negotiate with buyers' agents under rules enforced in code, approve the deal, PayPal holds the money on the buyer agent's Vault card, and the new dock's tap captures it, captures part of it, or voids it.
- **How we built it:**
  - PayPal: Orders v2 (`AUTHORIZE` on a `vault_id`), Payments v2 (capture with `final_capture`, void), Vault v3 payment tokens, Webhooks verified on the raw bytes.
  - OpenAI `gpt-5.4-mini`: the grower's agent (forced plan, read-only tools, one structured move per round), three buyer agents with private briefs, the load chat, and a paperwork reader for PDFs and photos.
  - Rules in code (`src/lib/rules.ts`, tested): floor, buyer limits, whole load, shelf life, dock hours.
  - Bryntum Scheduler for the Today board; the agent's new delivery appears on the schedule.
  - Next.js 16 on Vercel, Neon Postgres, a private run per visitor.
- **Challenges:**
  - The first agent was too eager and sold at exactly the floor; it now sees each buyer's bid trail and haggles.
  - Bundling Bryntum took the build past 6 GB of memory; it's now served as a prebuilt file.
  - Live updates cancelled each other on a slow connection; each refresh now waits for the last.
  - A dock rejection followed by a second sale deleted the record of the void, and buyers who'd lost to the failed deal were left out of the retry. Both fixed and tested on the live site.
- **Accomplishments:** a full rescue end to end on the live site, including the unhappy path. A click-through test passed 13 of 13 checks on the live site, all 15 live PayPal webhooks verified, and a negotiation takes 16–20 model calls and 17–26 seconds.
- **What's next:**
  - Real buyers' agents over an agent-to-agent protocol, instead of simulated ones.
  - PayPal Payouts for the carrier's redelivery fee.
  - Reading USDA inspection certificates directly.
  - An eval suite for the negotiating agents.
- **Try it:** live link, repo, architecture page.
- **Prize fit:** Best Use of Agentic Commerce (agents on both sides of a real PayPal transaction) and Bryntum (an agent that drives the schedule itself).
