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
| 0 · Accounts & services | 🔶 in progress — Supabase created + migrations run; Twilio not started (SETUP.md §1) |
| 1 · Scaffold | ✅ done |
| 2 · Schema (SQL written; must be run in Supabase) | ✅ SQL in `supabase/migrations/`, verified on local Postgres 16 |
| 3 · API layer | ✅ done, e2e-tested against local Postgres + PostgREST |
| 4 · Customer pages | ✅ done (menu, item sheet, cart, verify + checkout, status page) |
| 5 · Staff screen | ✅ done (realtime + polling fallback, chime, status buttons) |
| 6 · Admin | ✅ done (menu CRUD, variants/add-ons, sold-out, hours, caps, blocklist) |
| 7 · Deploy | 🔶 pilot on Vercel in progress (private `*.vercel.app`, from BreakroomTest); public subdomain deferred to launch — SETUP.md §0/§6 |
| 8 · Pilot hardening | ✅ done (empty/loading/error states, error boundary, SMS failure policy) |
| 9 · Test checklist | 🔶 all API-testable items passed locally (log below); the SMS-delivery and realtime-latency items need the deployed build — reproduced in SETUP.md §5–6 |

## Implementation notes & deviations

- **Kiosk on-screen keyboard, pulled forward from Phase 2.** The roadmap had
  flagged the on-screen keyboard as the jankiest part of a kiosk build, so it
  was built early to retire that risk while the rest is still fresh. It is
  *not* a new route or a new app: `components/kiosk/` mounts once in
  `app/layout.tsx` and layers a touch keyboard over the existing pages when a
  text field is focused. Activation is a per-device `localStorage` flag set by
  `?kiosk=on`, so regular customers never see it and there is nothing to leave
  switched on for the public. Caret/value math is pure and lives in
  `lib/kiosk.ts` (14 tests in `tests/kiosk.test.ts`); the DOM wiring — native
  keyboard suppression, focus tracking, scroll-into-view, and writing values
  through the prototype setter so React's controlled inputs see real `input`
  events — stays in the component. Usage is documented in `README.md`.
- **Kiosk "Done" key replaced with a hide-keyboard key (pilot feedback).** The
  original key blurred the field, which fired the app's own focus handling and
  abandoned half-typed item notes and checkout fields. Worse, it ran on
  `pointerdown`: unmounting the keyboard mid-gesture let the follow-up click
  hit-test through to the page underneath and press whatever had reflowed into
  that spot — usually the sheet backdrop, which closed the dialog. It is now a
  keyboard-with-down-arrow key that only hides the keyboard, leaves focus and
  the caret alone, and fires on `pointerup` so nothing falls through. Tapping
  any field brings it back (the pointerdown-capture listener clears the
  dismissed flag, since re-tapping an already-focused field fires no focus
  event).
- **Ghost-click on hide (second pilot report).** Moving the hide key to
  `pointerup` was not enough: touch synthesizes a compatibility `click` *after*
  `pointerup` and hit-tests it against the DOM at dispatch time, so removing
  the keyboard first left that click landing on whatever was underneath — with
  a centered dialog, the full-screen backdrop, which closes it. Cancelling
  `pointerdown` doesn't prevent it either (Chrome suppresses mousedown/mouseup
  but still fires `click`). The hide key now reports where the finger lifted
  and the manager swallows the one click matching those coordinates within
  500ms, on `document` in the capture phase so it never reaches React's
  listeners. Real taps elsewhere, and taps after the window, are unaffected.
- **Component tests added** (`tests/kiosk-keyboard.test.tsx`, jsdom via a new
  `vitest.config.ts`). The pure logic in `lib/kiosk.ts` was well covered but
  every bug so far has been in DOM behaviour, which nothing exercised. Covers:
  hiding keeps focus/caret/text, the ghost click is swallowed, a genuine tap
  still closes the dialog, the swallow window expires, and re-tapping an
  already-focused field re-summons the keyboard. Verified to fail without the
  fix, not just pass with it.
- **Keyboard key contrast.** The `?123`/`ABC` layer switch was `bg-qh-line/60`
  over the panel — 1.19:1, effectively invisible on a glare-lit screen. Action
  keys now use a full-opacity fill with a sage border, and the layer switch is
  its own solid `mode` variant: 5.79:1 fill and 6.19:1 label, both AA.
- **Admin numeric fields moved from `type="number"` to `inputMode`.** Native
  number inputs suppress the `inputmode` hint the kiosk keyboard reads to pick
  a layout, so price/quantity fields now declare `inputMode="decimal"` or
  `"numeric"` and parse defensively on submit (`|| 0`, `Math.max`). The server
  is unchanged and still the authority — `settingsPatchSchema` rejects
  anything malformed.
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

## Deployment log (updated 2026-07-27)

- **Repo topology:** `BreakRoom` `main` = live site only (Cloudflare Pages);
  `online-ordering` branch = site + Order Ahead button + this app; private
  mirror repo **`Aryaman-R/BreakroomTest`** (`main`) is what Vercel deploys.
  Sync with `git push breakroomtest online-ordering:main`.
- **Pilot mode chosen:** everything stays on `*.vercel.app` URLs; no custom
  domain, no Cloudflare DNS changes until launch (SETUP.md §6). The live
  site is untouched by design.
- **Owner progress so far:** Supabase project created and migrations run
  (new-style publishable/secret API keys — see SETUP.md §2 note); Vercel
  project deployed — initial Root Directory misconfiguration (served the
  marketing site, `/staff` 404) diagnosed and corrected; env-var wiring was
  in progress as of this update. Twilio not started — it has the longest
  lead time (SETUP.md §1).
- **Later main-site work rode along on this branch:** the mobile nav
  overhaul (compact header, reachable menu button — also landed on
  `BreakRoom` `main` for the live site) and the nav's Order Ahead button
  (`NEXT_PUBLIC_ORDER_URL` override → subdomain default in production →
  localhost in dev), which stays branch-only until launch.

## What's next (in order)

1. Finish env wiring + smoke test ladder (SETUP.md §3/§5).
2. Start Twilio toll-free verification (SETUP.md §1 — days of approval lag).
3. Launch: SETUP.md §6 (subdomain, real SMS, delete ALLOW_DEV_VERIFICATION,
   merge the nav button to `BreakRoom` `main`), then the §9 checklist.
4. First admin task after launch: complete the menu (yakisoba proteins etc.).
5. Phase 2 candidates when trust is earned: QR code on the counter, thermal
   printer, `/admin` stats.
