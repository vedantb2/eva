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

interface CodebaseContext {
  summary: string;
  techStack: {
    language: string;
    framework: string;
    other: string[];
  };
  patterns: {
    componentPattern: string;
    stateManagement: string;
    apiPattern: string;
  };
  keyFiles: { path: string; purpose: string }[];
  conventions: {
    naming: string;
    fileStructure: string;
  };
}

function buildSystemPrompt(codebaseContext: CodebaseContext | null): string {
  if (!codebaseContext) {
    return `You are helping gather requirements for a software feature. Generate specific, relevant multiple choice questions with 4 practical options.`;
  }

  const keyFilesList = codebaseContext.keyFiles
    .slice(0, 5)
    .map((f) => `- ${f.path}: ${f.purpose}`)
    .join("\n");

  return `You are helping gather requirements for a software feature in a ${codebaseContext.techStack.language}/${codebaseContext.techStack.framework} project.

Project context:
${codebaseContext.summary}

Tech stack: ${codebaseContext.techStack.language}, ${codebaseContext.techStack.framework}
Component pattern: ${codebaseContext.patterns.componentPattern}
State management: ${codebaseContext.patterns.stateManagement}
API pattern: ${codebaseContext.patterns.apiPattern}

Key files that may be relevant:
${keyFilesList}

Generate specific, relevant multiple choice questions with 4 practical options. Make questions specific to this project's tech stack and patterns when appropriate.`;
}

export async function POST(req: Request) {
  const { featureDescription, questionTopic, previousAnswer, codebaseContext } =
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
    system: buildSystemPrompt(codebaseContext),
    prompt,
  });

  return result.toTextStreamResponse();
}
