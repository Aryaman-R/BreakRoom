# The Breakroom — Online Ordering System

> **Scope: this repository is ONLY the online pickup-ordering system.** The Breakroom's main website ([breakroombothell.com](https://breakroombothell.com)) is a separate project — nothing in this repo touches it. Every doc in here is named `ORDERING-*` to make that unmistakable.

Order-ahead web app for The Breakroom (Bothell, WA). Customers browse the menu, place a pickup order, and **pay at the register when they arrive**. Staff see the order on a screen, re-key it into the existing Bematech POS, and the customer gets a text when it's ready.

**No payment processing. No processor fees. No changes to the existing POS or the main website.**

## Why it works this way

- The Breakroom is already live on DoorDash — so staff **already run the tablet re-key workflow every day**. This system adds a second, commission-free channel using the exact same muscle memory: order appears on a screen, staff re-key it into the POS.
- The cafe pays fees to its POS provider and doesn't want a second payment processor. So Phase 1 takes **zero payments** — customers pay at pickup through the register they already use, and the POS handles sales tax as it always has. Online prices display as menu prices, "plus tax at pickup."
- Fraud exposure is bounded by design: nothing gets made until staff tap **Accept**, every order requires SMS phone verification (the one exception is a kiosk walk-in standing at the counter, capped separately), orders are only accepted during open hours, and server-enforced caps limit order size and frequency. See [docs/ORDERING-FRAUD-PREVENTION.md](docs/ORDERING-FRAUD-PREVENTION.md).

## The three screens

| Route | Who | What |
|---|---|---|
| `/` | Customers | Menu → cart (with size/protein choices and add-ons) → name + verified phone → submit. Pay at pickup. On a kiosk, the phone step can be skipped — see below. |
| `/staff` | Staff | Live order queue with a chime. Accept / Ready / Picked up / No-show. Accept and Ready fire SMS to the customer. |
| `/admin` | Owner | Menu and prices, one-tap sold-out toggle, ordering hours, fraud caps, blocklist. |

Plus `/order/[id]` — the customer's live status page.

## Kiosk mode

For a shared touchscreen at the counter. It's the same app on the same URL —
no separate build, no separate route — with a session model that suits a screen
strangers take turns at.

**Turn it on:** visit any page with `?kiosk=on` once, on that device.
**Turn it off:** `?kiosk=off`, or the staff exit below.

The setting is a `localStorage` flag on **that one device**, so it survives
reloads and reboots but is invisible to everyone else — customers on their own
phones never load any of it, and there's nothing to accidentally leave enabled
for the public.

### What the customer sees

**An attract screen** when the kiosk is idle: *"Order here — tap anywhere to
start."* It tells a passer-by the screen is theirs to touch, and it guarantees
the last customer's session is over before the next one walks up. Outside
ordering hours it says so instead, and the menu is still browsable.

**A menu with a category rail** at the top — one tap to Bubble Tea instead of
scrolling past four categories to reach it.

**Checkout with a choice**, if the owner leaves it on: *Text me* (the usual
verified-phone flow) or ***Call my name*** — no phone number at all. That
second path is the kiosk's whole reason to exist over a QR code, and it's
kiosk-only by database constraint, not by convention. Walk-ins are capped
separately and can't exceed the call-to-confirm amount; see
[docs/ORDERING-FRAUD-PREVENTION.md](docs/ORDERING-FRAUD-PREVENTION.md).

**A confirmation built to be read across a counter**: the order number at the
size of a fist, what happens next, and a countdown that hands the screen back
after 25 seconds. Tapping the countdown buys more time; nothing stops it for
good.

**An idle reset.** A minute untouched raises *"Still ordering?"*, which counts
down fifteen seconds and then wipes the cart and returns to the attract screen.
The warning ignores stray taps on purpose — a bag brushing the screen is not a
customer — so only the button dismisses it.

**An out-of-service screen** if the kiosk can't reach the system: *"Please
order at the counter."* It checks by asking the server every 20 seconds rather
than trusting the browser's online/offline flag, which reports "online" for a
device on wifi whose uplink is down. Better a screen that says it's broken
than one that lets someone type in a whole order it can't place.

The kiosk never links off to the main site — locked-down hardware has no back
button.

### The on-screen keyboard

Every text field summons a keyboard docked to the bottom of the screen, and the
page makes room for it, so the field you're typing into is never covered — this
includes the cart and checkout dialogs, which shrink and scroll to stay clear.
The layout follows the field: full QWERTY with a `?123` symbol layer for text,
a phone pad for phone numbers, a number pad for quantities and caps, and a
decimal pad for prices. Email fields get `@` and `.com` keys. Shift is one-shot
by default and locks on a second tap; holding backspace repeats.

The key at bottom right (a keyboard with a down arrow) **only puts the keyboard
away** — it doesn't submit, doesn't close the dialog you're in, and doesn't drop
what you've typed. Tap the field again to bring the keyboard back. Use the
page's own buttons — *Add to cart*, *Place order* — to actually move forward.

The device's own keyboard is suppressed while kiosk mode is on, so the two can
never fight over the screen. Date and time pickers keep their native widgets.

### Staff exit

**Five taps in the top-left corner** open a PIN pad; the right PIN turns kiosk
mode off on that device and offers links to `/staff` and `/admin`. This exists
because Chromium in `--kiosk` mode has no URL bar, so `?kiosk=off` is
unreachable on exactly the hardware it was meant for.

Set the PIN with `NEXT_PUBLIC_KIOSK_EXIT_PIN`. **It defaults to `2468` — change
it.** The PIN is checked on the device, not on the server, so staff can still
get out when the network is down (which is when they most need to). It is a
speed bump against a curious customer, not a security boundary: all it unlocks
is a flag on a screen you're already standing in front of, and `/staff` and
`/admin` keep their own Supabase auth behind it.

### Hardware

Nothing here needs special hardware — it's the same app, so a tablet in a stand
works today. The dedicated Raspberry Pi build is a separate, later question:
[docs/ORDERING-ROADMAP.md](docs/ORDERING-ROADMAP.md).

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres + Auth + Realtime) · Twilio SMS · Vercel.

Free tiers cover a single cafe. SMS costs roughly a cent per message.

**Suggested home:** `order.breakroombothell.com` — one CNAME record in Cloudflare pointing at Vercel. The main site links to it; the two deployments stay fully independent.

## Status

✅ **Phase 1 code complete** — every surface built and tested locally against a
real Postgres + PostgREST rig (see `PROGRESS.md` for the test log). What's left
is wiring: creating the Supabase/Twilio/Vercel accounts and setting env vars.
**`SETUP.md` is the owner's step-by-step for that.**

This app lives in the `ordering/` subfolder of the main-site repo but deploys
independently (Vercel, **Root Directory = `ordering`**). The main site's static
Cloudflare Pages deployment is untouched.

**Where the code lives (as of 2026-07-27):** `BreakRoom`'s `main` branch has
the live site only; this app rides the **`online-ordering`** branch, mirrored
to the private repo **`Aryaman-R/BreakroomTest`** (`main`) which Vercel deploys
for the pilot. Full topology, env vars, and troubleshooting: `SETUP.md` §0.

## Folder layout

```
CLAUDE.md                            Build instructions + guardrails for Claude Code
README.md                            This file
RUNNING.md                           Run it locally in ~10 min + current limitations
PROGRESS.md                          Build log: status, decisions, test results
SETUP.md                             Owner setup: Supabase, Twilio, Vercel, Cloudflare
docs/ORDERING-ARCHITECTURE.md        System design, order lifecycle, security posture
docs/ORDERING-DATABASE.md            Full Postgres schema, RLS, real Breakroom seed menu
docs/ORDERING-IMPLEMENTATION.md      Step-by-step Phase 1 build plan with acceptance criteria
docs/ORDERING-FRAUD-PREVENTION.md    Threat model and the six control layers
docs/ORDERING-ROADMAP.md             Phase 2 (QR, printer, kiosk) and Phase 3 (payments)
supabase/migrations/                 Schema + seed + place_order() + kiosk walk-ins, run in order
app/ · components/ · lib/            The Next.js app (customer, staff, admin, kiosk, API)
tests/                               Unit tests (pricing, hours, transitions, phone, schemas, kiosk)
```

## Phases at a glance

1. **Now** — order-ahead + pay at pickup (this spec).
2. **Later** — QR code on the counter, thermal ticket printer, order stats, wiring the main site's Order button to point here for pickup. Kiosk *hardware* stays deliberately shelved until payments exist; the kiosk *software* is built and works on any tablet today — rationale in [docs/ORDERING-ROADMAP.md](docs/ORDERING-ROADMAP.md).
3. **If the owners ask** — online payment (the unlock that turns the kiosk into true self-checkout), scheduled pickup times.

The rule for every phase: **new surfaces, never rewrites.**

## License

All rights reserved. Private commercial project for The Breakroom, Bothell, WA.
