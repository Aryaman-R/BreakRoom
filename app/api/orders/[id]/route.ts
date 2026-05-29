import { NextResponse } from "next/server";
import { defaultRepo } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Lightweight status lookup so the success screen can reflect the
 * webhook-confirmed state ("paid") rather than only the client's optimistic
 * result. Returns a deliberately small, non-sensitive shape.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const order = await defaultRepo.getOrder(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({
    id: order.id,
    status: order.status,
    amountTotal: order.amountTotal,
    currency: order.currency,
    pickupTime: order.pickupTime,
  });
}
