# CLAUDE.md

Project: **online pickup-ordering system only** for The Breakroom cafe (Bothell, WA). Customers order on the web and pay at the register at pickup. Staff re-key orders into the cafe's existing Bematech POS by hand — this app **never touches payments**, **never integrates with the POS**, and **has nothing to do with the main website** at breakroombothell.com (a separate project).

## Read before writing any code

1. `docs/ORDERING-ARCHITECTURE.md` — components, order lifecycle, security posture
2. `docs/ORDERING-DATABASE.md` — schema to apply verbatim in Supabase, including the real seed menu
3. `docs/ORDERING-IMPLEMENTATION.md` — the build plan; follow the steps in order
4. `docs/ORDERING-FRAUD-PREVENTION.md` — rules the API layer must enforce

## Hard rules

- **Server is truth.** Recompute every order total server-side: unit price = the item's chosen variant price (or base price) plus chosen add-on deltas, all validated against the `variants`/`addons` stored on the menu item in the database. Client-sent prices, labels, and totals are display-only and must never be persisted.
- **Money is integer cents** everywhere. Never floats, never strings.
- **All writes go through API routes** using `SUPABASE_SERVICE_ROLE_KEY`, which lives server-side only and must never reach the client bundle. RLS stays enabled; browser clients get read-only access per policy.
- **No payment code.** Phase 1 has zero payment processing. Do not add Stripe or any processor — that is Phase 3, and only on explicit request. Sales tax is the register's job; the UI shows menu prices "plus tax at pickup."
- **Ordering hours are enforced server-side** from the `settings` table, evaluated in `America/Los_Angeles` (Vercel runs UTC — never use server local time). Outside hours, `POST /api/orders` rejects and the customer page shows a closed state.
- **Statuses are a closed enum:** `new`, `call_to_confirm`, `accepted`, `ready`, `picked_up`, `no_show`, `cancelled`. Enforce legal transitions server-side; reject anything else.
- **Phones are E.164** — normalize before every store or comparison. `orders.phone` is nullable for **kiosk walk-ins only**, enforced by a check constraint (`phone is not null or source = 'kiosk'`). Anything that reads a phone must handle null: no SMS, no blocklist entry, no per-phone cap. Never relax that constraint to "any source" — a forged `source` field would then buy an anonymous web order.
- **Fraud caps and hours are read from the `settings` table at request time** — never hardcoded.
- **Kiosk mode is a mode, not a stylesheet.** `components/kiosk/KioskProvider` owns it; read it with `useKiosk()`, never by touching `localStorage` or the `?kiosk=` param directly. The invariants it exists to hold: a session always ends (idle timeout, order placed, or "start over"), the cart never survives a session, and the kiosk never navigates off-app — locked-down hardware has no back button. If you add a screen that can hold a customer's attention indefinitely, give it its own countdown or leave the idle timer armed on it.
- **Don't undo the kiosk keyboard's two constraints** (`components/kiosk/`, mounted globally in the root layout): numeric fields use `inputMode="numeric"`/`"decimal"`, **not `type="number"`** — native number inputs suppress the hint the on-screen keyboard reads to pick a layout, so "restoring" them silently breaks it (parse defensively client-side; the server is still the authority). And anything that hides or unmounts the keyboard must act on `pointerup`, never `pointerdown`, and swallow the compatibility click that follows — otherwise it falls through and presses whatever is underneath. Rationale in `docs/ORDERING-ARCHITECTURE.md`.

## Stack

Next.js 14+ App Router + TypeScript · Tailwind · Supabase (Postgres, Auth for staff/admin, Realtime for `/staff`) · Twilio SMS · Vercel, at `order.breakroombothell.com`.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # legacy anon JWT or new sb_publishable_… key
SUPABASE_SERVICE_ROLE_KEY      # server only; legacy service_role JWT or new sb_secret_… key
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
STAFF_EMAILS                   # comma-separated allow-list for /staff
ADMIN_EMAILS                   # comma-separated allow-list for /admin (also grants /staff)
ALLOW_DEV_VERIFICATION         # optional: 1 = deployed builds return codes on-screen (pre-launch only)
NEXT_PUBLIC_KIOSK_EXIT_PIN     # optional: staff exit PIN for kiosk devices (defaults to 2468)
```

## Commands

`npm run dev` · `npm run build` · `npm run lint`

## Definition of done

Every box in the test checklist at the end of `docs/ORDERING-IMPLEMENTATION.md` passes against a deployed build.
