"use client";

import { useState } from "react";

export function ContactForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-qh-line bg-qh-bg-elevated p-6 text-qh-ink-soft">
        Thanks — we&#8217;ll write you back within a day.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO(backend): POST to /api/contact
        setDone(true);
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <div>
        <label className="block text-sm text-qh-ink-soft mb-1.5" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-qh-line bg-qh-bg-elevated p-3 focus:outline-none focus:ring-2 focus:ring-qh-accent"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-qh-ink text-qh-bg px-6 py-3 text-sm hover:bg-qh-accent transition-colors"
      >
        Send
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}
function Field({ label, name, type = "text", required }: FieldProps) {
  return (
    <div>
      <label className="block text-sm text-qh-ink-soft mb-1.5" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-qh-line bg-qh-bg-elevated px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-qh-accent"
      />
    </div>
  );
}
