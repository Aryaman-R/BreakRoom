import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fraud caps and ordering hours — read from the settings table at request
// time (never cached, never hardcoded in route logic). The defaults below
// only paper over a missing row so a stray delete can't take checkout down.

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
  allow_walkin_orders: 1,
  max_open_walkin_orders: 5,
  max_walkin_per_hour: 20,
};

export async function loadSettings(db: SupabaseClient): Promise<SettingsMap> {
  const { data, error } = await db.from("settings").select("key, value");
  if (error) throw new Error(`settings load failed: ${error.message}`);
  const map = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
      map[row.key as SettingKey] = row.value;
    }
  }
  return map;
}
