import { NextResponse } from "next/server";
import type { ApiError } from "./types";

// One error shape everywhere: { error, code }. The customer UI maps `code`
// to friendly copy; `error` is a safe human-readable fallback.
export function apiError(
  status: number,
  code: string,
  error: string
): NextResponse<ApiError> {
  return NextResponse.json({ error, code }, { status });
}

// Route handlers wrap themselves in this so an unexpected throw (Supabase
// down, network hiccup) still returns the standard JSON error shape.
export function handleErrors<A extends unknown[]>(
  fn: (...args: A) => Promise<NextResponse>
): (...args: A) => Promise<NextResponse> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[api] unhandled error:", err);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
  };
}
