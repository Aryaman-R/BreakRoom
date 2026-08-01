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
| Forged "kiosk walk-in" orders with no phone at all | Cafe-wide walk-in caps + a lower size limit + the accept valve (see below) |
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

## The kiosk walk-in exception

The counter kiosk can take an order with **no phone number at all**: the customer types a name, and staff call it across the counter. That is the kiosk's entire reason to exist over the QR code — phoneless walk-ins — and it deliberately steps outside layers 2, 3 (the per-phone rows), 5 and 6, because all four are keyed on a number that isn't there.

**Be clear about what can't be enforced.** The request says `source: "kiosk"`, and nothing about a browser on the public internet can prove that. Anyone who reads the JavaScript can post the same payload from anywhere. So the walk-in path is not defended by the claim — it's defended by making the claim worth very little:

| Control | Default | Why |
|---|---|---|
| `allow_walkin_orders` | 1 | Kill switch. Set to 0 from `/admin` and every order needs a verified number again, kiosk included. |
| `max_open_walkin_orders` | 5 | Phoneless orders in flight at once, **cafe-wide**. A flood stops at five tickets, and each one staff cancel frees a slot. |
| `max_walkin_per_hour` | 20 | Phoneless orders accepted per rolling hour, cafe-wide. Bounds a slow drip. |
| Size limit | `call_to_confirm_threshold_cents` ($50) | Walk-ins can't route to `call_to_confirm` — there's nobody to call — so the threshold becomes a wall. Over it, the kiosk asks for a number (restoring the $150 hard cap) or sends them to the counter. |
| Accept valve | always | Unchanged and decisive: no food is made until staff tap Accept, and every walk-in is badged **"Walk-in — call the name"** on the staff screen. |

The worst realistic outcome is therefore a handful of junk tickets on the staff screen that nobody accepts — annoying, self-limiting, and **zero food cost**. Compare that to the upside: the customers this serves are standing at the counter, which is the most accountable an order in this system ever gets.

Two things make this safe to ship rather than merely defensible. First, phoneless orders are trivially auditable — `select * from orders where phone is null` is the whole report. Second, if the pilot shows abuse, the fix is one toggle in `/admin`, not a deploy.

## Deliberate non-goals

No CAPTCHAs, no customer accounts, no card-on-file, no ID checks. Each adds friction that costs more real lattes than it saves in fraud. Revisit only if pilot data shows an actual problem the six layers miss.
