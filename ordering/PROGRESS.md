# Ordering System — Build Progress

> Living document. Updated as implementation proceeds. See `SETUP.md` for the
> things only the owner can do (accounts, credentials, deploy).

## Context decisions (settled with Aryaman, 2026-07-21)

- **Where the app lives:** a self-contained Next.js app in this `ordering/`
  folder (own `package.json`). The main site remains a static Cloudflare Pages
  export and is untouched. Deploys to Vercel with **Root Directory =
  `ordering`** so it can host server API routes.
- **Credentials:** none available yet. Everything is built to final-product
  fidelity against real Supabase/Twilio APIs; wiring up is env vars + running
  the SQL migrations (see `SETUP.md`). SMS has a dev fallback: with no Twilio
  creds the message is logged server-side and (outside production) the
  verification code is returned to the client so the whole flow is testable.
- **Visuals:** matches the main site's Quiet Hours brand — same palette,
  Squada One display / DM Sans body, same soft-shadow card language.

## Status

| Step (docs/ORDERING-IMPLEMENTATION.md) | State |
|---|---|
| 0 · Accounts & services | ⛔ **Owner task — see SETUP.md** |
| 1 · Scaffold | ✅ done |
| 2 · Schema (SQL written; must be run in Supabase) | ✅ SQL in `supabase/migrations/`, verified on local Postgres 16 |
| 3 · API layer | ✅ done, e2e-tested against local Postgres + PostgREST |
| 4 · Customer pages | ✅ done (menu, item sheet, cart, verify + checkout, status page) |
| 5 · Staff screen | ✅ done (realtime + polling fallback, chime, status buttons) |
| 6 · Admin | ✅ done (menu CRUD, variants/add-ons, sold-out, hours, caps, blocklist) |
| 7 · Deploy | ⛔ Owner task — see SETUP.md |
| 8 · Pilot hardening | ✅ done (empty/loading/error states, error boundary, SMS failure policy) |
| 9 · Test checklist | 🔶 all API-testable items passed locally (log below); the SMS-delivery and realtime-latency items need the deployed build — reproduced in SETUP.md §5–6 |

## Implementation notes & deviations

- **Docs moved** from `ordering/*.md` to `ordering/docs/` to match the layout
  `CLAUDE.md` references (`docs/ORDERING-*.md`).
- **Atomic order insert:** supabase-js can't span a transaction across two
  inserts, so migration `0003_place_order.sql` adds a `place_order()` Postgres
  function — order row + snapshotted items + `next_order_number()` in one
  transaction. `execute` is revoked from client roles.
- **Twilio via REST `fetch`, not the `twilio` npm SDK** — same API, ~40 lines,
  no heavyweight dependency. Swap-in is one file (`lib/sms.ts`) if the SDK is
  ever preferred.
- **Verification-code consumption is race-safe:** one conditional
  `UPDATE … SET used=true WHERE used=false AND expires_at > now()`; two
  concurrent submits can't both spend a code. Per the spec's step order, the
  code is spent *before* the later gauntlet checks, so a rejected order
  (e.g. open-order cap) requires requesting a fresh code.
- **Main-site `tsconfig.json`** gained `"ordering"` in `exclude` — without it
  the static site's typecheck swept the subfolder app. Only config touched;
  no site code changed.
- **Local verification rig (not committed):** Postgres 16 + a real PostgREST
  binary + a 30-line `/rest/v1` proxy + minted HS256 JWTs stand in for
  Supabase. The full checkout gauntlet ran against it: wrong code 401 ·
  missing/invented variant 400 · invented add-on 400 · qty 6 400 · tampered
  prices ignored (server total wins) · $87 cart → `call_to_confirm` ·
  $172 cart → `hard_cap` · 4th order/day 429 · 2nd open order 409 · blocked
  phone can't get a code · sold-out item rejected via direct API · order at
  2 AM Pacific → 403 closed · status endpoint returns no phone · 3 codes/hr
  rate limit · daily order numbers increment atomically.
- Schema + RLS also verified directly in psql: anon sees only available menu
  items and nothing else; authenticated sees menu/orders/items but no
  settings/codes/blocklist; `place_order()`/`next_order_number()` not
  executable by client roles; empty-item orders rejected.
- The **service-role key is provably absent from the client bundle** (grep of
  `.next/static` after a production build: zero hits for the key value or the
  env var name).
- `/staff` and `/admin` are `noindex`; the admin page renders a friendly
  "not an admin" screen for staff accounts not on `ADMIN_EMAILS`.

## Verification run (2026-07-21)

- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm test` — 22/22 passing (pricing, hours, transitions, phone)
- `npm run build` — production build succeeds, all routes dynamic as intended
- Main site: `npm run typecheck` still clean with `ordering/` excluded

## What's next (in order)

1. Owner works through `SETUP.md` (Twilio first — approval lag).
2. Deployed smoke test with `ALLOW_DEV_VERIFICATION=1`, then the full §9
   checklist with real SMS.
3. First admin task after launch: complete the menu (yakisoba proteins etc.).
4. Phase 2 candidates when trust is earned: QR code on the counter, main-site
   Order button swap, thermal printer, `/admin` stats.
