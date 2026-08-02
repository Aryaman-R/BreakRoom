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
| Forged "kiosk walk-in" orders with no phone at all | Cafe-wide walk-in caps **enforced in the insert transaction** + a lower size limit + the accept valve (see below) |
| **SMS pumping — farming the cafe's Twilio account for premium-rate revenue** | **NANP-only destinations, plus per-phone, per-IP, and global hourly send budgets** |
| **Brute-forcing a verification code** | **Attempt counter per code, one live code per phone** |
| Anything that slips through | **The valve: nothing is made until staff tap Accept** |

## The six layers

**1 · Human accept valve.** The ultimate backstop. Every order sits inert until a staff member looks at it and taps Accept. Weird order? Don't accept it. This single control means every other layer only has to reduce noise, not be perfect.

**2 · SMS verification.** 6-digit code, 5-minute expiry. Built directly on Twilio (~1¢ per message) — no third-party auth product needed. Kills anonymous prank orders and gives every order an accountable phone number.

Two things about this layer cost real money if they are wrong, so they get their own controls:

*Sending.* Every code is a message the cafe pays for. A per-phone limit alone is no limit at all — an attacker sends one code each to a million different numbers and never trips it. That is **SMS pumping**: the attacker controls (or is paid by) the destination range and earns a share of the termination fee, and the cafe gets the bill. So:

| Control | Default | Why |
|---|---|---|
| NANP-only destinations | `+1` | `lib/phone.ts` refuses anything outside the North American Numbering Plan. This is a **pickup** cafe — every real customer walks in to collect, so a code has no reason to go overseas, and the premium international ranges that make pumping profitable are simply unreachable. Widening this is a business decision, not a cleanup. |
| `max_sms_per_hour_global` | 60 | The backstop that actually bounds the bill, whatever the attacker rotates. Hitting it logs loudly — it means either the busiest hour the cafe has ever had, or an attack. |
| `max_sms_per_hour_per_ip` | 6 | Catches the naive version. Spoofable behind an arbitrary proxy, which is why it is not the one doing the real work. |
| per phone | 3/hour | The original limit. Still useful against one annoyed customer; useless against the threat above. |

*Guessing.* A 6-digit code is a million possibilities, which is plenty only if wrong guesses are counted. They were not: a miss returned "that didn't match" and cost the attacker nothing, and up to three codes were live per phone at once, so any single guess had three chances to land. Now `verification_codes.attempts` is incremented on every miss and checked before the next (`max_code_attempts`, default 5), and issuing a new code marks the previous ones spent.

*Spending.* The code is marked used only once every other gate has passed. It used to be spent the moment it matched — before the blocklist, the caps, and pricing — so any later rejection destroyed a valid code and forced another SMS, which could push a blameless customer over their own hourly send limit.

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
| `allow_walkin_orders` | **0 if unset** | Kill switch. Set to 0 from `/admin` and every order needs a verified number again, kiosk included. The in-code default is **off**: a kill switch that defaults to on fails in the wrong direction, and a deployment that never ran `0004_kiosk_walkin.sql` has no row at all — which used to silently enable phoneless ordering on an installation whose owner had never been told the feature existed. Applying 0004 inserts the row with `1`. |
| `max_open_walkin_orders` | 5 | Phoneless orders in flight at once, **cafe-wide**. A flood stops at five tickets, and each one staff cancel frees a slot. |
| `max_walkin_per_hour` | 20 | Phoneless orders accepted per rolling hour, cafe-wide. Bounds a slow drip. |

**Both walk-in caps are enforced inside the insert transaction** (`place_order`, under a transaction-scoped advisory lock — see `0005_hardening.sql`), not by reading counts in the API route beforehand. The route still pre-checks, because it produces a friendlier message and saves a round trip, but that check is not what holds the line: two reads followed by a write bound a *sequential* attacker and nothing else, and forging walk-ins is trivially parallel. N concurrent requests all saw the same pre-insert counts, all decided they were under the cap, and all inserted.
| Size limit | `call_to_confirm_threshold_cents` ($50) | Walk-ins can't route to `call_to_confirm` — there's nobody to call — so the threshold becomes a wall. Over it, the kiosk asks for a number (restoring the $150 hard cap) or sends them to the counter. |
| Accept valve | always | Unchanged and decisive: no food is made until staff tap Accept, and every walk-in is badged **"Walk-in — call the name"** on the staff screen. |

The worst realistic outcome is therefore a handful of junk tickets on the staff screen that nobody accepts — annoying, self-limiting, and **zero food cost**. Compare that to the upside: the customers this serves are standing at the counter, which is the most accountable an order in this system ever gets.

Two things make this safe to ship rather than merely defensible. First, phoneless orders are trivially auditable — `select * from orders where phone is null` is the whole report. Second, if the pilot shows abuse, the fix is one toggle in `/admin`, not a deploy.

## Staff access

`/staff` shows every open order with the customer's **name and phone number**, and the buttons that advance order status. Access is an allow-list: an email on `STAFF_EMAILS` or `ADMIN_EMAILS`, checked in `middleware.ts` (so the page never renders) and again in `lib/guards.ts` (so the API never answers). `/admin` additionally requires `ADMIN_EMAILS`.

"Staff = any signed-in Supabase Auth user" was the earlier rule, and it was only ever safe on the assumption that accounts are created by hand in the dashboard — which nothing enforced. **Supabase enables email sign-ups by default**, so on a project where that had not been turned off, anyone could self-register and read the customer list. Two independent fixes, both required: turn sign-ups off (SETUP.md §2.3), and configure the allow-list. With neither variable set the app refuses everyone rather than admitting everyone.

## Deliberate non-goals

No CAPTCHAs, no customer accounts, no card-on-file, no ID checks. Each adds friction that costs more real lattes than it saves in fraud. Revisit only if pilot data shows an actual problem the six layers miss.

**Still not solved: the kiosk cannot prove it is a kiosk.** The walk-in path is gated on `source: "kiosk"` in a request body, and nothing about a browser on the public internet can prove that claim — anyone who reads the JavaScript can post the same payload. The caps above bound the damage to junk tickets, and the accept valve means zero food cost, but a determined attacker can still consume the cafe-wide walk-in allowance from off-site and make the real counter kiosk refuse phoneless orders until the hour rolls over. Closing that properly needs a per-device credential provisioned by staff (so the caps can be keyed per kiosk rather than cafe-wide) — worth doing if the pilot ever sees it happen, and deliberately not guessed at before then.
