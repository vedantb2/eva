import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import { serverEnv } from "@/env/server";
import {
  createSandbox,
  runClaudeCLIStreaming,
  getGitHubToken,
} from "../sandbox";

type SandboxModel = "opus" | "sonnet" | "haiku";

function stripCodeFences(text: string): string {
  const match = text.match(/```(?:\w+)?\n([\s\S]+?)```/);
  return (match ? match[1] : text).trim();
}

function buildGeneratePrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Generate a single Convex database query to answer the user's question. Do NOT execute anything — output ONLY the raw query code with no markdown, no explanation, no backticks.

## Step 1: Read the Schema
Before generating any query, read the database schema and validators to understand all tables, fields, and indexes:
- cat packages/backend/convex/schema.ts
- cat packages/backend/convex/validators.ts

Use ONLY the indexes defined in schema.ts. NEVER invent indexes — they will cause errors. To filter by a field without an index, collect all rows first, then use .filter() in JavaScript.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}
- All database timestamps are in milliseconds since epoch (Unix ms). Use Date.now() in queries for current time. For "today", subtract 24*60*60*1000 from Date.now().

## Current Repository ID
repoId: "${repoId}"

## CRITICAL RULES
- Return ONLY the raw query code. No markdown, no explanation, no wrapping in backticks.
- Filter by repoId where applicable.
- For agentTasks: query boards by repoId first, then tasks by boardId.
- For agentRuns: query tasks first, then runs by taskId.

## Query Format
Every query MUST use this exact wrapper:
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => {
  // your query logic here
  return result;
}});

## Query Examples
- With index: await ctx.db.query("sessions").withIndex("by_repo", q => q.eq("repoId", "${repoId}")).collect()
- Order desc: await ctx.db.query("agentRuns").order("desc").take(20)
- Get by ID: await ctx.db.get(someId)`;
}

function buildAnalysePrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Execute the provided Convex database query and analyze the results.

## How to Execute
Write the query code to /tmp/query.js, then run it using this pattern:

cat > /tmp/query.js << 'QUERYEOF'
<paste the query code here>
QUERYEOF

cat > /tmp/run.mjs << 'RUNEOF'
import { readFileSync } from "fs";
const code = readFileSync("/tmp/query.js", "utf8");
const res = await fetch(process.env.NEXT_PUBLIC_CONVEX_URL + "/api/run_test_function", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ adminKey: process.env.CONVEX_DEPLOY_KEY, args: {}, bundle: { path: "testQuery.js", source: code }, format: "convex_encoded_json" }),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
RUNEOF

node /tmp/run.mjs

If the query fails, you may fix the query code and retry once.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}

## Current Repository ID
repoId: "${repoId}"

## Analysis Guidelines
1. Execute the provided query
2. Analyze the results thoroughly
3. Present findings in a structured, analyst-friendly format:
   - Lead with the key metric or direct answer
   - **Bold** important numbers, metrics, names, and key takeaways
   - Use tables, lists, or breakdowns where appropriate
   - Highlight trends, outliers, or notable patterns
   - Include percentages and comparisons when relevant
4. NEVER include raw database IDs (like _id, repoId, boardId, userId) unless the user explicitly asks for raw data
5. Use names, titles, statuses, and human-readable labels
6. If results are empty, say so clearly and suggest what the user might query instead`;
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
    const { clerkToken, queryId, question, repoId, model } = event.data;
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

      const repo = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repo) throw new Error("Repository not found");
      const githubToken = await getGitHubToken(repo.installationId);
      const sandbox = await createSandbox(githubToken, true);

      const result = await runClaudeCLIStreaming(
        sandbox,
        `${buildGeneratePrompt(repoId)}\n\nQuestion: ${question}`,
        {
          model: (model as SandboxModel) || "sonnet",
          allowedTools: ["Bash"],
          timeout: 120,
          onOutput: async (activity) => {
            await convex.mutation(api.streaming.set, {
              entityId: queryId,
              currentActivity: activity,
            });
          },
        },
      );

      if (result.isError) throw new Error(result.result);
      return stripCodeFences(result.result);
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
      const repo = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repo) throw new Error("Repository not found");
      const githubToken = await getGitHubToken(repo.installationId);
      const sandbox = await createSandbox(githubToken, true, {
        CONVEX_DEPLOY_KEY: serverEnv.CONVEX_DEPLOY_KEY,
      });

      const prompt = `${buildAnalysePrompt(repoId)}\n\nUser's question: ${question}\n\nQuery to execute:\n${queryCode}`;

      const result = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "sonnet",
        allowedTools: ["Bash"],
        timeout: 120,
        onOutput: async (activity) => {
          await convex.mutation(api.streaming.set, {
            entityId: queryId,
            currentActivity: activity,
          });
        },
      });

      if (result.isError) throw new Error(result.result);
      return result.result || "I couldn't generate a response.";
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
