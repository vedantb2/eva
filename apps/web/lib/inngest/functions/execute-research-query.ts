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

function buildSystemPrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Generate a single Convex database query to answer the user's question. Do NOT execute queries yourself — just return the query code.

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

## CRITICAL RULES
- ONLY use indexes listed below. NEVER invent indexes like "by_status" — they do not exist and will cause errors.
- To filter by a field that has no index, collect all rows first, then use .filter() in JavaScript.
- Return ONLY the raw query code. No markdown, no explanation, no wrapping in backticks.

## Query Format
Every query MUST use this exact wrapper:
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => {
  // your query logic here
  return result;
}});

## Available Indexes (ONLY these exist)
- agentTasks: by_board (boardId), by_project (projectId)
- agentRuns: by_task (taskId)
- sessions: by_repo (repoId), by_repo_and_status (repoId, status)
- projects: by_repo (repoId)
- boards: by_repo (repoId)
- docs: by_repo (repoId)

## Query Examples
- Filter by status (NO index exists — use JS filter):
  const boards = await ctx.db.query("boards").withIndex("by_repo", q => q.eq("repoId", "${repoId}")).collect();
  const boardIds = boards.map(b => b._id);
  const allTasks = [];
  for (const bid of boardIds) { allTasks.push(...await ctx.db.query("agentTasks").withIndex("by_board", q => q.eq("boardId", bid)).collect()); }
  return allTasks.filter(t => t.status === "todo").length;

- With index: await ctx.db.query("sessions").withIndex("by_repo", q => q.eq("repoId", "${repoId}")).collect()
- Order desc: await ctx.db.query("agentRuns").order("desc").take(20)
- Get by ID: await ctx.db.get(someId)

## Tips
- Filter by repoId where applicable
- For agentTasks: query boards by repoId first, then tasks by boardId
- For agentRuns: query tasks first, then runs by taskId`;
}

export const generateResearchQuery = inngest.createFunction(
  {
    id: "generate-research-query",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; queryId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const queryId = eventData.event.data.queryId as Id<"researchQueries">;
      await convex.mutation(api.researchQueries.updateLastMessage, {
        id: queryId,
        content: `Error generating query: ${error.message}`,
      });
    },
  },
  { event: "research/query.generate" },
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

    const queryCode = await step.run("generate-query", async () => {
      await convex.mutation(api.streaming.set, {
        entityId: queryId,
        currentActivity: "Generating query...",
      });

      const openrouter = createOpenRouter({
        apiKey: serverEnv.OPENROUTER_API_KEY ?? "",
      });

      const { text } = await generateText({
        model: openrouter("openai/gpt-5-nano"),
        system: buildSystemPrompt(repoId),
        prompt: question,
        stopWhen: stepCountIs(1),
      });

      return text || "";
    });

    await step.run("save-pending-query", async () => {
      await convex.mutation(api.streaming.clear, { entityId: queryId });
      const rq = await convex.query(api.researchQueries.get, {
        id: queryId as Id<"researchQueries">,
      });
      if (!rq) throw new Error("Query not found");
      await convex.mutation(api.researchQueries.updateMessageStatus, {
        id: queryId as Id<"researchQueries">,
        messageIndex: rq.messages.length - 1,
        status: "pending",
        content: queryCode,
      });
    });

    return { success: true };
  },
);

export const confirmResearchQuery = inngest.createFunction(
  {
    id: "confirm-research-query",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: {
          data: {
            clerkToken: string;
            queryId: string;
            messageIndex: number;
          };
        };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const queryId = eventData.event.data.queryId as Id<"researchQueries">;
      await convex.mutation(api.researchQueries.updateMessageStatus, {
        id: queryId,
        messageIndex: eventData.event.data.messageIndex,
        status: "confirmed",
        content: `Error executing query: ${error.message}`,
      });
    },
  },
  { event: "research/query.confirm" },
  async ({ event, step }) => {
    const { clerkToken, queryId, queryCode, messageIndex, question, repoId } =
      event.data;
    const convex = createConvex(clerkToken);

    await step.run("mark-confirmed", async () => {
      await convex.mutation(api.streaming.set, {
        entityId: queryId,
        currentActivity: "Running query...",
      });
      await convex.mutation(api.researchQueries.updateMessageStatus, {
        id: queryId as Id<"researchQueries">,
        messageIndex,
        status: "confirmed",
        queryCode,
        content: "",
      });
    });

    const answer = await step.run("execute-and-analyse", async () => {
      const openrouter = createOpenRouter({
        apiKey: serverEnv.OPENROUTER_API_KEY ?? "",
      });

      const now = new Date();
      const { text } = await generateText({
        model: openrouter("openai/gpt-5-nano"),
        system: `You are a data analyst assistant. Your audience is data analysts with no access to the codebase — only use information from the query results, never reference code, internal implementation details, or suggest the user look at source files. Execute the query using the run_query tool, then analyze the results and provide a clear, concise answer.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}

## Current Repository ID
repoId: "${repoId}"

## Instructions
1. Execute the provided query using the run_query tool
2. Analyze the results thoroughly
3. Present findings in a structured, analyst-friendly format:
   - Lead with the key metric or direct answer
   - **Bold** important numbers, metrics, names, and key takeaways using markdown **bold**
   - Use tables, lists, or breakdowns where appropriate
   - Highlight trends, outliers, or notable patterns
   - Include percentages and comparisons when relevant
4. NEVER include raw database IDs (like _id, repoId, boardId, userId) unless the user explicitly asks for an export or raw data
5. Use names, titles, statuses, and human-readable labels
6. If results are empty, say so clearly and suggest what the user might query instead
`,
        prompt: `User's question: ${question}\n\nQuery to execute:\n${queryCode}`,
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
      await convex.mutation(api.researchQueries.updateMessageStatus, {
        id: queryId as Id<"researchQueries">,
        messageIndex,
        status: "confirmed",
        content: answer,
      });
    });

    return { success: true };
  },
);
