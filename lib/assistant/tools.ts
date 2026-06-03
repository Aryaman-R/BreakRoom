/**
 * Tool definitions for Beans, in the shape the Anthropic Claude API expects.
 *
 * When wiring to the live API, pass these directly:
 *   client.messages.create({ tools: BEANS_TOOLS, ... })
 */

export const BEANS_TOOLS = [
  {
    name: "get_menu",
    description:
      "Returns the current menu, optionally filtered by category or dietary tag.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "One of: coffee, tea, pastries, lunch, specials.",
        },
        dietary: {
          type: "string",
          enum: ["VG", "V", "GF", "DF", "N"],
          description:
            "Filter by dietary tag: VG (vegan), V (vegetarian), GF (gluten-free), DF (dairy-free), N (contains nuts).",
        },
      },
    },
  },
  {
    name: "get_specials",
    description: "Returns today's three specials.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_hours",
    description:
      "Returns the cafe's opening hours. Optionally for a specific weekday.",
    input_schema: {
      type: "object",
      properties: {
        day: {
          type: "string",
          enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        },
      },
    },
  },
  {
    name: "check_availability",
    description:
      "Given an ISO date, returns the available booking slots that evening.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["date"],
    },
  },
  {
    name: "start_booking",
    description:
      "Pre-fills the booking form with collected info and produces a magic link the user can click. Does NOT submit the booking.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        eventType: { type: "string", enum: ["birthday", "corporate", "shower", "other"] },
        date: { type: "string" },
        timeSlot: { type: "string" },
        guestCount: { type: "number" },
      },
    },
  },
  {
    name: "get_event_info",
    description: "Returns details about a specific upcoming public event by id.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "get_directions",
    description: "Returns the address and a map link.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "escalate_to_human",
    description:
      "Captures the user's question and email and pings staff via email. Use only when the user asks for a human or when the question is outside Beans' competence.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        question: { type: "string" },
      },
      required: ["email", "question"],
    },
  },
] as const;

export type BeansToolName = (typeof BEANS_TOOLS)[number]["name"];
