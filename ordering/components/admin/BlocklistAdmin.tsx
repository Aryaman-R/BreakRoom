"use client";

import { useCallback, useEffect, useState } from "react";

type BlockedPhone = { phone: string; reason: string; created_at: string };

export function BlocklistAdmin() {
  const [rows, setRows] = useState<BlockedPhone[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blocked");
      if (!res.ok) throw new Error();
      setRows(await res.json());
      setError(null);
      setLoaded(true);
    } catch {
      setError("Couldn't load the blocklist — refresh to retry.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const block = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/blocked", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, reason }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "Couldn't block that number.");
      return;
    }
    setPhone("");
    setReason("");
    load();
  };

  const unblock = async (p: string) => {
    if (!window.confirm(`Unblock ${p}?`)) return;
    const res = await fetch(`/api/admin/blocked?phone=${encodeURIComponent(p)}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!res?.ok) setError("Couldn't unblock — try again.");
    load();
  };

  return (
    <div className="max-w-xl">
      <p className="text-sm text-qh-ink-soft">
        Blocked numbers can&#8217;t receive a verification code or place an
        order. Two no-shows adds a number here automatically.
      </p>

      <form onSubmit={block} className="card mt-4 flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-40 flex-1 text-sm">
          Phone
          <input
            className="field mt-1"
            type="tel"
            required
            placeholder="(425) 555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="min-w-40 flex-1 text-sm">
          Reason <span className="font-normal text-qh-ink-soft">(optional)</span>
          <input
            className="field mt-1"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button className="btn btn-primary btn-sm" disabled={busy}>
          Block
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
          {error}
        </p>
      ) : null}

      {!loaded ? (
        <p className="py-8 text-center text-qh-ink-soft">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-qh-ink-soft">
          Nobody&#8217;s blocked. 🎉
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-qh-line rounded-xl border border-qh-line bg-qh-bg-elevated">
          {rows.map((row) => (
            <li key={row.phone} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono">{row.phone}</p>
                <p className="truncate text-xs text-qh-ink-soft">
                  {row.reason || "no reason given"} ·{" "}
                  {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>
              <button className="btn btn-quiet btn-sm" onClick={() => unblock(row.phone)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
