"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { MenuItemForm, type MenuItemDraft } from "./MenuItemForm";
import { formatCents } from "@/lib/money";
import type { MenuItem, Variant } from "@/lib/types";

export function MenuAdmin() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MenuItem | null | "new">(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error();
      setItems(await res.json());
      setError(null);
      setLoaded(true);
    } catch {
      setError("Couldn't load the menu — refresh to retry.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAvailable = async (item: MenuItem) => {
    // optimistic — the sold-out toggle has to feel instant
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i))
    );
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    if (!res.ok) {
      setError("Availability didn't save — try again.");
      load();
    }
  };

  const save = async (draft: MenuItemDraft) => {
    setSaving(true);
    setFormError(null);
    const isNew = editing === "new";
    const res = await fetch(
      isNew ? "/api/admin/menu" : `/api/admin/menu/${(editing as MenuItem).id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      }
    ).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setFormError(body?.error ?? "Couldn't save — check the fields and try again.");
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}"? If it was ever ordered, archive it instead.`))
      return;
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't delete.");
    }
    load();
  };

  const categories = [...new Set(items.map((i) => i.category))];

  if (!loaded && !error) {
    return <p className="py-12 text-center text-qh-ink-soft">Loading menu…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-qh-ink-soft">
          {items.length} items · tap the dot to toggle sold-out
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
          + New item
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-lg">{category}</h2>
            <ul className="mt-2 divide-y divide-qh-line rounded-xl border border-qh-line bg-qh-bg-elevated">
              {items
                .filter((i) => i.category === category)
                .map((item) => {
                  const variants = (item.variants ?? []) as Variant[];
                  const addons = (item.addons ?? []) as Variant[];
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button
                        onClick={() => toggleAvailable(item)}
                        aria-label={item.available ? "Mark sold out" : "Mark available"}
                        title={item.available ? "Available — tap to mark sold out" : "Sold out — tap to make available"}
                        className={clsx(
                          "h-4 w-4 shrink-0 rounded-full border transition",
                          item.available
                            ? "border-qh-sage bg-qh-sage"
                            : "border-qh-line bg-transparent"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={clsx("truncate", !item.available && "text-qh-ink-soft line-through")}>
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-qh-ink-soft">
                          {variants.length > 0
                            ? `${variants.length} variants`
                            : formatCents(item.price_cents)}
                          {addons.length > 0 ? ` · ${addons.length} add-ons` : ""}
                          {item.notes_prompt ? " · notes prompt" : ""}
                        </p>
                      </div>
                      <button className="btn btn-quiet btn-sm" onClick={() => setEditing(item)}>
                        Edit
                      </button>
                      <button
                        className="text-sm text-qh-ink-soft underline underline-offset-2 hover:text-[#a4283d]"
                        onClick={() => remove(item)}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>

      {editing !== null ? (
        <MenuItemForm
          item={editing === "new" ? null : editing}
          categories={categories}
          onSave={save}
          onClose={() => {
            setEditing(null);
            setFormError(null);
          }}
          saving={saving}
          error={formError}
        />
      ) : null}
    </div>
  );
}
