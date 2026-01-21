import { serverEnv } from "@/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: serverEnv.NEXT_OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://conductor-lake.vercel.app",
    "X-Title": "Pulse",
  },
});

const questionSchema = z.object({
  question: z.string().describe("Short question, max 15 words"),
  options: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2-4 concise options, each max 15 words"),
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

interface PreviousAnswer {
  question: string;
  answer: string;
}

const SYSTEM_PROMPT = `You ask short, concrete implementation questions. Each question must affect how code is written.

## Format Rules (CRITICAL)
- Question: MAX 15 words, direct and simple
- Options: MAX 15 words each, start with the technical choice (not generic)

## Good Examples
Question: "Where should theme state be stored?"
Options: ["localStorage", "React Context", "URL parameter", "System preference"]

Question: "What happens if stored theme is invalid?"
Options: ["Fall back to light theme", "Fall back to system preference", "Show error and prompt user"]

Question: "Should theme sync across browser tabs?"
Options: ["Yes, sync via storage event", "No, each tab independent"]

## Bad Examples (TOO VERBOSE - DO NOT DO THIS)
- "When the user first visits the application and no theme preference exists, what should happen?"
- "localStorage with automatic persistence and validation of stored values"

## Question Topics
- State storage (localStorage, context, URL, database)
- Component type (hook, provider, utility, controlled/uncontrolled)
- Edge cases (missing data, invalid data, first load)
- Sync behavior (tabs, external changes, real-time)
- Error handling (fallback, retry, user prompt)

## DO NOT ask about
- Users, priority, goals, success criteria
- Anything that doesn't change code`;

function buildPrompt(
  featureDescription: string,
  questionCategory: string,
  previousAnswers: PreviousAnswer[],
  codebaseContext: CodebaseContext | null
): string {
  let prompt = `## Feature to Implement
"${featureDescription}"

`;

  if (codebaseContext) {
    const keyFilesList = codebaseContext.keyFiles
      .slice(0, 5)
      .map((f) => `- ${f.path}: ${f.purpose}`)
      .join("\n");

    prompt += `## Project Context
Tech Stack: ${codebaseContext.techStack.language}/${codebaseContext.techStack.framework}
State Management: ${codebaseContext.patterns.stateManagement}
Component Pattern: ${codebaseContext.patterns.componentPattern}
API Pattern: ${codebaseContext.patterns.apiPattern}

Key Files:
${keyFilesList}

`;
  }

  if (previousAnswers.length > 0) {
    prompt += `## Decisions Already Made\n`;
    previousAnswers.forEach((a, i) => {
      prompt += `${i + 1}. Q: ${a.question}\n   A: ${a.answer}\n`;
    });
    prompt += "\n";
  }

  prompt += `## Category: ${questionCategory.replace(/_/g, " ")}

Ask ONE short question (max 15 words) with 2-4 concise options (max 15 words each).`;

  return prompt;
}

export async function POST(req: Request) {
  const {
    featureDescription,
    questionTopic,
    previousAnswers = [],
    codebaseContext,
  } = await req.json();

  const prompt = buildPrompt(
    featureDescription,
    questionTopic,
    previousAnswers,
    codebaseContext
  );

  const result = streamObject({
    model: openrouter.chat("openai/gpt-5-nano"),
    schema: questionSchema,
    schemaName: "ImplementationQuestion",
    schemaDescription:
      "A concrete implementation decision question with 3-5 options",
    system: SYSTEM_PROMPT,
    prompt,
  });

  return result.toTextStreamResponse();
}
