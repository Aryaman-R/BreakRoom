# Ordering System — Architecture

> Scope reminder: this describes the **pickup-ordering system only**. The Breakroom's main website is a separate project.

## Summary

A single Next.js app on Vercel with Supabase as the database serves three surfaces: a customer menu/checkout, a staff order queue, and an owner admin. Orders are the only thing this system owns. Payment, sales tax, and the till live in the cafe's existing Bematech POS, and the boundary between the two systems is a human cashier re-keying accepted orders — the same tablet-re-key workflow staff already run daily for DoorDash. Twilio sends the three SMS messages that hold the flow together: the verification code, "order confirmed," and "order ready."

## Diagram

```
 Customer phone/laptop               Cafe counter
 ┌───────────────────┐        ┌────────────────────────┐
 │ /   menu · cart   │        │ /staff  queue · chime  │
 │     phone verify  │        │ Accept→SMS  Ready→SMS  │
 └─────────┬─────────┘        └───────────┬────────────┘
           │                              │  re-key by hand
 /order/[id]                              ▼  (same as DoorDash today)
 (status, 5s poll)                 Bematech POS
           │                       (payment · tax · till,
           │                        untouched)
           │      ┌──────────────┐
           └─────▶│ Next.js API  │◀── /admin (menu, hours,
                  │   routes     │           caps, blocklist)
                  └──────┬───────┘
                         │ service role key
                  ┌──────▼───────┐      ┌────────┐
                  │   Supabase   │      │ Twilio │
                  │   Postgres   │      │  SMS   │
                  └──────────────┘      └────────┘
```

## Components

**Customer app (`/`, `/order/[id]`)** — anonymous. Reads the menu via an RLS policy that exposes only available items. Items can carry **variants** (one required price-setting choice: wing count, yakisoba protein, 12oz/16oz) and **add-ons** (optional priced extras: boba toppings, avocado, bacon, combo upgrades); free-text notes cover non-price choices like bread, sauce, sweetness, and ice, guided by a per-item prompt. Placing an order is one POST carrying items + choices, name, phone, and the SMS code — or, from a kiosk, name and items alone (the walk-in path). Prices display as menu prices with a "plus tax at pickup" line — tax stays the register's job. Outside ordering hours (see settings) the page shows "Online ordering opens at 9:30 AM" instead of a cart. The status page polls `GET /api/orders/[id]` every 5 seconds until the order settles (`picked_up`, `no_show`, `cancelled`), then stops — no auth; the unguessable order UUID is the capability, and the response contains no phone number, only a `walk_in` boolean derived from it. On a kiosk this page becomes a large, self-resetting confirmation and does not poll at all.

**Staff screen (`/staff`)** — behind Supabase Auth. Subscribes to Supabase Realtime on the `orders` table; a chime loops while any order sits in `new` or `call_to_confirm`. Browsers require one user tap before audio can play, so the screen shows an "enable sound" button on load. Status buttons call `PATCH /api/orders/[id]`. Cards show variant, add-ons, and notes exactly as staff need them for re-keying.

**Admin (`/admin`)** — Supabase Auth plus an email allow-list (`ADMIN_EMAILS`). Menu CRUD including variants and add-ons, the one-tap sold-out toggle, ordering-hours editor, the fraud-cap editor, and blocklist management.

Both screens are allow-listed, not merely authenticated: `/staff` needs an email on `STAFF_EMAILS` or `ADMIN_EMAILS`, `/admin` needs `ADMIN_EMAILS`. Checked in `middleware.ts` so the page never renders, and again in `lib/guards.ts` so the API never answers. "Any signed-in user is staff" assumed accounts could only be created by hand in the Supabase dashboard, and nothing enforced that assumption — Supabase enables email sign-ups by default, so anyone could self-register into a screen listing every customer's name and phone number. With neither variable set, nobody gets in.

**Kiosk mode (`components/kiosk/`)** — a *mode*, not a route and not a build. `KioskProvider` mounts once in the root layout, reads a per-device `localStorage` flag set by `?kiosk=on`, and every kiosk behaviour hangs off it — which keeps all of this invisible to ordinary visitors and impossible to leave switched on for the public. The design constraint that shapes it: **a kiosk screen is shared, so the previous customer's session must always end.** Three mechanisms guarantee that, and each is independent so no single failure strands the screen:

- `KioskIdle` — 60s untouched → a 15s "still there?" countdown → session wiped. The warning ignores incidental activity on purpose; only its button dismisses it. It is armed on **every** route, standing down only while `KioskAttract` is actually mounted. That distinction is load-bearing: `attract` is a bare intent flag, but only `OrderApp` renders the attract screen, so on any other route `attract` could be true with nothing covering the screen. Since `endSession()` raises `attract` *before* navigating home, a navigation that was slow, interrupted, or failed left a live page with no idle timer and no attract screen — stuck until someone power-cycled it. The provider therefore tracks `attractVisible`, set by the attract screen on mount, and the timer keys on what is painted rather than on what was intended.
- `KioskOrderDone` — the confirmation screen runs its own 25s countdown. Tapping it restarts rather than pauses, so there is no way to hold the screen forever. The idle timer stays armed alongside it; the two do not fight, because 25s is well inside 60s and every tap that extends one resets the other.
- `KioskAttract` — where every reset lands: a full-screen "tap to order" state that both invites the next customer and proves the last one is gone.

`endSession()` is the single funnel — it clears the cart in storage *and* React state, drops open dialogs, returns to `/`, refreshes the menu, and raises the attract screen.

**A page load is also the start of a session.** `KioskProvider` clears the cart on boot whenever kiosk mode is on. Reloads happen for reasons the previous customer had nothing to do with — Chromium restarting after an update, staff power-cycling the screen, a crash — and the stored cart survived all of them: the attract screen went up looking like a clean slate, and the next person to tap "start" inherited a stranger's half-built order and paid for it at the register. The "cart never survives a session" invariant has to hold across a process restart, not just across `endSession()`.

**An in-flight order can outlive the session that placed it.** `CheckoutSheet` stamps each POST with the current `resetToken` and drops the response if it no longer matches. Without that, a request that hung until the idle wipe would navigate whoever was using the kiosk *next* to a stranger's confirmation screen, name and order number included. The order is still placed; it just stops steering a kiosk that has moved on. Two more overlays complete the surface: `KioskOffline` takes the kiosk out of service when it can't reach `/api/health` (the browser's `navigator.onLine` says "online" for a device on wifi with a dead uplink, so it is used only as a fast negative), and `KioskExit` gives staff a 5-tap corner + PIN way out, because Chromium `--kiosk` has no URL bar to type `?kiosk=off` into. Their stacking order is documented as a contract in `KioskShell`.

`KioskExit`'s pad sits above the idle warning, so it has to clean up after itself: it folds away after 20s untouched, and on any session reset. Five taps is not many on a screen a bored child is poking at, and before that a customer who found the hotspot by accident was left facing a "Staff exit" prompt that the idle path could not clear — the warning rendered *behind* the pad, and the wipe left the pad still covering the screen. The exit PIN is also capped at 12 characters, the pad's capacity: the pad auto-submits when the entry reaches the PIN's length, so a longer PIN could never reach its own length and locked staff out permanently. A PIN over the limit is refused in favour of the default.

Kiosk mode also changes two things the server cares about: orders are tagged `source=kiosk`, and checkout may omit the phone number entirely (the walk-in path — see ORDERING-FRAUD-PREVENTION.md, and note the database constraint that keeps it kiosk-only).

**Kiosk keyboard (`components/kiosk/KioskKeyboard.tsx`)** — an on-screen keyboard for shared touchscreens with no physical keyboard, enabled by the same mode. It is the one component that listens globally — `focusin`/`focusout` to track the focused field and a capture-phase `pointerdown` to force `inputmode="none"` before focus lands, so the device's own keyboard never appears. Values are written through the prototype `value` setter plus a synthetic `input` event, so React's controlled inputs see them as real typing; caret and `maxLength` math is pure and unit-tested in `lib/kiosk.ts`. Two consequences worth knowing before touching input code: **admin numeric fields deliberately use `inputMode` rather than `type="number"`**, because native number inputs suppress the hint the keyboard reads to pick a layout (parsing is defensive on submit, and the server is still the authority); and **anything that unmounts the keyboard must do so on `pointerup`, never `pointerdown`**, with the follow-up compatibility click swallowed — otherwise it falls through to the page underneath. See `README.md` for operator-facing usage.

**API routes** — the only writers in the system. They run server-side with the service role key and enforce verification, hours, caps, status transitions, and full price recomputation.

**Supabase** — Postgres, Auth (staff and owner accounts created manually in the dashboard), Realtime publication on `orders`.

**Twilio** — exactly three message types. US note: A2P SMS requires registering the sending number (toll-free verification or 10DLC). Start that registration on day one — approval takes days, not minutes.

## Order lifecycle

```
             ┌─ total > threshold ─▶ call_to_confirm ─┐
 submit ─────┤                       (staff phone the │
             └─────────────────────▶ new ─────────────┤ customer first)
                                                      ▼
                     cancelled ◀───────────────── accepted ── SMS "confirmed"
                                                      ▼
                                                    ready ──── SMS "ready!"
                                                  ▼       ▼
                                            picked_up   no_show ─▶ 2 strikes
                                                                   = phone blocked
```

Legal transitions are enforced in the PATCH handler; anything else returns 400.

## One order, end to end

1. During open hours, a customer builds a cart — say an 8pc wings (variant), a Milk Tea + boba (add-on), notes "Korean sauce, 50% sweet" — then enters name + phone and taps "Text me a code."
2. `POST /api/verify/start` sends a 6-digit code — 5-minute expiry, max 3 sends per phone per hour.
3. Customer submits. `POST /api/orders` validates the code, then runs the gauntlet: hours window → blocklist → open-order cap → daily cap → item availability, variant validity, add-on validity, quantity caps → server-side price recomputation → threshold routing → `next_order_number()` → insert order + fully snapshotted items.
4. The staff screen chimes. The cashier taps **Accept** (or phones first if `call_to_confirm`), re-keys the order into the Bematech, and the customer gets "confirmed, ~15 min."
5. When the order's up, staff tap **Ready** → SMS. Customer pays at the register (tax computed there, as always); staff tap **Picked up**. If nobody shows in a reasonable window, **No-show**.

## Security posture

- RLS is enabled on every table. The anonymous role can select available menu items and nothing else. Authenticated staff can select everything. **No client role has any insert/update/delete policy** — every mutation goes through server routes holding the service role key.
- The service role key exists only in server environment variables.
- Staff authorization = valid session **and** email present in `STAFF_EMAILS` or `ADMIN_EMAILS`. Admin authorization additionally requires `ADMIN_EMAILS`. Both are checked in `middleware.ts` (page) and in the route (data), and both fail closed when neither list is configured. A valid session on its own is **not** sufficient — Supabase enables public email sign-ups by default, so treating any authenticated user as staff exposed the customer list to anyone willing to register. Turning sign-ups off in the Supabase dashboard is the other half of this and is in SETUP.md §2.3.
- The public order-status endpoint returns a sanitized projection with no phone number.
- Hours, rate limits, and caps are enforced in route logic against the database — never in the UI alone.
- All time math for ordering hours uses `America/Los_Angeles` explicitly; the server's own clock (UTC on Vercel) is never trusted for "is the cafe open."

## Design principles

Server is truth · money in integer cents · order items snapshot name, variant, add-ons, and price at purchase so menu edits never rewrite history · statuses are a closed enum · every future feature is a new surface on this same core, never a rewrite.
