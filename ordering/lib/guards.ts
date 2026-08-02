import "server-only";
import type { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSessionUser, isAdminEmail, isStaffEmail } from "./supabase/auth";
import { apiError } from "./api";

// Route-level authorization.
// Staff = a signed-in user whose email is on STAFF_EMAILS or ADMIN_EMAILS.
// Admin = staff whose email is on the ADMIN_EMAILS allow-list.

type GuardResult = { user: User } | { response: NextResponse };

export async function requireStaff(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return { response: apiError(401, "unauthorized", "Sign in required.") };
  }
  // Being signed in is not the same as being staff. Supabase enables email
  // sign-ups by default, so "any authenticated user" meant anyone willing to
  // register — and /staff exposes every customer's name and phone number.
  if (!isStaffEmail(user.email)) {
    return {
      response: apiError(403, "forbidden", "This account isn't set up for staff access."),
    };
  }
  return { user };
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireStaff();
  if ("response" in result) return result;
  if (!isAdminEmail(result.user.email)) {
    return {
      response: apiError(403, "forbidden", "This account is not an admin."),
    };
  }
  return result;
}
