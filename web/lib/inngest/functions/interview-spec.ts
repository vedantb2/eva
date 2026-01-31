import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { WORKSPACE_DIR } from "../sandbox";
import { getGitHubToken, runClaudeCLI, extractJsonFromText, ensureProjectSandbox } from "../sandbox-helpers";

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

SUBTASKS:
- Each task MUST have 3-7 subtasks that serve as a checklist for the agent
- Subtasks should be discrete, actionable items the agent will mark as complete
- Examples of good subtasks for "Theme infrastructure":
  - "Create ThemeContext with light/dark state"
  - "Add CSS custom properties for colors"
  - "Implement localStorage persistence"
  - "Add useTheme hook for consuming context"
- Subtasks should be specific enough that completion is unambiguous

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
  const basePrompt = `You are a technical architect. Based on the feature description and interview answers, create a detailed implementation plan.
${TASK_PHILOSOPHY}

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "title": "Clear, concise feature title (max 60 chars)",
  "description": "Detailed description of the feature including scope and goals",
  "tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "dependencies": [1, 2],
      "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
    }
  ]
}`;

  if (!codebaseContext?.techStack) {
    return basePrompt;
  }

  const keyFilesList = (codebaseContext.keyFiles ?? [])
    .slice(0, 8)
    .map((f) => `- ${f.path}: ${f.purpose}`)
    .join("\n");

  const keyDirs = (codebaseContext.structure?.keyDirectories ?? [])
    .slice(0, 5)
    .map((d) => `- ${d.path}: ${d.purpose}`)
    .join("\n");

  const language = codebaseContext.techStack.language ?? "Unknown";
  const framework = codebaseContext.techStack.framework ?? "Unknown";
  const dependencies = (codebaseContext.techStack.other ?? []).slice(0, 10).join(", ") || "None";

  return `You are a technical architect for a ${language}/${framework} project.

Project context:
${codebaseContext.summary ?? "No summary available"}

Tech stack: ${language}, ${framework}
Dependencies: ${dependencies}

Key directories:
${keyDirs || "Not available"}

Key files:
${keyFilesList || "Not available"}

Code patterns:
- Components: ${codebaseContext.patterns?.componentPattern ?? "N/A"}
- State: ${codebaseContext.patterns?.stateManagement ?? "N/A"}
- API: ${codebaseContext.patterns?.apiPattern ?? "N/A"}

Conventions:
- Naming: ${codebaseContext.conventions?.naming ?? "N/A"}
- File structure: ${codebaseContext.conventions?.fileStructure ?? "N/A"}

${TASK_PHILOSOPHY}

Reference actual file paths and follow the project's existing patterns and conventions.

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "title": "Clear, concise feature title (max 60 chars)",
  "description": "Detailed description of the feature including scope and goals",
  "tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "dependencies": [1, 2],
      "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
    }
  ]
}`;
}

interface Answer {
  question: string;
  answer: string;
}

export const interviewSpec = inngest.createFunction(
  {
    id: "interview-spec",
    retries: 2,
  },
  { event: "project/interview.spec" },
  async ({ event, step }) => {
    const { clerkToken, projectId, repoId, installationId, featureDescription, answers } = event.data;
    const convex = createConvex(clerkToken);

    const project = await step.run("fetch-project", async () => {
      const p = await convex.query(api.projects.get, {
        id: projectId as Id<"projects">,
      });
      if (!p) throw new Error("Project not found");
      return p;
    });

    const repo = await step.run("fetch-repo", async () => {
      const r = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!r) throw new Error("Repo not found");
      return r;
    });

    const codebaseContext: CodebaseContext | null = project.codebaseIndex
      ? JSON.parse(project.codebaseIndex)
      : null;

    const specJson = await step.run("generate-spec", async () => {
      const githubToken = await getGitHubToken(installationId);

      const sandbox = await ensureProjectSandbox(
        project.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.projects.updateProjectSandbox, {
            id: projectId as Id<"projects">,
            sandboxId,
          });
        }
      );

      const answersText = (answers as Answer[])
        .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
        .join("\n\n");

      const prompt = `Feature: "${featureDescription}"

Interview answers:
${answersText}

Generate an implementation spec with 2-5 tasks. Each task should represent a complete ownership boundary (e.g., "backend infrastructure" or "UI integration"), not a single micro-edit. Tasks should be comprehensive enough that completing one task means that entire area of the codebase is done.

Output ONLY valid JSON.`;

      const systemPrompt = buildSystemPrompt(codebaseContext);
      const fullPrompt = `${systemPrompt}

${prompt}`;

      const claudeResult = await runClaudeCLI(sandbox, fullPrompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir: WORKSPACE_DIR,
        timeout: 180,
      });

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        throw new Error(`Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`);
      }

      return jsonStr;
    });

    await step.run("save-spec", async () => {
      await convex.mutation(api.projects.addMessage, {
        id: projectId as Id<"projects">,
        role: "assistant",
        content: specJson,
      });

      await convex.mutation(api.projects.update, {
        id: projectId as Id<"projects">,
        generatedSpec: specJson,
        phase: "finalized",
      });
    });

    await step.run("update-activity", async () => {
      await convex.mutation(api.projects.updateLastSandboxActivity, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true, spec: specJson };
  }
);
