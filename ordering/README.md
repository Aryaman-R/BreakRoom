# The Breakroom — Online Ordering System

> **Scope: this repository is ONLY the online pickup-ordering system.** The Breakroom's main website ([breakroombothell.com](https://breakroombothell.com)) is a separate project — nothing in this repo touches it. Every doc in here is named `ORDERING-*` to make that unmistakable.

Order-ahead web app for The Breakroom (Bothell, WA). Customers browse the menu, place a pickup order, and **pay at the register when they arrive**. Staff see the order on a screen, re-key it into the existing Bematech POS, and the customer gets a text when it's ready.

**No payment processing. No processor fees. No changes to the existing POS or the main website.**

## Why it works this way

- The Breakroom is already live on DoorDash — so staff **already run the tablet re-key workflow every day**. This system adds a second, commission-free channel using the exact same muscle memory: order appears on a screen, staff re-key it into the POS.
- The cafe pays fees to its POS provider and doesn't want a second payment processor. So Phase 1 takes **zero payments** — customers pay at pickup through the register they already use, and the POS handles sales tax as it always has. Online prices display as menu prices, "plus tax at pickup."
- Fraud exposure is bounded by design: nothing gets made until staff tap **Accept**, every order requires SMS phone verification, orders are only accepted during open hours, and server-enforced caps limit order size and frequency. See [docs/ORDERING-FRAUD-PREVENTION.md](docs/ORDERING-FRAUD-PREVENTION.md).

## The three screens

| Route | Who | What |
|---|---|---|
| `/` | Customers | Menu → cart (with size/protein choices and add-ons) → name + verified phone → submit. Pay at pickup. |
| `/staff` | Staff | Live order queue with a chime. Accept / Ready / Picked up / No-show. Accept and Ready fire SMS to the customer. |
| `/admin` | Owner | Menu and prices, one-tap sold-out toggle, ordering hours, fraud caps, blocklist. |

Plus `/order/[id]` — the customer's live status page.

## Kiosk mode

For a shared touchscreen at the counter that has no physical keyboard. Every
screen above gains an on-screen keyboard whenever a text field is focused.

**Turn it on:** visit any page with `?kiosk=on` once, on that device.
**Turn it off:** `?kiosk=off`.

The setting is a `localStorage` flag on **that one device**, so it survives
reloads and reboots but is invisible to everyone else — customers on their own
phones never load any of it, and there's nothing to accidentally leave enabled
for the public.

While a field is focused the keyboard docks to the bottom of the screen and the
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

Nothing here needs special hardware — it's the same app, so a tablet in a stand
works today. Dedicated kiosk hardware is a separate, later question:
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
supabase/migrations/                 Schema + seed + place_order(), run in order
app/ · components/ · lib/            The Next.js app (customer, staff, admin, kiosk, API)
tests/                               Unit tests (pricing, hours, transitions, phone, kiosk)
```

## Phases at a glance

1. **Now** — order-ahead + pay at pickup (this spec).
2. **Later** — QR code on the counter, thermal ticket printer, order stats, wiring the main site's Order button to point here for pickup. Kiosk hardware stays deliberately shelved until payments exist — rationale in [docs/ORDERING-ROADMAP.md](docs/ORDERING-ROADMAP.md).
3. **If the owners ask** — online payment (the unlock that turns the kiosk into true self-checkout), scheduled pickup times.

The rule for every phase: **new surfaces, never rewrites.**

## License

All rights reserved. Private commercial project for The Breakroom, Bothell, WA.
