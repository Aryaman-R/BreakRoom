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
