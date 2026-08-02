import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fraud caps and ordering hours — read from the settings table at request
// time (never cached, never hardcoded in route logic). The defaults below
// only paper over a missing row so a stray delete can't take checkout down.
//
// One exception, and it matters: `allow_walkin_orders` is a kill switch, and
// a kill switch that defaults to ON fails in the wrong direction. If 0004 has
// not been applied — which is the state of any deployment that followed an
// older SETUP.md — the row is simply absent, and defaulting it to 1 silently
// enabled phoneless ordering on an installation whose owner had never been
// told the feature existed, let alone shown where to turn it off. It defaults
// to 0 now, and `walkinConfigured` reports whether the setting is actually
// present so the API can say something more useful than a flat refusal.

export const SETTING_KEYS = [
  "call_to_confirm_threshold_cents",
  "hard_cap_cents",
  "max_qty_per_item",
  "max_open_orders_per_phone",
  "max_orders_per_phone_per_day",
  "ordering_open_minutes",
  "ordering_close_minutes",
  "last_order_buffer_minutes",
  // Kiosk walk-ins (no phone number). Phone-keyed caps can't see these
  // orders at all, so they get their own — see 0004_kiosk_walkin.sql.
  "allow_walkin_orders",
  "max_open_walkin_orders",
  "max_walkin_per_hour",
  // SMS budget. The per-phone limit in /api/verify/start is no defence
  // against an attacker who uses a different number every request, which is
  // exactly what SMS pumping does — see 0005_hardening.sql.
  "max_sms_per_hour_global",
  "max_sms_per_hour_per_ip",
  "max_code_attempts",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type SettingsMap = Record<SettingKey, number>;

export const DEFAULT_SETTINGS: SettingsMap = {
  call_to_confirm_threshold_cents: 5000,
  hard_cap_cents: 15000,
  max_qty_per_item: 5,
  max_open_orders_per_phone: 1,
  max_orders_per_phone_per_day: 3,
  ordering_open_minutes: 570,
  ordering_close_minutes: 930,
  last_order_buffer_minutes: 20,
  // Fails closed. See the note above.
  allow_walkin_orders: 0,
  max_open_walkin_orders: 5,
  max_walkin_per_hour: 20,
  max_sms_per_hour_global: 60,
  max_sms_per_hour_per_ip: 6,
  max_code_attempts: 5,
};

/** Settings, plus which keys the database actually supplied. */
export interface LoadedSettings {
  settings: SettingsMap;
  /** Keys found in the settings table, as opposed to filled in from defaults. */
  present: Set<SettingKey>;
}

export async function loadSettingsDetailed(
  db: SupabaseClient
): Promise<LoadedSettings> {
  const { data, error } = await db.from("settings").select("key, value");
  if (error) throw new Error(`settings load failed: ${error.message}`);
  const settings = { ...DEFAULT_SETTINGS };
  const present = new Set<SettingKey>();
  for (const row of data ?? []) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
      settings[row.key as SettingKey] = row.value;
      present.add(row.key as SettingKey);
    }
  }
  return { settings, present };
}

export async function loadSettings(db: SupabaseClient): Promise<SettingsMap> {
  return (await loadSettingsDetailed(db)).settings;
}
