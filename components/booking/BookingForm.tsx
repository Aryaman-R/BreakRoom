"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { bookingSchema, type BookingFormValues } from "@/lib/validation";
import { DateSlotPicker } from "./DateSlotPicker";
import { GuestSlider } from "./GuestSlider";
import { EventTypeControl } from "./EventTypeControl";
import { CateringChecklist } from "./CateringChecklist";
import { SuccessCard } from "./SuccessCard";

const DEFAULTS: Partial<BookingFormValues> = {
  eventType: "birthday",
  guestCount: 20,
  catering: ["coffee_bar"],
  date: "",
  timeSlot: "",
  website: "",
};

export function BookingForm() {
  const search = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<BookingFormValues | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onBlur",
    defaultValues: DEFAULTS,
  });

  // Pre-fill from a Beans magic-link: /book?prefill=<urlencoded querystring>
  useEffect(() => {
    const prefill = search?.get("prefill");
    if (!prefill) return;
    try {
      const params = new URLSearchParams(decodeURIComponent(prefill));
      const guestCount = params.get("guestCount");
      form.reset({
        ...DEFAULTS,
        ...Object.fromEntries(params.entries()),
        guestCount: guestCount ? Number(guestCount) : DEFAULTS.guestCount,
      } as BookingFormValues);
    } catch {
      /* ignore malformed prefill */
    }
  }, [search, form]);

  const onSubmit = async (values: BookingFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Confetti shower (lazy-loaded)
      try {
        const { default: confetti } = await import("canvas-confetti");
        const fire = (origin: { x: number; y: number }) =>
          confetti({
            particleCount: 80,
            spread: 70,
            startVelocity: 40,
            ticks: 100,
            origin,
            colors: ["#ff4d9e", "#ff9f45", "#d7f25a", "#6EE7B7", "#A78BFA"],
          });
        fire({ x: 0.2, y: 0.6 });
        fire({ x: 0.5, y: 0.5 });
        fire({ x: 0.8, y: 0.6 });
      } catch { /* ignore */ }
      setSubmitted(values);
    } catch {
      setSubmitError(
        "Something went sideways. Email us at hello@thebreakroom.cafe and we&#8217;ll sort it out."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SuccessCard values={submitted} />;
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="rounded-3xl border border-ah-cream/15 bg-ah-bg-2/40 backdrop-blur-sm p-6 sm:p-10 space-y-8"
    >
      {/* Honeypot — visually hidden, not announced */}
      <div aria-hidden className="absolute -left-[10000px] w-px h-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register("website")}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Field
          label="Your name"
          error={errors.name?.message}
          input={
            <input
              {...form.register("name")}
              autoComplete="name"
              className={inputCls}
              aria-invalid={!!errors.name}
            />
          }
        />
        <Field
          label="Email"
          error={errors.email?.message}
          input={
            <input
              type="email"
              {...form.register("email")}
              autoComplete="email"
              className={inputCls}
              aria-invalid={!!errors.email}
            />
          }
        />
      </div>

      <Field
        label="Phone (optional, but speeds things up)"
        error={errors.phone?.message}
        input={
          <input
            type="tel"
            {...form.register("phone")}
            autoComplete="tel"
            className={inputCls}
          />
        }
      />

      <Controller
        control={form.control}
        name="eventType"
        render={({ field }) => (
          <EventTypeControl
            value={field.value}
            onChange={field.onChange}
            otherValue={form.watch("eventTypeOther") ?? ""}
            onOtherChange={(v) => form.setValue("eventTypeOther", v)}
          />
        )}
      />

      <Controller
        control={form.control}
        name="date"
        render={({ field: dateField }) => (
          <Controller
            control={form.control}
            name="timeSlot"
            render={({ field: slotField }) => (
              <DateSlotPicker
                date={dateField.value}
                slot={slotField.value}
                onDateChange={dateField.onChange}
                onSlotChange={slotField.onChange}
                dateError={errors.date?.message}
                slotError={errors.timeSlot?.message}
              />
            )}
          />
        )}
      />

      <Controller
        control={form.control}
        name="guestCount"
        render={({ field }) => (
          <GuestSlider value={field.value} onChange={field.onChange} />
        )}
      />

      <Controller
        control={form.control}
        name="catering"
        render={({ field }) => (
          <CateringChecklist
            value={field.value}
            onChange={field.onChange}
            error={errors.catering?.message as string | undefined}
          />
        )}
      />

      <Field
        label="Anything else?"
        error={errors.notes?.message}
        input={
          <textarea
            {...form.register("notes")}
            rows={4}
            placeholder="Tell us about your group, what would make it special, or anything we should know."
            className={`${inputCls} resize-none`}
          />
        }
      />

      {submitError && (
        <div
          className="rounded-2xl border border-ah-magenta/40 bg-ah-magenta/10 text-ah-cream p-4"
          dangerouslySetInnerHTML={{ __html: submitError }}
        />
      )}

      <div>
        <SubmitButton submitting={submitting} disabled={!form.formState.isValid && form.formState.submitCount > 0} />
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-ah-cream/20 bg-ah-bg/60 text-ah-cream placeholder-ah-cream/40 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ah-electric focus:border-ah-electric transition-colors";

interface FieldProps {
  label: string;
  input: React.ReactNode;
  error?: string;
}
function Field({ label, input, error }: FieldProps) {
  return (
    <div>
      <label className="block text-sm text-ah-cream/85 mb-2">{label}</label>
      {input}
      {error && (
        <p
          className="mt-1.5 text-xs text-ah-magenta"
          role="alert"
          dangerouslySetInnerHTML={{ __html: error }}
        />
      )}
    </div>
  );
}

function SubmitButton({
  submitting,
  disabled,
}: {
  submitting: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="relative w-full rounded-2xl px-6 py-4 text-base font-medium text-ah-bg overflow-hidden disabled:opacity-60"
      style={{
        backgroundImage:
          "conic-gradient(from 0deg, #ff4d9e, #ff9f45, #d7f25a, #6EE7B7, #A78BFA, #ff4d9e)",
      }}
    >
      <span className="relative z-[1]">
        {submitting ? "Sending good vibes…" : "Send the request"}
      </span>
    </button>
  );
}
