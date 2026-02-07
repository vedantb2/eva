import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import { generateText, tool, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const queryResultSchema = z.object({
  status: z.string(),
  value: z.unknown(),
  logLines: z.array(z.string()).optional(),
});

async function runConvexQuery(queryCode: string): Promise<string> {
  const res = await fetch(
    `${clientEnv.NEXT_PUBLIC_CONVEX_URL}/api/run_test_function`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminKey: serverEnv.CONVEX_DEPLOY_KEY,
        args: {},
        bundle: { path: "testQuery.js", source: queryCode },
        format: "convex_encoded_json",
      }),
    },
  );
  if (!res.ok) throw new Error(`Convex query failed: ${res.status}`);
  const { status, value } = queryResultSchema.parse(await res.json());
  if (status !== "success")
    throw new Error(`Query error: ${JSON.stringify(value)}`);
  return JSON.stringify(value);
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
      await convex.mutation(api.streaming.set, {
        entityId: queryId,
        currentActivity: "Analyzing your question...",
      });

      const openrouter = createOpenRouter({
        apiKey: serverEnv.OPENROUTER_API_KEY ?? "",
      });

      const now = new Date();
      const { text } = await generateText({
        model: openrouter("openai/gpt-5-nano"),
        system: `You are a data analyst. Use the run_query tool to query the Convex database and analyze results. Do NOT suggest manual steps or modifications.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}
- All database timestamps are in milliseconds since epoch (Unix ms). Use Date.now() in queries for current time. For "today", subtract 24*60*60*1000 from Date.now().

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

## Instructions
1. Use run_query to execute read-only Convex queries
2. Always show the query code you ran in your response so the user can verify
3. Query format — every query MUST use this exact wrapper:
\`\`\`js
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => {
  // your query logic here
  return result;
}});
\`\`\`

## Query Examples
- Get all rows: \`await ctx.db.query("tableName").collect()\`
- With index: \`await ctx.db.query("sessions").withIndex("by_repo", q => q.eq("repoId", "${repoId}")).collect()\`
- Order desc: \`await ctx.db.query("agentRuns").order("desc").take(20)\`
- Filter after fetch: \`const rows = await ctx.db.query("agentRuns").collect(); return rows.filter(r => r.startedAt >= ${now.getTime()} - 86400000);\`
- Get by ID: \`await ctx.db.get(someId)\`

## Available Indexes
- agentTasks: by_board (boardId), by_project (projectId)
- agentRuns: by_task (taskId)
- sessions: by_repo (repoId), by_repo_and_status (repoId, status)
- projects: by_repo (repoId)
- boards: by_repo (repoId)
- docs: by_repo (repoId)

## Tips
- Filter by repoId where applicable
- For agentTasks: query boards by repoId first, then tasks by boardId
- For agentRuns: query tasks first, then runs by taskId
- Analyze the results and provide a concise answer`,
        prompt: question,
        tools: {
          run_query: tool({
            description:
              "Execute a read-only Convex database query. Write JavaScript using the Convex query format with ctx.db.query().",
            inputSchema: z.object({
              code: z
                .string()
                .describe("JavaScript query code using Convex query format"),
            }),
            execute: async ({ code }) => runConvexQuery(code),
          }),
        },
        stopWhen: stepCountIs(5),
      });

      return text || "I couldn't generate a response.";
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
