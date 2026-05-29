"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { useCart, formatCents } from "@/lib/cart";
import { getStripePromise } from "./stripeClient";

const stripePromise = getStripePromise();

const appearance: Appearance = {
  theme: "stripe",
  variables: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    colorPrimary: "#8B5E3C",
    colorBackground: "#FBF7F0",
    colorText: "#2A2520",
    colorTextSecondary: "#6B6258",
    colorDanger: "#b3261e",
    borderRadius: "12px",
    spacingUnit: "3px",
  },
};

const detailsSchema = z.object({
  name: z.string().min(2, "Please add a name for the order."),
  email: z.string().email("Enter a valid email for your receipt."),
  pickupTime: z.string().min(1, "Choose a pickup time."),
});
type Details = z.infer<typeof detailsSchema>;

type Phase = "details" | "payment" | "success";

export function OrderCheckout() {
  const { lines, subtotalCents, count, setQuantity, clear } = useCart();
  const [phase, setPhase] = useState<Phase>("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const goSuccess = useCallback(
    (id: string) => {
      setOrderId(id);
      setPhase("success");
      clear();
    },
    [clear]
  );

  // Handle returns from redirect-based payment methods.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    const redirectStatus = params.get("redirect_status");
    if (order && (redirectStatus === "succeeded" || redirectStatus === "pending")) {
      goSuccess(order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createIntent = useCallback(
    async (details: Details) => {
      setCreating(true);
      setCreateError(null);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
            name: details.name,
            email: details.email,
            pickupTime: details.pickupTime,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCreateError(
            data.error ?? "We couldn't start checkout. Please try again."
          );
          return;
        }
        setClientSecret(data.clientSecret);
        setOrderId(data.orderId);
        setPhase("payment");
      } catch {
        setCreateError("Network hiccup — please try again.");
      } finally {
        setCreating(false);
      }
    },
    [lines]
  );

  // Ordering not configured — degrade gracefully.
  if (!stripePromise) {
    return (
      <Notice title="Online ordering is taking a quick break.">
        We can&#8217;t take card payments right now. Come say hi at the counter,
        or call us at{" "}
        <a href="tel:+17185550199" className="underline hover:text-qh-ink">
          (718) 555&#8209;0199
        </a>
        .
      </Notice>
    );
  }

  if (phase === "success") {
    return <SuccessStep orderId={orderId} />;
  }

  if (lines.length === 0) {
    return (
      <Notice title="Your order is empty.">
        Add a coffee or a pastry from the menu and it&#8217;ll show up here.
        <div className="mt-5">
          <Link
            href="/menu"
            className="inline-flex rounded-full border border-qh-ink px-4 py-2 text-sm text-qh-ink hover:bg-qh-ink hover:text-qh-bg transition-colors"
          >
            Browse the menu
          </Link>
        </div>
      </Notice>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
      <div>
        {phase === "details" ? (
          <DetailsStep
            creating={creating}
            createError={createError}
            onSubmit={createIntent}
          />
        ) : (
          clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <PaymentStep
                total={subtotalCents}
                orderId={orderId}
                onPaid={() => orderId && goSuccess(orderId)}
                onBack={() => setPhase("details")}
              />
            </Elements>
          )
        )}
      </div>

      <OrderSummary
        lines={lines}
        subtotalCents={subtotalCents}
        count={count}
        editable={phase === "details"}
        onQuantity={setQuantity}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — pickup details                                            */
/* ------------------------------------------------------------------ */

function DetailsStep({
  creating,
  createError,
  onSubmit,
}: {
  creating: boolean;
  createError: string | null;
  onSubmit: (d: Details) => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", pickupTime: "" },
  });

  // Generate pickup slots after mount (avoids SSR/client time mismatch).
  useEffect(() => {
    const start = new Date(Date.now() + 20 * 60_000);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    const out: string[] = [];
    for (let i = 0; i < 12; i++) {
      const t = new Date(start.getTime() + i * 15 * 60_000);
      out.push(
        "Today, " +
          t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    }
    setSlots(out);
    setValue("pickupTime", out[0], { shouldValidate: true });
  }, [setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" error={errors.name?.message}>
          <input
            {...register("name")}
            autoComplete="name"
            className={inputCls}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Email (for your receipt)" error={errors.email?.message}>
          <input
            type="email"
            {...register("email")}
            autoComplete="email"
            className={inputCls}
            aria-invalid={!!errors.email}
          />
        </Field>
      </div>

      <Field label="Pickup time" error={errors.pickupTime?.message}>
        <select {...register("pickupTime")} className={inputCls}>
          {slots.length === 0 && <option value="">Loading times…</option>}
          {slots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      {createError && (
        <p className="rounded-xl border border-qh-accent/40 bg-qh-accent/10 text-qh-ink px-4 py-3 text-sm">
          {createError}
        </p>
      )}

      <button
        type="submit"
        disabled={creating}
        className="w-full sm:w-auto rounded-full bg-qh-ink text-qh-bg px-6 py-3 text-sm font-medium hover:bg-qh-accent transition-colors disabled:opacity-60"
      >
        {creating ? "Starting checkout…" : "Continue to payment"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — payment (embedded Payment Element)                        */
/* ------------------------------------------------------------------ */

function PaymentStep({
  total,
  orderId,
  onPaid,
  onBack,
}: {
  total: number;
  orderId: string | null;
  onPaid: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order?order=${orderId ?? ""}`,
      },
      redirect: "if_required",
    });

    if (payError) {
      setError(payError.message ?? "Your payment couldn't be completed.");
      setSubmitting(false);
      return;
    }
    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing")
    ) {
      onPaid();
      return;
    }
    // Unexpected state — let them try again.
    setSubmitting(false);
  };

  return (
    <form onSubmit={pay} className="space-y-6">
      <PaymentElement />
      {error && (
        <p className="rounded-xl border border-qh-accent/40 bg-qh-accent/10 text-qh-ink px-4 py-3 text-sm">
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="rounded-full bg-qh-ink text-qh-bg px-6 py-3 text-sm font-medium hover:bg-qh-accent transition-colors disabled:opacity-60"
        >
          {submitting ? "Processing…" : `Pay ${formatCents(total)}`}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-sm text-qh-ink-soft underline hover:text-qh-ink disabled:opacity-60"
        >
          Back
        </button>
      </div>
      <p className="text-xs text-qh-ink-soft">
        Payments are processed securely by Stripe. We never see your card
        details.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — success (confirmed by the webhook)                        */
/* ------------------------------------------------------------------ */

function SuccessStep({ orderId }: { orderId: string | null }) {
  const [info, setInfo] = useState<{
    status: string;
    amountTotal: number;
    currency: string;
    pickupTime: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    let tries = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setInfo(data);
          if (data.status === "paid") return; // confirmed by webhook
        }
      } catch {
        /* keep trying */
      }
      if (active && tries++ < 8) setTimeout(poll, 1500);
    };
    poll();
    return () => {
      active = false;
    };
  }, [orderId]);

  const confirmed = info?.status === "paid";

  return (
    <div className="rounded-3xl border border-qh-line bg-qh-bg-elevated p-8 sm:p-10 text-center max-w-xl mx-auto">
      <div className="mx-auto h-14 w-14 rounded-full bg-qh-sage/20 text-qh-sage inline-flex items-center justify-center text-2xl">
        ✓
      </div>
      <h2 className="mt-5 font-display text-3xl">Payment received</h2>
      <p className="mt-3 text-qh-ink-soft">
        Thanks for ordering ahead. We&#8217;ve sent a receipt to your email and
        we&#8217;re getting started.
      </p>

      <dl className="mt-6 text-sm grid grid-cols-2 gap-y-2 max-w-xs mx-auto text-left">
        {info?.pickupTime && (
          <>
            <dt className="text-qh-ink-soft">Pickup</dt>
            <dd className="font-mono text-qh-ink text-right">{info.pickupTime}</dd>
          </>
        )}
        {info && (
          <>
            <dt className="text-qh-ink-soft">Total</dt>
            <dd className="font-mono text-qh-ink text-right">
              {formatCents(info.amountTotal, info.currency)}
            </dd>
          </>
        )}
        <dt className="text-qh-ink-soft">Status</dt>
        <dd className="font-mono text-right">
          {confirmed ? (
            <span className="text-qh-sage">confirmed</span>
          ) : (
            <span className="text-qh-ink-soft">confirming…</span>
          )}
        </dd>
      </dl>

      <div className="mt-8">
        <Link
          href="/menu"
          className="inline-flex rounded-full border border-qh-ink px-5 py-2.5 text-sm text-qh-ink hover:bg-qh-ink hover:text-qh-bg transition-colors"
        >
          Order something else
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function OrderSummary({
  lines,
  subtotalCents,
  count,
  editable,
  onQuantity,
}: {
  lines: { id: string; name: string; price: number; quantity: number }[];
  subtotalCents: number;
  count: number;
  editable: boolean;
  onQuantity: (id: string, q: number) => void;
}) {
  return (
    <aside className="rounded-3xl border border-qh-line bg-qh-bg-elevated p-6">
      <h2 className="font-display text-xl">Order summary</h2>
      <ul className="mt-4 space-y-3">
        {lines.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p
                className="text-qh-ink leading-tight"
                dangerouslySetInnerHTML={{ __html: l.name }}
              />
              {editable ? (
                <div className="mt-1 inline-flex items-center rounded-full border border-qh-line">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => onQuantity(l.id, l.quantity - 1)}
                    className="h-7 w-7 inline-flex items-center justify-center text-qh-ink-soft hover:text-qh-ink"
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center font-mono text-qh-ink">
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => onQuantity(l.id, l.quantity + 1)}
                    className="h-7 w-7 inline-flex items-center justify-center text-qh-ink-soft hover:text-qh-ink"
                  >
                    ＋
                  </button>
                </div>
              ) : (
                <p className="text-xs text-qh-ink-soft font-mono mt-0.5">
                  ×{l.quantity}
                </p>
              )}
            </div>
            <span className="font-mono text-qh-ink whitespace-nowrap">
              {formatCents(Math.round(l.price * 100) * l.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 pt-4 border-t border-qh-line flex justify-between text-sm">
        <span className="text-qh-ink-soft">
          Subtotal · {count} item{count === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-qh-ink">{formatCents(subtotalCents)}</span>
      </div>
    </aside>
  );
}

const inputCls =
  "w-full rounded-xl border border-qh-line bg-qh-bg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-qh-accent focus:border-qh-accent transition-colors";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-qh-ink-soft mb-2">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-qh-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-qh-line bg-qh-bg-elevated p-8 sm:p-10 max-w-xl">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 text-qh-ink-soft">{children}</p>
    </div>
  );
}
