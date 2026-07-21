import "server-only";

// Twilio via its REST API directly — one endpoint, form-encoded, Basic auth.
// (The full twilio SDK adds nothing here but cold-start weight.)
//
// With no Twilio env vars set, messages are logged to the server console and
// `dev: true` is returned so callers can decide what to surface. Message
// policy per docs/ORDERING-IMPLEMENTATION.md §8: a failed VERIFICATION send
// must surface to the customer; failed accepted/ready sends log and continue.

export type SmsResult = { ok: boolean; dev: boolean; error?: string };

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!smsConfigured()) {
    console.log(`[sms:dev] to=${to} body=${JSON.stringify(body)}`);
    return { ok: false, dev: true };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(
    `${sid}:${process.env.TWILIO_AUTH_TOKEN!}`
  ).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.TWILIO_FROM_NUMBER!,
          Body: body,
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[sms] Twilio ${res.status} sending to ${to}: ${detail}`);
      return { ok: false, dev: false, error: `Twilio ${res.status}` };
    }
    return { ok: true, dev: false };
  } catch (err) {
    console.error(`[sms] send to ${to} failed:`, err);
    return { ok: false, dev: false, error: "network" };
  }
}
