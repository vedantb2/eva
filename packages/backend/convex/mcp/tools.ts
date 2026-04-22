import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function textResult(data: Record<string, unknown> | Array<unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

interface McpCredentials {
  clerkUserId: string;
  scopedRepoId?: string;
}

interface RepoInfo {
  id: string;
  owner: string;
  name: string;
  rootDirectory: string | null;
  mcpRootPrompt: string | null;
}

interface RepoCredentials {
  convexUrl: string;
  deployKey: string;
}

export function registerTools(
  server: McpServer,
  credentials: McpCredentials,
  ctx: ActionCtx,
): void {
  const { clerkUserId, scopedRepoId } = credentials;

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────────────────────

  async function getContext(): Promise<{ deployKey: string; userId: string }> {
    const result = await ctx.runAction(internal.mcp.nodeActions.getContext, {
      clerkUserId,
    });
    return result;
  }

  async function getUserRepos(userId: string): Promise<RepoInfo[]> {
    return ctx.runAction(internal.mcp.nodeActions.listUserRepos, { userId });
  }

  async function resolveTargetWithAccess(
    repoId: string,
    deployKey: string,
    userId: string,
  ): Promise<RepoCredentials> {
    if (scopedRepoId && scopedRepoId !== repoId) {
      throw new Error(
        "Access denied: this token is scoped to a different repository.",
      );
    }

    const hasAccess = await ctx.runQuery(
      internal.mcp.queries.checkRepoAccessForUser,
      { repoId, userId },
    );
    if (!hasAccess) {
      throw new Error("Access denied: you do not have access to this repo.");
    }

    const repoCreds = await ctx.runAction(
      internal.mcp.nodeActions.getRepoConvexCredentials,
      { repoId, userId },
    );
    if (!repoCreds) {
      throw new Error(
        `Repo ${repoId} has no Convex credentials. Ensure NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY are set in its env vars in Eva.`,
      );
    }
    return repoCreds;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // list_repos
  // ─────────────────────────────────────────────────────────────────────────────

  server.tool(
    "list_repos",
    "List all GitHub repos you have access to. Call this first to discover available repos and their instructions for data routing (e.g. which backend to query for which data).",
    {},
    async () => {
      const { userId } = await getContext();
      const repos = await getUserRepos(userId);

      const repoList = repos.map((r) => ({
        id: r.id,
        owner: r.owner,
        name: r.name,
        app: r.rootDirectory,
        ...(r.mcpRootPrompt ? { mcpRootPrompt: r.mcpRootPrompt } : {}),
      }));

      const rootPrompts = repos
        .filter((r) => r.mcpRootPrompt)
        .map(
          (r) =>
            `[${r.owner}/${r.name}${r.rootDirectory ? ` (${r.rootDirectory})` : ""}]: ${r.mcpRootPrompt}`,
        );

      if (rootPrompts.length > 0) {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(repoList, null, 2) },
            {
              type: "text" as const,
              text: `\n---\nRepo instructions:\n${rootPrompts.join("\n")}`,
            },
          ],
        };
      }

      return textResult(repoList);
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // list_tables
  // ─────────────────────────────────────────────────────────────────────────────

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

      const tables = await ctx.runAction(internal.mcp.nodeActions.listTables, {
        convexUrl: target.convexUrl,
        deployKey: target.deployKey,
      });

      return textResult(tables);
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // query_table
  // ─────────────────────────────────────────────────────────────────────────────

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

      const result = await ctx.runAction(internal.mcp.nodeActions.queryTable, {
        convexUrl: target.convexUrl,
        deployKey: target.deployKey,
        table,
        order,
        numItems: limit,
        cursor: cursor ?? null,
      });

      return textResult({
        page: result.page,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
        count: result.page.length,
      });
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // get_document
  // ─────────────────────────────────────────────────────────────────────────────

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

      const result = await ctx.runAction(
        internal.mcp.nodeActions.runTestQuery,
        {
          convexUrl: target.convexUrl,
          deployKey: target.deployKey,
          code: `return await ctx.db.get(${JSON.stringify(id)});`,
        },
      );

      const output: { document: unknown; logLines?: string[] } = {
        document: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return textResult(output);
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // run_query
  // ─────────────────────────────────────────────────────────────────────────────

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

      const result = await ctx.runAction(
        internal.mcp.nodeActions.runTestQuery,
        {
          convexUrl: target.convexUrl,
          deployKey: target.deployKey,
          code,
        },
      );

      const output: { result: unknown; logLines?: string[] } = {
        result: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return textResult(output);
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // count_table
  // ─────────────────────────────────────────────────────────────────────────────

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

      const result = await ctx.runAction(
        internal.mcp.nodeActions.runTestQuery,
        {
          convexUrl: target.convexUrl,
          deployKey: target.deployKey,
          code: `const docs = await ctx.db.query(${JSON.stringify(table)}).collect(); return docs.length;`,
        },
      );

      return textResult({ table, count: result.value });
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Task creation tools
  // ─────────────────────────────────────────────────────────────────────────────

  async function resolveRepoByName(
    repoName: string,
    app: string | undefined,
    userId: string,
  ): Promise<{ repo: RepoInfo } | ReturnType<typeof errorResult>> {
    const repos = await getUserRepos(userId);

    const normalizedInput = repoName.toLowerCase();
    const normalizedApp = app?.toLowerCase();

    const nameMatches = repos.filter((r) => {
      const fullName = `${r.owner}/${r.name}`.toLowerCase();
      return (
        fullName === normalizedInput || r.name.toLowerCase() === normalizedInput
      );
    });

    let repo: RepoInfo | undefined;
    if (nameMatches.length === 0) {
      repo = undefined;
    } else if (nameMatches.length === 1) {
      repo = nameMatches[0];
    } else if (normalizedApp) {
      repo = nameMatches.find((r) => {
        if (!r.rootDirectory) return false;
        const rootDir = r.rootDirectory.toLowerCase();
        return (
          rootDir === normalizedApp || rootDir.endsWith(`/${normalizedApp}`)
        );
      });
      if (!repo) {
        const apps = nameMatches
          .map((r) => r.rootDirectory ?? "(root)")
          .join(", ");
        return errorResult(
          `Multiple apps found for "${repoName}" but none matched app "${app}". Available apps: ${apps}`,
        );
      }
    } else {
      const apps = nameMatches
        .map((r) => r.rootDirectory ?? "(root)")
        .join(", ");
      return errorResult(
        `Multiple apps found for "${repoName}". Specify the "app" parameter to disambiguate. Available apps: ${apps}`,
      );
    }

    if (!repo) {
      const available = repos.map((r) => `${r.owner}/${r.name}`).join(", ");
      return errorResult(
        `Repo "${repoName}" not found. Your repos: ${available}`,
      );
    }

    return { repo };
  }

  const taskArgs = {
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
    app: z
      .string()
      .optional()
      .describe(
        'App name within a monorepo (e.g. "web", "mcp", "chrome-extension"). Matches against rootDirectory. Required when a repo has multiple apps.',
      ),
  };

  type TaskInput = {
    title: string;
    description: string;
    repoName: string;
    model?: "opus" | "sonnet" | "haiku";
    baseBranch?: string;
    app?: string;
  };

  async function createTaskForRepo(
    input: TaskInput,
    userId: string,
  ): Promise<
    { taskId: string; repoFullName: string } | ReturnType<typeof errorResult>
  > {
    const resolved = await resolveRepoByName(input.repoName, input.app, userId);
    if ("isError" in resolved) return resolved;
    const { repo } = resolved;

    const taskId = await ctx.runAction(internal.mcp.nodeActions.createTask, {
      clerkUserId,
      repoId: repo.id,
      title: input.title,
      description: input.description,
      model: input.model,
      baseBranch: input.baseBranch,
    });

    return { taskId, repoFullName: `${repo.owner}/${repo.name}` };
  }

  server.tool(
    "create_and_run_task",
    "Create a task on the Eva platform and immediately start execution. Use this to send plans, prompts, or instructions to Eva for autonomous execution against a repo.",
    taskArgs,
    async (input) => {
      const { userId } = await getContext();
      const result = await createTaskForRepo(input, userId);
      if ("isError" in result) return result;

      await ctx.runAction(internal.mcp.nodeActions.startTaskExecution, {
        clerkUserId,
        taskId: result.taskId,
      });

      return textResult({
        taskId: result.taskId,
        repo: result.repoFullName,
        title: input.title,
        status: "execution_started",
      });
    },
  );

  server.tool(
    "create_task",
    "Create a task on the Eva platform without starting execution. Use this to queue tasks for later review or manual execution.",
    taskArgs,
    async (input) => {
      const { userId } = await getContext();
      const result = await createTaskForRepo(input, userId);
      if ("isError" in result) return result;

      return textResult({
        taskId: result.taskId,
        repo: result.repoFullName,
        title: input.title,
        status: "created",
      });
    },
  );

  server.tool(
    "create_tasks_batch",
    `Create multiple tasks at once with dependencies between them, and optionally group them into a project.

Each task in the array has a title, description, and optional dependsOn array of 0-based indices referencing other tasks in the same batch.

Example: [
  { "title": "Setup DB schema", "description": "..." },
  { "title": "Build API", "description": "...", "dependsOn": [0] },
  { "title": "Build UI", "description": "...", "dependsOn": [1] }
]

This creates 3 tasks where Build API depends on Setup DB schema, and Build UI depends on Build API.`,
    {
      repoName: z
        .string()
        .describe(
          'Repo name (e.g. "conductor" or "vedantb2/conductor"). Resolved by matching against your connected repos.',
        ),
      tasks: z
        .array(
          z.object({
            title: z.string().describe("Short task title"),
            description: z
              .string()
              .optional()
              .describe("Full prompt/instructions for the task"),
            dependsOn: z
              .array(z.number())
              .optional()
              .describe(
                "Array of 0-based indices of tasks this task depends on",
              ),
          }),
        )
        .describe("Ordered array of tasks to create"),
      projectTitle: z
        .string()
        .optional()
        .describe(
          "If provided, creates a project with this title and assigns all tasks to it",
        ),
      model: z
        .enum(["opus", "sonnet", "haiku"])
        .optional()
        .describe(
          "Claude model to use for all tasks. If omitted, uses the repo's default model.",
        ),
      baseBranch: z
        .string()
        .optional()
        .describe(
          "Branch to base work off of. If omitted, uses the repo's default base branch.",
        ),
      app: z
        .string()
        .optional()
        .describe(
          'App name within a monorepo (e.g. "web", "mcp"). Required when a repo has multiple apps.',
        ),
    },
    async (input) => {
      const { userId } = await getContext();
      const resolved = await resolveRepoByName(
        input.repoName,
        input.app,
        userId,
      );
      if ("isError" in resolved) return resolved;
      const { repo } = resolved;

      const tasksForMutation = input.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        dependsOn: t.dependsOn,
      }));

      const result = await ctx.runAction(
        internal.mcp.nodeActions.createTasksBatch,
        {
          clerkUserId,
          repoId: repo.id,
          tasks: tasksForMutation,
          projectTitle: input.projectTitle,
          model: input.model,
          baseBranch: input.baseBranch,
        },
      );

      // Result is typed as 'any' from Convex, safely convert to object for spreading
      const batchResult =
        typeof result === "object" && result !== null
          ? (result as Record<string, unknown>)
          : {};

      return textResult({
        repo: `${repo.owner}/${repo.name}`,
        ...batchResult,
        taskCount: input.tasks.length,
        status: "created",
      });
    },
  );
}
