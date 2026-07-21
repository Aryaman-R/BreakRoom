# Ordering System — Fraud & Abuse Model

> Scope reminder: covers abuse of the **pickup-ordering system only**.

Phase 1 takes no payment, so the worst case is never a chargeback — it's **food made for a no-show**, and caps bound that. Context worth giving the owners: this is the same risk cafes have run for decades on call-in orders with nothing but caller ID, except this system adds verification, caps, hours, and a blocklist on top. And The Breakroom already accepts DoorDash orders from strangers all day — this channel is strictly more accountable than that. Food cost runs around 30% of menu price, so a $15 no-show costs the cafe roughly $4.50.

## Threats → controls

| Threat | Control |
|---|---|
| Prank / garbage orders at volume | SMS verification — a real phone per order — plus rate limits |
| One giant fake order | Hard cap rejects it; big-but-plausible orders route to `call_to_confirm` |
| Absurd quantities | Per-item quantity cap |
| Price/choice tampering | Every variant, add-on, and total recomputed server-side from DB values |
| Overnight or after-close orders | Hours gate — ordering only 9:30 AM to 3:10 PM Pacific |
| Serial no-shows | Two strikes → phone blocked |
| Order spam from one person | One open order + three per day, per phone |
| Anything that slips through | **The valve: nothing is made until staff tap Accept** |

## The six layers

**1 · Human accept valve.** The ultimate backstop. Every order sits inert until a staff member looks at it and taps Accept. Weird order? Don't accept it. This single control means every other layer only has to reduce noise, not be perfect.

**2 · SMS verification.** 6-digit code, 5-minute expiry, max 3 sends per phone per hour. Built directly on Twilio (~1¢ per message) — no third-party auth product needed. Kills anonymous prank orders and gives every order an accountable phone number.

**3 · Server-side caps.** Enforced inside `POST /api/orders` — never the UI — and read live from the `settings` table so the owners control the risk dial from `/admin`:

| Setting | Default | Meaning |
|---|---|---|
| `call_to_confirm_threshold_cents` | 5000 ($50) | Above this, staff phone the customer before making anything |
| `hard_cap_cents` | 15000 ($150) | Above this, rejected outright |
| `max_qty_per_item` | 5 | Per line item |
| `max_open_orders_per_phone` | 1 | Until picked up, cancelled, or no-showed |
| `max_orders_per_phone_per_day` | 3 | Per calendar day |

**4 · Hours gate.** Orders are only accepted 9:30 AM – 3:10 PM Pacific (open time through close minus a 20-minute buffer, all editable in settings). Nothing can queue up overnight for staff to find at open, and the kitchen never gets a ticket at 3:29.

**5 · Call-to-confirm path.** Large orders aren't rejected — they land flagged, staff call the verified number, then Accept. The Breakroom already handles event and catering inquiries by phone, so this needs no staff training.

**6 · Two-strike blocklist.** `no_show` is a first-class order status. The second no-show for a phone auto-inserts it into `blocked_phones`; blocked phones can't even receive a verification code. Admin can view and unblock — the logic lives in the API route rather than a DB trigger precisely so it stays visible and reversible.

## Deliberate non-goals

No CAPTCHAs, no customer accounts, no card-on-file, no ID checks. Each adds friction that costs more real lattes than it saves in fraud. Revisit only if pilot data shows an actual problem the six layers miss.
