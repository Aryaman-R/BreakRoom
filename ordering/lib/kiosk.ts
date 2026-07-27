// Pure logic for the kiosk on-screen keyboard: caret/value math and the
// ?kiosk= activation param. No DOM access here so it stays unit-testable
// (tests/kiosk.test.ts). DOM wiring lives in components/kiosk/.

/** localStorage flag that keeps kiosk mode on across reloads on the device. */
export const KIOSK_STORAGE_KEY = "br-kiosk-keyboard";

/** What a ?kiosk=… URL value asks us to do with the stored flag, if anything. */
export function parseKioskValue(raw: string | null): "on" | "off" | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (v === "on" || v === "1" || v === "true") return "on";
  if (v === "off" || v === "0" || v === "false") return "off";
  return null;
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
