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

interface CodebaseContext {
  summary: string;
  techStack: {
    language: string;
    framework: string;
    other: string[];
  };
  structure: {
    keyDirectories: { path: string; purpose: string }[];
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
    imports: string;
  };
}

function buildSystemPrompt(codebaseContext: CodebaseContext | null): string {
  if (!codebaseContext) {
    return `You are a technical architect. Based on the feature description and interview answers, create a detailed implementation plan with specific, actionable tasks ordered by dependency.`;
  }

  const keyFilesList = codebaseContext.keyFiles
    .slice(0, 8)
    .map((f) => `- ${f.path}: ${f.purpose}`)
    .join("\n");

  const keyDirs = codebaseContext.structure.keyDirectories
    .slice(0, 5)
    .map((d) => `- ${d.path}: ${d.purpose}`)
    .join("\n");

  return `You are a technical architect for a ${codebaseContext.techStack.language}/${codebaseContext.techStack.framework} project.

Project context:
${codebaseContext.summary}

Tech stack: ${codebaseContext.techStack.language}, ${codebaseContext.techStack.framework}
Dependencies: ${codebaseContext.techStack.other.slice(0, 10).join(", ")}

Key directories:
${keyDirs}

Key files:
${keyFilesList}

Code patterns:
- Components: ${codebaseContext.patterns.componentPattern}
- State: ${codebaseContext.patterns.stateManagement}
- API: ${codebaseContext.patterns.apiPattern}

Conventions:
- Naming: ${codebaseContext.conventions.naming}
- File structure: ${codebaseContext.conventions.fileStructure}

Based on the feature description and interview answers, create a detailed implementation plan with specific, actionable tasks ordered by dependency. Reference actual file paths and follow the project's existing patterns and conventions.`;
}

export async function POST(req: Request) {
  const { featureDescription, answers, codebaseContext } = await req.json();

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
    system: buildSystemPrompt(codebaseContext),
    prompt,
  });

  return result.toTextStreamResponse();
}
