"use client";

import { useState } from "react";
import clsx from "clsx";
import { BlocklistAdmin } from "./BlocklistAdmin";
import { MenuAdmin } from "./MenuAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { browserClient } from "@/lib/supabase/browser";

const TABS = ["Menu", "Hours & caps", "Blocklist"] as const;
type Tab = (typeof TABS)[number];

export function AdminScreen({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("Menu");

  const signOut = async () => {
    await browserClient().auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-qh-line bg-qh-bg-elevated/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <div>
            <h1 className="text-xl leading-none">Admin</h1>
            <p className="text-xs text-qh-ink-soft">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/staff" className="btn btn-quiet btn-sm">
              Orders
            </a>
            <button className="btn btn-quiet btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="container-page flex gap-1 pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm",
                tab === t
                  ? "bg-qh-ink text-qh-bg"
                  : "text-qh-ink-soft hover:bg-qh-line/50"
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-page py-6">
        {tab === "Menu" ? <MenuAdmin /> : null}
        {tab === "Hours & caps" ? <SettingsAdmin /> : null}
        {tab === "Blocklist" ? <BlocklistAdmin /> : null}
      </main>
    </div>
  );
}
