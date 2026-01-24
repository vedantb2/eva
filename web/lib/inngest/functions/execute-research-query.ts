import { inngest } from "../client";
import { Daytona } from "@daytonaio/sdk";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { runClaudeCLI } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

interface QueryContext {
  repoId: Id<"githubRepos">;
  taskStats: {
    total: number;
    byStatus: { todo: number; in_progress: number; code_review: number; done: number };
  };
  runStats: {
    total: number;
    byStatus: { queued: number; running: number; success: number; error: number };
    successRate: number;
    prsCreated: number;
  };
  sessionStats: {
    total: number;
    active: number;
    messagesByMode: { execute: number; ask: number; plan: number };
  };
  projectStats: {
    total: number;
    byPhase: { draft: number; finalized: number; active: number; completed: number };
    topProjects: Array<{ id: Id<"projects">; title: string; tasksTotal: number; tasksDone: number }>;
  };
}

async function gatherContext(repoId: Id<"githubRepos">): Promise<QueryContext> {
  const [taskStats, runStats, sessionStats, projectStats] = await Promise.all([
    convex.query(api.analytics.getTaskStats, { repoId }),
    convex.query(api.analytics.getRunStats, { repoId }),
    convex.query(api.analytics.getSessionStats, { repoId }),
    convex.query(api.analytics.getProjectStats, { repoId }),
  ]);

  return { repoId, taskStats, runStats, sessionStats, projectStats };
}

function formatContextForPrompt(context: QueryContext): string {
  return `## Current Project Data

### Task Statistics
- Total tasks: ${context.taskStats.total}
- By status:
  - Todo: ${context.taskStats.byStatus.todo}
  - In Progress: ${context.taskStats.byStatus.in_progress}
  - Code Review: ${context.taskStats.byStatus.code_review}
  - Done: ${context.taskStats.byStatus.done}

### Agent Run Statistics
- Total runs: ${context.runStats.total}
- By status:
  - Queued: ${context.runStats.byStatus.queued}
  - Running: ${context.runStats.byStatus.running}
  - Success: ${context.runStats.byStatus.success}
  - Error: ${context.runStats.byStatus.error}
- Success rate: ${context.runStats.successRate}%
- PRs created: ${context.runStats.prsCreated}

### Session Statistics
- Total sessions: ${context.sessionStats.total}
- Active sessions: ${context.sessionStats.active}
- Messages by mode:
  - Execute: ${context.sessionStats.messagesByMode.execute}
  - Ask: ${context.sessionStats.messagesByMode.ask}
  - Plan: ${context.sessionStats.messagesByMode.plan}

### Project Statistics
- Total projects: ${context.projectStats.total}
- By phase:
  - Draft: ${context.projectStats.byPhase.draft}
  - Finalized: ${context.projectStats.byPhase.finalized}
  - Active: ${context.projectStats.byPhase.active}
  - Completed: ${context.projectStats.byPhase.completed}
${context.projectStats.topProjects.length > 0 ? `- Top projects:\n${context.projectStats.topProjects.map((p) => `  - ${p.title}: ${p.tasksDone}/${p.tasksTotal} tasks done`).join("\n")}` : ""}`;
}

function formatDataSummary(context: QueryContext): string {
  return `**Data Queried:**
- Task stats: ${context.taskStats.total} total tasks
- Run stats: ${context.runStats.total} total runs (${context.runStats.successRate}% success rate)
- Session stats: ${context.sessionStats.total} sessions (${context.sessionStats.active} active)
- Project stats: ${context.projectStats.total} projects`;
}

export const executeResearchQuery = inngest.createFunction(
  {
    id: "execute-research-query",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { queryId: string } };
      };
      const queryId = eventData.event.data.queryId as Id<"researchQueries">;
      await convex.mutation(api.researchQueries.addMessageNoAuth, {
        id: queryId,
        role: "assistant",
        content: `Error processing query: ${error.message}`,
      });
    },
  },
  { event: "research/query.execute" },
  async ({ event, step }) => {
    const { queryId, question, repoId } = event.data;

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.researchQueries.addMessageNoAuth, {
        id: queryId as Id<"researchQueries">,
        role: "assistant",
        content: "Gathering data from analytics...",
      });
    });

    const context = await step.run("gather-context", async () => {
      return await gatherContext(repoId as Id<"githubRepos">);
    });

    const answer = await step.run("generate-answer", async () => {
      const sandbox = await daytona.create({
        envVars: { CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN },
        autoStopInterval: 5,
      });

      try {
        const prompt = `You are a data analyst assistant answering questions about a software development project.

${formatContextForPrompt(context)}

## Question
${question}

## Instructions
- Be concise and direct
- Use the provided data to give accurate answers
- If the data doesn't contain what's needed, say so
- Format numbers nicely (e.g., "5 tasks" not "5.0 tasks")
- Don't make up data that isn't provided`;

        const claudeResult = await runClaudeCLI(sandbox, prompt, {
          model: "sonnet",
          allowedTools: [],
          workDir: "/",
          timeout: 60,
        });

        return claudeResult.result || "I couldn't generate a response.";
      } finally {
        await sandbox.delete();
      }
    });

    const fullResponse = `${formatDataSummary(context)}

---

${answer}`;

    await step.run("save-response", async () => {
      await convex.mutation(api.researchQueries.addMessageNoAuth, {
        id: queryId as Id<"researchQueries">,
        role: "assistant",
        content: fullResponse,
      });
    });

    return { success: true };
  }
);
