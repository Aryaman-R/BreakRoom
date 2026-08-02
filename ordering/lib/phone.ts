// Phones are E.164 — normalize before every store or comparison.
//
// Deliberately restricted to the North American Numbering Plan (+1).
//
// This is a pickup-only cafe in Bothell, WA: every real customer has to walk
// through the door to collect their food, so a verification code has no
// legitimate reason to be sent overseas. The previous rule accepted anything
// matching /^[1-9]\d{7,14}$/ — every E.164 number on earth — and /api/verify/
// start will hand any accepted number to Twilio. That is the setup for SMS
// pumping (a.k.a. toll fraud): an attacker walks a list of premium-rate
// international ranges they earn revenue from, collects the per-message payout,
// and leaves the cafe with the bill. There is no per-IP or global budget above
// this to stop it, and the per-phone cap of 3/hour does nothing when every
// request uses a different number.
//
// Widening this is a business decision, not a cleanup: if the cafe ever needs
// to text a non-US number, add that country explicitly rather than reopening
// the whole plan.

/** Country codes we will send an SMS to. NANP only. */
const ALLOWED_COUNTRY_CODES = ["1"] as const;

export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasPlus) {
    // +1 followed by a valid 10-digit NANP number.
    if (!/^1\d{10}$/.test(digits)) return null;
    return isValidNanp(digits.slice(1)) ? `+${digits}` : null;
  }
  if (/^\d{10}$/.test(digits)) {
    return isValidNanp(digits) ? `+1${digits}` : null;
  }
  if (/^1\d{10}$/.test(digits)) {
    return isValidNanp(digits.slice(1)) ? `+${digits}` : null;
  }
  return null;
}

/**
 * Structural NANP validity for a bare 10-digit number.
 *
 * Area code and exchange both have to start 2-9, and N11 area codes (411,
 * 911, …) are service codes rather than subscriber numbers. This is a cheap
 * structural filter, not a lookup: it turns away typos and casual junk before
 * they reach Twilio and cost money, but it cannot tell an unassigned number
 * from a real one, and it deliberately still accepts the 555 exchange that
 * the tests and Twilio's own magic numbers use.
 */
function isValidNanp(ten: string): boolean {
  if (ten.length !== 10) return false;
  const area = ten.slice(0, 3);
  const exchange = ten.slice(3, 6);
  if (!/^[2-9]\d{2}$/.test(area)) return false;
  if (!/^[2-9]\d{2}$/.test(exchange)) return false;
  // N11 codes (411, 911, …) are service codes, never subscriber numbers.
  if (/^\d11$/.test(area)) return false;
  return true;
}

/** Exposed for the SMS layer, which refuses to dial outside this set. */
export function isAllowedDestination(e164: string): boolean {
  return ALLOWED_COUNTRY_CODES.some((cc) => e164.startsWith(`+${cc}`));
}
