# The Break Room

A cafe website with two personalities. By day, a calm refuge for office workers. By night and on weekends, a colorful event space.

The site mirrors that duality through two distinct visual modes that share underlying structure but diverge in color, motion, and energy.

> The product spec — including brand direction, page-by-page intent, animation philosophy, and accessibility requirements — lives in [`SPEC.md`](./SPEC.md). This README covers how to run, develop, and ship the site.

---

## Table of contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Environment](#environment)
- [Project structure](#project-structure)
- [Architecture at a glance](#architecture-at-a-glance)
- [Backend integration](#backend-integration)
- [The Beans assistant](#the-beans-assistant)
- [Accessibility & performance](#accessibility--performance)
- [Deployment](#deployment)
- [Further reading](#further-reading)

---

## Stack

| Concern        | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Framework      | **Next.js 14** (App Router), **React 18**, **TypeScript**              |
| Styling        | **Tailwind CSS** + CSS custom properties for theme tokens              |
| Animation      | **Framer Motion** for layout & interactive motion, CSS for loops       |
| Forms          | **react-hook-form** + **zod**                                          |
| Confetti       | **canvas-confetti** (lazy-loaded only where used)                      |
| Data layer     | `Repo` interface (today: in-memory + JSON; tomorrow: Postgres)         |
| AI assistant   | Anthropic Claude API with tool use (live loop sketched; mocked today)  |
| Email          | Resend / Postmark (transport stubbed; ready to wire)                   |
| Map            | Google Maps Embed API (keyless fallback in dev)                        |

---

## Quick start

```bash
git clone <repo>
cd BreakRoom
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

No API keys are required to run locally — the data layer is in-memory and the AI assistant returns deterministic mock responses until `ANTHROPIC_API_KEY` is set.

Requires **Node 18.17+** (Next.js 14 minimum).

---

## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the dev server with HMR                 |
| `npm run build`      | Production build                              |
| `npm start`          | Serve the production build                    |
| `npm run typecheck`  | Run `tsc --noEmit`                            |
| `npm run lint`       | Run `next lint`                               |

---

## Environment

All variables are optional in development. See [`.env.example`](./.env.example) for the canonical list.

| Variable                              | When you need it                          | Notes                                                              |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                        | Real bookings persistence                 | Postgres connection string                                         |
| `ANTHROPIC_API_KEY`                   | Live Beans assistant (replaces the mock)  | Server-side only                                                   |
| `RESEND_API_KEY`                      | Booking confirmation emails               | Or swap to Postmark — transport is a small interface               |
| `BOOKING_NOTIFY_EMAIL`                | Where booking notifications are sent      | Defaults to `hello@thebreakroom.cafe`                              |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`   | Production map embed                      | Restrict by HTTP referrer in the Google Cloud console              |
| `NEXT_PUBLIC_SITE_URL`                | OG image base URLs, canonical URLs        | Set to your deployed origin                                        |

---

## Project structure

```
.
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Shell: fonts, providers, nav, footer, assistant
│   ├── page.tsx                # Home (Mode A)
│   ├── menu/                   # Magazine-style menu (Mode A)
│   ├── visit/                  # Hours, map, contact (Mode A)
│   ├── about/                  # Story, team, timeline (Mode A)
│   ├── events/                 # Public events list (Mode A, with Mode B accents)
│   ├── book/                   # Party booking (Mode B) — the destination
│   ├── api/                    # Route handlers
│   │   ├── bookings/           # POST a booking, GET admin list (dev only)
│   │   ├── availability/       # GET slots for a date
│   │   ├── specials/           # GET today's specials
│   │   └── assistant/          # Beans conversation endpoint
│   └── globals.css             # Tokens, base styles, both modes, button styles
├── components/
│   ├── BookPartyButton.tsx     # The signature CTA — see SPEC §7
│   ├── Navigation.tsx          # Sticky nav with dark-backdrop awareness
│   ├── Footer.tsx
│   ├── ModeProvider.tsx        # Sets <body data-mode="…"> from route
│   ├── useNavBackdrop.ts       # Hook: detects dark sections behind the nav
│   ├── ui/Reveal.tsx           # Default scroll-reveal animation wrapper
│   ├── home/                   # Home-page sections
│   ├── menu/                   # Menu view
│   ├── visit/                  # Map embed, contact form
│   ├── booking/                # /book Mode B page + form components
│   └── assistant/              # Beans widget, panel, tool result renderers
├── lib/
│   ├── db.ts                   # Repo interface + InMemoryRepo (swap point)
│   ├── email.ts                # Email transport stub
│   ├── types.ts                # Shared domain types
│   ├── validation.ts           # zod schemas
│   ├── transitions/colorWipe.ts# Colored page-transition for /book
│   └── assistant/              # System prompt, tool defs, handlers
├── content/                    # Source-of-truth JSON for editable content
│   ├── menu.json
│   ├── specials.json
│   ├── events.json
│   ├── about.json
│   ├── faq.json
│   └── testimonials.json
├── public/
│   └── noise.svg               # Paper-grain overlay texture
├── SPEC.md                     # Product & design specification
├── reference.md                # Architecture notes for future contributors
└── README.md
```

---

## Architecture at a glance

**Two visual modes.** Every color is a CSS custom property in `app/globals.css`. The `ModeProvider` sets `data-mode="after-hours"` on `<body>` on `/book` routes; Mode B styles cascade from there. Mid-page dark sections (like the home page's "After Hours" transition) flag themselves with `data-nav-backdrop="dark"` so the sticky nav switches to light text without changing the route.

**Repository pattern for data.** API route handlers never touch JSON files or a database directly — they call `defaultRepo` from `lib/db.ts`. Swap the singleton to a Postgres-backed `Repo` and every read/write across the site follows. See [the next section](#backend-integration).

**Lazy bundles where it matters.** The Beans assistant panel and the confetti library both load on demand. The /book page is code-split off the shared bundle. Initial JS stays under 90 KB shared.

**Content as data.** Menu, specials, events, FAQ, about copy, and testimonials live in `content/*.json`. Edit them without touching components. The long-term path is a CMS (Sanity, Payload) — the same `Repo` interface would back it.

**Accessible by default.** Skip link, visible focus states, reduced-motion handling, keyboard-navigable date/slot picker, honeypot on the booking form, semantic landmarks.

---

## Backend integration

Today the site runs end-to-end with no external services. Each external integration is wired through a single swap point so the UI doesn't need to change when real services come online.

### Database

```ts
// lib/db.ts
export const defaultRepo: Repo = new InMemoryRepo();
```

Implement a `PgRepo` against your Postgres pool of choice (Supabase, Neon, or a raw `pg.Pool`), then point `defaultRepo` at it. The `Repo` interface in `lib/db.ts` is the contract — nothing else in the app should care about persistence details.

### Email

```ts
// lib/email.ts
export async function send(message: EmailMessage): Promise<{ ok: true }> {
  // Replace with Resend or Postmark client.
}
```

Bookings go through an embedded Google Form (`components/booking/GoogleFormEmbed.tsx`),
which is what a static site can do without a backend. The earlier `lib/email.ts`
and `lib/validation.ts` — a Resend/Postmark stub and a zod schema for a
server-rendered booking form — were removed: nothing imported them, and there is
no runtime that could have executed them. They are in git history if that
changes.

### Anthropic Claude (Beans)

Beans runs **entirely in the browser**. `runAssistantTurn` in
`lib/assistant/handlers.ts` is a deterministic mock that pattern-matches intents
and calls `runToolCall` locally; there is no `app/api/assistant/route.ts`, and a
static export could not host one.

Going live means either adding a real backend somewhere else and pointing the
panel at it, or moving off `output: "export"` entirely. Do not call the
Anthropic API from the browser — that would ship the API key to every visitor.
The system prompt and tool definitions are ready in
`lib/assistant/system-prompt.ts` and `lib/assistant/tools.ts`.

### Map

The `MapEmbed` component uses the official Google Maps Embed API when `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is present, falling back to the keyless legacy embed URL in dev.

---

## The Beans assistant

Beans is the AI concierge — a small coffee-bean icon in the bottom-right that opens a slide-in chat panel. It uses **tool use** to look up real cafe data rather than guess. Available tools:

| Tool                  | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `get_menu`            | Returns the menu, optionally filtered by category or dietary tag      |
| `get_specials`        | Returns today's specials                                              |
| `get_hours`           | Returns opening hours                                                 |
| `check_availability`  | Returns available booking slots for a given date                      |
| `start_booking`       | Pre-fills the booking form (produces a `/book?prefill=…` magic link)  |
| `get_event_info`      | Returns details about a specific public event                         |
| `get_directions`      | Returns the address and a map link                                    |
| `escalate_to_human`   | Captures the user's question + email and pings staff                  |

By design, Beans **cannot finalize a booking on the user's behalf** — it can fill the form, but a human always confirms. This is deliberate.

Tool results render with custom React components inline in the chat (`components/assistant/ToolResultCard.tsx`) rather than as raw JSON. Adding a new tool means: a definition in `lib/assistant/tools.ts`, a handler case in `lib/assistant/handlers.ts`, and a card variant in `ToolResultCard.tsx`.

---

## Accessibility & performance

- Skip-to-content link, visible focus states, keyboard-navigable pickers
- All animations honor `prefers-reduced-motion`
- Confetti elements are `aria-hidden`
- Booking form errors use full sentences, tied via `aria-describedby` (where applicable) and `role="alert"`
- Assistant panel is `role="dialog"`, traps focus, returns focus on close (via Escape)

Bundle budget (after build):

```
First Load JS shared by all   ~87 KB   (budget: 150 KB)
/book                         ~33 KB   on top, loaded only when visited
/menu                         ~3.6 KB  on top
```

---

## Deployment

**This site is a static export.** `next.config.mjs` sets `output: "export"`, so
`next build` produces a folder of plain HTML/CSS/JS in `out/` and there is no
server at runtime. That rules out API routes, server actions, middleware,
dynamic rendering, ISR, and next/image optimization — if you add any of them the
build will fail, or worse, silently not run.

It deploys to **Cloudflare Pages**:

1. Push to GitHub
2. Build command `npm run build`, output directory `out`
3. Set the environment variables below — they are inlined **at build time**, so
   changing one means rebuilding, not just restarting

### Required environment variables

| Variable | Why it matters |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Feeds `metadataBase`, so every `og:image`, canonical URL, and the JSON-LD `@id` derive from it. If it is unset the build falls back to `https://breakroombothell.com`. Getting this wrong breaks every link preview. |
| `NEXT_PUBLIC_ORDER_URL` | Overrides the order-ahead app URL used by the nav, the hero CTA, and `/online-order`. Defaults to `https://order.breakroombothell.com` in production and `http://localhost:3100` in `next dev`. Point it at a preview deploy when testing. |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Optional. The `/visit` map falls back to a keyless embed without it. Restrict by HTTP referrer before shipping. |

The ordering app in [`ordering/`](./ordering) is a **separate application** with
its own deployment (Vercel), its own environment, and its own database. It is
not built or deployed by this project. See [`ordering/README.md`](./ordering/README.md).

### Business facts live in one file

Hours, phone number, address, and social links are defined once in
[`lib/business.ts`](./lib/business.ts) and read from there by the footer, the
`/visit` page, the homepage status card, the Beans assistant, and the JSON-LD.
Change them there — not in a component. `app/robots.ts` and `app/sitemap.ts`
render to static files at build time.

---

## Further reading

- [`SPEC.md`](./SPEC.md) — product & design specification (the source of truth for what the site is)
- [`reference.md`](./reference.md) — architecture notes, conventions, and gotchas for future contributors
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Anthropic Claude API — tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
