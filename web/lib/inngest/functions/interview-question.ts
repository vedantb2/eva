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

interface PreviousAnswer {
  question: string;
  answer: string;
}

const SYSTEM_PROMPT = `You are a product-minded engineer helping a user spec out a feature before building it. You have access to their codebase and understand how it works.

## Your Role
- Ask questions that actually matter for implementation — things that would block you or lead to rework if you guessed wrong
- Ground your questions in the real codebase: reference existing patterns, pages, or behaviors the user already has
- Each question should include a brief example or scenario so the user understands why it matters
- Use plain language but you CAN reference things the user would recognize (e.g. "the settings page", "your current notification system", "the sidebar")

## Format Rules
- Question: 1-3 sentences. Include a concrete example or "for instance..." to illustrate why the question matters.
- Options: 2-4 options, each 1-2 sentences. Describe the actual user-facing behavior, not implementation details.
- Do NOT ask about purely technical choices (database schema, state management library, API design)
- Do NOT repeat topics already covered in previous answers

## Good Examples
{"question": "When a user creates a new project, should they see a blank canvas or a guided setup flow? For instance, right now your app drops users into an empty board — should this feature follow the same pattern or hold their hand a bit more?", "options": ["Blank canvas, same as existing boards", "Step-by-step wizard that walks them through setup", "Blank canvas but with a dismissible tooltip pointing out key actions"]}

{"question": "If someone is halfway through filling this out and accidentally navigates away, should their progress be saved? For example, imagine they've typed out a long description and hit the back button by mistake.", "options": ["Auto-save their progress so they can pick up where they left off", "Show a warning before leaving but don't auto-save", "Don't save — if they leave, they start over"]}

{"question": "Should other team members be able to see or interact with this, or is it private to the person who created it? For instance, if Alice creates one, can Bob view it or is it hidden from him entirely?", "options": ["Fully private — only the creator can see it", "Visible to everyone on the team but only the creator can edit", "Visible and editable by the whole team"]}

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{"question": "your question here", "options": ["option 1", "option 2", "option 3"]}`;

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
  previousAnswers: PreviousAnswer[],
  rejectionReason?: string,
): string {
  let prompt = `## Feature Request
"${featureDescription}"

`;

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
Ask a question that directly addresses what the user felt was missing or wrong.

`;
  }

  prompt += `## Your Task
Ask ONE question about a decision that would actually affect how this feature gets built. Ground it in the existing codebase where possible — reference real pages, components, or behaviors the user already has.

Include a brief example or scenario in the question so the user understands the tradeoff.

Output ONLY valid JSON:
{"question": "your question", "options": ["option 1", "option 2"]}`;

  return prompt;
}

const SPEC_SYSTEM_PROMPT = `You are a technical architect. Read CLAUDE.md first to understand the codebase, then create a detailed implementation plan based on the feature description and interview answers.
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

        const fullPrompt = `${SPEC_SYSTEM_PROMPT}\n\n${prompt}`;

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
        previousAnswers as PreviousAnswer[],
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
