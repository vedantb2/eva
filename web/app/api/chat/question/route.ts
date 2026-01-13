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

const questionSchema = z.object({
  question: z.string().describe("The multiple choice question to ask the user"),
  options: z
    .array(z.string())
    .length(4)
    .describe("Exactly 4 answer options for the question"),
});

export async function POST(req: Request) {
  const { featureDescription, questionTopic, previousAnswer } =
    await req.json();

  const prompt = previousAnswer
    ? `Feature: "${featureDescription}"
Previous answer: "${previousAnswer}"
Generate a question about: "${questionTopic}"`
    : `Feature: "${featureDescription}"
Generate a question about: "${questionTopic}"`;

  const result = streamObject({
    model: openrouter.chat("openai/gpt-5-nano"),
    schema: questionSchema,
    schemaName: "MultipleChoiceQuestion",
    schemaDescription: "A multiple choice question with exactly 4 options",
    system: `You are helping gather requirements for a software feature. Generate specific, relevant multiple choice questions with 4 practical options.`,
    prompt,
  });

  return result.toTextStreamResponse();
}
