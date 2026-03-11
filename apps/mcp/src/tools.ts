import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ConvexCredentials } from "./auth.js";
import {
  getTableShapes,
  getDeclaredSchema,
  queryTableData,
  runTestQuery,
  wrapQueryHandler,
  getDeployKey,
  listUserRepos,
  checkRepoAccess,
  getRepoConvexCredentials,
  runMutation,
  resolveUserByClerkId,
} from "./convex-api.js";

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerTools(
  server: McpServer,
  credentials: ConvexCredentials,
): void {
  const { convexUrl, clerkUserId } = credentials;

  async function getContext(): Promise<{
    deployKey: string;
    userId: string;
  }> {
    const deployKey = await getDeployKey(convexUrl);
    const userId = await resolveUserByClerkId(
      convexUrl,
      deployKey,
      clerkUserId,
    );
    if (!userId) {
      throw new Error("User not found. Ensure your Eva account exists.");
    }
    return { deployKey, userId };
  }

  async function resolveTargetWithAccess(
    repoId: string,
    deployKey: string,
    userId: string,
  ): Promise<{ convexUrl: string; deployKey: string }> {
    const hasAccess = await checkRepoAccess(
      convexUrl,
      deployKey,
      repoId,
      userId,
    );
    if (!hasAccess) {
      throw new Error("Access denied: you do not have access to this repo.");
    }
    const repoCreds = await getRepoConvexCredentials(
      convexUrl,
      deployKey,
      repoId,
    );
    if (!repoCreds) {
      throw new Error(
        `Repo ${repoId} has no Convex credentials. Ensure NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY are set in its env vars in Eva.`,
      );
    }
    return repoCreds;
  }

  server.tool(
    "list_repos",
    "List all GitHub repos you have access to. Call this first to let the user choose which codebase to work with.",
    {},
    async () => {
      const { deployKey, userId } = await getContext();
      const repos = await listUserRepos(convexUrl, deployKey, userId);
      return textResult(repos);
    },
  );

  server.tool(
    "list_tables",
    "List all tables in a repo's Convex deployment with their field definitions, indexes, and inferred shapes.",
    {
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's database to query.",
        ),
    },
    async ({ repoId }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(repoId, deployKey, userId);
      const [shapes, declaredTables] = await Promise.all([
        getTableShapes(target.convexUrl, target.deployKey),
        getDeclaredSchema(target.convexUrl, target.deployKey),
      ]);

      const schemaByTable: Record<string, (typeof declaredTables)[number]> = {};
      for (const table of declaredTables) {
        schemaByTable[table.tableName] = table;
      }

      const allTableNames = new Set([
        ...Object.keys(shapes),
        ...Object.keys(schemaByTable),
      ]);
      const sortedNames = Array.from(allTableNames).sort();

      const tables = sortedNames.map((name) => ({
        name,
        declaredSchema: schemaByTable[name] ?? null,
        inferredShape: shapes[name] ?? null,
      }));

      return textResult(tables);
    },
  );

  server.tool(
    "query_table",
    "Read a page of documents from a Convex table. Returns documents ordered by creation time. Use the continueCursor for pagination.",
    {
      table: z.string().describe("Table name"),
      order: z
        .enum(["asc", "desc"])
        .default("desc")
        .describe("Sort order by creation time"),
      limit: z
        .number()
        .max(1000)
        .default(100)
        .describe("Max documents to return (default 100, max 1000)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous query"),
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's database to query.",
        ),
    },
    async ({ table, order, limit, cursor, repoId }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(repoId, deployKey, userId);
      const result = await queryTableData(
        target.convexUrl,
        target.deployKey,
        table,
        order,
        {
          numItems: limit,
          cursor: cursor ?? null,
        },
      );

      return textResult({
        page: result.page,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
        count: result.page.length,
      });
    },
  );

  server.tool(
    "get_document",
    "Get a single document by its Convex document ID.",
    {
      id: z
        .string()
        .describe('The document ID (e.g. "j572abc123..." or "kd83xyz...")'),
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's database to query.",
        ),
    },
    async ({ id, repoId }) => {
      if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        return errorResult(
          "Invalid document ID format. IDs should be alphanumeric.",
        );
      }
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(repoId, deployKey, userId);
      const source = wrapQueryHandler(`return await ctx.db.get("${id}");`);
      const result = await runTestQuery(
        target.convexUrl,
        target.deployKey,
        source,
      );

      const output: { document: typeof result.value; logLines?: string[] } = {
        document: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return textResult(output);
    },
  );

  server.tool(
    "run_query",
    `Run arbitrary read-only Convex query code against a repo's database. This is the most powerful tool — use it for joins, aggregations, filters, and complex data retrieval.

Provide the body of an async handler function. The \`ctx\` object is available with:
- ctx.db.query("tableName") — query a table (supports .filter(), .order(), .collect(), .first(), .take(n))
- ctx.db.get(id) — get a document by ID

Example: "const users = await ctx.db.query('users').collect(); return users.filter(u => u.role === 'admin').length;"`,
    {
      code: z
        .string()
        .describe(
          "The handler body code. Must return a value. Example: \"return await ctx.db.query('users').collect();\"",
        ),
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's database to query.",
        ),
    },
    async ({ code, repoId }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(repoId, deployKey, userId);
      const source = wrapQueryHandler(code);
      const result = await runTestQuery(
        target.convexUrl,
        target.deployKey,
        source,
      );

      const output: { result: typeof result.value; logLines?: string[] } = {
        result: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return textResult(output);
    },
  );

  server.tool(
    "count_table",
    "Count the total number of documents in a table.",
    {
      table: z.string().describe("Table name"),
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's database to query.",
        ),
    },
    async ({ table, repoId }) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return errorResult(
          "Invalid table name. Use alphanumeric characters and underscores.",
        );
      }
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(repoId, deployKey, userId);
      const source = wrapQueryHandler(
        `const docs = await ctx.db.query("${table}").collect(); return docs.length;`,
      );
      const result = await runTestQuery(
        target.convexUrl,
        target.deployKey,
        source,
      );

      return textResult({ table, count: result.value });
    },
  );

  server.tool(
    "create_and_run_task",
    "Create a task on the Eva platform and immediately start execution. Use this to send plans, prompts, or instructions to Eva for autonomous execution against a repo.",
    {
      title: z.string().describe("Short task title"),
      description: z
        .string()
        .describe(
          "The full prompt, plan, or instructions for the task (plain text or markdown)",
        ),
      repoName: z
        .string()
        .describe(
          'Repo name (e.g. "conductor" or "vedantb2/conductor"). Resolved by matching against your connected repos.',
        ),
      model: z
        .enum(["opus", "sonnet", "haiku"])
        .optional()
        .describe(
          "Claude model to use. If omitted, uses the repo's default model.",
        ),
      baseBranch: z
        .string()
        .optional()
        .describe(
          "Branch to base work off of. If omitted, uses the repo's default base branch.",
        ),
    },
    async ({ title, description, repoName, model, baseBranch }) => {
      const { deployKey, userId } = await getContext();
      const repos = await listUserRepos(convexUrl, deployKey, userId);

      const normalizedInput = repoName.toLowerCase();
      const repo = repos.find((r) => {
        const fullName = `${r.owner}/${r.name}`.toLowerCase();
        return (
          fullName === normalizedInput ||
          r.name.toLowerCase() === normalizedInput
        );
      });

      if (!repo) {
        const available = repos.map((r) => `${r.owner}/${r.name}`).join(", ");
        return errorResult(
          `Repo "${repoName}" not found. Your repos: ${available}`,
        );
      }

      const mutationArgs: Record<string, string> = {
        repoId: repo.id,
        title,
        description,
      };
      if (model) mutationArgs.model = model;
      if (baseBranch) mutationArgs.baseBranch = baseBranch;

      const taskIdResult = await runMutation(
        convexUrl,
        deployKey,
        "_agentTasks/mutations:createQuickTask",
        mutationArgs,
      );

      if (typeof taskIdResult !== "string") {
        return errorResult(
          "Unexpected response from createQuickTask: expected a task ID string.",
        );
      }

      await runMutation(
        convexUrl,
        deployKey,
        "_agentTasks/execution:startExecution",
        {
          id: taskIdResult,
        },
      );

      return textResult({
        taskId: taskIdResult,
        repo: `${repo.owner}/${repo.name}`,
        title,
        status: "execution_started",
      });
    },
  );
}
