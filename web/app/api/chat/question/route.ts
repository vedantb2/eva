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
  question: z.string().describe("The implementation decision question"),
  options: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3-5 concrete implementation options"),
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

const SYSTEM_PROMPT = `You are a senior software architect helping a developer make concrete implementation decisions for a feature. Your job is to ask ONE question that will directly influence how the code is written.

## Your Goal
Identify an implementation decision that has multiple valid approaches, and ask the developer to choose one. The answer must directly affect the code structure, APIs used, or behavior.

## Question Types You Should Ask

1. **Architecture & State Questions**
   - Where should state live? (localStorage, sessionStorage, React Context, URL params, database)
   - Should this use a hook, provider, utility module, or class?
   - Should the component be controlled or uncontrolled?
   - Should this be client-side or server-side?

2. **Data & Persistence Questions**
   - How should data be stored/cached?
   - What should happen if stored data is invalid or missing?
   - Should changes persist immediately or require explicit save?

3. **Edge Case & Behavior Questions**
   - What happens on first load with no existing data?
   - What happens if the operation fails?
   - Should the UI update automatically when external state changes?
   - How should conflicts be resolved?

4. **API & Integration Questions**
   - Which existing pattern/component should this extend?
   - Should this be a new endpoint or extend an existing one?
   - What format should the API accept/return?

## Rules
- Ask exactly ONE question per response
- Provide 3-5 concrete options that represent real implementation choices
- Each option should result in different code
- Options should be mutually exclusive
- DO NOT ask about:
  - General product questions ("who is the user?")
  - Vague requirements ("what is the priority?")
  - Non-technical preferences
  - Things that don't change the implementation`;

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

  prompt += `## Question Category
Focus on: ${questionCategory.replace(/_/g, " ")}

Generate a concrete implementation question about this category. The question should:
- Present 3-5 specific implementation options
- Each option should result in different code
- Be specific to this feature (not generic)
- Build on the decisions already made`;

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
