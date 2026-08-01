# Ordering System — Phase 1 Implementation Plan

> Scope reminder: this plan builds the **pickup-ordering system only**, deployed at `order.breakroombothell.com`. The main website is untouched.

Build in this order. Each step ends with acceptance criteria — don't move on until they pass. Total scope: roughly 1–2 weeks part-time.

## 0 · Accounts & services (no code)

- Create a Supabase project (free tier). Copy the URL, anon key, and service role key.
- Twilio: buy a number and **start toll-free verification or 10DLC registration immediately** — US carriers block unregistered senders, and approval takes days. Everything else can proceed while this is pending.
- Vercel account, connected to this GitHub repo.
- Cloudflare (already manages breakroombothell.com): plan a CNAME `order` → Vercel once deployed in step 7.

✅ Every env var listed in `CLAUDE.md` has a value in `.env.local`.

## 1 · Scaffold

`npx create-next-app@latest` with TypeScript, App Router, Tailwind. Add `@supabase/supabase-js` and `twilio`. Create two Supabase client helpers: a browser client (anon key) and a server client (service role key, imported with `server-only`). Add helpers: `formatCents()`, and `pacificNowMinutes()` returning minutes-from-midnight in `America/Los_Angeles` (via `Intl.DateTimeFormat` — never the server clock directly).

✅ App boots; lint passes; service role key is provably absent from the client bundle.

## 2 · Schema

Run the SQL from `docs/ORDERING-DATABASE.md` in the Supabase SQL editor — tables, RLS, realtime, indexes, and the real Breakroom seed menu. Create staff and owner users in the Auth dashboard. Set `ADMIN_EMAILS`.

✅ Tables visible; `select next_order_number();` returns 1, then 2; menu rows show variants/add-ons jsonb.

## 3 · API layer

All routes under `app/api/`. These are the only writers in the system.

### POST `/api/verify/start`
Body `{phone}`. Normalize to E.164 → 403 if blocked → 429 if ≥3 codes for this phone in the last hour → insert 6-digit code with 5-minute expiry → Twilio SMS: *"Your Breakroom code: 123456"*.

### POST `/api/orders`
Body `{customer_name, phone, code, source, items: [{menu_item_id, variant_label?, addon_labels?, quantity, notes}]}`.

In order:
1. **Hours gate:** `pacificNowMinutes()` must be ≥ `ordering_open_minutes` and < `ordering_close_minutes − last_order_buffer_minutes` → else 403 with a friendly "ordering is closed" payload.
2. Validate code: matches phone, unused, unexpired → mark used. Else 401.
3. Blocklist check → 403.
4. Open-order check: any order for this phone in `new` / `call_to_confirm` / `accepted` / `ready` → 409.
5. Daily cap: orders today for this phone ≥ `max_orders_per_phone_per_day` → 429.
6. Per item: exists and `available`; if the item has `variants`, `variant_label` must match one (else 400); every `addon_label` must match the item's `addons` (else 400); `quantity ≤ max_qty_per_item`.
7. **Recompute pricing entirely from DB jsonb:** unit = variant price (or base `price_cents`) + sum of matched add-on prices; total = Σ unit × qty. Ignore every client-sent number.
8. Total > `hard_cap_cents` → 400. Total > `call_to_confirm_threshold_cents` → status `call_to_confirm`, else `new`.
9. `next_order_number()`, then insert order + snapshotted items (name, variant_label, chosen addons jsonb, unit price) in one transaction.

Returns 201 `{order_id, order_number, status}`.

### GET `/api/orders/[id]`
Sanitized projection for the status page: `{order_number, status, items, total_cents, created_at}` — **no phone**. No auth; the UUID is the capability.

### PATCH `/api/orders/[id]` — staff session required
Body `{status}`. Enforce the transition table from ORDERING-ARCHITECTURE.md; set `accepted_at` / `ready_at`. Side effects:
- → `accepted`: SMS *"Breakroom order #N confirmed — ready in about 15 minutes."*
- → `ready`: SMS *"Breakroom order #N is ready for pickup!"*
- → `no_show`: if this phone now has ≥2 `no_show` orders, insert into `blocked_phones` with reason `"2 no-shows"`.

### Admin routes — staff session + email in `ADMIN_EMAILS`
Menu CRUD including variants/add-ons/notes_prompt (`GET/POST /api/admin/menu`, `PATCH/DELETE /api/admin/menu/[id]`), settings incl. hours (`GET/PATCH /api/admin/settings`), blocklist (`GET/DELETE /api/admin/blocked`).

✅ The full order flow works via curl. Tampered prices, fake variant labels, and invented add-ons are all rejected or ignored in favor of DB values. An order attempted at 3:15 PM Pacific is refused.

## 4 · Customer pages

**`/`** — menu grouped by category (available items only). Item sheet: variant picker (required radio when present), add-on checkboxes with prices, quantity, and a notes box showing the item's `notes_prompt` (this covers bread, sauce, sweetness, ice, side picks). Cart shows each line's variant + add-ons. Subtotal displays with **"plus tax at pickup"** — tax is the register's job. Checkout sheet: name → phone → "Text me a code" → code entry → Place order → redirect to `/order/[id]`. Show **"Pay at the register when you pick up"** prominently before submission. Outside hours, replace the cart with "Online ordering is open 9:30 AM – 3:10 PM daily."

**`/order/[id]`** — big order number, four-step status tracker, polls the GET endpoint every 5s. `call_to_confirm` shows *"We'll give you a quick call to confirm this one."*

✅ Comfortable on a phone screen; wings can't be added without picking a count; sold-out items don't render; a wrong code produces a friendly retry, not a dead end.

## 5 · Staff screen

**`/staff`** behind Supabase Auth login. Order cards oldest-first, grouped by status. `new` and `call_to_confirm` cards highlighted, with source badge (WEB/QR/KIOSK), variant + add-ons + notes rendered exactly as staff need to re-key them, and the customer's phone shown on `call_to_confirm` cards. Chime: an "enable sound" tap once on load (browser autoplay rule), then a loop every ~10s while anything needs accepting. Realtime subscription with a polling fallback.

Buttons: **Accept · Ready · Picked up · No-show · Cancel** (cancel asks for confirmation).

✅ An order placed from a phone appears within ~2 seconds and chimes; Accept and Ready each deliver their SMS; an 8pc Korean wings + Milk Tea with boba card reads unambiguously.

## 6 · Admin

**`/admin`** — menu table with inline edit of name/price/category, variant and add-on editors, notes_prompt field, the availability toggle (the one-tap sold-out), add and archive items, hours editor, caps editor bound to `settings`, blocklist view with unblock. First real task after launch: finish entering the full Breakroom menu (the seed is a subset — e.g. yakisoba protein prices).

✅ Toggling sold-out removes the item from `/` immediately; a caps or hours change applies to the very next order attempt.

## 7 · Deploy

Push → Vercel → set env vars → deploy. Add the Vercel URL to Supabase Auth's allowed redirect list. In Cloudflare, add CNAME `order` → the Vercel target, so the app lives at `order.breakroombothell.com`.

✅ A production order placed from a phone on cellular data is accepted on a second device, and both SMS arrive.

## 8 · Pilot hardening

Empty states, loading states, error toasts. Log Twilio failures: a failed *ready* SMS must not break the order (log and continue), but a failed *verification* SMS must surface clearly to the customer. Turn on Vercel analytics.

## 9 · Test checklist — definition of done

- [ ] Cannot order without a valid, unexpired code
- [ ] Blocked phone: can't receive a code, can't order
- [ ] Second open order from the same phone → 409
- [ ] Fourth order in one day → rejected
- [ ] Quantity 6 of one item → rejected
- [ ] Order attempt at 3:15 PM Pacific (inside buffer) → 403; at 10 AM → accepted
- [ ] Wings submitted without a variant → 400; with variant "40 pc" → 400
- [ ] Invented add-on label → 400; tampered add-on price ignored (server prices win)
- [ ] $200 cart → rejected; $75 cart → lands as `call_to_confirm`
- [ ] Client-tampered totals ignored — server total wins
- [ ] Sold-out item rejected even via direct API call
- [ ] Illegal status jump (`new` → `ready`) → 400
- [ ] Accept + Ready SMS arrive; status page reflects each within 5s
- [ ] Two no-shows → third order attempt from that phone is blocked
- [ ] Staff screen chimes until Accept is tapped

## Kiosk mode — on-device checklist

Not part of the Phase 1 definition of done above; kiosk mode was built ahead of
the kiosk hardware (see the roadmap). These need a **real touchscreen** — the
jsdom component tests cover the logic, but every bug found so far has been in
touch behaviour that jsdom can only simulate. Run with `?kiosk=on`.

**Keyboard**

- [ ] Tapping a text box raises the keyboard; the device's own keyboard never appears
- [ ] Item notes: type a note, tap hide → the sheet stays open, the note survives, and *Add to cart* still adds the item
- [ ] Checkout: type name, hide, type phone, hide → still on checkout, both fields intact
- [ ] Hiding the keyboard never closes the dialog it was typing in (the ghost-click regression)
- [ ] Tapping the same field again after hiding brings the keyboard back
- [ ] The `?123` / `ABC` layer switch is clearly visible under the cafe's actual lighting
- [ ] Layouts match the field: phone pad on phone number, decimal pad on prices, `@`/`.com` on email
- [ ] The focused field is never covered by the keyboard, including inside a scrolled sheet

**Session**

- [ ] Attract screen appears on load and after every reset; one tap starts ordering
- [ ] Outside ordering hours the attract screen says so, and the menu is still browsable
- [ ] Half-build an order and walk away: warning at ~60s, wipe at ~75s, back to attract
- [ ] The idle warning survives a passer-by brushing the screen — only its button dismisses it
- [ ] "Start over" in the header wipes the cart from any point in the flow
- [ ] After an order, the number is legible from **the far side of the counter**
- [ ] The confirmation clears itself; tapping the countdown buys more time but can't stop it
- [ ] The next customer's menu is fresh — nothing left in the cart, no scroll position kept

**Walk-in**

- [ ] "Call my name" places an order with no phone and no code
- [ ] It appears on `/staff` badged *"Walk-in — call the name"*
- [ ] Marking it no-show doesn't threaten to block a phone number
- [ ] An order over the call-to-confirm amount is refused with a "add a number or order at the counter" message
- [ ] Turning the toggle off in `/admin` removes the button from the kiosk on the next page load

**Resilience and exit**

- [ ] Pull the network: the kiosk goes out of service within ~40s and recovers on its own
- [ ] Five taps top-left → PIN pad; the right PIN exits kiosk mode, a wrong one locks out after 5 tries
- [ ] `?kiosk=off` still works from a device that has a URL bar
- [ ] A customer's own phone is unaffected by any of it
