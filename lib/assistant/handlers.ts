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
      return {
        mon: "9:30 AM – 3:30 PM",
        tue: "9:30 AM – 3:30 PM",
        wed: "9:30 AM – 3:30 PM",
        thu: "9:30 AM – 3:30 PM",
        fri: "9:30 AM – 3:30 PM",
        sat: "9:30 AM – 3:30 PM",
        sun: "9:30 AM – 3:30 PM",
      };
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
      return {
        address: "18916 N Creek Pkwy #101, Bothell, WA 98011",
        mapUrl:
          "https://www.openstreetmap.org/?mlat=47.7763&mlon=-122.2017&zoom=17",
      };
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
  if (text.includes("special")) {
    const result = (await runToolCall("get_specials", {})) as Array<{
      name: string;
      price: number;
    }>;
    return {
      reply: "Here&#8217;s what we&#8217;re running today:",
      toolCalls: [{ name: "get_specials", input: {}, result }],
    };
  }

  if (text.includes("order")) {
  return {
    reply:
      "There's two ways you can order. Either give us a call at 425-419-4231 or order online through DoorDash by clicking the pink ORDER button on our website. If you don't want the delivery charges on Doordash, click the 'PICKUP' option. ",
    toolCalls: [],
  };
}

 if (text.includes("menu") || text.includes("coffee") || text.includes("food")) {
  const category =
    text.includes("coffee")
      ? "coffee"
      : text.includes("food") || text.includes("lunch")
      ? "lunch"
      : undefined;

  const result = await runToolCall("get_menu", { category });

  return {
    reply: "Here's our menu!",
    toolCalls: [{ name: "get_menu", input: { category }, result }],
  };
}
  if (text.includes("hour") || text.includes("open")) {
    const result = await runToolCall("get_hours", {});
    return {
      reply: "We&#8217;re open every day, 9:30 AM &#8211; 3:30 PM.",
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
        "Happy to help. What date are you thinking, roughly how many people, and what kind of event? I&#8217;ll check what&#8217;s open.",
      toolCalls: [],
    };
  }

  if (text.includes("where") || text.includes("address") || text.includes("direction")) {
    const result = await runToolCall("get_directions", {});
    return {
      reply: "We&#8217;re at 18916 N Creek Pkwy #101 in Bothell. Map link below.",
      toolCalls: [{ name: "get_directions", input: {}, result }],
    };
  }

  return {
    reply:
      "I can help with the menu, hours, directions, and party bookings. What are you after?",
    toolCalls: [],
  };
}
