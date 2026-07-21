# Architecture reference

Notes for future contributors (human or AI) working on this codebase. The product spec is in `SPEC.md`; the user-facing docs are in `README.md`. This document is the **how it's built** layer — conventions, swap points, gotchas.

When you change something foundational, update this file.

---

## 1. The two-mode design system

Every color the site uses is a CSS custom property declared in `app/globals.css`. Two palettes coexist:

- **Mode A — Quiet Hours** (`--qh-*`): warm cream, soft brown, sage. Default for every page except `/book`.
- **Mode B — After Hours** (`--ah-*`): deep aubergine + saturated magenta/tangerine/electric yellow/mint/violet. Only on `/book`.

**Discipline (non-negotiable):**

- In Mode A: **no pure black, no pure white, no saturated primary colors.** Use `--qh-ink` (warm near-black), `--qh-bg` (warm cream), and the muted palette.
- In Mode B: **every surface is colored.** A "white" card uses `--ah-cream`, not `#FFF`.
- The two modes share `--qh-bg ≈ --ah-cream` so the brand still feels related, just dressed up.

### How a page knows which mode it's in

`components/ModeProvider.tsx` watches `usePathname()` and sets `<body data-mode="after-hours">` on `/book` routes. Mode-B-specific CSS in `globals.css` cascades from that attribute selector:

```css
body[data-mode="after-hours"] { … }
body[data-mode="after-hours"] .book-btn { … }
```

### Mid-page dark sections (the nav backdrop mechanism)

Some Mode A pages contain dark stretches — the home page's `AfterHoursTransition` interpolates its background from cream to aubergine as the user scrolls. The sticky nav needs to switch to light text when these stretches are behind it without changing the route or body mode.

The mechanism:

1. Sections that should force the nav to light add `data-nav-backdrop="dark"` to any element inside themselves. Position the sentinel where the background is *actually dark* — not at the top of the section if the section's gradient hasn't transitioned yet (the home page sentinel sits at `top: 40%` of the section for this reason).
2. `components/useNavBackdrop.ts` runs an IntersectionObserver against all such elements, scoped to the top strip of the viewport (nav height).
3. `components/Navigation.tsx` consumes the hook and toggles `dark` state. Tab colors, the active underline, the wordmark, the mobile sheet, the hamburger icon, and the AssistantTrigger hover background all switch based on this single boolean.

If you add a new dark section anywhere, you only need to drop in the `data-nav-backdrop="dark"` attribute. No nav code changes.

---

## 2. The keystone Book a Party button

The single most important interactive element on the site (see SPEC §7). Lives in two files:

- `components/BookPartyButton.tsx` — the React side: routing, click confetti, page transition wiring.
- `app/globals.css` §4 (`book-btn`, `book-btn__bg`, `book-btn__sparkles`) — the CSS side: conic gradient hover, sparkle particles, scale + rotate, glow shadow, custom `✨` cursor.

**Contract you must not break:**

- The button is always a `<Link href="/book">` — modifier-clicks (Cmd/Ctrl/Shift) must continue to behave naturally (open in new tab).
- The click handler intercepts left-click only, then: fires confetti from the button's center → runs `colorWipeIn()` from `lib/transitions/colorWipe.ts` → calls `router.push()`. The wipe and confetti are dynamically imported so they don't enter the initial bundle.
- Reduced motion (`prefers-reduced-motion: reduce`) must skip the confetti and the wipe — only the route change happens. The CSS already handles the static hover fallback.
- The button looks correct on both Mode A and Mode B backgrounds. Mode B inversion is handled by a `body[data-mode="after-hours"] .book-btn` rule in globals.css; don't fork the component.

**Sizes:** `sm`, `md`, `lg`. The nav uses `md` on desktop, `sm` on mobile (and the sm variant never collapses into the hamburger).

---

## 3. Data layer — the swap point

`lib/db.ts` exports a `Repo` interface and a `defaultRepo` singleton. Everything that needs cafe data — API route handlers, server components, the assistant — calls `defaultRepo`.

```ts
export const defaultRepo: Repo =
  globalForRepo.__repo ?? (globalForRepo.__repo = new InMemoryRepo());
```

Today: `InMemoryRepo` reads from `content/*.json` and writes bookings into a process-local array (attached to `globalThis` so dev HMR doesn't wipe them).

To wire a real database:

1. Implement `PgRepo` (or `SupabaseRepo`, etc.) against the same interface.
2. Replace the `defaultRepo` assignment with the new instance.

Nothing else in the app changes. If you find code reading JSON files directly outside `lib/db.ts`, it's a bug — fix it before it spreads.

**Adding a new persisted entity:** add the method to `Repo`, implement it in `InMemoryRepo`, and add the type to `lib/types.ts`. Do not bypass the interface with one-off reads.

---

## 4. The Beans AI assistant

Three files form the contract; keep them in sync:

| File                                | Role                                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| `lib/assistant/system-prompt.ts`    | The system prompt — terse, with explicit rules                        |
| `lib/assistant/tools.ts`            | Tool definitions in Anthropic's `input_schema` shape                  |
| `lib/assistant/handlers.ts`         | `runToolCall(name, input)` — server-side execution per tool           |

The route handler at `app/api/assistant/route.ts` currently calls `runAssistantTurn`, a deterministic mock that pattern-matches user intent and returns structured tool results. **The mock and the live API return the same response shape** (`{ reply: string, toolCalls: AssistantToolCall[] }`) so the UI is stable across the swap.

**To go live:**

1. Install `@anthropic-ai/sdk`.
2. In the route handler, replace `runAssistantTurn` with a loop:
   - Call `client.messages.create({ model, system, tools, messages })`.
   - When the response contains `tool_use` blocks, call `runToolCall(name, input)` for each, append the results back as `tool_result` blocks, and call `messages.create` again.
   - Continue until `stop_reason === "end_turn"`.
3. Stream tokens to the client over Server-Sent Events for snappiness.

**Adding a new tool:**

1. Add the definition to `BEANS_TOOLS` in `lib/assistant/tools.ts`.
2. Add a `case "<name>":` to `runToolCall` in `lib/assistant/handlers.ts`.
3. If the result needs custom rendering in the chat, add a variant in `components/assistant/ToolResultCard.tsx` — otherwise it falls through to a JSON dump.

**Things Beans must never do** (enforce in the system prompt and never trust the model alone):
- Finalize a booking on the user's behalf. It can pre-fill the form via `start_booking` (which returns a `/book?prefill=…` magic-link URL); the human always submits.
- Invent menu items, prices, or hours. Always go through a tool.
- Answer questions outside the cafe's domain.

---

## 5. Content as data

These files are the source of truth for editable copy:

| File                            | What it holds                                  |
| ------------------------------- | ---------------------------------------------- |
| `content/menu.json`             | Categories, items, prices, dietary tags        |
| `content/specials.json`         | Today's three rotating specials                |
| `content/events.json`           | Public events (upcoming + past)                |
| `content/about.json`            | Story paragraphs, values, team, timeline       |
| `content/faq.json`              | FAQ items for /book                            |
| `content/testimonials.json`     | Home-page pull quotes                          |

**Do not duplicate this content into components.** If you're tempted to inline a list of values, ask whether it belongs in JSON instead. The long-term goal is a CMS; the more content lives in `content/`, the cheaper that migration.

When a content schema grows, add types to `lib/types.ts` and have the JSON validate against them at read time (in `lib/db.ts`) — not at the component level.

---

## 6. Animation conventions

- **Mode A** is slow. 400–800ms ease-out. Use `Reveal` (`components/ui/Reveal.tsx`) for default scroll reveals — don't roll a new variant unless the section truly needs it.
- **Mode B** is springy. Spring physics with `stiffness: 200–300, damping: 15–25`.
- For shared-layout transitions (the underline indicator, the segmented-control pill), use Framer Motion's `layoutId` inside a `LayoutGroup` with a stable id.
- All long-running loops, parallax, and confetti **must** check `prefers-reduced-motion: reduce`. The CSS sweep in `globals.css` handles most cases by setting `animation-duration: 0.001ms`, but JS-driven effects (confetti, the color wipe) need explicit `matchMedia` checks at call time.
- The colored wipe (`lib/transitions/colorWipe.ts`) is a one-shot DOM operation, not a Framer Motion variant. Don't fold it into a layout animation — it needs to cover during the route change, which Framer doesn't control.

---

## 7. Booking form anatomy

`components/booking/BookingForm.tsx` is a `react-hook-form` form with `zod` resolver. Each non-trivial field is its own component so the form file stays a layout, not a tangle:

- `EventTypeControl` — segmented control with shared-layout pill animation.
- `DateSlotPicker` — fetches `/api/availability?date=…` whenever the date changes; unavailable slots render struck-through and disabled.
- `GuestSlider` — gradient range slider with a number bubble.
- `CateringChecklist` — chips that toggle on/off.
- `SuccessCard` — the post-submit confetti card with `.ics` calendar download.

**Validation tone**: error messages are full sentences. "Required." is not an error message — `"We need a way to reach you — please add an email."` is.

**Honeypot**: a hidden `website` field. If a bot fills it, the API silently returns success without persisting. Don't remove this without a replacement.

**Pre-fill**: the Beans `start_booking` tool produces a `/book?prefill=<urlencoded querystring>` URL. The form reads `useSearchParams()` and merges the values into defaults. This is why the form is wrapped in `<Suspense>` on the page — `useSearchParams()` opts the route out of static prerendering unless suspended.

---

## 8. Performance & bundle hygiene

- **Initial shared JS budget: 150 KB.** Current baseline ~87 KB. If you add a dependency, check the build output (`npm run build`) — anything that pushes a route's First Load JS above 160 KB needs justification.
- Lazy-load anything that's not used on first paint. Pattern:
  ```ts
  const Panel = dynamic(() => import("./Panel").then((m) => m.Panel), { ssr: false });
  ```
- Lazy-import expensive libs inside event handlers, not at the top of files:
  ```ts
  const { default: confetti } = await import("canvas-confetti");
  ```
- The Beans panel JS only loads when the user clicks the floating button. The confetti library only loads on `/book` (initial burst) or on the Book a Party button click. Keep this discipline.

---

## 9. Accessibility checklist

Before shipping any new interactive component:

- [ ] Reachable by keyboard with visible focus states
- [ ] Color contrast 4.5:1 body / 3:1 large text
- [ ] All images have meaningful `alt` text; decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Forms have visible labels (not just placeholders)
- [ ] Error messages are tied to inputs (`aria-describedby` or `role="alert"`)
- [ ] Animations check `prefers-reduced-motion`
- [ ] Dialogs use `role="dialog"`, trap focus, return focus on close
- [ ] One `h1` per page, no skipping heading levels

The Book a Party button's hover state is the most likely to fail contrast — verify the label color against the gradient's lowest-contrast color, not the average.

---

## 10. Things that look like bugs but are not

- **The nav appears transparent at the top of every page.** Intentional — `scrolled` only kicks in past 64px, and the backdrop fades in only then.
- **The "and" in the home headline is in accent color and italic.** That's the design — it's the visual hinge between the two halves of the line. The overflow-hidden word-reveal wrappers have extra padding + matching negative margin to keep italic letterforms from clipping.
- **The mock assistant only understands a handful of intents.** Yes — the mock is a placeholder. Wire `runAssistantTurn` to the real Anthropic API for actual conversation.
- **Booking specials category shows fewer items than the menu file lists.** The "specials" category in `content/menu.json` is intentionally empty — it's populated dynamically from `content/specials.json` at read time by `InMemoryRepo.getMenu()`. Edit specials there.

---

## 11. Open work (good first issues for the next session)

- Wire `Repo` to a real Postgres instance and remove the in-memory fallback in production.
- Replace `runAssistantTurn` with the live Anthropic loop + SSE streaming.
- Wire Resend (or Postmark) into `lib/email.ts` and verify booking confirmations land.
- Add a small admin route (or Slack notifier) for new booking notifications — the email path is there but a real-time channel will be wanted.
- Schema.org markup (`Cafe`, `OpeningHoursSpecification`, `Menu`, `Event`) — sketched in SPEC §14, not yet implemented.
- Per-page OG image generator using Next.js `ImageResponse`.
- Real photography — replace the SVG illustrations in `home/Hero`, `home/WorkHoursSection`, `home/AfterHoursTransition`, `visit/PhotoTile`, and `booking/TheSpace`.
- Address the remaining `npm audit` advisories on Next 14.x (requires evaluating a Next 16 migration).
