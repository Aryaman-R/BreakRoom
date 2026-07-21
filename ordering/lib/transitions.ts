import type { OrderStatus } from "./types";

// The closed transition graph from docs/ORDERING-ARCHITECTURE.md.
// Anything not listed here is rejected with 400 by the PATCH route.
const LEGAL: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  call_to_confirm: ["accepted", "cancelled"],
  accepted: ["ready", "cancelled"],
  ready: ["picked_up", "no_show"],
  picked_up: [],
  no_show: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return LEGAL[from]?.includes(to) ?? false;
}

export function legalTargets(from: OrderStatus): readonly OrderStatus[] {
  return LEGAL[from] ?? [];
}
