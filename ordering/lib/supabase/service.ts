import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The service-role client — bypasses RLS. Every write in the system goes
// through routes holding this. The key must never reach the client bundle;
// the `server-only` import makes that a build error rather than a hope.

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase server credentials missing — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see SETUP.md)."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
