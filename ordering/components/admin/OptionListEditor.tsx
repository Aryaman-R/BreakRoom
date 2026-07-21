"use client";

import type { Variant } from "@/lib/types";

// Shared editor for variants and add-ons: rows of label + dollar price.
// Prices are edited in dollars and stored as integer cents.

export type OptionRow = { label: string; dollars: string };

export function toRows(options: Variant[] | null): OptionRow[] {
  return (options ?? []).map((o) => ({
    label: o.label,
    dollars: (o.price_cents / 100).toFixed(2),
  }));
}

export function fromRows(rows: OptionRow[]): Variant[] | null {
  const cleaned = rows
    .filter((r) => r.label.trim().length > 0)
    .map((r) => ({
      label: r.label.trim(),
      price_cents: Math.max(0, Math.round(parseFloat(r.dollars || "0") * 100) || 0),
    }));
  return cleaned.length > 0 ? cleaned : null;
}

export function OptionListEditor({
  legend,
  hint,
  rows,
  onChange,
}: {
  legend: string;
  hint: string;
  rows: OptionRow[];
  onChange: (rows: OptionRow[]) => void;
}) {
  const update = (i: number, patch: Partial<OptionRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <fieldset className="rounded-xl border border-qh-line p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <p className="text-xs text-qh-ink-soft">{hint}</p>
      <div className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              aria-label={`${legend} label`}
              className="field flex-1"
              placeholder="Label (e.g. 8 pc)"
              maxLength={80}
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <div className="relative w-28">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-qh-ink-soft">
                $
              </span>
              <input
                aria-label={`${legend} price`}
                className="field pl-7 text-right font-mono"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={row.dollars}
                onChange={(e) => update(i, { dollars: e.target.value })}
              />
            </div>
            <button
              type="button"
              aria-label="Remove row"
              className="btn btn-quiet h-9 w-9 !rounded-full !p-0"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-quiet btn-sm mt-3"
        onClick={() => onChange([...rows, { label: "", dollars: "0.00" }])}
      >
        + Add row
      </button>
    </fieldset>
  );
}
