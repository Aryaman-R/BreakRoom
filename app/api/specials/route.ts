import { NextResponse } from "next/server";
import { defaultRepo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const specials = await defaultRepo.getSpecials();
  return NextResponse.json({ specials });
}
