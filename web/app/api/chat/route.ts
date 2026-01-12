import { serverEnv } from "@/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages } from "ai";

const openrouter = createOpenRouter({
  apiKey: serverEnv.NEXT_OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const result = streamText({
    model: openrouter("anthropic/claude-3.5-sonnet"),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
  });

  return result.toTextStreamResponse();
}
