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

const TASK_PHILOSOPHY = `
TASK GRANULARITY RULES:
- Each task should represent ONE ownership boundary in the codebase
- A task should encompass all related changes within that boundary (multiple file edits are expected)
- Think in terms of: "core capability/infrastructure" vs "user-facing integration/UI"
- Aim for 2-5 tasks total, NOT 10+ micro-tasks

Examples of GOOD task breakdowns:
- "Add dark theme toggle": 2 tasks
  1. Theme infrastructure (context, CSS variables, persistence)
  2. Toggle UI component and integration into settings
- "Add user notifications": 3 tasks
  1. Notification data model and API endpoints
  2. Real-time notification delivery system
  3. Notification UI components and user preferences
- "Add search functionality": 2 tasks
  1. Search backend (indexing, query API, ranking)
  2. Search UI (input, results display, filters)

Examples of BAD task breakdowns (too granular):
- "Create ThemeContext" (too small - combine with other theme work)
- "Add CSS variables" (too small - part of theme infrastructure)
- "Create toggle button" (too small - part of UI task)
- "Wire up toggle to context" (too small - part of UI task)

Each task description should specify ALL the changes needed within that ownership boundary.`;

function buildSystemPrompt(codebaseContext: CodebaseContext | null): string {
  if (!codebaseContext) {
    return `You are a technical architect. Based on the feature description and interview answers, create a detailed implementation plan.
${TASK_PHILOSOPHY}`;
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

${TASK_PHILOSOPHY}

Reference actual file paths and follow the project's existing patterns and conventions.`;
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

Generate an implementation spec with 2-5 tasks. Each task should represent a complete ownership boundary (e.g., "backend infrastructure" or "UI integration"), not a single micro-edit. Tasks should be comprehensive enough that completing one task means that entire area of the codebase is done.`;

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
