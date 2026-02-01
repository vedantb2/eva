import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import {
  WORKSPACE_DIR,
  getGitHubToken,
  runClaudeCLI,
  extractJsonFromText,
  getOrCreateSandbox,
} from "../sandbox";

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
- Anything using programming terminology

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{"question": "your question here", "options": ["option 1", "option 2", "option 3"]}`;

const CATEGORY_MAP: Record<string, string> = {
  state_management: "how information is tracked and updated",
  data_persistence: "how data is saved and loaded",
  component_architecture: "how the feature is organized",
  api_design: "how different parts communicate",
  edge_case_handling: "unusual situations or edge cases",
  initialization_behavior: "what happens the first time",
  error_handling: "what happens when something goes wrong",
  runtime_behavior: "how things work while the app is running",
  integration_points: "how this connects with existing features",
  validation_strategy: "how user input is checked",
  default: "an important detail",
};

const TASK_PHILOSOPHY = `
TASK GRANULARITY RULES:
- Each task should represent ONE ownership boundary in the codebase
- A task should encompass all related changes within that boundary (multiple file edits are expected)
- Think in terms of: "core capability/infrastructure" vs "user-facing integration/UI"
- Aim for 2-5 tasks total, NOT 10+ micro-tasks

SUBTASKS:
- Each task MUST have 3-7 subtasks that serve as a checklist for the agent
- Subtasks should be discrete, actionable items the agent will mark as complete
- Subtasks should be specific enough that completion is unambiguous

Each task description should specify ALL the changes needed within that ownership boundary.`;

function buildQuestionPrompt(
  featureDescription: string,
  questionCategory: string,
  previousAnswers: PreviousAnswer[],
  codebaseContext: CodebaseContext | null,
  rejectionReason?: string,
): string {
  let prompt = `## Feature Request
"${featureDescription}"

`;

  if (codebaseContext?.techStack?.framework) {
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

  if (rejectionReason) {
    prompt += `## Important Context
The user previously received a generated plan but rejected it with this feedback: "${rejectionReason}"
Ask a question that addresses what the user felt was missing or wrong.

`;
  }

  const categoryDescription =
    CATEGORY_MAP[questionCategory] || CATEGORY_MAP.default;

  prompt += `## Your Task
Think of an edge case or scenario the user probably hasn't considered about ${categoryDescription}.
Ask ONE simple question (max 15 words) with 2-4 clear options (max 15 words each).
Use everyday language. No technical jargon.

Output ONLY valid JSON in this format:
{"question": "your question", "options": ["option 1", "option 2"]}`;

  return prompt;
}

function buildSpecSystemPrompt(codebaseContext: CodebaseContext | null): string {
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
  const dependencies =
    (codebaseContext.techStack.other ?? []).slice(0, 10).join(", ") || "None";

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

export const interviewQuestion = inngest.createFunction(
  {
    id: "interview-question",
    retries: 2,
  },
  { event: "project/interview.question" },
  async ({ event, step }) => {
    const {
      clerkToken,
      projectId,
      repoId,
      installationId,
      featureDescription,
      questionTopic,
      previousAnswers = [],
      rejectionReason,
    } = event.data;
    const convex = createConvex(clerkToken);

    const { project, repo } = await step.run("fetch-data", async () => {
      const projectData = await convex.query(api.projects.get, {
        id: projectId as Id<"projects">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!projectData || !repoData)
        throw new Error("Project or repo not found");
      return { project: projectData, repo: repoData };
    });

    const codebaseContext: CodebaseContext | null = repo.codebaseIndex
      ? JSON.parse(repo.codebaseIndex)
      : null;

    const answerCount = (previousAnswers as PreviousAnswer[]).length;

    const shouldGenerateSpec = await step.run("check-readiness", async () => {
      if (rejectionReason) return false;
      if (answerCount < 3) return false;
      if (answerCount >= 7) return true;

      const githubToken = await getGitHubToken(installationId);
      const sandbox = await getOrCreateSandbox(
        project.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.projects.updateProjectSandbox, {
            id: projectId as Id<"projects">,
            sandboxId,
          });
        },
      );

      const answersText = (previousAnswers as PreviousAnswer[])
        .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
        .join("\n\n");

      const readinessPrompt = `Feature: "${featureDescription}"

Interview Q&A so far:
${answersText}

Given these questions and answers, do you have enough information to create a comprehensive implementation plan for this feature? Consider whether all major edge cases, user flows, and behavioral decisions have been addressed.

You should lean towards "ready" - ${answerCount} questions have already been asked. Only say "not_ready" if a critical aspect of the feature is completely unaddressed.

Respond with ONLY the single word "ready" or "not_ready". Nothing else.`;

      const result = await runClaudeCLI(sandbox, readinessPrompt, {
        model: "haiku",
        allowedTools: [],
        workDir: WORKSPACE_DIR,
        timeout: 30,
      });

      return result.result.trim().toLowerCase().includes("ready") &&
        !result.result.trim().toLowerCase().includes("not_ready");
    });

    if (shouldGenerateSpec) {
      const specJson = await step.run("generate-spec", async () => {
        const githubToken = await getGitHubToken(installationId);
        const sandbox = await getOrCreateSandbox(
          project.sandboxId,
          githubToken,
          repo.owner,
          repo.name,
          async (sandboxId) => {
            await convex.mutation(api.projects.updateProjectSandbox, {
              id: projectId as Id<"projects">,
              sandboxId,
            });
          },
        );

        const answersText = (previousAnswers as PreviousAnswer[])
          .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
          .join("\n\n");

        const prompt = `Feature: "${featureDescription}"

Interview answers:
${answersText}

Generate an implementation spec with 2-5 tasks. Each task should represent a complete ownership boundary (e.g., "backend infrastructure" or "UI integration"), not a single micro-edit. Tasks should be comprehensive enough that completing one task means that entire area of the codebase is done.

Output ONLY valid JSON.`;

        const systemPrompt = buildSpecSystemPrompt(codebaseContext);
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        const claudeResult = await runClaudeCLI(sandbox, fullPrompt, {
          model: "sonnet",
          allowedTools: ["Read", "Glob", "Grep"],
          workDir: WORKSPACE_DIR,
          timeout: 180,
        });

        const jsonStr = extractJsonFromText(claudeResult.result);
        if (!jsonStr) {
          throw new Error(
            `Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`,
          );
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
        await convex.mutation(api.projects.updateLastSandboxActivity, {
          id: projectId as Id<"projects">,
        });
      });

      return { success: true, type: "spec", spec: specJson };
    }

    const questionJson = await step.run("generate-question", async () => {
      const githubToken = await getGitHubToken(installationId);

      const sandbox = await getOrCreateSandbox(
        project.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.projects.updateProjectSandbox, {
            id: projectId as Id<"projects">,
            sandboxId,
          });
        },
      );

      const prompt = buildQuestionPrompt(
        featureDescription,
        questionTopic,
        previousAnswers as PreviousAnswer[],
        codebaseContext,
        rejectionReason as string | undefined,
      );

      const fullPrompt = `${SYSTEM_PROMPT} ${prompt}`;

      const claudeResult = await runClaudeCLI(sandbox, fullPrompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir: WORKSPACE_DIR,
        timeout: 120,
      });
      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        throw new Error(
          `Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`,
        );
      }

      return jsonStr;
    });

    await step.run("save-message", async () => {
      await convex.mutation(api.projects.addMessage, {
        id: projectId as Id<"projects">,
        role: "assistant",
        content: questionJson,
      });
      await convex.mutation(api.projects.updateLastSandboxActivity, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true, type: "question", question: questionJson };
  },
);
