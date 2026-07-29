import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/** agentRuns carry large log blobs — keep pages tiny to stay under the read limit. */
const PAGE_SIZE = 4;

type StripTable =
  | "agentTasks"
  | "agentRuns"
  | "sessions"
  | "projects"
  | "automationRuns"
  | "docs"
  | "designSessions";

type LegacyVercelSandboxIdJson = {
  vercelSandboxId?: string;
};

type StripArgs = {
  dryRun?: boolean;
  table?: StripTable;
  cursor?: string;
  docsPatched?: number;
};

type StripResult = {
  dryRun: boolean;
  done: boolean;
  table: string;
  docsPatched: number;
};

function stripVercelSandboxIdFromAgentTask(
  doc: Doc<"agentTasks">,
): Omit<Doc<"agentTasks">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"agentTasks"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromAgentRun(
  doc: Doc<"agentRuns">,
): Omit<Doc<"agentRuns">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"agentRuns"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromSession(
  doc: Doc<"sessions">,
): Omit<Doc<"sessions">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"sessions"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromProject(
  doc: Doc<"projects">,
): Omit<Doc<"projects">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"projects"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromAutomationRun(
  doc: Doc<"automationRuns">,
): Omit<Doc<"automationRuns">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"automationRuns"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromDoc(
  doc: Doc<"docs">,
): Omit<Doc<"docs">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"docs"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

function stripVercelSandboxIdFromDesignSession(
  doc: Doc<"designSessions">,
): Omit<Doc<"designSessions">, "_id" | "_creationTime"> | null {
  const serialized = JSON.stringify(doc);
  const parsed: Doc<"designSessions"> & LegacyVercelSandboxIdJson =
    JSON.parse(serialized);
  if (!Object.prototype.hasOwnProperty.call(parsed, "vercelSandboxId")) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    vercelSandboxId: omittedVercelSandboxId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedVercelSandboxId;
  return rest;
}

async function paginateAgentTasks(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("agentTasks").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromAgentTask(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      { dryRun, table: "agentTasks", cursor: page.continueCursor, docsPatched },
    );
    return { dryRun, done: false, table: "agentTasks", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "agentRuns", docsPatched },
  );
  return { dryRun, done: false, table: "agentTasks", docsPatched };
}

async function paginateAgentRuns(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("agentRuns").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromAgentRun(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      { dryRun, table: "agentRuns", cursor: page.continueCursor, docsPatched },
    );
    return { dryRun, done: false, table: "agentRuns", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "sessions", docsPatched },
  );
  return { dryRun, done: false, table: "agentRuns", docsPatched };
}

async function paginateSessions(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("sessions").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromSession(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      { dryRun, table: "sessions", cursor: page.continueCursor, docsPatched },
    );
    return { dryRun, done: false, table: "sessions", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "projects", docsPatched },
  );
  return { dryRun, done: false, table: "sessions", docsPatched };
}

async function paginateProjects(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("projects").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromProject(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      { dryRun, table: "projects", cursor: page.continueCursor, docsPatched },
    );
    return { dryRun, done: false, table: "projects", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "automationRuns", docsPatched },
  );
  return { dryRun, done: false, table: "projects", docsPatched };
}

async function paginateAutomationRuns(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("automationRuns").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromAutomationRun(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      {
        dryRun,
        table: "automationRuns",
        cursor: page.continueCursor,
        docsPatched,
      },
    );
    return { dryRun, done: false, table: "automationRuns", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "docs", docsPatched },
  );
  return { dryRun, done: false, table: "automationRuns", docsPatched };
}

async function paginateDocs(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("docs").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromDoc(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      { dryRun, table: "docs", cursor: page.continueCursor, docsPatched },
    );
    return { dryRun, done: false, table: "docs", docsPatched };
  }
  await ctx.scheduler.runAfter(
    0,
    internal.migrations.stripVercelSandboxIdFields,
    { dryRun, table: "designSessions", docsPatched },
  );
  return { dryRun, done: false, table: "docs", docsPatched };
}

async function paginateDesignSessions(
  ctx: MutationCtx,
  args: StripArgs,
): Promise<StripResult> {
  const dryRun = args.dryRun ?? false;
  let docsPatched = args.docsPatched ?? 0;
  const page = await ctx.db.query("designSessions").paginate({
    cursor: args.cursor ?? null,
    numItems: PAGE_SIZE,
  });
  for (const doc of page.page) {
    const cleaned = stripVercelSandboxIdFromDesignSession(doc);
    if (!cleaned) continue;
    docsPatched++;
    if (!dryRun) await ctx.db.replace(doc._id, cleaned);
  }
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.stripVercelSandboxIdFields,
      {
        dryRun,
        table: "designSessions",
        cursor: page.continueCursor,
        docsPatched,
      },
    );
    return { dryRun, done: false, table: "designSessions", docsPatched };
  }
  console.log(
    `[migration] stripVercelSandboxIdFields: patched ${docsPatched} docs${dryRun ? " (dry run)" : ""}`,
  );
  return { dryRun, done: true, table: "designSessions", docsPatched };
}

/**
 * Drops legacy `vercelSandboxId` from prod docs after phase-2 removed it from
 * the schema. Re-add the optional field temporarily, deploy, run this, then
 * remove the field from tableFields again.
 *
 * Run: `npx convex run migrations:stripVercelSandboxIdFields`
 * Dry run: `npx convex run migrations:stripVercelSandboxIdFields '{"dryRun":true}'`
 */
export const stripVercelSandboxIdFields = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    table: v.optional(
      v.union(
        v.literal("agentTasks"),
        v.literal("agentRuns"),
        v.literal("sessions"),
        v.literal("projects"),
        v.literal("automationRuns"),
        v.literal("docs"),
        v.literal("designSessions"),
      ),
    ),
    cursor: v.optional(v.string()),
    docsPatched: v.optional(v.number()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    done: v.boolean(),
    table: v.string(),
    docsPatched: v.number(),
  }),
  handler: async (ctx, args) => {
    const table = args.table ?? "agentTasks";
    switch (table) {
      case "agentTasks":
        return paginateAgentTasks(ctx, args);
      case "agentRuns":
        return paginateAgentRuns(ctx, args);
      case "sessions":
        return paginateSessions(ctx, args);
      case "projects":
        return paginateProjects(ctx, args);
      case "automationRuns":
        return paginateAutomationRuns(ctx, args);
      case "docs":
        return paginateDocs(ctx, args);
      case "designSessions":
        return paginateDesignSessions(ctx, args);
    }
  },
});
