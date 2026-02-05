import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { runClaudeCodeDirectStreaming } from "../sandbox";
import fs from "fs";
import os from "os";
import path from "path";

function getConvexAccessToken(): string | null {
  try {
    const configPath = path.join(os.homedir(), ".convex", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config.accessToken ?? null;
  } catch {
    return null;
  }
}

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
        content: "",
      });
    });

    const answer = await step.run("generate-answer", async () => {
      const ts = Date.now();
      const mcpConfigPath = path.join(os.tmpdir(), `mcp-config-${ts}.json`);
      const backendDir = path.resolve(process.cwd(), "../backend");

      const isWindows = process.platform === "win32";
      const npxCmd = `npx -y convex@latest mcp start --project-dir "${backendDir}"`;
      const mcpServer = isWindows
        ? { command: "cmd", args: ["/c", npxCmd] }
        : { command: "npx", args: ["-y", "convex@latest", "mcp", "start", "--project-dir", backendDir] };

      const accessToken = getConvexAccessToken();
      const mcpEnv: Record<string, string> = {};
      if (accessToken) {
        mcpEnv.CONVEX_OVERRIDE_ACCESS_TOKEN = accessToken;
      }

      fs.writeFileSync(
        mcpConfigPath,
        JSON.stringify({
          mcpServers: {
            convex: { ...mcpServer, env: mcpEnv },
          },
        }),
      );

      const prompt = `You are a data analyst. You MUST use the Convex MCP tools to query the database. Do NOT create files, do NOT suggest manual steps, do NOT modify the codebase.

## Database Schema
- agentTasks: _id, boardId, columnId, title, description, repoId, projectId, status (todo/in_progress/code_review/done), createdAt, updatedAt
- agentRuns: _id, taskId, status (queued/running/success/error), logs[], startedAt, finishedAt, prUrl, error
- sessions: _id, repoId, userId, title, status (active/closed), messages[], branchName, prUrl
- projects: _id, repoId, userId, title, description, phase (draft/finalized/active/completed), branchName
- boards: _id, name, ownerId, repoId, createdAt
- docs: _id, repoId, title, content, createdAt, updatedAt
- users: _id, clerkId, email, name, createdAt

## Current Repository ID
repoId: "${repoId}"

## Question
${question}

## Instructions
1. Call mcp__convex__status to get the deploymentSelector
2. Use mcp__convex__runOneoffQuery with that deploymentSelector to run ad-hoc queries directly - do NOT create or modify any files
3. The runOneoffQuery code format is:
\`\`\`js
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => { return await ctx.db.query("tableName").collect(); } });
\`\`\`
4. Filter by repoId where applicable (sessions, projects use by_repo index)
5. For agentTasks, query boards by repoId first, then tasks by boardId
6. Analyze the results and provide a concise answer`;

      try {
        const result = await runClaudeCodeDirectStreaming(prompt, {
          model: "sonnet",
          disallowedTools: ["Write", "Edit", "Bash", "NotebookEdit"],
          mcpConfigPath,
          workDir: backendDir,
          timeout: 180,
          onOutput: async (currentActivity) => {
            await convex.mutation(api.streaming.set, {
              entityId: queryId,
              currentActivity,
            });
          },
        });
        return result.result || "I couldn't generate a response.";
      } finally {
        try { fs.unlinkSync(mcpConfigPath); } catch {}
      }
    });

    await step.run("save-response", async () => {
      await convex.mutation(api.streaming.clear, { entityId: queryId });
      await convex.mutation(api.researchQueries.updateLastMessage, {
        id: queryId as Id<"researchQueries">,
        content: answer,
      });
    });

    return { success: true };
  },
);
