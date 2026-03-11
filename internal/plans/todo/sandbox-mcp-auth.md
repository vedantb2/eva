# Sandbox MCP Auth — Delegated Internal Tokens

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let sandboxes access the MCP server via short-lived delegated tokens instead of raw CONVEX_DEPLOY_KEY, and add env var scoping so sensitive keys never enter sandboxes.

**Architecture:** Eva's backend mints delegated JWTs (8h TTL, signed with MCP_INTERNAL_SECRET) for sandbox sessions. The MCP server accepts these alongside OAuth tokens. Env vars gain a `sandboxExclude` flag so keys like CONVEX_DEPLOY_KEY are stored but never injected into sandboxes. The research query workflow switches from direct Convex API calls to MCP's `run_query` tool.

**Tech Stack:** Convex, Express (MCP server), jsonwebtoken, Next.js (env var UI)

---

## Chunk 1: Env Var Scoping (sandbox exclusion)

### Task 1: Add `sandboxExclude` flag to env var storage

**Files:**

- Modify: `packages/backend/convex/schema.ts:273-277` (repoEnvVars table)
- Modify: `packages/backend/convex/schema.ts:331-335` (teamEnvVars table)

- [ ] **Step 1: Update repoEnvVars schema**

Add `sandboxExclude` to the vars array object:

```typescript
repoEnvVars: defineTable({
  repoId: v.id("githubRepos"),
  vars: v.array(v.object({ key: v.string(), value: v.string(), sandboxExclude: v.optional(v.boolean()) })),
  updatedAt: v.number(),
}).index("by_repo", ["repoId"]),
```

- [ ] **Step 2: Update teamEnvVars schema**

Same change:

```typescript
teamEnvVars: defineTable({
  teamId: v.id("teams"),
  vars: v.array(v.object({ key: v.string(), value: v.string(), sandboxExclude: v.optional(v.boolean()) })),
  updatedAt: v.number(),
}).index("by_team", ["teamId"]),
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/schema.ts
git commit -m "feat: add sandboxExclude flag to env var schema"
```

### Task 2: Filter excluded vars in sandbox resolution

**Files:**

- Modify: `packages/backend/convex/repoEnvVars.ts`
- Modify: `packages/backend/convex/teamEnvVars.ts`
- Modify: `packages/backend/convex/repoEnvVarsActions.ts`
- Modify: `packages/backend/convex/teamEnvVarsActions.ts`

- [ ] **Step 1: Update repoEnvVars.getForSandbox to filter excluded vars**

In `packages/backend/convex/repoEnvVars.ts`, `getForSandbox` handler:

```typescript
handler: async (ctx, args) => {
  const doc = await ctx.db
    .query("repoEnvVars")
    .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
    .first();
  if (!doc) return [];
  return doc.vars.filter((entry) => !entry.sandboxExclude);
},
```

- [ ] **Step 2: Update teamEnvVars.getForSandbox to filter excluded vars**

Same pattern in `packages/backend/convex/teamEnvVars.ts`.

- [ ] **Step 3: Update repoEnvVars.list to return sandboxExclude flag**

Update the return validator and mapping in `repoEnvVars.list`:

```typescript
returns: v.array(v.object({ key: v.string(), value: v.string(), sandboxExclude: v.boolean() })),
handler: async (ctx, args) => {
  const doc = await ctx.db
    .query("repoEnvVars")
    .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
    .first();
  if (!doc) return [];
  return doc.vars.map((entry) => ({ key: entry.key, value: "••••••", sandboxExclude: entry.sandboxExclude ?? false }));
},
```

- [ ] **Step 4: Same for teamEnvVars.list**

- [ ] **Step 5: Update upsertVarInternal in both files to accept sandboxExclude**

Add `sandboxExclude: v.optional(v.boolean())` to args. When pushing a new var entry, include `sandboxExclude: args.sandboxExclude ?? false`.

- [ ] **Step 6: Update repoEnvVarsActions.upsertVar and teamEnvVarsActions.upsertVar**

Pass `sandboxExclude` through from args to the internal mutation.

- [ ] **Step 7: Add toggleSandboxExclude mutation to both repoEnvVars.ts and teamEnvVars.ts**

```typescript
export const toggleSandboxExclude = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
    sandboxExclude: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return null;
    const vars = doc.vars.map((entry) =>
      entry.key === args.key
        ? { ...entry, sandboxExclude: args.sandboxExclude }
        : entry,
    );
    await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    return null;
  },
});
```

For teamEnvVars, same but with `teamId` instead of `repoId`.

- [ ] **Step 8: Commit**

```bash
git add packages/backend/convex/repoEnvVars.ts packages/backend/convex/teamEnvVars.ts packages/backend/convex/repoEnvVarsActions.ts packages/backend/convex/teamEnvVarsActions.ts
git commit -m "feat: filter sandbox-excluded env vars from sandbox injection"
```

### Task 3: Migration — auto-set sandboxExclude on existing CONVEX_DEPLOY_KEY entries

**Files:**

- Create: `packages/backend/convex/migrations/sandboxExcludeDeployKey.ts` (temporary)

- [ ] **Step 1: Write migration function**

```typescript
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const run = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const repoDocs = await ctx.db.query("repoEnvVars").collect();
    for (const doc of repoDocs) {
      const updated = doc.vars.map((entry) =>
        entry.key === "CONVEX_DEPLOY_KEY" || entry.key === "CONVEX_ADMIN_KEY"
          ? { ...entry, sandboxExclude: true }
          : entry,
      );
      await ctx.db.patch(doc._id, { vars: updated, updatedAt: Date.now() });
    }

    const teamDocs = await ctx.db.query("teamEnvVars").collect();
    for (const doc of teamDocs) {
      const updated = doc.vars.map((entry) =>
        entry.key === "CONVEX_DEPLOY_KEY" || entry.key === "CONVEX_ADMIN_KEY"
          ? { ...entry, sandboxExclude: true }
          : entry,
      );
      await ctx.db.patch(doc._id, { vars: updated, updatedAt: Date.now() });
    }
    return null;
  },
});
```

- [ ] **Step 2: Deploy and run the migration**

- [ ] **Step 3: Delete the migration file after running**

- [ ] **Step 4: Commit the deletion**

```bash
git add packages/backend/convex/migrations/
git commit -m "chore: clean up sandboxExclude migration"
```

### Task 4: Update env var UI to show sandbox exclusion

**Files:**

- Modify: `apps/web/lib/components/EnvVarsTable.tsx`
- Modify: `apps/web/app/(repo)/[owner]/[repo]/settings/env-variables/EnvVariablesClient.tsx`
- Modify: `apps/web/app/(repo)/[owner]/[repo]/settings/env-variables/TeamEnvVarsClient.tsx`

- [ ] **Step 1: Update EnvVarsTable interface**

Add `sandboxExclude` to the `EnvVar` interface:

```typescript
interface EnvVar {
  key: string;
  value: string;
  sandboxExclude: boolean;
}
```

Add `onToggleSandboxExclude` to props:

```typescript
interface EnvVarsTableProps {
  vars: EnvVar[] | undefined;
  onUpsert?: (
    key: string,
    value: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  onReveal?: (key: string) => Promise<string | null>;
  onRemove?: (key: string) => Promise<void>;
  onToggleSandboxExclude?: (
    key: string,
    sandboxExclude: boolean,
  ) => Promise<void>;
  description: string;
  readOnly?: boolean;
}
```

- [ ] **Step 2: Add sandbox exclusion toggle to each env var row**

In the actions column (before edit/delete), add a lock toggle button:

```tsx
<Button
  size="icon-sm"
  variant="ghost"
  onClick={() => onToggleSandboxExclude?.(v.key, !v.sandboxExclude)}
  title={
    v.sandboxExclude
      ? "MCP only — not injected into sandbox (click to allow)"
      : "Available in sandbox (click to restrict to MCP only)"
  }
>
  {v.sandboxExclude ? (
    <IconLock size={14} className="text-amber-500" />
  ) : (
    <IconLockOpen size={14} />
  )}
</Button>
```

Import `IconLock` and `IconLockOpen` from `@tabler/icons-react`.

- [ ] **Step 3: Add sandboxExclude checkbox to "add variable" row**

When adding a new var, add a small checkbox: "Exclude from sandbox". Default unchecked. Pass the value through `onUpsert`.

- [ ] **Step 4: Update handleAdd and handleBulkImport to pass sandboxExclude**

`handleAdd` passes the checkbox state. `handleBulkImport` defaults to `false`.

- [ ] **Step 5: Update EnvVariablesClient to pass new props**

```typescript
const toggleSandboxExclude = useMutation(api.repoEnvVars.toggleSandboxExclude);

<EnvVarsTable
  vars={vars}
  onUpsert={async (key, value, sandboxExclude) => {
    await upsertVar({ repoId, key, value, sandboxExclude });
  }}
  onReveal={(key) => revealValue({ repoId, key })}
  onRemove={async (key) => {
    await removeVar({ repoId, key });
  }}
  onToggleSandboxExclude={async (key, sandboxExclude) => {
    await toggleSandboxExclude({ repoId, key, sandboxExclude });
  }}
  description="Repo-specific variables injected into sandboxes for this repository."
/>
```

- [ ] **Step 6: Update TeamEnvVarsClient with same pattern**

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/components/EnvVarsTable.tsx apps/web/app/(repo)/[owner]/[repo]/settings/env-variables/EnvVariablesClient.tsx apps/web/app/(repo)/[owner]/[repo]/settings/env-variables/TeamEnvVarsClient.tsx
git commit -m "feat: env var sandbox exclusion toggle in UI"
```

---

## Chunk 2: Internal MCP Auth — Token Minting & Verification

### Task 5: Add internal token verification to MCP server with repoId scoping

**Files:**

- Modify: `apps/mcp/src/auth.ts`
- Modify: `apps/mcp/src/tools.ts`

- [ ] **Step 1: Update ConvexCredentials to carry optional scopedRepoId**

In `apps/mcp/src/auth.ts`:

```typescript
export interface ConvexCredentials {
  convexUrl: string;
  clerkUserId: string;
  scopedRepoId?: string; // Set for internal sandbox tokens — enforces single-repo access
}
```

- [ ] **Step 2: Add internal secret getter**

```typescript
function getInternalSecret(): string {
  const secret = process.env.MCP_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("MCP_INTERNAL_SECRET environment variable is required");
  }
  return secret;
}
```

- [ ] **Step 3: Add internal token schema and verification**

```typescript
const internalTokenPayloadSchema = z.object({
  sub: z.string(),
  iss: z.literal("eva"),
  aud: z.literal("mcp-internal"),
  repoId: z.string(),
});

export async function verifyInternalToken(
  token: string,
): Promise<ConvexCredentials | null> {
  try {
    const decoded = jwt.verify(token, getInternalSecret());
    const payload = internalTokenPayloadSchema.safeParse(decoded);
    if (!payload.success) return null;
    return {
      convexUrl: getConvexUrl(),
      clerkUserId: payload.data.sub,
      scopedRepoId: payload.data.repoId,
    };
  } catch {
    return null;
  }
}
```

No `verifyClerkUserExists` call — Eva already verified the user when minting.

- [ ] **Step 4: Refactor verifyToken to try both paths**

Rename existing `verifyToken` to `verifyOAuthToken`. Create new `verifyToken`:

```typescript
async function verifyOAuthToken(
  token: string,
): Promise<ConvexCredentials | null> {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const payload = mcpTokenPayloadSchema.safeParse(decoded);
    if (!payload.success) return null;
    const clerkUserId = payload.data.sub;
    const userExists = await verifyClerkUserExists(clerkUserId);
    if (!userExists) return null;
    return { convexUrl: getConvexUrl(), clerkUserId };
  } catch {
    return null;
  }
}

export async function verifyToken(
  token: string,
): Promise<ConvexCredentials | null> {
  const oauthResult = await verifyOAuthToken(token);
  if (oauthResult) return oauthResult;
  return verifyInternalToken(token);
}
```

- [ ] **Step 5: Enforce repoId scoping in tools.ts**

In `apps/mcp/src/tools.ts`, update `resolveTargetWithAccess` to check `scopedRepoId`:

```typescript
async function resolveTargetWithAccess(
  repoId: string,
  deployKey: string,
  userId: string,
): Promise<{ convexUrl: string; deployKey: string }> {
  if (credentials.scopedRepoId && credentials.scopedRepoId !== repoId) {
    throw new Error(
      "Access denied: this token is scoped to a different repository.",
    );
  }
  const hasAccess = await checkRepoAccess(convexUrl, deployKey, repoId, userId);
  // ... rest unchanged
}
```

This means: OAuth tokens (no `scopedRepoId`) can access any repo the user has access to. Internal sandbox tokens can only access the single repo they were minted for.

- [ ] **Step 6: Commit**

```bash
git add apps/mcp/src/auth.ts apps/mcp/src/tools.ts
git commit -m "feat: add internal token verification with repoId scoping to MCP auth"
```

### Task 6: Add token minting endpoint to MCP server

**Files:**

- Modify: `apps/mcp/src/auth.ts`
- Modify: `apps/mcp/src/index.ts`

- [ ] **Step 1: Add mintInternalToken function in auth.ts**

```typescript
const mintRequestSchema = z.object({
  clerkUserId: z.string(),
  repoId: z.string(),
});

export function mintInternalToken(
  body: Record<string, string>,
  bootstrapSecret: string,
): { token: string; expiresIn: number } | null {
  const expected = process.env.MCP_BOOTSTRAP_SECRET;
  if (!expected || bootstrapSecret !== expected) return null;

  const parsed = mintRequestSchema.safeParse(body);
  if (!parsed.success) return null;

  const expiresIn = 28800; // 8 hours
  const token = jwt.sign(
    {
      sub: parsed.data.clerkUserId,
      iss: "eva",
      aud: "mcp-internal",
      repoId: parsed.data.repoId,
    },
    getInternalSecret(),
    { expiresIn },
  );

  return { token, expiresIn };
}
```

- [ ] **Step 2: Add POST /api/internal/mint-token route in index.ts**

```typescript
import { mintInternalToken } from "./auth.js";

app.post("/api/internal/mint-token", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("MCPBootstrap ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const secret = auth.slice("MCPBootstrap ".length);
  const body = bodyToStringRecord(req);
  const result = mintInternalToken(body, secret);
  if (!result) {
    res.status(403).json({ error: "Invalid credentials or request" });
    return;
  }
  res.json(result);
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mcp/src/auth.ts apps/mcp/src/index.ts
git commit -m "feat: add internal token minting endpoint for sandbox auth"
```

### Task 7: Add token minting to Eva's backend

**Files:**

- Create: `packages/backend/convex/mcpTokenMinter.ts`
- Modify: `packages/backend/convex/users.ts` (add getInternal)

- [ ] **Step 1: Add users.getInternal internalQuery**

In `packages/backend/convex/users.ts`:

```typescript
export const getInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.object({ clerkId: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { clerkId: user.clerkId };
  },
});
```

- [ ] **Step 2: Create mcpTokenMinter.ts**

```typescript
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

function getMcpBaseUrl(): string {
  const url = process.env.MCP_BASE_URL;
  if (!url) throw new Error("MCP_BASE_URL environment variable is required");
  return url.replace(/\/$/, "");
}

function getMcpBootstrapSecret(): string {
  const secret = process.env.MCP_BOOTSTRAP_SECRET;
  if (!secret)
    throw new Error("MCP_BOOTSTRAP_SECRET environment variable is required");
  return secret;
}

export const mintSandboxMcpToken = internalAction({
  args: {
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({ token: v.string(), expiresIn: v.number() }),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getInternal, {
      userId: args.userId,
    });
    if (!user) throw new Error("User not found");

    const response = await fetch(`${getMcpBaseUrl()}/api/internal/mint-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `MCPBootstrap ${getMcpBootstrapSecret()}`,
      },
      body: JSON.stringify({
        clerkUserId: user.clerkId,
        repoId: String(args.repoId),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mint MCP token: HTTP ${response.status}`);
    }

    const result = await response.json();
    return { token: String(result.token), expiresIn: Number(result.expiresIn) };
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/mcpTokenMinter.ts packages/backend/convex/users.ts
git commit -m "feat: add MCP token minting action for sandbox sessions"
```

---

## Chunk 3: Wire Sandbox → MCP

### Task 8: Pass MCP token to sandbox and configure Claude Code MCP

**Files:**

- Modify: `packages/backend/convex/_daytona/helpers.ts` (signAndLaunchScript)
- Modify: `packages/backend/convex/_daytona/execution.ts` (launchOnExistingSandbox)
- Modify: `packages/backend/convex/_daytona/launch.ts`

- [ ] **Step 1: Update signAndLaunchScript to accept repoId and mint MCP token**

In `packages/backend/convex/_daytona/helpers.ts`, add `repoId: Id<"githubRepos">` parameter after `entityId`:

```typescript
export async function signAndLaunchScript(
  ctx: GenericActionCtx<DataModel>,
  sandbox: Sandbox,
  userId: Id<"users">,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  entityId: string,
  repoId: Id<"githubRepos">,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
  } = {},
): Promise<void> {
  const sandboxToken = await ctx.runAction(
    internal.sandboxJwt.signSandboxToken,
    { userId },
  );

  const mcpToken = await ctx.runAction(
    internal.mcpTokenMinter.mintSandboxMcpToken,
    { userId, repoId },
  );

  const streamingEntityId = opts.extraEnvVars?.STREAMING_ENTITY_ID ?? entityId;
  const streamingHmac = computeStreamingHmac(streamingEntityId);
  const convexSiteUrl = process.env.CONVEX_SITE_URL ?? "";
  const mcpBaseUrl = process.env.MCP_BASE_URL ?? "";

  await launchScript(
    sandbox,
    prompt,
    completionMutation,
    entityIdField,
    sandboxToken,
    entityId,
    {
      ...opts,
      extraEnvVars: {
        ...opts.extraEnvVars,
        STREAMING_HMAC: streamingHmac,
        CONVEX_SITE_URL: convexSiteUrl,
      },
      mcpToken: mcpToken.token,
      mcpBaseUrl,
    },
  );
}
```

- [ ] **Step 2: Update launchOnExistingSandbox to pass repoId**

In `packages/backend/convex/_daytona/execution.ts`, pass `args.repoId` to `signAndLaunchScript`:

```typescript
await signAndLaunchScript(
  ctx,
  sandbox,
  args.userId,
  args.prompt,
  args.completionMutation,
  args.entityIdField,
  args.entityId,
  args.repoId,
  {
    model: args.model,
    allowedTools: args.allowedTools,
    systemPrompt: args.systemPrompt,
    extraEnvVars:
      Object.keys(extraEnvVars).length > 0 ? extraEnvVars : undefined,
    claudeSessionId,
  },
);
```

- [ ] **Step 3: Update launchScript to write Claude Code MCP config**

In `packages/backend/convex/_daytona/launch.ts`, add `mcpToken` and `mcpBaseUrl` to opts type:

```typescript
export async function launchScript(
  sandbox: Sandbox,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  convexToken: string,
  entityId: string,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
    mcpToken?: string;
    mcpBaseUrl?: string;
  } = {},
): Promise<void> {
```

After uploading the design prompt and run script, write the Claude Code MCP config:

```typescript
if (opts.mcpBaseUrl && opts.mcpToken) {
  const claudeConfig = JSON.stringify({
    mcpServers: {
      eva: {
        url: `${opts.mcpBaseUrl}/mcp`,
        headers: {
          Authorization: `Bearer ${opts.mcpToken}`,
        },
      },
    },
  });
  await sandbox.fs.uploadFile(
    Buffer.from(claudeConfig, "utf-8"),
    "/home/daytona/.claude.json",
  );
}
```

Note: The Claude volume mounts at `/home/daytona/.claude` (see `volumes.ts`). The `.claude.json` config lives at `/home/daytona/.claude.json` (sibling to the `.claude/` directory). If a session has a mounted volume, check whether the volume mount would shadow this file. The file is at `.claude.json`, not inside `.claude/`, so it should be fine.

- [ ] **Step 4: Commit**

```bash
git add packages/backend/convex/_daytona/helpers.ts packages/backend/convex/_daytona/execution.ts packages/backend/convex/_daytona/launch.ts
git commit -m "feat: mint and inject MCP token into sandbox sessions"
```

### Task 9: Migrate research query workflow to use MCP

**Files:**

- Modify: `packages/backend/convex/researchQueryWorkflow.ts`

- [ ] **Step 1: Update buildAnalysePrompt to use MCP instead of direct Convex API**

The current prompt tells the sandbox to use `process.env.CONVEX_DEPLOY_KEY` and `/api/run_test_function` directly. Replace with MCP `run_query` tool:

```typescript
function buildAnalysePrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Execute the provided Convex database query and analyze the results.

## How to Execute
Use the Eva MCP server's run_query tool. It is pre-configured and available automatically.

Call the run_query tool with:
- repoId: "${repoId}"
- code: the query handler body (the code inside the handler function, NOT the full import/export wrapper)

If the query fails, fix and retry once.

## Context
- UTC: ${now.toISOString()} | Timestamp: ${now.getTime()}
- Repository ID: "${repoId}"

## Analysis Rules
- Lead with the key metric or direct answer
- **Bold** important numbers, metrics, and key takeaways
- Use tables, lists, or breakdowns where appropriate
- Highlight trends, outliers, percentages, and comparisons
- NEVER include raw database IDs — use names, titles, statuses, and human-readable labels
- If results are empty, say so and suggest alternatives`;
}
```

- [ ] **Step 2: Update allowedTools for confirm workflow steps**

MCP tools are auto-available when configured in Claude Code — no `allowedTools` change needed. However, the confirm workflow currently uses `allowedTools: "Bash"`. Since MCP tools are separate from the built-in tool allowlist, this should work. If not, fall back to removing the `allowedTools` restriction entirely for confirm steps.

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/researchQueryWorkflow.ts
git commit -m "feat: migrate research query to use MCP instead of direct deploy key"
```

---

## Chunk 4: Cleanup & Verification

### Task 10: Update SetupBanner

**Files:**

- Modify: `apps/web/lib/components/SetupBanner.tsx`

- [ ] **Step 1: Update SetupBanner**

Remove `CONVEX_DEPLOY_KEY` from the optional keys check. It's now managed via the env var scoping UI, not a setup prerequisite.

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/components/SetupBanner.tsx
git commit -m "fix: update SetupBanner to reflect new env var scoping"
```

### Task 11: Deployment configuration

No code change — deployment config step.

- [ ] **Step 1: Set required env vars**

On **Convex backend** (via Convex dashboard):

- `MCP_BASE_URL` — The MCP server's public URL
- `MCP_BOOTSTRAP_SECRET` — Same value already set for MCP bootstrap

On **MCP server** (deployment platform):

- `MCP_INTERNAL_SECRET` — New secret for signing internal tokens (generate strong random string)
- `MCP_BOOTSTRAP_SECRET` — Already exists

### Task 12: Typecheck all packages

- [ ] **Step 1: Run typecheck on backend**

```bash
cd packages/backend && npx convex codegen --typecheck enable
```

- [ ] **Step 2: Run typecheck on web**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Run typecheck on MCP**

```bash
cd apps/mcp && npx tsc --noEmit
```

- [ ] **Step 4: Fix any type errors**
