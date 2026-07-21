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

## Folder layout

```
CLAUDE.md                            Build instructions + guardrails for Claude Code
README.md                            This file
PROGRESS.md                          Build log: status, decisions, test results
SETUP.md                             Owner setup: Supabase, Twilio, Vercel, Cloudflare
docs/ORDERING-ARCHITECTURE.md        System design, order lifecycle, security posture
docs/ORDERING-DATABASE.md            Full Postgres schema, RLS, real Breakroom seed menu
docs/ORDERING-IMPLEMENTATION.md      Step-by-step Phase 1 build plan with acceptance criteria
docs/ORDERING-FRAUD-PREVENTION.md    Threat model and the six control layers
docs/ORDERING-ROADMAP.md             Phase 2 (QR, printer, kiosk) and Phase 3 (payments)
supabase/migrations/                 Schema + seed + place_order(), run in order
app/ · components/ · lib/            The Next.js app (customer, staff, admin, API)
tests/                               Unit tests (pricing, hours, transitions, phone)
```

## Phases at a glance

1. **Now** — order-ahead + pay at pickup (this spec).
2. **Later** — QR code on the counter, thermal ticket printer, order stats, wiring the main site's Order button to point here for pickup. Kiosk hardware stays deliberately shelved until payments exist — rationale in [docs/ORDERING-ROADMAP.md](docs/ORDERING-ROADMAP.md).
3. **If the owners ask** — online payment (the unlock that turns the kiosk into true self-checkout), scheduled pickup times.

The rule for every phase: **new surfaces, never rewrites.**

## License

All rights reserved. Private commercial project for The Breakroom, Bothell, WA.
