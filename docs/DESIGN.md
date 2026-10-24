# Design: "Almanac" (draft, 25 Oct 2026)

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
- Top bar (logo, the most urgent clock, PayPal sandbox tag). No sidebar, no chat rail.
- **Today:** Bryntum Scheduler, light theme retuned to these tokens; trucks as rows, bars in freshness colours, the agent's new delivery dashed in forest.
- **Load room:** load card + clock, offers chart against the floor, deal card, and the load's own chat (messages, attachments, the agent says what it changed).
- **Dock check:** phone-first.

## Never
Gradients, glassmorphism, coloured side stripes, robot icons, emoji, strawberry clip-art as a logo, invented numbers.
