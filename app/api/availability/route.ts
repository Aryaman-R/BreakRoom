import { NextResponse } from "next/server";
import { defaultRepo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Provide ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const slots = await defaultRepo.getAvailability(date);
  return NextResponse.json({ date, slots });
}
