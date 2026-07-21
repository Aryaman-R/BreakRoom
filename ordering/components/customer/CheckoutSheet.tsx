"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "./Sheet";
import { cartSubtotal, clearCart, type CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import type { OrderSource } from "@/lib/types";

const RESEND_COOLDOWN_S = 30;

type Phase = "details" | "code" | "placing";

export function CheckoutSheet({
  lines,
  source,
  onClose,
}: {
  lines: CartLine[];
  source: OrderSource;
  onClose: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timer.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    clearInterval(timer.current);
    timer.current = setInterval(
      () => setCooldown((c) => (c <= 1 ? (clearInterval(timer.current), 0) : c - 1)),
      1000
    );
  };

  const sendCode = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Please tell us your name — it's how we call your order.");
      return;
    }
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
    setPhase("placing");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone,
          code,
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
        setPhase("code");
        setCode("");
        return;
      }
      clearCart();
      router.push(`/order/${body.order_id}`);
    } catch {
      setError("Network hiccup — please try again.");
      setPhase("code");
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
            Name for the order
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
      </div>

      {phase === "details" ? (
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
