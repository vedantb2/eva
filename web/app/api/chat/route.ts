import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const result = streamText({
    model: openrouter("anthropic/claude-3.5-sonnet"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
