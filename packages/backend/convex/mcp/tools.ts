import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

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
  entityId?: string;
  entityKind?: "session" | "task" | "project";
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
  const { clerkUserId, scopedRepoId, entityId, entityKind } = credentials;

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────────────────────

  async function getContext(): Promise<{ deployKey: string; userId: string }> {
    return ctx.runAction(internal.mcp.nodeActions.getContext, {
      clerkUserId,
    });
  }

  async function getUserRepos(userId: string): Promise<RepoInfo[]> {
    return ctx.runAction(internal.mcp.nodeActions.listUserRepos, { userId });
  }

  async function assertRepoAccess(
    repoId: string,
    userId: string,
  ): Promise<void> {
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
  }

  async function resolveTargetWithAccess(
    repoId: string,
    _deployKey: string,
    userId: string,
    environment: "staging" | "prod",
  ): Promise<RepoCredentials> {
    await assertRepoAccess(repoId, userId);

    const repoCreds = await ctx.runAction(
      internal.mcp.nodeActions.getRepoConvexCredentials,
      { repoId, userId, environment },
    );
    if (!repoCreds) {
      const expected =
        environment === "prod"
          ? "PROD_CONVEX_URL and PROD_CONVEX_DEPLOY_KEY"
          : "CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL/VITE_CONVEX_URL) and CONVEX_DEPLOY_KEY";
      throw new Error(
        `Repo ${repoId} has no Convex credentials for environment "${environment}". Ensure ${expected} are set in its env vars in Eva.`,
      );
    }
    return repoCreds;
  }

  const environmentArg = z
    .enum(["staging", "prod"])
    .default("prod")
    .describe(
      'Which Convex deployment to query. "prod" (default) reads from PROD_CONVEX_URL/PROD_CONVEX_DEPLOY_KEY. "staging" reads from NEXT_PUBLIC_CONVEX_URL/CONVEX_DEPLOY_KEY.',
    );

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

      // Advertise which repos have a Postgres read replica configured, so the
      // agent can pick a postgres_query target without probing each repo.
      const replicaRepoIds = new Set(
        await ctx.runQuery(internal.mcp.queries.reposWithPostgresReplica, {
          repoIds: repos.map((r) => r.id),
        }),
      );

      const repoList = repos.map((r) => ({
        id: r.id,
        owner: r.owner,
        name: r.name,
        app: r.rootDirectory,
        hasPostgresReplica: replicaRepoIds.has(r.id),
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
      environment: environmentArg,
    },
    async ({ repoId, environment }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(
        repoId,
        deployKey,
        userId,
        environment,
      );

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
      environment: environmentArg,
    },
    async ({ table, order, limit, cursor, repoId, environment }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(
        repoId,
        deployKey,
        userId,
        environment,
      );

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
      environment: environmentArg,
    },
    async ({ id, repoId, environment }) => {
      if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        return errorResult(
          "Invalid document ID format. IDs should be alphanumeric.",
        );
      }
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(
        repoId,
        deployKey,
        userId,
        environment,
      );

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
      environment: environmentArg,
    },
    async ({ code, repoId, environment }) => {
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(
        repoId,
        deployKey,
        userId,
        environment,
      );

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
      environment: environmentArg,
    },
    async ({ table, repoId, environment }) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return errorResult(
          "Invalid table name. Use alphanumeric characters and underscores.",
        );
      }
      const { deployKey, userId } = await getContext();
      const target = await resolveTargetWithAccess(
        repoId,
        deployKey,
        userId,
        environment,
      );

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
  // postgres_query
  // ─────────────────────────────────────────────────────────────────────────────

  server.tool(
    "postgres_query",
    `Run read-only SQL against a repo's Postgres read replica (the POSTGRES_READ_REPLICA_URL env var configured for the repo in Eva).

Constraints:
- Read-only: every query runs inside a READ ONLY transaction; writes fail.
- Single statement only — multi-statement SQL (e.g. "SELECT 1; SELECT 2") is rejected.
- 30 second statement timeout.
- Always add a LIMIT — large result sets are truncated to the limit and a ~1 MB byte cap.

For schema discovery, query information_schema (e.g. "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").`,
    {
      sql: z.string().describe("A single read-only SQL statement to execute."),
      limit: z
        .number()
        .max(1000)
        .default(100)
        .describe("Max rows to return (default 100, max 1000)."),
      repoId: z
        .string()
        .describe(
          "Repo ID from list_repos. Required to specify which repo's read replica to query.",
        ),
    },
    async ({ sql, limit, repoId }) => {
      const { userId } = await getContext();
      await assertRepoAccess(repoId, userId);

      const result = await ctx.runAction(
        internal.mcp.postgres.runPostgresQuery,
        { repoId, sql, maxRows: limit },
      );

      if (!result.ok) {
        if (result.errorCode === "missing_config") {
          return errorResult(
            `This repo has no Postgres read replica configured. Add a POSTGRES_READ_REPLICA_URL env var in the repo's Environment Variables settings in Eva (append "?sslmode=require" if the server needs TLS, and mark it as excluded from sandboxes so the URL never reaches task sandboxes).`,
          );
        }
        return errorResult(`Postgres query failed: ${result.error}`);
      }

      return textResult({
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rowCount,
        truncated: result.truncated,
      });
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
        'Repo name (e.g. "eva" or "vvedantb/eva"). Resolved by matching against your connected repos.',
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
    projectId: z
      .string()
      .optional()
      .describe(
        "Optional project ID (Convex ID from the projects table) to attach this task to. When provided, the task's number is automatically set to the next position in the project.",
      ),
  };

  type TaskInput = {
    title: string;
    description: string;
    repoName: string;
    model?: "opus" | "sonnet" | "haiku";
    baseBranch?: string;
    app?: string;
    projectId?: string;
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
      projectId: input.projectId,
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
          'Repo name (e.g. "eva" or "vvedantb/eva"). Resolved by matching against your connected repos.',
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

      // Result is typed as 'any' from Convex; launder to unknown, then narrow to
      // an object before spreading so no assertion is needed.
      const rawResult: unknown = result;
      const batchResult =
        typeof rawResult === "object" && rawResult !== null
          ? { ...rawResult }
          : {};

      return textResult({
        repo: `${repo.owner}/${repo.name}`,
        ...batchResult,
        taskCount: input.tasks.length,
        status: "created",
      });
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Eva document tools (the `docs` table — design docs/PRDs stored on Eva)
  //
  // NOTE: distinct from `get_document`, which reads a row from a CONNECTED
  // repo's database. These operate on Eva's own docs.
  // ─────────────────────────────────────────────────────────────────────────────

  server.tool(
    "create_eva_doc",
    "Create a design document (PRD) stored on the Eva platform, attached to one of your repos. This is Eva's own document store — NOT a connected repo's database (use get_document for that).",
    {
      repoName: z
        .string()
        .describe(
          'Repo to attach the doc to (e.g. "eva" or "vvedantb/eva"). Resolved against your connected repos.',
        ),
      title: z.string().describe("Document title"),
      content: z.string().describe("Document body as markdown"),
      app: z
        .string()
        .optional()
        .describe(
          'App name within a monorepo (e.g. "web"). Required when a repo has multiple apps.',
        ),
    },
    async ({ repoName, title, content, app }) => {
      const { userId } = await getContext();
      const resolved = await resolveRepoByName(repoName, app, userId);
      if ("isError" in resolved) return resolved;
      const { repo } = resolved;

      const docId = await ctx.runAction(internal.mcp.nodeActions.createEvaDoc, {
        clerkUserId,
        repoId: repo.id,
        title,
        content,
      });

      return textResult({
        docId,
        repo: `${repo.owner}/${repo.name}`,
        title,
        status: "created",
      });
    },
  );

  server.tool(
    "get_eva_doc",
    "Get a single Eva design document (PRD) by its Eva doc ID. Returns null if it does not exist or you lack access.",
    {
      docId: z
        .string()
        .describe("The Eva doc ID (from create_eva_doc or list_eva_docs)"),
    },
    async ({ docId }) => {
      // Resolve identity first (ensures the Eva user row exists) so the
      // as-user query can authenticate.
      await getContext();
      const doc = await ctx.runAction(internal.mcp.nodeActions.getEvaDoc, {
        clerkUserId,
        docId,
      });
      return textResult({ document: doc });
    },
  );

  server.tool(
    "list_eva_docs",
    "List all Eva design documents (PRDs) attached to one of your repos.",
    {
      repoName: z
        .string()
        .describe(
          'Repo whose docs to list (e.g. "eva"). Resolved against your connected repos.',
        ),
      app: z
        .string()
        .optional()
        .describe(
          "App name within a monorepo. Required when a repo has multiple apps.",
        ),
      kind: z
        .enum(["document", "pr-recap"])
        .optional()
        .describe("Filter by doc kind. Omit to list all docs."),
    },
    async ({ repoName, app, kind }) => {
      const { userId } = await getContext();
      const resolved = await resolveRepoByName(repoName, app, userId);
      if ("isError" in resolved) return resolved;
      const { repo } = resolved;

      const docs = await ctx.runAction(internal.mcp.nodeActions.listEvaDocs, {
        clerkUserId,
        repoId: repo.id,
        kind,
      });
      return textResult({ repo: `${repo.owner}/${repo.name}`, docs });
    },
  );

  server.tool(
    "update_eva_doc",
    "Update an Eva design document (PRD). Only the fields you pass are changed.",
    {
      docId: z.string().describe("The Eva doc ID to update"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New markdown body"),
      description: z.string().optional().describe("New short description"),
    },
    async ({ docId, title, content, description }) => {
      await getContext();
      await ctx.runAction(internal.mcp.nodeActions.updateEvaDoc, {
        clerkUserId,
        docId,
        title,
        content,
        description,
      });
      return textResult({ docId, status: "updated" });
    },
  );

  server.tool(
    "trigger_pr_recap",
    "Start PR visual recap generation for a pull request. Requires prRecapsEnabled on the repo. Returns a pending Eva doc id — poll with get_pr_recap until prRecapStatus is ready.",
    {
      repoName: z.string().describe("Repository name (e.g. eva or owner/repo)"),
      prNumber: z
        .number()
        .int()
        .positive()
        .describe("GitHub pull request number"),
      app: z
        .string()
        .optional()
        .describe("Monorepo app name when the repo has multiple apps"),
    },
    async ({ repoName, prNumber, app }) => {
      const { userId } = await getContext();
      const resolved = await resolveRepoByName(repoName, app, userId);
      if ("isError" in resolved) return resolved;
      const { repo } = resolved;
      await assertRepoAccess(repo.id, userId);

      const result = await ctx.runAction(
        internal.mcp.nodeActions.triggerPrRecap,
        {
          clerkUserId,
          repoId: repo.id,
          prNumber,
        },
      );

      return textResult({
        repo: `${repo.owner}/${repo.name}`,
        ...result,
      });
    },
  );

  server.tool(
    "get_pr_recap",
    "Get a PR visual recap doc by Eva doc id or by repo + GitHub prUrl.",
    {
      docId: z.string().optional().describe("Eva doc id from trigger_pr_recap"),
      repoName: z
        .string()
        .optional()
        .describe("Repo name when looking up by prUrl"),
      prUrl: z
        .string()
        .optional()
        .describe("GitHub pull request URL (use with repoName)"),
      app: z.string().optional().describe("Monorepo app name"),
    },
    async ({ docId, repoName, prUrl, app }) => {
      const { userId } = await getContext();

      if (docId) {
        const document = await ctx.runAction(
          internal.mcp.nodeActions.getPrRecap,
          {
            clerkUserId,
            docId,
          },
        );
        return textResult({ document });
      }

      if (repoName && prUrl) {
        const resolved = await resolveRepoByName(repoName, app, userId);
        if ("isError" in resolved) return resolved;
        const document = await ctx.runAction(
          internal.mcp.nodeActions.getPrRecap,
          {
            clerkUserId,
            repoId: resolved.repo.id,
            prUrl,
          },
        );
        return textResult({ document });
      }

      return errorResult("Provide docId or repoName + prUrl");
    },
  );

  server.tool(
    "publish_pr_recap",
    "Publish finalized PR recap markdown to an existing recap doc and upsert the sticky GitHub comment. Equivalent to Agent-Native create-visual-recap.",
    {
      docId: z.string().describe("Eva PR recap doc id"),
      content: z.string().describe("Recap body as markdown"),
      headSha: z.string().describe("PR head commit SHA this recap reflects"),
      status: z
        .enum(["ready", "error"])
        .describe("Whether generation succeeded"),
      errorMessage: z
        .string()
        .optional()
        .describe("Error message when status is error"),
    },
    async ({ docId, content, headSha, status, errorMessage }) => {
      await getContext();
      const result = await ctx.runAction(
        internal.mcp.nodeActions.publishPrRecap,
        {
          clerkUserId,
          docId,
          content,
          headSha,
          status,
          errorMessage,
        },
      );
      return textResult(result);
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Team + artifact tools
  // ─────────────────────────────────────────────────────────────────────────────

  async function getUserTeams(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    return ctx.runAction(internal.mcp.nodeActions.listUserTeams, { userId });
  }

  async function resolveTeam(
    teamId: string | undefined,
    userId: string,
  ): Promise<{ teamId: string } | ReturnType<typeof errorResult>> {
    const teams = await getUserTeams(userId);
    if (teams.length === 0) {
      return errorResult(
        "You are not a member of any team. Create a team in Eva before saving artifacts.",
      );
    }

    let chosen: { id: string; name: string } | undefined;
    if (teamId) {
      chosen = teams.find((t) => t.id === teamId);
      if (!chosen) {
        const available = teams.map((t) => `${t.name} (${t.id})`).join(", ");
        return errorResult(
          `Team "${teamId}" not found or you are not a member. Your teams: ${available}`,
        );
      }
    } else if (teams.length === 1) {
      chosen = teams[0];
    } else {
      const available = teams.map((t) => `${t.name} (${t.id})`).join(", ");
      return errorResult(
        `You belong to multiple teams. Pass teamId to choose one (call list_teams). Your teams: ${available}`,
      );
    }

    if (!chosen) return errorResult("Could not resolve a team.");
    return { teamId: chosen.id };
  }

  server.tool(
    "list_teams",
    "List the teams you belong to on Eva. Use this to find a teamId for create_artifact.",
    {},
    async () => {
      const { userId } = await getContext();
      const teams = await getUserTeams(userId);
      return textResult(teams);
    },
  );

  server.tool(
    "create_artifact",
    `Save an HTML artifact to Eva and get back a hosted link to view it.

Provide a self-contained HTML document (inline CSS/JS, or CDN links). Eva stores it and hosts it in a sandboxed iframe at the returned viewUrl. The link is viewable by members of the bound team while signed in to Eva.

Do NOT use this for session walkthrough recordings, screen captures, or screenshots. For those, save the file under repo-root recordings/ or screenshots/ with agent-browser and leave it on disk — Eva attaches it to the chat message with the built-in video/image player.`,
    {
      name: z.string().describe("Artifact name/title"),
      html: z
        .string()
        .describe("The full, self-contained HTML document to host"),
      description: z.string().optional().describe("Optional short description"),
      teamId: z
        .string()
        .optional()
        .describe(
          "Team to bind the artifact to (from list_teams). Optional if you belong to exactly one team.",
        ),
      declaredTools: z
        .array(z.string())
        .optional()
        .describe(
          "Optional list of Eva MCP tool names the artifact calls (advisory).",
        ),
    },
    async ({ name, html, description, teamId, declaredTools }) => {
      const { userId } = await getContext();
      const resolved = await resolveTeam(teamId, userId);
      if ("isError" in resolved) return resolved;

      const result = await ctx.runAction(
        internal.mcp.nodeActions.createArtifact,
        {
          clerkUserId,
          name,
          html,
          description,
          boundTeamId: resolved.teamId,
          declaredTools: declaredTools ?? [],
        },
      );

      return textResult({
        artifactId: result.artifactId,
        viewUrl: result.viewUrl,
        name,
        status: "created",
      });
    },
  );

  server.tool(
    "get_artifact",
    "Get a saved Eva artifact by its ID, including its hosted view URL.",
    {
      artifactId: z
        .string()
        .describe("The artifact ID (from create_artifact or list_artifacts)"),
    },
    async ({ artifactId }) => {
      await getContext();
      const result = await ctx.runAction(internal.mcp.nodeActions.getArtifact, {
        clerkUserId,
        artifactId,
      });
      if (result === null) return textResult({ artifact: null });
      return textResult(result);
    },
  );

  server.tool(
    "list_artifacts",
    "List all Eva artifacts across the teams you belong to, each with its hosted view URL.",
    {},
    async () => {
      await getContext();
      const artifacts = await ctx.runAction(
        internal.mcp.nodeActions.listArtifacts,
        { clerkUserId },
      );
      return textResult({ artifacts });
    },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Browser tools (shared desktop Chrome via CDP — session/task/project sandboxes)
  // ─────────────────────────────────────────────────────────────────────────────

  function requireBrowserEntity():
    | { entityKind: "session" | "task" | "project"; entityId: string }
    | ReturnType<typeof errorResult> {
    if (entityKind === undefined || entityId === undefined) {
      return errorResult(
        "browser_* tools require a session, task, or project sandbox (token has no entity).",
      );
    }
    return { entityKind, entityId };
  }

  server.tool(
    "browser_start",
    "Start the sandbox's shared desktop Chrome (CDP on port 9222) so the user can watch live in the Browser tab. Then run `agent-browser connect 9222` once and use agent-browser commands against that browser.",
    {},
    async () => {
      const entity = requireBrowserEntity();
      if ("isError" in entity) return entity;

      const result = await ctx.runAction(
        internal.daytona.startDesktopForBrowserEntity,
        {
          entityKind: entity.entityKind,
          entityId: entity.entityId,
          clerkUserId,
        },
      );
      if (!result.ok) return errorResult(result.message);
      return {
        content: [{ type: "text" as const, text: result.message }],
      };
    },
  );

  server.tool(
    "browser_lock",
    "Signal that you are actively driving the shared browser. Switches the user's UI to the Browser tab and shows a takeover overlay. Call before interacting; pair with browser_unlock when done.",
    {},
    async () => {
      const entity = requireBrowserEntity();
      if ("isError" in entity) return entity;

      await ctx.runMutation(internal.mcp.browserLock.setAgentBrowsingAt, {
        entityKind: entity.entityKind,
        entityId: entity.entityId,
        locked: true,
      });
      return textResult({ locked: true });
    },
  );

  server.tool(
    "browser_unlock",
    "Clear the agent-browsing soft lock so the user can interact freely in the Browser/Computer tab again.",
    {},
    async () => {
      const entity = requireBrowserEntity();
      if ("isError" in entity) return entity;

      await ctx.runMutation(internal.mcp.browserLock.setAgentBrowsingAt, {
        entityKind: entity.entityKind,
        entityId: entity.entityId,
        locked: false,
      });
      return textResult({ locked: false });
    },
  );
}
