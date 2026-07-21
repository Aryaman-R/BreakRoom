"use client";

import { useEffect, useState } from "react";
import type { SettingsMap } from "@/lib/settings";

// Hours are edited as clock times, money caps as dollars; everything is
// stored as integers (minutes-from-midnight / cents) via the settings API.

function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function SettingsAdmin() {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // string-typed working copy so partially-typed values don't fight the user
  const [open, setOpen] = useState("");
  const [close, setClose] = useState("");
  const [buffer, setBuffer] = useState("");
  const [confirmAt, setConfirmAt] = useState("");
  const [hardCap, setHardCap] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [maxOpen, setMaxOpen] = useState("");
  const [maxDaily, setMaxDaily] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error();
        const s: SettingsMap = await res.json();
        setSettings(s);
        setOpen(minutesToTime(s.ordering_open_minutes));
        setClose(minutesToTime(s.ordering_close_minutes));
        setBuffer(String(s.last_order_buffer_minutes));
        setConfirmAt((s.call_to_confirm_threshold_cents / 100).toFixed(2));
        setHardCap((s.hard_cap_cents / 100).toFixed(2));
        setMaxQty(String(s.max_qty_per_item));
        setMaxOpen(String(s.max_open_orders_per_phone));
        setMaxDaily(String(s.max_orders_per_phone_per_day));
      } catch {
        setError("Couldn't load settings — refresh to retry.");
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const body: Partial<SettingsMap> = {
      ordering_open_minutes: timeToMinutes(open),
      ordering_close_minutes: timeToMinutes(close),
      last_order_buffer_minutes: Math.max(0, parseInt(buffer, 10) || 0),
      call_to_confirm_threshold_cents: Math.round(parseFloat(confirmAt || "0") * 100),
      hard_cap_cents: Math.round(parseFloat(hardCap || "0") * 100),
      max_qty_per_item: Math.max(1, parseInt(maxQty, 10) || 1),
      max_open_orders_per_phone: Math.max(1, parseInt(maxOpen, 10) || 1),
      max_orders_per_phone_per_day: Math.max(1, parseInt(maxDaily, 10) || 1),
    };
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const payload = await res?.json().catch(() => null);
      setError(payload?.error ?? "Couldn't save settings.");
      return;
    }
    setSettings(await res.json());
    setSaved(true);
  };

  if (!settings && !error) {
    return <p className="py-12 text-center text-qh-ink-soft">Loading settings…</p>;
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="card p-5">
        <h2 className="text-lg">Ordering hours</h2>
        <p className="mt-1 text-sm text-qh-ink-soft">
          Pacific time. Online ordering stops {buffer || "0"} minutes before
          closing so the kitchen isn&#8217;t handed a ticket at close.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <label className="text-sm">
            Opens
            <input type="time" className="field mt-1" value={open} onChange={(e) => setOpen(e.target.value)} />
          </label>
          <label className="text-sm">
            Closes
            <input type="time" className="field mt-1" value={close} onChange={(e) => setClose(e.target.value)} />
          </label>
          <label className="text-sm">
            Buffer (min)
            <input type="number" min="0" className="field mt-1 text-right font-mono" value={buffer} onChange={(e) => setBuffer(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg">Fraud caps</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Call to confirm above ($)
            <input type="number" min="0" step="0.01" className="field mt-1 text-right font-mono" value={confirmAt} onChange={(e) => setConfirmAt(e.target.value)} />
          </label>
          <label className="text-sm">
            Reject above ($)
            <input type="number" min="0" step="0.01" className="field mt-1 text-right font-mono" value={hardCap} onChange={(e) => setHardCap(e.target.value)} />
          </label>
          <label className="text-sm">
            Max quantity per item
            <input type="number" min="1" className="field mt-1 text-right font-mono" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} />
          </label>
          <label className="text-sm">
            Open orders per phone
            <input type="number" min="1" className="field mt-1 text-right font-mono" value={maxOpen} onChange={(e) => setMaxOpen(e.target.value)} />
          </label>
          <label className="text-sm">
            Orders per phone per day
            <input type="number" min="1" className="field mt-1 text-right font-mono" value={maxDaily} onChange={(e) => setMaxDaily(e.target.value)} />
          </label>
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="rounded-lg bg-qh-sage/10 px-3 py-2 text-sm text-qh-sage">
          Saved — applies to the very next order attempt.
        </p>
      ) : null}

      <button className="btn btn-primary btn-md" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
