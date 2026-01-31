import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { WORKSPACE_DIR } from "../sandbox";
import {
  getGitHubToken,
  runClaudeCLI,
  extractJsonFromText,
  ensureSandbox,
} from "../sandbox-helpers";

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
- Anything using programming terminology

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{"question": "your question here", "options": ["option 1", "option 2", "option 3"]}`;

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
  codebaseContext: CodebaseContext | null,
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

    const codebaseContext: CodebaseContext | null = project.codebaseIndex
      ? JSON.parse(project.codebaseIndex)
      : null;

    const questionJson = await step.run("generate-question", async () => {
      const githubToken = await getGitHubToken(installationId);

      const sandbox = await ensureSandbox(
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

      const prompt = buildPrompt(
        featureDescription,
        questionTopic,
        previousAnswers,
        codebaseContext,
      );

      const fullPrompt = `${SYSTEM_PROMPT}

${prompt}`;

      const claudeResult = await runClaudeCLI(sandbox, fullPrompt, {
        model: "haiku",
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

    return { success: true, question: questionJson };
  },
);
