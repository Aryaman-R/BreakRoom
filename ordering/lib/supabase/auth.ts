import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Cookie-session client for auth checks inside route handlers and server
// components. Staff = any Supabase Auth user (accounts are created by hand in
// the dashboard). Admin = staff whose email is on the ADMIN_EMAILS allow-list.

export function authClient(): SupabaseClient {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies; middleware refreshes them.
          }
        },
      },
    }
  );
}

export async function getSessionUser(): Promise<User | null> {
  // getUser() validates the JWT against Supabase — never trust the raw cookie.
  const { data } = await authClient().auth.getUser();
  return data.user ?? null;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
