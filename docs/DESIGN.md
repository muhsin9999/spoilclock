# Design: "Almanac" (25 Oct 2026)

Picked by the user from a nine-style sheet: **#4 Premium agriculture** (cream, deep forest green, kraft brown, an engraved field illustration). Calm, warm and professional like Cleared and Lifeline, but its own: a farm almanac / seed-merchant feel, not an office.

**Goal:** within seconds a judge sees a serious tool for a grower whose truck was just rejected. One urgent thing on screen (the freshness clock); everything else calm.

## Colour
| Token | Hex | Use |
| --- | --- | --- |
| `--parchment` | #F4EEDF | App background |
| `--card` | #FBF8F0 | Cards |
| `--line` | #E2D7C0 | Hairlines |
| `--ink` | #1E2A20 | Text (green-black) |
| `--muted` | #6E6B58 | Secondary text |
| `--forest` | #2F5D3A | Primary actions (one per screen) |
| `--forest-deep` | #1F3B27 | Pressed, headings on tint |
| `--kraft` | #A9824F | Illustration lines, secondary marks |
| `--wheat` | #EEE2C6 | Tags, quiet tints |
| Freshness ramp | #4E8A3E → #C8952B → #B0452E | Shelf life only: clock, load bars, grade |

Rust (#B0452E) means spoiling or rejected, nothing else. Different from Cleared (teal-green #0F7B5F, grey paper) and Lifeline (coral, beige paper).

## Type
- **Fraunces** (OFL) for headings and big numbers: an almanac serif, sentence case.
- **Public Sans** (OFL) for UI text; tabular figures for money and weights.
- **IBM Plex Mono** only for PayPal IDs.
- Never all caps except the stamps.

## Signatures
1. **The logo: a leaf-hand clock.** A clock face of tick marks whose single hand is a leaf. Final pick from the logo sheet.
2. **The freshness clock.** A ring around each load that drains along the freshness ramp; "8 h 52 m left" in Fraunces at its centre. Ticks live.
3. **Engraved fields.** Fine kraft line-art (crop rows, an orchard, a truck on a farm road) at the foot of sections and in empty states. Low contrast, never behind text.
4. **Inspection stamps.** Big state changes land as an ink stamp, like a produce inspection stamp: REJECTED, HELD $2,752, ACCEPTED, VOIDED. Only for these moments.

## Layout
- **Sidebar** (the product standard, chosen by the user): Today · Loads · Buyers · Money · Rules, a "needs you" card for the most urgent load, How it's built, back home, and the PayPal sandbox panel. Phones: a top bar and a bottom tab bar.
- **Today:** Bryntum Scheduler, light theme retuned to these tokens; trucks as rows, bars per trip kind, the agent's new delivery dashed in forest. Click a delivery to report a rejection.
- **Load page:** a wide facts strip (freshness ring, grade, prices, floor, files), then the negotiation (price ladder, buyer agents, deal card or money trail) beside the load's chat.
- **Dock check:** phone-first.

## The agent
The engraved crate (public/art/crate-blank.webp) with its face drawn in code (src/components/brand/agent-crate.tsx): idle (blinks, glances, can follow the cursor), working (eyes scan), thinking, worried, happy.

## Never
Gradients, glassmorphism, coloured side stripes, robot icons, emoji, strawberry clip-art as a logo, invented numbers.
