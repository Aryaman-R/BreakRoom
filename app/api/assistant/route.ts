import { NextResponse } from "next/server";
import { runAssistantTurn } from "@/lib/assistant/handlers";

export const runtime = "nodejs";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Beans assistant endpoint.
 *
 * Today: returns a deterministic, mocked response that exercises the
 * tool-use UI path without requiring an Anthropic API key.
 *
 * Tomorrow: replace `runAssistantTurn` with a real Anthropic Claude call:
 *
 *   import Anthropic from "@anthropic-ai/sdk";
 *   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   const stream = client.messages.stream({
 *     model: "claude-sonnet-4-6",
 *     system: BEANS_SYSTEM_PROMPT,
 *     tools: TOOLS,
 *     messages,
 *   });
 *   // Loop tool_use → run handler → feed tool_result back, until stop_reason=end_turn.
 *   // Stream tokens to the client via Server-Sent Events.
 *
 * Until then, the route exposes the same response shape so the UI stays stable.
 */
export async function POST(req: Request) {
  let body: { messages: AssistantMessage[] } | undefined;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Body must be { messages: [...] }" },
      { status: 400 }
    );
  }

  const result = await runAssistantTurn(body.messages);
  return NextResponse.json(result);
}
