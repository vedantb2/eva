import { inngest } from "../client";
import { Daytona } from "@daytonaio/sdk";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import {
  cloneRepo,
  configureGit,
  getGitHubToken,
  installClaudeCode,
  runClaudeCLI,
} from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

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
        content: "Analyzing your question...",
      });
    });

    const answer = await step.run("generate-answer", async () => {
      const repo = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repo) throw new Error("Repo not found");

      const githubToken = await getGitHubToken(repo.installationId);

      const sandbox = await daytona.create({
        envVars: {
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
          CONVEX_DEPLOYMENT: serverEnv.CONVEX_DEPLOYMENT,
          CONVEX_DEPLOY_KEY: serverEnv.CONVEX_DEPLOY_KEY,
        },
        ephemeral: true,
      });

      try {
        await configureGit(sandbox);
        await cloneRepo(sandbox, githubToken, repo.owner, repo.name, "~/workspace");
        await sandbox.process.executeCommand(
          "npm install -g convex",
          "/",
          undefined,
          120,
        );
        await installClaudeCode(sandbox);

        const mcpConfig = JSON.stringify({
          type: "stdio",
          command: "bash",
          args: [
            "-c",
            `export CONVEX_DEPLOYMENT='${serverEnv.CONVEX_DEPLOYMENT}' && export CONVEX_DEPLOY_KEY='${serverEnv.CONVEX_DEPLOY_KEY}' && cd $HOME/workspace/backend && convex mcp start`,
          ],
        });
        const mcpConfigBase64 = Buffer.from(mcpConfig).toString("base64");
        await sandbox.process.executeCommand(
          `claude mcp add-json convex "$(echo '${mcpConfigBase64}' | base64 -d)"`,
          "/",
          undefined,
          30,
        );

        const prompt = `You are a data analyst with access to query a software project database via Convex MCP.

## Database Schema
- agentTasks: _id, boardId, columnId, title, description, repoId, projectId, status (todo/in_progress/code_review/done), createdAt, updatedAt
- agentRuns: _id, taskId, status (queued/running/success/error), logs[], startedAt, finishedAt, prUrl, error
- sessions: _id, repoId, userId, title, status (active/closed), messages[], branchName, prUrl
- projects: _id, repoId, userId, title, description, phase (draft/finalized/active/completed), branchName
- boards: _id, name, ownerId, repoId, createdAt
- docs: _id, repoId, title, content, createdAt, updatedAt

## Current Repository ID
repoId: "${repoId}"

## Question
${question}

## Instructions
- Use the runOneoffQuery MCP tool to query the Convex database
- Write JavaScript query code that uses ctx.db.query() with proper indexes
- Filter by repoId where applicable (e.g., sessions, projects use by_repo index)
- For agentTasks, query boards by repoId first, then tasks by boardId
- Analyze the results and provide insights
- Be concise and accurate`;

        const result = await runClaudeCLI(sandbox, prompt, {
          model: "sonnet",
          allowedTools: [],
          workDir: "~/workspace/backend",
          timeout: 180,
        });

        return result.result || "I couldn't generate a response.";
      } finally {
        await sandbox.delete();
      }
    });

    await step.run("save-response", async () => {
      await convex.mutation(api.researchQueries.addMessageNoAuth, {
        id: queryId as Id<"researchQueries">,
        role: "assistant",
        content: answer,
      });
    });

    return { success: true };
  },
);
