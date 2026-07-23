# Ordering System — What You Need To Do (Owner Setup)

The code is complete and tested locally; none of it can go live without
accounts and credentials only you can create. Work through this top to bottom
— roughly 45 minutes of clicking, plus a days-long Twilio approval wait you
should **start first**.

Every step references the build docs in `docs/` if you want the why.

---

## 1 · Twilio — start TODAY (approval takes days)

US carriers block SMS from unregistered numbers, and registration review takes
days — start it before anything else (docs/ORDERING-IMPLEMENTATION.md §0).

1. Create an account at [twilio.com](https://www.twilio.com) and buy a phone
   number with SMS capability (~$1/mo; messages ~1¢ each).
2. Immediately start **toll-free verification** (if you bought a toll-free
   number — simpler) or **10DLC registration** (local number) under
   *Messaging → Regulatory compliance*. Describe the use case honestly:
   "Transactional SMS for a cafe's order-ahead site: verification codes and
   order-status notifications. No marketing."
3. Note down, from the Twilio Console home:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` — your new number in `+1XXXXXXXXXX` form

> Until these are set, the app runs in **dev SMS mode**: no texts are sent and
> the verification code is shown on-screen/in logs. Fine for testing, not for
> customers.

## 2 · Supabase — database + staff logins

1. Create a project at [supabase.com](https://supabase.com) (free tier).
   Region: **West US (Oregon)** — closest to Bothell.
2. Open **SQL Editor** and run these three files from `supabase/migrations/`,
   in order, each as one paste-and-run:
   1. `0001_schema.sql` — tables, RLS, realtime, indexes
   2. `0002_seed_menu.sql` — the starter Breakroom menu
   3. `0003_place_order.sql` — the atomic order-placement function
3. Sanity check: in SQL Editor run `select count(*) from menu_items;` —
   expect **29**.
4. Create logins under **Authentication → Users → Add user** (email +
   password, "Auto confirm" on):
   - one **staff** account (shared by the counter), e.g. `staff@breakroombothell.com`
   - one **owner** account for yourself — this email goes in `ADMIN_EMAILS`
5. Note down, from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `anon` `public` key)
   - `SUPABASE_SERVICE_ROLE_KEY` (the `service_role` key — **secret**, server
     only; never share it or put it anywhere but env vars)

## 3 · Vercel — hosting

The main site stays on Cloudflare Pages; this app needs a server runtime, so
it deploys to Vercel (free Hobby tier is fine to start).

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account and
   **Import** the `BreakRoom` repository.
2. In the import screen set **Root Directory = `ordering`** (critical — the
   app lives in that subfolder). Framework preset: Next.js. Leave build
   commands default.
3. Add **Environment Variables** (all environments):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 2 (keep secret) |
   | `TWILIO_ACCOUNT_SID` | from step 1 (omit until ready) |
   | `TWILIO_AUTH_TOKEN` | from step 1 (omit until ready) |
   | `TWILIO_FROM_NUMBER` | from step 1 (omit until ready) |
   | `ADMIN_EMAILS` | your owner email, e.g. `you@example.com` |
   | `ALLOW_DEV_VERIFICATION` | `1` **only while smoke-testing without Twilio — delete before launch** |

4. Deploy. You'll get a `*.vercel.app` URL.
5. Back in **Supabase → Authentication → URL Configuration**, set **Site URL**
   to that URL (update it again after the custom domain below).

## 4 · Cloudflare — the order.breakroombothell.com domain

1. In Vercel: project → **Settings → Domains** → add
   `order.breakroombothell.com`. Vercel shows a CNAME target
   (`cname.vercel-dns.com`).
2. In Cloudflare (which already manages breakroombothell.com): **DNS → Add
   record** → CNAME, name `order`, target `cname.vercel-dns.com`, proxy
   status **DNS only** (grey cloud — Vercel handles TLS).
3. Wait for Vercel to show the domain as valid; update the Supabase Site URL
   to `https://order.breakroombothell.com`.

## 5 · Smoke test the deployed build

With `ALLOW_DEV_VERIFICATION=1` and no Twilio vars, codes appear in the
checkout UI itself, so you can test before SMS approval lands:

1. Open the site on your phone (cellular, not wifi), add an item, check out —
   the on-screen dev code completes verification. Order lands.
2. On another device, sign in at `/login` with the staff account — the order
   card should appear within ~2 s; tap **Enable sound** and confirm the chime.
3. Tap **Accept**, then **Ready**, then **Picked up**; watch the customer
   status page move within 5 s of each.
4. Sign in with the owner account, open `/admin`: toggle an item sold-out and
   confirm it vanishes from the menu on reload; change a cap and try to
   exceed it.
5. When Twilio approval arrives: add the three `TWILIO_*` vars, **delete
   `ALLOW_DEV_VERIFICATION`**, redeploy, and re-run steps 1–3 confirming real
   texts arrive (code, "confirmed", "ready").

## 6 · The full definition-of-done checklist

Run the list at the end of `docs/ORDERING-IMPLEMENTATION.md` §9 against the
production site. Everything in it already passed locally against a real
Postgres + PostgREST rig (see `PROGRESS.md`), so surprises should be config,
not code.

## 7 · First week of operation

- Finish the menu in `/admin` — the seed is a representative subset. Known
  gaps: yakisoba protein variants (chicken/beef/shrimp/tofu/pork with real
  prices), plus anything missing from the full cafe menu.
- Print the QR code (Phase 2): point it at
  `https://order.breakroombothell.com/?source=qr` and staff will see a QR
  badge on those orders.
- When you trust it, point the main site's Order button here for pickup
  (that's a main-site edit — the one-line link swap described in
  docs/ORDERING-ROADMAP.md).

## Local development (optional)

See **`RUNNING.md`** — a 10-minute walkthrough to run and tour the whole
system locally (Supabase free tier only, codes shown on-screen, no Twilio).
