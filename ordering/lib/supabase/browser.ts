"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Anon-key browser client with cookie-based sessions, so the server (routes,
// middleware) can see the staff login. Reads are RLS-scoped; this client can
// never write — no client role has a write policy.

let client: SupabaseClient | undefined;

export function browserClient(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
