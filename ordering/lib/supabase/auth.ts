import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
        setAll: (
          list: { name: string; value: string; options: CookieOptions }[]
        ) => {
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

function allowList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return allowList(process.env.ADMIN_EMAILS).includes(email.toLowerCase());
}

/**
 * Whether this account may see the staff screen.
 *
 * "Staff = any signed-in Supabase Auth user" was only ever safe on the
 * assumption that accounts are created by hand in the dashboard — and nothing
 * in the app enforced that assumption. Supabase projects have email sign-ups
 * enabled by default, so on a project where nobody had explicitly turned them
 * off, anyone could self-register and reach /staff: every open order, every
 * customer name, and every customer phone number, plus the buttons that
 * advance order status.
 *
 * STAFF_EMAILS is the allow-list. Admins are implicitly staff, so a
 * single-operator cafe can set ADMIN_EMAILS alone and be done.
 *
 * If neither variable is set the app cannot tell staff from strangers, so it
 * refuses everyone rather than admitting everyone. SETUP.md covers both this
 * and turning off public sign-ups in the Supabase dashboard, which is the
 * other half of the fix.
 */
export function isStaffEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const staff = allowList(process.env.STAFF_EMAILS);
  const admins = allowList(process.env.ADMIN_EMAILS);
  if (staff.length === 0 && admins.length === 0) {
    console.error(
      "[auth] neither STAFF_EMAILS nor ADMIN_EMAILS is set — refusing all staff access. " +
        "Set them in the deployment environment; see SETUP.md."
    );
    return false;
  }
  const lower = email.toLowerCase();
  return staff.includes(lower) || admins.includes(lower);
}
