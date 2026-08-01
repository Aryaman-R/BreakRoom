# Running It Right Now (local)

See the whole thing working on your machine in ~10 minutes. You need Node 18+
and one free account: **Supabase** (the database). No Twilio, no Vercel, no
credit card. (`SETUP.md` is the separate guide for actually going live.)

## 1 · Create the database (one-time, ~5 min)

1. [supabase.com](https://supabase.com) → New project (free tier, any region).
2. Open **SQL Editor** and paste-and-run these three files from
   `supabase/migrations/`, in order:
   `0001_schema.sql` → `0002_seed_menu.sql` → `0003_place_order.sql`.
3. **Authentication → Users → Add user**: any email + password, with
   **Auto confirm** on. This is your staff/admin login.

## 2 · Configure and start

```bash
cd ordering
cp .env.example .env.local
npm install
npm run dev          # → http://localhost:3100
```

In `.env.local`, fill exactly four values:

```
NEXT_PUBLIC_SUPABASE_URL=      https://<ref>.supabase.co   (Connect button, or Project Settings → Data API)
NEXT_PUBLIC_SUPABASE_ANON_KEY= the publishable key (sb_publishable_…)
SUPABASE_SERVICE_ROLE_KEY=     a secret key (sb_secret_…)
ADMIN_EMAILS=                  the email you created in step 1.3
```

(Older Supabase projects show legacy "anon"/"service_role" JWT keys instead —
those work in the same two slots.)

Leave the Twilio lines empty — that's what turns on dev mode.

## 3 · The tour

1. **Order** at `http://localhost:3100`: add an 8 pc wings + a Milk Tea with
   boba, check out with any name and a fake number like `(425) 555-0100`.
   Because Twilio isn't configured, **the 6-digit code appears right on the
   checkout screen** — enter it, place the order, and you land on the live
   status page.
2. **Staff screen** — second tab, `http://localhost:3100/staff`, sign in with
   your step-1.3 user. The order card is there; tap **Enable sound**, then
   **Accept** → **Ready** → **Picked up** and watch the customer status page
   update within ~5 seconds at each step.
3. **Admin** — `http://localhost:3100/admin`: toggle an item sold-out (it
   vanishes from the menu on reload), edit prices/variants, change the caps.

**Says "ordering is closed"?** The hours gate is real: orders are only taken
9:30 AM – 3:10 PM **Pacific**. For after-hours testing, open `/admin` →
Hours & caps and set Opens `00:00`, Closes `23:59`, Buffer `0` (put it back
later — the defaults are the cafe's real hours).

4. **Kiosk mode** (optional) — load `http://localhost:3100/?kiosk=on`. The
   page becomes a kiosk: a "tap to order" attract screen, bigger targets, and
   an on-screen keyboard on any text field whose layout follows the field
   (QWERTY, phone pad, number pad, decimal pad). Worth trying in a browser
   window rather than a phone emulator, since that's the shape of the real
   hardware. Things to poke at:

   - Add something to the cart and leave the tab alone for a minute — the
     "Still ordering?" warning appears, then wipes the session.
   - Check out and pick **"Call my name"** — no phone, no code. You land on
     the big-number confirmation, which clears itself after 25 seconds.
   - That order shows on `/staff` badged *"Walk-in — call the name."*
   - Tap the very top-left corner five times → PIN pad. The dev PIN is `2468`
     unless you set `NEXT_PUBLIC_KIOSK_EXIT_PIN` in `.env.local`.
   - Kill your network and wait ~40 seconds → "Please order at the counter."

   Turn it back off with `?kiosk=off` — the flag is per-device, in
   `localStorage`.

   **"Call my name" 400s?** Run `supabase/migrations/0004_kiosk_walkin.sql`
   against your local database; it's what makes `orders.phone` nullable.

`npm test` runs the 62 unit tests; no database needed.

## Current limitations

- **No real SMS yet.** Until Twilio is registered (SETUP.md §1), codes show
  on-screen and the "confirmed"/"ready" texts are only logged to the dev
  server console.
- **Localhost only.** Nothing is deployed; SETUP.md covers Vercel + the
  `order.breakroombothell.com` domain.
- **Seed menu is a subset.** Real items and prices, but incomplete — e.g.
  yakisoba only has the Veggie variant. Finishing it in `/admin` is the first
  real task after launch.
- **No payments, by design.** Phase 1 is order-ahead + pay at the register;
  there is deliberately no card flow anywhere.
- **Staff/admin accounts are manual.** Created in the Supabase dashboard;
  `/admin` additionally requires the email to be in `ADMIN_EMAILS`.
- **One open order per phone, 3/day, $150 cap, etc.** — the fraud caps are
  live even locally, so a second test order from the same fake number gets
  refused until you mark the first picked-up (that's the system working).
