import { serverEnv } from "@/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: serverEnv.NEXT_OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://conductor-lake.vercel.app",
    "X-Title": "Eva",
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

const SYSTEM_PROMPT = `You help users think through their feature by asking clarifying questions about edge cases and scenarios they may not have considered.

## Your Role
- Surface edge cases the user probably hasn't thought about
- Ask "what should happen when..." questions
- Use simple, everyday language - NO technical jargon
- Help the user make decisions that will affect how the feature works

## Format Rules
- Question: MAX 15 words, simple and clear
- Options: MAX 15 words each, describe the behavior in plain language
- NO technical terms like "localStorage", "context", "API", "state", "sync", "fallback"

## Good Examples
Question: "Should the app remember your theme choice after you close it?"
Options: ["Yes, remember forever", "No, reset each visit", "Only remember for this device"]

Question: "If you change the theme in one tab, should other open tabs update too?"
Options: ["Yes, update all tabs", "No, each tab stays independent"]

Question: "What if someone has 100+ items? Should we show all at once?"
Options: ["Show all of them", "Show 20 at a time with a 'load more' button", "Show 50 max"]

Question: "What happens if the user tries to delete something by accident?"
Options: ["Delete immediately, no undo", "Ask 'Are you sure?' first", "Allow undo for 5 seconds"]

Question: "What should new users see the first time they use this?"
Options: ["Empty screen with a hint to get started", "Pre-filled example data", "Quick tutorial walkthrough"]

## Bad Examples (DO NOT DO THIS)
- "Where should theme state be stored?" (too technical)
- "localStorage with automatic persistence" (jargon-heavy option)
- "Should we use optimistic updates?" (developer speak)

## Focus Areas
- First-time experience: What do new users see?
- Edge cases: What if there's nothing there? What if there's too much?
- Mistakes: What if users do something by accident?
- Failures: What if something goes wrong?
- Conflicts: What if two things happen at once?
- Limits: Is there a maximum? What happens at the limit?
- Memory: Should the app remember choices? For how long?

## DO NOT ask about
- Technical implementation details
- Developer-facing decisions
- Anything using programming terminology`;

const CATEGORY_MAP: Record<string, string> = {
  data_flow: "what happens with the data",
  error_handling: "what happens when something goes wrong",
  user_experience: "how it should feel to use",
  edge_cases: "unusual situations or edge cases",
  permissions: "who can do what",
  notifications: "keeping users informed",
  default: "an important detail",
};

function buildPrompt(
  featureDescription: string,
  questionCategory: string,
  previousAnswers: PreviousAnswer[],
  codebaseContext: CodebaseContext | null
): string {
  let prompt = `## Feature Request
"${featureDescription}"

`;

  if (codebaseContext) {
    prompt += `## App Info
This is a ${codebaseContext.techStack.framework} app.

`;
  }

  if (previousAnswers.length > 0) {
    prompt += `## Already Decided\n`;
    previousAnswers.forEach((a, i) => {
      prompt += `${i + 1}. ${a.question} → ${a.answer}\n`;
    });
    prompt += "\n";
  }

  const categoryDescription = CATEGORY_MAP[questionCategory] || CATEGORY_MAP.default;

  prompt += `## Your Task
Think of an edge case or scenario the user probably hasn't considered about ${categoryDescription}.
Ask ONE simple question (max 15 words) with 2-4 clear options (max 15 words each).
Use everyday language. No technical jargon.`;

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
