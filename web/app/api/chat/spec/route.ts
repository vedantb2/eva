import { serverEnv } from "@/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: serverEnv.NEXT_OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://conductor-lake.vercel.app",
    "X-Title": "Conductor",
  },
});

const specSchema = z.object({
  title: z.string().describe("Clear, concise feature title (max 60 chars)"),
  description: z
    .string()
    .describe("Detailed description of the feature including scope and goals"),
  tasks: z.array(
    z.object({
      title: z.string().describe("Task title"),
      description: z.string().describe("What needs to be done"),
      dependencies: z
        .array(z.number())
        .describe("Task numbers this depends on, e.g. [1, 2]"),
    })
  ),
});

export async function POST(req: Request) {
  const { featureDescription, answers } = await req.json();

  const answersText = answers
    .map(
      (a: { question: string; answer: string }, i: number) =>
        `Q${i + 1}: ${a.question}\nA: ${a.answer}`
    )
    .join("\n\n");

  const prompt = `Feature: "${featureDescription}"

Interview answers:
${answersText}

Generate an implementation spec with 3-10 tasks.`;

  const result = streamObject({
    model: openrouter.chat("openai/gpt-5-nano"),
    schema: specSchema,
    schemaName: "ImplementationSpec",
    schemaDescription: "A structured implementation specification with tasks",
    system: `You are a technical architect. Based on the feature description and interview answers, create a detailed implementation plan with specific, actionable tasks ordered by dependency.`,
    prompt,
  });

  return result.toTextStreamResponse();
}
