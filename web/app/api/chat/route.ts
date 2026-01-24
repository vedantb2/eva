import { serverEnv } from "@/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, UIMessage } from "ai";

const openrouter = createOpenRouter({
  apiKey: serverEnv.NEXT_OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://conductor-lake.vercel.app",
    "X-Title": "Eva",
  },
});

interface SimpleMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function isUIMessage(msg: SimpleMessage | UIMessage): msg is UIMessage {
  return "parts" in msg || "id" in msg;
}

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messages cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modelMessages = isUIMessage(messages[0])
    ? convertToModelMessages(messages)
    : messages.map((m: SimpleMessage) => ({
        role: m.role,
        content: m.content,
      }));

  const result = streamText({
    model: openrouter.chat("openai/gpt-5-nano"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
