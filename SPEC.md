# The Break Room — Website Specification

> A cafe website with two personalities. By day: a calm, cozy refuge for office workers. By night and on weekends: a colorful, electric event space for parties and gatherings. The site mirrors that duality.

---

## 1. Project Overview

**The Break Room** is a neighborhood cafe with two distinct modes of operation:

- **Weekdays, 7 AM – 5 PM** — A quiet, comfortable workspace for office workers. Coffee, light food, fast Wi-Fi, soft lighting, places to think.
- **Weekday evenings, weekends** — Available for booking as a private event space. Birthday parties, corporate gatherings, baby showers, game nights, trivia, open mics, anniversary dinners.

The website needs to communicate both. The default experience is calm and inviting. A single, magnetic call-to-action — the **Book a Party** button — pulls visitors into the colorful, energetic side of the brand when they're ready for it.

### Core goals
1. Make office workers feel they've found a sanctuary.
2. Make event hosts feel that something exciting is possible here.
3. Convert visitors into bookings with as little friction as possible.
4. Surface menu, hours, and specials instantly.
5. Provide an AI concierge that can actually *do things*, not just chat.

---

## 2. Brand & Aesthetic Direction

### Two-mode design system

The site has **two distinct visual modes** that share underlying structure but diverge dramatically in color, motion, and energy.

#### Mode A — "Quiet Hours" (default for most pages)
Cozy, warm minimalism. Inspired by independent specialty coffee shops, mid-century interiors, and editorial print design. Generous whitespace, soft shadows, slow animations.

- **Mood words**: warm, slow, considered, hushed, lived-in
- **Reference points**: Aesop, Blue Bottle's editorial pages, Kinfolk magazine, Aēsop store interiors
- **Energy level**: low. Things ease in, not pop in.

#### Mode B — "After Hours" (party/booking page only)
Colorful, vibrant, alive. Neon-leaning but not tacky. Inspired by risograph printing, 90s rave flyers redrawn for 2026, confetti, dance floor lighting. Saturated color, kinetic motion, playful typography.

- **Mood words**: electric, joyful, loud (in a good way), celebratory, warm
- **Reference points**: Spotify Wrapped, Glossier Play, Figma's brand evolution, Stripe Sessions visual identity
- **Energy level**: high. Things bounce, wiggle, pulse.

### Color tokens

Define everything as CSS custom properties so theme switches are clean.

```css
:root {
  /* Mode A — Quiet Hours */
  --qh-bg:           #F4EFE6;   /* warm cream */
  --qh-bg-elevated:  #FBF7F0;
  --qh-ink:          #2A2520;   /* warm near-black, never pure black */
  --qh-ink-soft:     #6B6258;
  --qh-accent:       #8B5E3C;   /* roasted espresso brown */
  --qh-accent-soft:  #C9A57B;   /* latte foam */
  --qh-sage:         #7E8C6E;   /* a single muted accent */
  --qh-line:         #E5DDCF;

  /* Mode B — After Hours */
  --ah-bg:           #1A0F2E;   /* deep aubergine, NOT black */
  --ah-bg-2:         #2B1450;
  --ah-magenta:      #FF3D8A;
  --ah-tangerine:    #FF8C42;
  --ah-electric:     #FFE066;   /* warm yellow, not lemon */
  --ah-mint:         #6EE7B7;
  --ah-violet:       #A78BFA;
  --ah-cream:        #FFF8E7;   /* still warm — ties back to Mode A */
}
```

**Discipline**: in Mode A, no pure black, no pure white, no saturated primary colors. In Mode B, every surface is colored — a "white" card uses cream, not white. The two modes share `--qh-bg` ≈ `--ah-cream` so the brand still feels related, just dressed up.

### Typography

Pick distinctive fonts. **Do not use Inter, Roboto, or other defaults.**

- **Display (headings, large UI)**: a warm serif with personality — `Fraunces` (variable, soft optical sizes) or `Recoleta` if licensed. Italic forms used liberally for menu sections.
- **Body**: a humanist sans with character — `Söhne`, `General Sans`, or `Geist Sans` as a free fallback.
- **Numerals & specials**: `JetBrains Mono` for prices, hours, and the AI assistant interface.
- **Mode B accent**: a single playful display font for the party page only — `Cooper Hewitt`, `Bagel Fat One`, or a wonky variable font like `Bungee Spice`. Used sparingly, mostly for the page hero and section numbers.

Body copy: 16–18px, line-height 1.6, tracking slightly loose. Headings: tight tracking, generous size jumps between levels (use a 1.333 modular scale).

### Texture & atmosphere

- **Mode A**: a subtle paper-grain noise overlay (`background-image` SVG noise at 3–5% opacity). Soft long shadows on cards. Hand-drawn divider strokes between sections rather than hairline rules.
- **Mode B**: animated gradient mesh backgrounds, grain at 8% opacity, occasional decorative SVG shapes (squiggles, stars, blobs) that drift slowly. Confetti effect on form submission.

---

## 3. Tech Stack

Recommended stack — adjustable, but the spec assumes this:

- **Framework**: Next.js 14+ (App Router) with React. SSR for SEO on menu and event pages.
- **Styling**: Tailwind CSS for utility, CSS custom properties for theme tokens, CSS modules or `styled-components` for any complex per-component styling.
- **Animation**:
  - `framer-motion` (now Motion) for layout, page transitions, and React-driven motion.
  - CSS-only for hovers and simple loops — keep the bundle lean.
  - `lenis` for smooth scrolling on the main page.
- **Forms**: `react-hook-form` + `zod` for validation.
- **Backend**: Next.js Route Handlers or a small Node/Express service. Either is fine.
- **Database**: PostgreSQL (Supabase or Neon for hosted simplicity). Tables: `bookings`, `menu_items`, `specials`, `events`, `availability_slots`.
- **AI Assistant**: Anthropic Claude API (`claude-sonnet-4-6` or whatever the current default is at build time), with tool use for actions.
- **Deployment**: Vercel for the frontend; database hosted separately.
- **Email**: Resend or Postmark for booking confirmations.

---

## 4. File Structure

```
the-break-room/
├── README.md                       # this file
├── app/
│   ├── layout.tsx                  # shared shell, nav, footer, fonts
│   ├── page.tsx                    # home (Mode A)
│   ├── menu/
│   │   └── page.tsx                # menu (Mode A)
│   ├── visit/
│   │   └── page.tsx                # hours, location, contact (Mode A)
│   ├── about/
│   │   └── page.tsx                # story, team, values (Mode A)
│   ├── events/
│   │   └── page.tsx                # public events calendar (Mode A)
│   ├── book/
│   │   └── page.tsx                # PARTY BOOKING (Mode B)
│   ├── api/
│   │   ├── bookings/route.ts       # POST/GET bookings
│   │   ├── availability/route.ts   # GET open slots
│   │   ├── specials/route.ts       # GET today's specials
│   │   └── assistant/route.ts      # AI assistant endpoint w/ tool use
│   └── globals.css                 # tokens, base styles, both modes
├── components/
│   ├── Navigation.tsx              # top nav with magnetic CTA
│   ├── BookPartyButton.tsx         # the signature button
│   ├── Footer.tsx
│   ├── menu/
│   ├── home/
│   ├── booking/
│   │   ├── BookingForm.tsx
│   │   ├── DateSlotPicker.tsx
│   │   └── ConfettiBurst.tsx
│   └── assistant/
│       ├── AssistantWidget.tsx     # floating chat bubble
│       ├── AssistantPanel.tsx
│       └── tools/                  # client-side tool result renderers
├── lib/
│   ├── db.ts
│   ├── email.ts
│   ├── assistant/
│   │   ├── system-prompt.ts
│   │   ├── tools.ts                # tool definitions for Claude
│   │   └── handlers.ts             # server-side tool execution
│   └── utils.ts
├── public/
│   ├── fonts/
│   ├── images/
│   └── noise.svg
└── content/
    ├── menu.json                   # source of truth for menu
    ├── about.mdx
    └── faq.mdx
```

Keep menu content in JSON or MDX so it can be edited without touching components. Long-term, swap to a CMS (Sanity, Payload).

---

## 5. Navigation

### Top bar (sticky, all pages)

Left to right:
1. **Logo / wordmark** — "The Break Room" set in Fraunces italic. On hover, the dot in the period (if any) wiggles. Click returns home.
2. **Tabs** — Menu · Visit · About · Events
3. **AI assistant icon** — small coffee-cup icon, opens the assistant panel. Subtle pulse when the user has been idle for 20+ seconds on a page where the assistant could help (menu, visit, book).
4. **Book a Party button** — the signature CTA. See §7.

### Behavior
- Sticky on scroll, with a subtle backdrop blur (`backdrop-filter: blur(12px)`) and a 1px line-color border that fades in only after scrolling past 64px.
- Underline indicator slides between active tabs using `framer-motion`'s shared layout (`layoutId`).
- On mobile, tabs collapse into a hamburger that opens a full-screen menu with each tab as a large, tappable line item, animating in with a 60ms stagger.
- The Book a Party button **never collapses into the hamburger**. It always remains visible, even on mobile — shrunk slightly, but always reachable.

---

## 6. Page-by-Page Specification

### 6.1 Home — `/`

**Goal**: in 5 seconds, make a visitor feel welcome and understand what this place is.

**Structure (top to bottom)**:

1. **Hero**
   - Large editorial-style headline: *"Somewhere between the office and home."*
   - Subhead: brief sentence about the dual identity.
   - Hero image: a single warm photograph (real, not stock) — morning light on a wooden table, half a cup of coffee, an open notebook. No carousel.
   - Subtle parallax on scroll (image moves at 0.85x scroll speed).
   - Two buttons: "See the menu" (quiet, ghost style) and "Book a party" (the signature button, smaller variant).
   - Page-load animation: headline reveals word-by-word with `clip-path` mask, 80ms stagger; image fades from 0.8 → 1 opacity over 700ms.

2. **"During work hours" section**
   - Two-column asymmetric layout. Left: serif headline + paragraph. Right: photo of laptops and lattes.
   - A small card floats over the image showing live current status: "Open now · Wi-Fi: fast · Seats: ~12 free" — pulled from a simple status endpoint or set manually by staff via an admin route.

3. **"After hours, we transform" section**
   - Visual shift: background gradually warms toward the After Hours palette as the user scrolls into this section (use `IntersectionObserver` to interpolate `--surface` between the two palettes). This is the only place the home page hints at Mode B.
   - Photo of the space dressed up for an event.
   - CTA: the **Book a Party** button (full-size variant) centered below.

4. **Today's specials**
   - 3 cards, fetched from `/api/specials`. Each card: dish name, one-line description, price, small illustration.
   - Cards slightly tilt on hover (1.5° rotate, 1.02 scale, soft shadow lift).

5. **What people say**
   - 3 short testimonial quotes, set as pull-quotes with oversized opening quotation marks in the accent color. No star ratings, no carousel.

6. **Footer**
   - Hours, address, phone, email, socials, newsletter signup (single email field), credits.

**Motion**: Lenis smooth scroll. Section reveals on scroll (translateY 24px → 0, opacity 0 → 1, 600ms ease-out, triggered at 15% visible).

### 6.2 Menu — `/menu`

**Layout**: a magazine-style menu, not a database table.

- Sticky category nav on the left (desktop) or top (mobile): Coffee · Tea · Pastries · Lunch · Specials.
- Right column: items grouped by category. Each item is a row: name (serif), dots leading to price (mono), description below in lighter ink.
- Allergen icons on the right edge of each row (V, GF, DF, N) — small, line-drawn, only shown when applicable.
- A toggle in the page header: **"Show me only [vegan / gluten-free / under $10]"** — purely client-side filter.
- Specials section is highlighted with a hand-drawn border SVG.

**Motion**: when filtering, items animate via `framer-motion`'s `AnimatePresence` with layout animations — they slide and fade rather than snap.

### 6.3 Visit — `/visit`

- Hours table (today highlighted).
- Address with an embedded map (use Mapbox or Leaflet with a custom warm-cream styled tile layer — never Google Maps default).
- Photos of the interior, one large, two small — mosaic layout.
- "How to find us" — short prose with a hand-drawn arrow pointing to a quirky landmark nearby.
- Contact: phone, email, simple contact form (name, email, message).

### 6.4 About — `/about`

- Long-form editorial layout. Drop caps on first paragraphs of each section.
- Founder story, values, sourcing ethics.
- Team grid: small portraits, names, one-line "what they do here" or "what they're drinking today."
- A timeline of the cafe's milestones — vertical, with hand-drawn connector strokes.

### 6.5 Events — `/events`

- A list of upcoming public events (open mic nights, trivia, etc.) — distinct from private bookings.
- Each event card: date, title, short description, RSVP button.
- Past events shown grayed out below.
- This page is the *bridge* between Mode A and Mode B. It uses Mode A's typography but introduces small splashes of Mode B color in the date pills and RSVP buttons.

### 6.6 Book a Party — `/book` ⭐ Mode B

This page is the **destination** for the signature button. Treat it as the most exciting page on the site.

**Structure**:

1. **Hero (full viewport)**
   - Background: animated gradient mesh — three colored blobs (magenta, tangerine, electric yellow) drifting on a deep aubergine canvas. Use either a CSS keyframe animation on `background-position` of a layered radial-gradient stack, or a Three.js/WebGL shader if you want to go further. Add 8% grain overlay.
   - Floating decorative SVG elements: a star, a squiggle, a wonky circle — each on its own slow translate+rotate loop with different durations (12s, 17s, 23s) so they never sync.
   - Headline in the playful display font: *"Let's throw something memorable."*
   - Subhead: 1 sentence describing the kinds of events.
   - Confetti burst plays once on page load (canvas-based, then unmounts).

2. **What you can do here**
   - 4 colorful cards: *Birthday parties · Team offsites · Showers & celebrations · Whatever you can imagine*.
   - Each card has a different background color from the After Hours palette and tilts slightly (±2°). On hover, it straightens, scales 1.03, and the card's color brightens.

3. **The space**
   - Carousel-free photo strip with horizontal scroll snap. Each photo has a colored border that matches the After Hours palette.
   - Capacity stats inline: *"Up to 40 standing · 24 seated · A/V included · Catering options."*

4. **Booking form** — see §8.

5. **FAQ accordion**
   - Custom-styled, not the default. Expanded items animate height with `framer-motion` and the `+` icon rotates to `×`.

6. **Sticky bottom bar (Mode B page only)**
   - On scroll past the hero, a thin colorful bar pins to the bottom on mobile with a single CTA "Jump to form ↓".

**Motion philosophy on this page**: things move all the time, but slowly enough not to be annoying. Hover and click states should feel like pressing a candy button.

---

## 7. The Signature Book a Party Button

This button appears in three places: the top nav, the home page hero, and the home page "After hours" section. It is the most important interactive element on the site.

### Default state (Mode A pages)
- Pill shape, ~14px vertical padding, ~28px horizontal.
- Background: `var(--qh-ink)` (warm near-black).
- Text: `var(--qh-bg)` (cream), set in the body sans, medium weight, slightly tracked.
- Subtle 1px border in the same color for focus visibility.

### On hover
This is where it transforms.

1. **Color flood**: an animated conic gradient (magenta → tangerine → electric yellow → mint → violet → magenta) sweeps in from behind the text. Implemented as a pseudo-element with `background: conic-gradient(...)` rotated continuously via `@keyframes rotate-conic { to { transform: rotate(360deg); } }` at 4s/loop.
2. **Text color** shifts to `var(--ah-cream)`.
3. **Slight scale** to 1.04, with a tiny `rotate(-1deg)` for personality.
4. **Soft glow**: `box-shadow: 0 0 24px rgba(255, 61, 138, 0.4), 0 0 48px rgba(255, 140, 66, 0.3);`
5. **Decorative micro-particles**: 4–6 tiny colored dots emit from the button edges and float upward, fading out over 800ms. Implement with absolutely positioned spans on hover-enter, `keyframes` for upward drift + opacity.
6. **Cursor**: switches to a custom small "✨" or party-popper SVG cursor when over the button (Mode B preview).

### On click
- Brief `scale(0.96)` press-down (100ms).
- Confetti burst from the button's center (canvas-based, ~30 particles, 600ms).
- Page transition to `/book` is a colored wipe — a magenta panel sweeps from the click point outward, covers the screen, then reveals the booking page underneath. Use `framer-motion` page transitions or the browser View Transitions API where supported.

### On focus (keyboard)
- Same gradient effect as hover, plus a 3px outline in `--ah-electric` with a 2px offset for accessibility.

### Reduced motion
If `prefers-reduced-motion: reduce`, drop the conic rotation and particles. Keep only the color shift and a static gradient. The page transition becomes a simple fade.

### Implementation sketch (React)

```tsx
// components/BookPartyButton.tsx
import { motion } from "motion/react";
import Link from "next/link";

export function BookPartyButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Link href="/book" className={`book-btn book-btn--${size}`}>
      <span className="book-btn__bg" aria-hidden />
      <span className="book-btn__label">Book a party</span>
      <span className="book-btn__sparkles" aria-hidden>
        {/* 5 absolutely positioned sparkle spans, animated on hover */}
      </span>
    </Link>
  );
}
```

The CSS does the heavy lifting; React only triggers the click confetti and routes.

---

## 8. The Booking Form

Lives at the bottom of `/book`. The point: minimum friction, maximum delight.

### Fields
1. **Your name** (text, required)
2. **Email** (email, required)
3. **Phone** (tel, optional but recommended)
4. **Event type** (segmented control — Birthday · Corporate · Shower · Other; "Other" reveals a small text input)
5. **Date** (date picker, custom-styled to match Mode B)
6. **Time slot** (chips, fetched from `/api/availability?date=...` — only available slots are shown; unavailable ones are dimmed and not clickable)
7. **Guest count** (slider with a number bubble, range 5–60)
8. **Catering needs** (checkbox group: Coffee bar · Light bites · Full menu · Just the space)
9. **Anything else?** (textarea, optional)
10. **Submit** — large, full-width, the same gradient treatment as the signature button but always-on (not just hover).

### Validation
- Live, inline, kind. Error messages are full sentences ("We need a way to reach you — please add an email."), not "Required."
- Use `react-hook-form` + `zod`.
- Submit is disabled until required fields are valid; when disabled, it shows a soft tooltip explaining why on hover.

### Submission flow
1. Optimistic UI: button shows a spinner with the text "Sending good vibes…"
2. POST to `/api/bookings`. Server inserts a row, sends a confirmation email via Resend, sends a notification to the cafe owner.
3. On success: confetti fills the screen for 2 seconds, the form is replaced by a success card: *"You're on the list. We'll email you within one business day to confirm details."* with a calendar invite (.ics) download link.
4. On failure: a warm error card with a fallback — "Something went sideways. Email us at hello@thebreakroom.cafe and we'll sort it out."

### Honeypot
Add a hidden field named `website` — if it's filled, silently reject the submission (bots fill everything).

---

## 9. AI Assistant — "Beans"

The site includes an AI concierge named **Beans** (a small coffee-bean illustration). Beans is not a chatbot pretending to be a human. It's a tool that *does things* — it has access to the cafe's data and can take actions.

### Where it appears
- Floating button in the bottom-right, ~56px circle, with a subtle bounce animation every 30 seconds (gentle, not annoying).
- Clicking opens a panel that slides in from the right (desktop) or up from bottom as a sheet (mobile).
- The panel has a header with Beans' name, a typing indicator, an input box, and the conversation.

### What Beans can do
Beans uses the Anthropic Claude API with **tool use** to take real actions. The tools:

| Tool name | What it does |
|---|---|
| `get_menu` | Returns the current menu, optionally filtered by category or dietary tag. |
| `get_specials` | Returns today's specials. |
| `get_hours` | Returns hours for today or a specific day. |
| `check_availability` | Given a date and rough time, returns available booking slots. |
| `start_booking` | Pre-fills the booking form with collected info and navigates the user to `/book`. Does NOT submit on the user's behalf. |
| `get_event_info` | Returns details about a specific upcoming public event. |
| `get_directions` | Returns the address and a map link. |
| `escalate_to_human` | Captures the user's question + email and pings the staff via email/Slack. |

### What Beans cannot do
- **Cannot finalize a booking on the user's behalf.** It can fill in the form but the human always confirms. This is a deliberate trust decision.
- Cannot access personal user data beyond what's typed in the conversation.
- Cannot answer questions outside the cafe's domain. If asked, it politely redirects: "I'm only smart about The Break Room. For that one, your friendly local search engine is better equipped."

### Implementation
- **Endpoint**: `POST /api/assistant` accepts `{ messages: [...] }` and proxies to Claude with the system prompt + tool definitions.
- **System prompt** (sketch):
  > You are Beans, the digital concierge for The Break Room cafe in [city]. You help visitors with the menu, hours, directions, and party bookings. You have tools to look up real information — always use them rather than guessing. If a user wants to book a party, gather the basics (date, guest count, event type), call check_availability, then call start_booking to pre-fill the form for them. Never invent menu items, prices, or hours. Be warm, brief, and a little witty.
- **Tool execution**: each tool maps to a server-side handler in `lib/assistant/handlers.ts`. The handler hits the database (or static JSON for menu) and returns structured data.
- **Streaming**: responses stream token-by-token using Server-Sent Events for snappiness.
- **Rate limiting**: per-IP, 20 messages/hour, soft limit. If exceeded, Beans says: "Whew, lots of questions today — give me a sec. Try again in a few minutes?"
- **Logging**: log conversations (anonymized) to improve the system prompt over time. Show a small "🍪 Beans remembers nothing about you between sessions" note in the UI.

### UX details
- When Beans calls a tool, the UI shows a small inline indicator: *"Beans is checking availability…"*
- Tool results render with custom React components — e.g., menu items appear as styled cards inline in the chat, not as raw text.
- The booking pre-fill creates a magic link: `/book?prefill=<token>` where the token decrypts to the form values. On arrival, fields are filled and gently highlighted.
- Beans' avatar animates while typing — the bean wiggles.

---

## 10. Animation & Motion Guidelines

### Principles
1. **Motion has meaning.** Every animation either guides attention, indicates state, or expresses brand. No motion for motion's sake.
2. **Mode A is slow.** 400–800ms ease-out for most transitions. Things glide.
3. **Mode B is springy.** Use spring physics (`stiffness: 200, damping: 15`) for bounces and pops.
4. **Respect `prefers-reduced-motion`.** Disable parallax, autoplay loops, particle effects, and confetti. Keep state-change indicators and basic fades.

### Page transitions
- Between Mode A pages: a 200ms cross-fade.
- From Mode A to `/book`: the colored wipe transition described in §7.
- From `/book` back: a reverse cream-colored wipe.

### Scroll behavior
- Lenis smooth scroll on Mode A pages.
- Disable smooth scroll on Mode B for snappier feel; let parties feel kinetic.

### Hover micro-interactions (catalogue)
- Links: underline grows from left to right (200ms).
- Cards: lift + shadow + 1.5° rotate (Mode A), or color-brighten + straighten (Mode B).
- Images: 1.05 scale with overflow-hidden parent, 600ms ease.
- Icons: rotate or wiggle; never just darken.

---

## 11. Accessibility

This is non-optional.

- All interactive elements reachable by keyboard, with visible focus states (outline + offset).
- Color contrast meets WCAG AA: 4.5:1 for body, 3:1 for large text.
- The Book a Party button's gradient hover state must still meet contrast — verify the text against the gradient's lowest-contrast color.
- All images have meaningful alt text. Decorative images use `alt=""`.
- Forms have visible labels (not just placeholders), error messages tied via `aria-describedby`.
- The AI assistant panel: `role="dialog"`, traps focus when open, returns focus to the trigger on close.
- All animations honor `prefers-reduced-motion`.
- Confetti uses `aria-hidden="true"` and does not announce.
- Headings follow proper hierarchy (one `h1` per page, no skipping levels).
- The custom date and time pickers are keyboard-navigable (arrow keys, Enter, Escape).

---

## 12. Performance Budget

- LCP < 2.0s on a 4G connection.
- Hero image: AVIF/WebP, ~80KB compressed, served via `next/image`.
- Fonts: variable, `font-display: swap`, subset to Latin.
- JS bundle (initial): under 150KB gzipped. Code-split the booking page and the AI assistant — both lazy-loaded.
- Defer the assistant's JS until the user clicks the floating button.
- Defer the confetti library until the user lands on `/book`.
- Lighthouse target: 95+ on Performance, Accessibility, Best Practices, SEO.

---

## 13. Content & Copy Voice

- **Mode A copy**: warm, simple, sentences that can be read aloud. No jargon. No "synergy."
- **Mode B copy**: playful, slightly cheeky, lots of em-dashes and ampersands.
- Avoid clichés ("artisanal," "experience the difference," "your home away from home").
- The cafe has a **first-person plural voice** ("we," "us") consistently — never the third person.
- Beans (the AI) uses first person singular and light humor.

---

## 14. SEO & Metadata

- Page titles: `[Page] — The Break Room`.
- Per-page Open Graph images: a custom OG image generator (Next.js `ImageResponse`) that uses the page title in the display font on the cream background, with the logo.
- Schema.org markup for `Cafe`, `OpeningHoursSpecification`, `Menu`, and `Event`.
- Sitemap and robots.txt generated automatically.
- Canonical URLs on every page.

---

## 15. Future Enhancements (Phase 2)

Documented but not built in v1:
- Loyalty program (punch card, "10th coffee free").
- Online ordering for pickup.
- Live seat/availability counter pulled from Wi-Fi presence (privacy-respecting).
- Beans gains a voice mode.
- Multi-location support if the cafe expands.
- A small CMS for staff to update menu, specials, and hours without a deploy.
- Newsletter archive.

---

## 16. Build Checklist

When building from this README, work in this order:

1. Set up the Next.js project, fonts, color tokens, Tailwind config.
2. Build the shared layout, navigation, and footer.
3. **Build the Book a Party button as a standalone component.** Get it perfect in isolation — this is the keystone.
4. Build the home page (Mode A).
5. Build menu, visit, about, events pages (Mode A).
6. Build `/book` (Mode B) with the booking form.
7. Wire up the database and the booking API.
8. Build the AI assistant panel UI with mocked responses.
9. Wire up the assistant to the Claude API with tool use, one tool at a time.
10. Add page transitions and motion polish.
11. Accessibility audit.
12. Performance audit.
13. Content pass — replace lorem ipsum with real copy.
14. Deploy.

---

## 17. Notes for the Builder

- When in doubt, choose the warmer color, the slower animation, the simpler layout. Mode A's restraint is what makes Mode B feel earned.
- The Book a Party button is not just a CTA — it is the brand's thesis statement: *"there's a fun version of this place hiding inside the calm one."* Build it accordingly.
- Beans should feel like a useful tool, not a gimmick. If a feature would make Beans worse to use just to seem more "AI," cut it.
- This site is for a real cafe. Imagine the owner reading every page. Would they recognize their place? Would they be proud to share the link?

---

*End of README.*
