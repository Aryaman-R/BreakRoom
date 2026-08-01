"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Sheet } from "./Sheet";
import { useKiosk } from "@/components/kiosk/KioskProvider";
import { cartSubtotal, clearCart, type CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import type { OrderSource } from "@/lib/types";

const RESEND_COOLDOWN_S = 30;

type Phase = "details" | "code" | "placing";
/** How the customer wants to be reached: a text, or their name called out. */
type Contact = "phone" | "walkin";

export function CheckoutSheet({
  lines,
  source,
  allowWalkin,
  onClose,
}: {
  lines: CartLine[];
  source: OrderSource;
  /**
   * Offer "no phone — call my name". True only at the kiosk, and only while
   * the owner leaves the setting on: the customer is standing at the counter,
   * which is the whole reason we can reach them without a number.
   */
  allowWalkin: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { kiosk } = useKiosk();
  const [phase, setPhase] = useState<Phase>("details");
  const [contact, setContact] = useState<Contact>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timer.current), []);

  const walkIn = allowWalkin && contact === "walkin";

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    clearInterval(timer.current);
    timer.current = setInterval(
      () => setCooldown((c) => (c <= 1 ? (clearInterval(timer.current), 0) : c - 1)),
      1000
    );
  };

  const requireName = () => {
    if (name.trim()) return true;
    setError("Please tell us your name — it's how we call your order.");
    return false;
  };

  const sendCode = async () => {
    setError(null);
    if (!requireName()) return;
    setSending(true);
    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't send the code — please try again.");
        return;
      }
      setDevCode(body?.dev_code ?? null);
      setPhase("code");
      startCooldown();
    } catch {
      setError("Network hiccup — please try again.");
    } finally {
      setSending(false);
    }
  };

  const placeOrder = async () => {
    setError(null);
    if (!requireName()) return;
    // Where a rejected order should leave the customer: a walk-in never had a
    // code step to fall back to.
    const fallback: Phase = walkIn ? "details" : "code";
    setPhase("placing");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          // Omitted entirely for a walk-in — the server reads their absence
          // as the walk-in path and applies its own caps.
          ...(walkIn ? {} : { phone, code }),
          source,
          items: lines.map((l) => ({
            menu_item_id: l.menu_item_id,
            variant_label: l.variant_label,
            addon_labels: l.addon_labels,
            quantity: l.quantity,
            notes: l.notes,
          })),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't place the order — please try again.");
        // A spent/expired code can't be reused; stay on the code step so the
        // customer can request a fresh one.
        setPhase(fallback);
        if (!walkIn) setCode("");
        return;
      }
      clearCart();
      // The kiosk shows the number and resets itself, so leave nothing behind
      // for a back gesture to land on. `n` lets the confirmation paint the
      // order number immediately instead of after a round trip.
      const to = `/order/${body.order_id}?n=${body.order_number}`;
      if (kiosk) router.replace(to);
      else router.push(to);
    } catch {
      setError("Network hiccup — please try again.");
      setPhase(fallback);
    }
  };

  return (
    <Sheet title="Check out" onClose={onClose}>
      <p className="text-sm text-qh-ink-soft">
        {formatCents(cartSubtotal(lines))} plus tax —{" "}
        <span className="font-medium text-qh-ink">
          pay at the register when you pick up.
        </span>
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="co-name" className="text-sm font-medium">
            {walkIn ? "Name we'll call out" : "Name for the order"}
          </label>
          <input
            id="co-name"
            className="field mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            disabled={phase !== "details"}
          />
        </div>

        {allowWalkin ? (
          <fieldset>
            <legend className="text-sm font-medium">
              How should we let you know it&#8217;s ready?
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <ContactChoice
                selected={contact === "phone"}
                disabled={phase !== "details"}
                onSelect={() => {
                  setContact("phone");
                  setError(null);
                }}
                title="Text me"
                detail="We'll send a code now, then a text when it's up."
              />
              <ContactChoice
                selected={contact === "walkin"}
                disabled={phase !== "details"}
                onSelect={() => {
                  setContact("walkin");
                  setError(null);
                }}
                title="Call my name"
                detail="No phone needed — listen for your name at the counter."
              />
            </div>
          </fieldset>
        ) : null}

        {walkIn ? null : (
          <div>
            <label htmlFor="co-phone" className="text-sm font-medium">
              Mobile number
            </label>
            <p className="text-xs text-qh-ink-soft">
              We text you a code now, and &#8220;order ready&#8221; when it&#8217;s up.
            </p>
            <input
              id="co-phone"
              className="field mt-1"
              type="tel"
              inputMode="tel"
              placeholder="(425) 555-0100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              autoComplete="tel"
              disabled={phase !== "details"}
            />
          </div>
        )}
      </div>

      {walkIn ? (
        <>
          <div className="mt-4 rounded-xl border border-qh-accent/30 bg-qh-accent-soft/30 px-4 py-3 text-sm">
            🔔{" "}
            <span className="font-medium">
              Stay nearby — we&#8217;ll call your name and your order number.
            </span>{" "}
            Pay at the register when you pick it up.
          </div>
          <button
            className="btn btn-accent btn-lg mt-4 w-full"
            onClick={placeOrder}
            disabled={!name.trim() || phase === "placing"}
          >
            {phase === "placing" ? "Placing your order…" : "Place order"}
          </button>
        </>
      ) : phase === "details" ? (
        <button
          className="btn btn-primary btn-md mt-4 w-full"
          onClick={sendCode}
          disabled={sending || !phone.trim()}
        >
          {sending ? "Sending…" : "Text me a code"}
        </button>
      ) : (
        <>
          <div className="mt-4">
            <label htmlFor="co-code" className="text-sm font-medium">
              Enter the 6-digit code we texted you
            </label>
            {devCode ? (
              <p className="mt-1 rounded-lg bg-qh-accent-soft/40 px-3 py-2 text-sm">
                Dev mode — no SMS is configured. Your code is{" "}
                <span className="font-mono font-semibold">{devCode}</span>.
              </p>
            ) : null}
            <input
              id="co-code"
              className="field mt-2 text-center font-mono text-xl tracking-[0.4em]"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={phase === "placing"}
            />
          </div>
          <button
            className="btn btn-accent btn-lg mt-4 w-full"
            onClick={placeOrder}
            disabled={code.length !== 6 || phase === "placing"}
          >
            {phase === "placing" ? "Placing your order…" : "Place order"}
          </button>
          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              className="text-qh-ink-soft underline underline-offset-2 hover:text-qh-accent disabled:no-underline disabled:opacity-50"
              onClick={sendCode}
              disabled={sending || cooldown > 0}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              className="text-qh-ink-soft underline underline-offset-2 hover:text-qh-accent"
              onClick={() => {
                setPhase("details");
                setCode("");
                setDevCode(null);
                setError(null);
              }}
            >
              Change number
            </button>
          </div>
        </>
      )}

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}

function ContactChoice({
  selected,
  disabled,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "rounded-xl border px-4 py-3 text-left transition disabled:opacity-60",
        selected
          ? "border-qh-sage bg-qh-sage/10"
          : "border-qh-line hover:border-qh-ink-soft"
      )}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-0.5 block text-sm text-qh-ink-soft">{detail}</span>
    </button>
  );
}
