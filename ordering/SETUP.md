# Ordering System — Owner Setup & Deployment Guide

> Updated 2026-07-27 to match the **actual** deployment path (pilot on Vercel
> URLs first, real subdomain at launch) and Supabase's new API-key system.
> `RUNNING.md` covers local dev; `PROGRESS.md` is the build/test log.

## 0 · Where things run — the current topology

Two GitHub repos, one codebase:

| Repo | Branch | Contains | Feeds |
|---|---|---|---|
| `Aryaman-R/BreakRoom` (public) | `main` | main site only (no ordering) | **live breakroombothell.com** via Cloudflare Pages |
| `Aryaman-R/BreakRoom` (public) | `online-ordering` | main site + Order Ahead button + `ordering/` app | staging for everything below |
| `Aryaman-R/BreakroomTest` (private) | `main` | mirror of `online-ordering` | **Vercel pilot deployments** |

Two Vercel projects, both importing `BreakroomTest`:

1. **Ordering app** — Root Directory = `ordering`. This is the product:
   customer menu at `/`, staff at `/staff`, admin at `/admin`.
2. **Site test copy** (optional) — Root Directory = repo root. A private copy
   of the marketing site whose Order Ahead button points at project 1 via
   `NEXT_PUBLIC_ORDER_URL`.

**The separation rule:** the live site only changes when `BreakRoom`'s `main`
changes. Nothing on Vercel or in `BreakroomTest` can touch it. Keeping the
pilot private = don't add custom domains in Vercel and don't touch Cloudflare
DNS until launch (§6). To sync new work to the pilot:
`git push breakroomtest online-ordering:main`.

## 1 · Twilio — start FIRST (approval takes days)

US carriers block automated texts from unregistered numbers. Until this
clears, the app runs in dev-SMS mode (codes shown on screen — fine for the
pilot, not for customers).

1. Create the account at twilio.com; upgrade (add card) before launch — trial
   accounts only text your own verified numbers, with a "trial" prefix.
2. Buy a **toll-free** number (8XX, ~$2/mo, SMS-capable). Toll-free
   verification is one form with no monthly campaign fees; a local number
   would need the fussier A2P 10DLC brand+campaign registration instead.
   **Do not use the cafe's real phone number** — Twilio would have to take it
   over (porting or hosted SMS), breaking normal calls/texts on it, and the
   registration wait is the same anyway. The real number keeps its human
   jobs: customer calls and the call-to-confirm flow.
3. Messaging → Regulatory Compliance → **Toll-Free Verification**. Answers
   that pass review cleanly:
   - Business: The Breakroom's legal name, address, breakroombothell.com.
     (Mismatched business info is the #1 rejection cause.)
   - Use case: *"Transactional messages for a cafe's order-ahead website:
     one-time verification codes and order-status notifications. No
     marketing."*
   - Sample messages (the exact three the app sends):
     `Your Breakroom code: 123456` ·
     `Breakroom order #12 confirmed — ready in about 15 minutes.` ·
     `Breakroom order #12 is ready for pickup!`
   - Opt-in: *"Customer enters their mobile number on the checkout form and
     taps 'Text me a code', consenting to a verification code and status
     updates for that order."* (They may ask for a checkout screenshot.)
   - Volume: low, under 1,000/month.
4. Typical approval: **1–5 business days.** When it lands, do §6 step 4.
5. Note down: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (console home), and
   the number as `TWILIO_FROM_NUMBER` in `+18XXXXXXXXX` form.

Cost: ~$2/mo + ~1¢ per message; ~3 messages per order.

## 2 · Supabase — database + logins

1. Create a project at supabase.com (free tier, region West US).
2. **SQL Editor** → run the three files from `supabase/migrations/` in order:
   `0001_schema.sql`, `0002_seed_menu.sql`, `0003_place_order.sql`.
   Check: `select count(*) from menu_items;` → **29**.
3. **Authentication → Users → Add user** (Auto confirm ON). Create two:
   - your owner account — this email also goes in `ADMIN_EMAILS`
   - a shared staff account for the counter (not in `ADMIN_EMAILS`)

   **There is no separate "admin password" setting.** `ADMIN_EMAILS` is only
   an allow-list; the password is whatever you set on the Auth user here.
   Any Auth user can use `/staff`; only allow-listed emails also get `/admin`.
4. Collect three values:
   - **Project URL** — `https://<ref>.supabase.co`. Find it via the
     **Connect** button, under **Project Settings → Data API**, or just read
     `<ref>` out of your dashboard address bar
     (`supabase.com/dashboard/project/<ref>`) and append `.supabase.co`.
   - **Publishable key** (`sb_publishable_…`) — API Keys page.
   - **Secret key** (`sb_secret_…`) — create one on the API Keys page, named
     for the deployment (e.g. `vercel-ordering`). Rotation later = create a
     new key, swap it in Vercel, revoke the old one.

   *Newer Supabase projects use these publishable/secret keys instead of the
   legacy "anon"/"service_role" JWTs. The app takes either kind — the env
   var names below are just labels.*

## 3 · Vercel — the ordering app

1. Add New → Project → import `Aryaman-R/BreakroomTest`.
2. **Root Directory = `ordering`** — the setting that matters. On the import
   screen it's next to Framework Preset; on an existing project it's in
   Settings (currently under **Build and Deployment**; older UI: General).
   Symptom of getting this wrong: the URL serves the marketing site and
   `/staff` 404s.
3. Environment Variables (all environments):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the `https://<ref>.supabase.co` URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the **publishable** `sb_publishable_…` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the **secret** `sb_secret_…` key |
   | `ADMIN_EMAILS` | your owner email(s), comma-separated |
   | `ALLOW_DEV_VERIFICATION` | `1` — pilot only; **delete at launch** |
   | `TWILIO_*` (three vars) | omit until §6 |

4. Deploy, then note the **stable** URL (Settings → Domains, e.g.
   `something.vercel.app` — not the long per-deployment hash URL).
5. **Env vars only apply to new builds** — after any change: Deployments →
   ⋯ → Redeploy.
6. Supabase → **Authentication → URL Configuration → Site URL** = that URL
   (keeps `/staff` logins working on it).

## 4 · Optional: site test copy with the Order Ahead button

Second Vercel project from the same repo, Root Directory = repo root, one env
var: `NEXT_PUBLIC_ORDER_URL` = the ordering app's URL → deploy. The nav's
Order Ahead button resolves: `NEXT_PUBLIC_ORDER_URL` if set → else
`order.breakroombothell.com` in production builds → else `localhost:3100` in
`next dev`. (So without the var, a deployed test copy points at the
not-yet-live subdomain — that's the NXDOMAIN error.)

## 5 · Smoke test — each step isolates one config

1. Ordering URL shows the menu → Supabase URL + publishable key right.
   ("Ordering is taking a quick break" = the server can't reach Supabase:
   wrong/missing env vars or no redeploy. Exact cause appears in Vercel
   runtime logs as `[/] menu load failed: …`.)
2. Checkout returns an on-screen code and the order lands → secret key +
   `ALLOW_DEV_VERIFICATION` right.
3. `/staff` signs in and the order card appears live → Site URL + auth user
   right.
4. `/admin` opens (not "Not an admin") → `ADMIN_EMAILS` matches the login
   email exactly.
5. Fraud rails work even in pilot: a second order from the same phone is
   refused until the first is picked up; 3 codes/hour per phone; hours gate
   is 9:30 AM–3:10 PM Pacific (temporarily widen in `/admin` → Hours & caps
   for after-hours testing).

## 6 · Launch day — going public

1. Vercel ordering project → Settings → Domains → add
   `order.breakroombothell.com` (it shows "Invalid Configuration" until DNS
   exists — expected).
2. Cloudflare → breakroombothell.com → DNS → add record: CNAME, name
   `order`, target `cname.vercel-dns.com`, **DNS only (grey cloud)** — the
   orange proxy breaks Vercel's TLS. A few minutes later Vercel validates
   and issues the certificate.
3. Supabase Site URL → `https://order.breakroombothell.com`.
4. Add the three `TWILIO_*` vars; **delete `ALLOW_DEV_VERIFICATION`**;
   redeploy; place one real order end-to-end (code, confirmed, ready texts).
5. Wire the live site's button: merge the Order Ahead nav change from
   `online-ordering` into `BreakRoom`'s `main` (no env var needed — the
   production default is already the subdomain). Until this merge, the live
   site simply has no button, which is the point.
6. Run the full checklist in `docs/ORDERING-IMPLEMENTATION.md` §9 against
   production.

## 7 · First weeks of operation

- Finish the menu in `/admin` — the seed is a real-price subset (e.g.
  yakisoba needs its chicken/beef/shrimp/tofu/pork variants).
- Print the counter QR pointing at
  `https://order.breakroombothell.com/?source=qr` (staff see a QR badge).
- Consider a Twilio auto-reply on the toll-free number ("This line is
  automated — call us at (425) 419-4231").
- **Putting a tablet on the counter?** Open the ordering site on that device
  once with `?kiosk=on` on the end of the URL — e.g.
  `https://order.breakroombothell.com/?kiosk=on` — and it gains an on-screen
  keyboard whenever someone taps a text box. Nothing visibly changes until a
  text box is tapped, and the setting sticks on that device through reloads
  and restarts. `?kiosk=off` removes it. This is per-device: it does nothing
  to customers' own phones, so there is no way to leave it switched on for
  the public by accident. Details in `README.md` → Kiosk mode.

## Troubleshooting quick table

| Symptom | Cause → fix |
|---|---|
| "Ordering is taking a quick break" | Server can't reach Supabase → check env vars, **redeploy**, read `[/] menu load failed:` in Vercel runtime logs |
| Ordering URL shows the marketing site; `/staff` 404s | Root Directory isn't `ordering` → set it, redeploy |
| Order Ahead button → localhost | `NEXT_PUBLIC_ORDER_URL` unset on a dev/preview build → set it + redeploy |
| Order Ahead button → DNS_PROBE_FINISHED_NXDOMAIN | Button defaulting to the subdomain before §6 wiring → set `NEXT_PUBLIC_ORDER_URL`, or do §6 |
| `/login` succeeds but bounces back to login | Supabase Site URL doesn't match the deployed URL |
| `/admin` says "Not an admin" | Login email ≠ `ADMIN_EMAILS` entry (exact string match) |
| No SMS arrives after Twilio setup | Number unverified (§1.3 pending), or env vars added without redeploy |
| Env var change seems ignored | Always redeploy — values are baked at build time |
| Tapped `?kiosk=on` but nothing happened | Expected — the keyboard only appears once a text box is tapped |
| Kiosk keyboard gone after wiping the tablet / using private browsing | The flag lives in that browser's storage → visit `?kiosk=on` again |

## Local development

See **`RUNNING.md`** — 10-minute local walkthrough (Supabase free tier only,
codes on-screen, no Twilio).
