// Pure logic for kiosk mode: the ?kiosk= activation param, session timings,
// the staff-exit tap counter, and the on-screen keyboard's caret/value math.
// No DOM access here so it stays unit-testable (tests/kiosk.test.ts). DOM
// wiring lives in components/kiosk/.

/**
 * localStorage flag that keeps kiosk mode on across reloads on the device.
 * The name is historical — kiosk mode started life as just the on-screen
 * keyboard — and is deliberately unchanged so devices already switched on
 * in the cafe stay switched on across deploys.
 */
export const KIOSK_STORAGE_KEY = "br-kiosk-keyboard";

/** What a ?kiosk=… URL value asks us to do with the stored flag, if anything. */
export function parseKioskValue(raw: string | null): "on" | "off" | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (v === "on" || v === "1" || v === "true") return "on";
  if (v === "off" || v === "0" || v === "false") return "off";
  return null;
}

// SESSION TIMINGS -----------------------------------------------------
// A kiosk is a shared surface: one customer's half-built order must never
// greet the next one. Every number below is a deliberate tradeoff between
// "don't rush someone who is still reading the menu" and "don't leave a
// stranger's order on screen".

/** Untouched for this long → the "still there?" warning appears. */
export const KIOSK_IDLE_MS = 60_000;
/** How long that warning counts down before the session is wiped. */
export const KIOSK_IDLE_WARN_MS = 15_000;
/** How long a placed order stays on screen before the kiosk resets itself. */
export const KIOSK_DONE_MS = 25_000;

/** Whole seconds left, for countdown copy. Never negative. */
export function countdownSeconds(remainingMs: number): number {
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

// STAFF EXIT ----------------------------------------------------------
// Chromium in --kiosk mode has no URL bar, so ?kiosk=off is unreachable on
// the hardware. Five taps in a screen corner open a PIN pad instead.
//
// This is a *speed bump against curious customers*, not a security boundary:
// the PIN is checked on the device so staff can still get out when the
// network is down, and all it unlocks is a localStorage flag on a screen you
// already need physical access to touch. Nothing behind it is privileged —
// /staff and /admin have their own real Supabase auth.

export const KIOSK_EXIT_TAPS = 5;
/** Taps more than this far apart start the count over. */
export const KIOSK_EXIT_TAP_GAP_MS = 3_000;
/** Wrong PINs before the pad locks out. */
export const KIOSK_EXIT_MAX_ATTEMPTS = 5;
export const DEFAULT_KIOSK_EXIT_PIN = "2468";
/**
 * The staff PIN pad folds itself away after this long untouched.
 *
 * A customer who finds the corner hotspot by accident lands on a "Staff exit"
 * dialog they have no reason to understand. The pad sits at z-95, above the
 * idle warning at z-75, so the idle path could not rescue them: the warning
 * rendered *behind* the pad and the wipe left the pad still covering the
 * screen. Without this the kiosk needed a member of staff to clear it.
 */
export const KIOSK_EXIT_PAD_IDLE_MS = 20_000;
/**
 * Hard ceiling on PIN entry length, and therefore on a usable exit PIN.
 *
 * The pad auto-submits once the entry is as long as the configured PIN. Entry
 * used to be truncated at a fixed 12 characters, so a PIN of 13 or more could
 * never reach its own length: the pad would accept digits forever and submit
 * nothing, locking staff out of their own device permanently.
 * `kioskExitPin` refuses to return anything longer than this.
 */
export const KIOSK_EXIT_PIN_MAX = 12;

export type TapState = { count: number; last: number };
export const NO_TAPS: TapState = { count: 0, last: 0 };

/** Fold one corner tap into the counter, restarting if the gap was too long. */
export function registerTap(state: TapState, now: number): TapState {
  const continues = now - state.last <= KIOSK_EXIT_TAP_GAP_MS;
  return { count: continues ? state.count + 1 : 1, last: now };
}

export function tapsUnlock(state: TapState): boolean {
  return state.count >= KIOSK_EXIT_TAPS;
}

/**
 * The configured exit PIN. Falls back to a documented default so a kiosk is
 * never stranded by a missing env var — SETUP.md tells owners to change it.
 *
 * A PIN longer than KIOSK_EXIT_PIN_MAX is unenterable on the pad, so rather
 * than let a well-meaning long PIN brick the device we refuse it and fall
 * back to the default. Misconfiguration should cost you a weak PIN, not the
 * only way out of kiosk mode.
 */
export function kioskExitPin(): string {
  const configured = (process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN ?? "").trim();
  if (!configured) return DEFAULT_KIOSK_EXIT_PIN;
  if (configured.length > KIOSK_EXIT_PIN_MAX) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[kiosk] NEXT_PUBLIC_KIOSK_EXIT_PIN is ${configured.length} characters; ` +
          `the pad can hold at most ${KIOSK_EXIT_PIN_MAX}. Falling back to the default PIN.`
      );
    }
    return DEFAULT_KIOSK_EXIT_PIN;
  }
  return configured;
}

export type EditResult = { value: string; caret: number };

// Inputs like type=email don't expose a selection (selectionStart is null) —
// treat that as a caret at the end. Clamp against stale out-of-range values.
function clampSelection(
  value: string,
  selStart: number | null,
  selEnd: number | null
): { start: number; end: number } {
  const start = Math.max(0, Math.min(selStart ?? value.length, value.length));
  const end = Math.max(start, Math.min(selEnd ?? value.length, value.length));
  return { start, end };
}

/**
 * Insert text at the selection (replacing it), honoring maxLength.
 * maxLength < 0 means unlimited, matching HTMLInputElement.maxLength.
 */
export function applyInsert(
  value: string,
  selStart: number | null,
  selEnd: number | null,
  text: string,
  maxLength: number = -1
): EditResult {
  const { start, end } = clampSelection(value, selStart, selEnd);
  let insert = text;
  if (maxLength >= 0) {
    const room = maxLength - (value.length - (end - start));
    insert = room > 0 ? text.slice(0, room) : "";
  }
  return {
    value: value.slice(0, start) + insert + value.slice(end),
    caret: start + insert.length,
  };
}

/** Delete the selection, or the single code point before the caret. */
export function applyBackspace(
  value: string,
  selStart: number | null,
  selEnd: number | null
): EditResult {
  const { start, end } = clampSelection(value, selStart, selEnd);
  if (start !== end) {
    return { value: value.slice(0, start) + value.slice(end), caret: start };
  }
  if (start === 0) return { value, caret: 0 };
  // Delete a whole surrogate pair (emoji etc.), never half of one.
  let cut = 1;
  const low = value.charCodeAt(start - 1);
  if (low >= 0xdc00 && low <= 0xdfff && start >= 2) {
    const high = value.charCodeAt(start - 2);
    if (high >= 0xd800 && high <= 0xdbff) cut = 2;
  }
  return {
    value: value.slice(0, start - cut) + value.slice(start),
    caret: start - cut,
  };
}
