import "server-only";
import type { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSessionUser, isAdminEmail } from "./supabase/auth";
import { apiError } from "./api";

// Route-level authorization. Staff = any signed-in Supabase Auth user.
// Admin = staff whose email is on the ADMIN_EMAILS allow-list.

type GuardResult = { user: User } | { response: NextResponse };

export async function requireStaff(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return { response: apiError(401, "unauthorized", "Sign in required.") };
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
