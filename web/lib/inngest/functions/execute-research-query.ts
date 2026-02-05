import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { serverEnv } from "@/env/server";
import { createSandbox, WORKSPACE_DIR, getGitHubToken, syncRepo, runClaudeCLI } from "../sandbox";

export const executeResearchQuery = inngest.createFunction(
  {
    id: "execute-research-query",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; queryId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const queryId = eventData.event.data.queryId as Id<"researchQueries">;
      await convex.mutation(api.researchQueries.updateLastMessage, {
        id: queryId,
        content: `Error processing query: ${error.message}`,
      });
    },
  },
  { event: "research/query.execute" },
  async ({ event, step }) => {
    const { clerkToken, queryId, question, repoId } = event.data;
    const convex = createConvex(clerkToken);

    await step.run("add-user-message", async () => {
      await convex.mutation(api.researchQueries.addMessage, {
        id: queryId as Id<"researchQueries">,
        role: "user",
        content: question,
      });
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.researchQueries.addMessage, {
        id: queryId as Id<"researchQueries">,
        role: "assistant",
        content: "Analyzing your question...",
      });
    });

    const answer = await step.run("generate-answer", async () => {
      const repo = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repo) throw new Error("Repo not found");

      const githubToken = await getGitHubToken(repo.installationId);

      const convexAllowList = "52.44.0.0/16,52.54.0.0/16,52.200.0.0/16";
      const sandbox = await createSandbox(
        githubToken,
        undefined,
        { CONVEX_DEPLOY_KEY: serverEnv.CONVEX_DEPLOY_KEY },
        convexAllowList,
      );

      try {
        await syncRepo(sandbox, githubToken, repo.owner, repo.name);

        const backendDir = `${WORKSPACE_DIR}/backend`;
        await sandbox.process.executeCommand(
          `printf 'CONVEX_DEPLOYMENT=${serverEnv.CONVEX_DEPLOYMENT}\nCONVEX_DEPLOY_KEY=${serverEnv.CONVEX_DEPLOY_KEY}\n' > ${backendDir}/.env.local`,
          "/",
          undefined,
          10,
        );

        const mcpConfig = JSON.stringify({
          type: "stdio",
          command: "bash",
          args: ["-c", `cd ${backendDir} && npx convex mcp start`],
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
          workDir: backendDir,
          timeout: 180,
        });

        return result.result || "I couldn't generate a response.";
      } finally {
        await sandbox.delete();
      }
    });

    await step.run("save-response", async () => {
      await convex.mutation(api.researchQueries.updateLastMessage, {
        id: queryId as Id<"researchQueries">,
        content: answer,
      });
    });

    return { success: true };
  },
);
