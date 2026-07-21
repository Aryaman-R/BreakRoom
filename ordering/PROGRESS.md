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
| 0 · Accounts & services | ⛔ **Owner task — will be detailed in SETUP.md** |
| 1 · Scaffold | 🔨 in progress |
| 2 · Schema (SQL written; must be run in Supabase) | ⬜ |
| 3 · API layer | ⬜ |
| 4 · Customer pages | ⬜ |
| 5 · Staff screen | ⬜ |
| 6 · Admin | ⬜ |
| 7 · Deploy | ⛔ Owner task — see SETUP.md |
| 8 · Pilot hardening | ⬜ |
| 9 · Test checklist | ⬜ needs a deployed build + real creds |

## Implementation notes & deviations

- **Docs moved** from `ordering/*.md` to `ordering/docs/` to match the layout
  `CLAUDE.md` references (`docs/ORDERING-*.md`).
