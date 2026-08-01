# Ordering System — Roadmap

> Scope reminder: every phase below extends the **pickup-ordering system**. The main website only ever changes by pointing a link at it.

The rule: every phase adds **surfaces** to the same app and database. If a phase requires a rewrite, the design was wrong.

## Phase 2 — once the owners trust it

**Wire the main site's Order button.** breakroombothell.com's Order button currently goes to DoorDash. The likely end state: **Order Pickup** → `order.breakroombothell.com` (commission-free), **Delivery** → DoorDash. DoorDash takes a commission even on pickup orders placed through it, so every pickup redirected here is straight margin back to the cafe. Exact button layout is the owners' call.

**QR code on the counter.** The ordering URL with `?source=qr`, printed as *"Skip the line — order ahead."* Zero new code. This captures most of a kiosk's value, because the slow part of counter service is the customer *deciding* — bread, sauce, sweetness, toppings — not paying. Moving the deciding onto their phone turns 2-minute order-and-pay interactions into 20-second pay-only pickups.

**Thermal ticket printer.** A ~$50 ESC/POS printer plus a tiny local print service (Node, running on any always-on machine at the cafe) that watches for accepted orders and prints a physical ticket. More rush-proof than a chime, and it removes "staff forgot to look at the screen" as a failure mode.

**Stats on `/admin`.** Orders per day, top items, hour-of-day histogram — all cheap queries on data already being collected. This is also the evidence base for the Phase 3 payments conversation.

**Modifier upgrade path, only if needed.** Variants + add-ons + guided notes should cover the real menu. If notes-based choices (bread, sauce, sweetness, side picks) prove error-prone in re-keying, graduate them to proper `modifier_groups` / `modifier_options` tables. That's an additive migration — existing orders' snapshots are untouched.

**Kiosk hardware — the only part still shelved.** Everything on the software side of the old kiosk plan is now built and shipping in the app; what's left to buy is a screen and a stand:

- Raspberry Pi 4/5 + 10–15" HDMI/USB touchscreen + secured stand (~$250 total)
- Chromium in `--kiosk` mode pointed at `https://order.breakroombothell.com/?kiosk=on`
- Nightly reboot; systemd restarts the browser on crash

That's the whole remaining list. The software half of the original bullet — bigger touch targets, no site nav, a 60-second idle timer that wipes the cart, an out-of-service fallback when offline, a hidden 5-tap-corner + PIN staff exit — is done, along with an attract screen, a self-clearing order-number confirmation, and the phoneless walk-in checkout that was the kiosk's only unique audience in the first place. See [Kiosk mode](../README.md#kiosk-mode).

Two consequences worth stating. First, a **kiosk no longer waits on Phase 3**: it was shelved because "a kiosk customer still pays at the register, so its only unique audience is phoneless walk-ins" — and serving phoneless walk-ins is now a feature, not a gap. Second, none of it needed hardware to build or to use: any tablet in a stand is a kiosk today, which is also the cheapest possible way to find out whether the cafe wants one before spending $250.

The moment Phase 3 payments ship, the same screen becomes true self-checkout with no kiosk-side changes.

## Phase 3 — only if the owners ask

**Online payment (Stripe Checkout)** behind a toggle: pay-at-pickup vs pay-online. This is the unlock that lets QR and kiosk orders skip the register entirely. Reopen the fee conversation with real order-volume data from Phase 2 stats — a percentage fee on proven demand is a different proposition than one on hypothetical demand, and it's still far below DoorDash's commission.

**Scheduled pickup times** — "ready at 12:30," throttled per 15-minute window so the bar isn't slammed. Pairs naturally with the cafe's 9:30–3:30 hours.

**Repeat-customer touches** — recognize a returning phone, offer "your usual?" one-tap reorder.

**Daily summary email** to the owner: orders, revenue routed through the app, top items.

## Explicit non-goals — all phases

- **No integration with the Bematech POS.** The re-key boundary is a feature: zero coupling to a legacy system, zero vendor certification, zero added fees. Staff already run this exact workflow for DoorDash. If the cafe ever changes POS providers, nothing here changes.
- **No changes to the main website's codebase.** It links here; that's the whole relationship.
- **No delivery.** DoorDash keeps that job. Pickup only.
- **No native apps.** The web app is the app.
