/**
 * Tool execution + a mock conversation runner.
 *
 * `runToolCall` is what the live Anthropic loop will call when the model
 * emits a `tool_use` block. It returns structured JSON, ready to be passed
 * back into the next `messages.create` call as a `tool_result`.
 *
 * `runAssistantTurn` is the dev-mode mock: it pattern-matches the user's last
 * message against a handful of intents and returns a response in the same
 * shape the live endpoint will produce. This lets the UI ship before the API
 * key does.
 */

import { defaultRepo } from "@/lib/db";
import {
  BUSINESS,
  DOORDASH_URL,
  FULL_ADDRESS,
  HOURS,
  MAP_URL,
  ORDER_AHEAD_URL,
  formatDayHours,
  hoursSummary,
} from "@/lib/business";
import type { BeansToolName } from "./tools";

export interface AssistantToolCall {
  name: BeansToolName;
  input: Record<string, unknown>;
  result: unknown;
}

export interface AssistantTurnResult {
  reply: string;
  toolCalls: AssistantToolCall[];
}

export async function runToolCall(
  name: BeansToolName,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_menu": {
      const menu = await defaultRepo.getMenu();
      const cat = (input.category as string | undefined)?.toLowerCase();
      const dietary = input.dietary as string | undefined;
      let cats = menu;
      if (cat) cats = cats.filter((c) => c.id === cat);
      if (dietary) {
        cats = cats.map((c) => ({
          ...c,
          items: c.items.filter((i) => i.tags.includes(dietary as never)),
        }));
      }
      return cats;
    }
    case "get_specials":
      return defaultRepo.getSpecials();
    case "get_hours":
      // Read from lib/business so Beans cannot contradict the footer and the
      // /visit table — it used to answer "open Saturday and Sunday" while both
      // of those said the weekend was closed.
      return Object.fromEntries(
        HOURS.map((d) => [d.label.slice(0, 3).toLowerCase(), formatDayHours(d)])
      );
    case "check_availability": {
      const date = String(input.date);
      const slots = await defaultRepo.getAvailability(date);
      return { date, slots };
    }
    case "start_booking": {
      const params = new URLSearchParams();
      Object.entries(input).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
      return { url: `/book?prefill=${encodeURIComponent(params.toString())}` };
    }
    case "get_event_info": {
      const id = String(input.id);
      return defaultRepo.getEvent(id);
    }
    case "get_directions":
      return { address: FULL_ADDRESS, mapUrl: MAP_URL };
    case "escalate_to_human": {
      // TODO(backend): forward to staff Slack/email.
      return { ok: true };
    }
  }
}

/**
 * Mock conversation runner for dev. Replace with the real Anthropic loop
 * once ANTHROPIC_API_KEY is configured.
 */
export async function runAssistantTurn(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<AssistantTurnResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content ?? "").toLowerCase();

  // Naive intent detection — only here so the UI is exercised end-to-end.
  //
  // Replies are plain text with real Unicode punctuation. They used to carry
  // HTML entities (&#8217;), which is why the panel rendered them through
  // dangerouslySetInnerHTML; that has been removed, so anything returned here
  // is displayed literally.
  if (text.includes("special")) {
    const result = (await runToolCall("get_specials", {})) as Array<{
      name: string;
      price: number;
    }>;
    return {
      reply: "Here’s what we’re running today:",
      toolCalls: [{ name: "get_specials", input: {}, result }],
    };
  }

  if (text.includes("order")) {
    return {
      reply:
        `Two easy ways to order ahead. Our own pickup app is the cheapest — no ` +
        `delivery fees and no commission: ${ORDER_AHEAD_URL}. You can also use ` +
        `DoorDash (${DOORDASH_URL.split("?")[0]}) — that link opens on Pickup so ` +
        `you are not charged for delivery. Or just call us at ${BUSINESS.phone.display}.`,
      toolCalls: [],
    };
  }

  if (text.includes("menu") || text.includes("coffee") || text.includes("food")) {
    // "lunch" was not a category id, so asking about food returned an empty
    // card. The real ids are in content/menu.json; food maps to the savoury
    // categories, and with no id at all we show the whole menu.
    const category = text.includes("coffee")
      ? "coffee"
      : text.includes("boba") || text.includes("tea")
      ? "bubble-tea"
      : undefined;

    const result = await runToolCall("get_menu", { category });

    return {
      reply: category ? "Here’s that part of the menu:" : "Here’s our menu:",
      toolCalls: [{ name: "get_menu", input: { category }, result }],
    };
  }

  if (text.includes("hour") || text.includes("open")) {
    const result = await runToolCall("get_hours", {});
    return {
      reply: `We’re open ${hoursSummary()}. Closed Saturday and Sunday.`,
      toolCalls: [{ name: "get_hours", input: {}, result }],
    };
  }

  if (
    text.includes("book") ||
    text.includes("party") ||
    text.includes("event")
  ) {
    return {
      reply:
        "Happy to help. What date are you thinking, roughly how many people, and what kind of event? I’ll check what’s open.",
      toolCalls: [],
    };
  }

  if (text.includes("where") || text.includes("address") || text.includes("direction")) {
    const result = await runToolCall("get_directions", {});
    return {
      reply: `We’re at ${FULL_ADDRESS}. Map link below.`,
      toolCalls: [{ name: "get_directions", input: {}, result }],
    };
  }

  return {
    reply:
      "I can help with the menu, hours, directions, and party bookings. What are you after?",
    toolCalls: [],
  };
}
