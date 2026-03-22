# Convex Preview Deployment for Sandbox Sessions

## Context

Claude agents in sandboxes have no isolated Convex backend — they either develop locally or share a dev deployment, causing data conflicts. Each session should get its own Convex preview deployment (isolated DB + functions + env vars) so the sandboxed app has a real cloud backend.

## Architecture: Platform + MCP Hybrid

**Platform (session startup)**: Creates preview deployment, writes `.env.local`, runs `npx convex deploy` — session is fully ready when Claude starts.

**MCP tool**: Lets Claude re-deploy after code changes and set Vercel env vars.

**Scope**: Sessions only (for now). Fresh preview per session (auto-expires after 1 week). Seeding deferred to phase 2.

---

## Part 1: Platform — Preview Setup During Session Start

### Required Repo Env Vars (user configures in UI)

| Key                   | Purpose                                  | Sandbox? |
| --------------------- | ---------------------------------------- | -------- |
| `CONVEX_ACCESS_TOKEN` | Convex Management API bearer token       | No       |
| `CONVEX_PROJECT_ID`   | Convex project to create preview in      | No       |
| `VERCEL_TOKEN`        | Vercel API auth (optional, for MCP tool) | No       |
| `VERCEL_PROJECT_ID`   | Vercel project (optional, for MCP tool)  | No       |

All repo-level. None leak into sandbox.

### New File: `packages/backend/convex/_convexPreview/setup.ts`

`"use node"` internalAction called from `startSessionSandbox`:

```
Args: sandboxId, repoId, branchName, rootDirectory
Returns: { deploymentName, deploymentUrl } | null (if not configured)
```

**Steps:**

1. `resolveAllEnvVars(ctx, repoId)` → check for `CONVEX_ACCESS_TOKEN` + `CONVEX_PROJECT_ID`
2. If missing → return null (skip, repo doesn't use Convex)
3. POST `https://api.convex.dev/v1/projects/{projectId}/create_deployment` with `{ type: "preview", reference: branchName }` → get `{ name, deploymentUrl }`
4. POST `https://api.convex.dev/v1/deployments/{name}/create_deploy_key` with `{ name: "eva-session-{branchName}" }` → get `{ deployKey }`
5. Get sandbox via `daytona.get(sandboxId)`
6. Build `.env.local`:
   ```
   CONVEX_DEPLOY_KEY={deployKey}
   NEXT_PUBLIC_CONVEX_URL={deploymentUrl}
   ```
7. Upload to `{WORKSPACE_DIR}/{rootDirectory}/.env.local` via `sandbox.fs.uploadFile()`
8. Run `npx convex deploy --preview-create {branchName}` in sandbox (pushes functions to preview)
9. Return `{ deploymentName, deploymentUrl }`

### New File: `packages/backend/convex/convexPreview.ts`

Barrel export:

```ts
export { setupConvexPreview } from "./_convexPreview/setup";
```

### Modified: `packages/backend/convex/_daytona/sessions.ts`

Insert after `startSessionServices()` and before `sandboxReady()` in **both** the reuse path and new sandbox path:

```ts
// After startSessionServices, before sandboxReady
await runLoggedSessionStep("setupConvexPreview", sandboxDetails, () =>
  ctx.runAction(internal.convexPreview.setupConvexPreview, {
    sandboxId: sandbox.id,
    repoId,
    branchName: args.branchName,
    rootDirectory: rootDir,
  }),
);
```

Wrapped so failures are non-fatal (log + continue):

```ts
try {
  await runLoggedSessionStep("setupConvexPreview", ...);
} catch (err) {
  logSession(`setupConvexPreview failed (non-fatal): ${errorMessage(err)}`);
}
```

---

## Part 2: MCP Tool — Re-deploy + Vercel Env Vars

### New MCP Tool: `setup_convex_preview`

In `apps/mcp/src/tools.ts`, add a new tool:

```
Tool: setup_convex_preview
Description: Create or update a Convex preview deployment for a branch. Returns deploy key + URL. Optionally sets Vercel preview env vars.
Args:
  - repoId (string): Repo ID from list_repos
  - branchName (string): Git branch name for the preview
  - setVercelEnv (boolean, optional): If true, sets CONVEX_DEPLOY_KEY + NEXT_PUBLIC_CONVEX_URL on Vercel for the branch
```

**Steps:**

1. Resolve context (deployKey, userId) → verify repo access
2. Fetch repo env vars via `getRepoEnvVars()` → extract `CONVEX_ACCESS_TOKEN`, `CONVEX_PROJECT_ID`
3. Create preview deployment via Convex Management API
4. Create deploy key for the preview deployment
5. If `setVercelEnv` + `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` in env vars:
   - POST `https://api.vercel.com/v10/projects/{projectId}/env` with:
     ```json
     [
       {
         "key": "CONVEX_DEPLOY_KEY",
         "value": "{deployKey}",
         "target": ["preview"],
         "gitBranch": "{branchName}",
         "type": "encrypted"
       },
       {
         "key": "NEXT_PUBLIC_CONVEX_URL",
         "value": "{deploymentUrl}",
         "target": ["preview"],
         "gitBranch": "{branchName}",
         "type": "plain"
       }
     ]
     ```
6. Return `{ deploymentName, deploymentUrl, deployKey, vercelEnvSet: true/false }`

### New File: `apps/mcp/src/convex-management-api.ts`

Inline API client functions:

```ts
const CONVEX_API_BASE = "https://api.convex.dev/v1";

export async function createPreviewDeployment(accessToken: string, projectId: string, branchName: string)
  → { name: string, deploymentUrl: string }

export async function createDeployKey(accessToken: string, deploymentName: string, keyName: string)
  → { deployKey: string }
```

### New File: `apps/mcp/src/vercel-api.ts`

```ts
export async function setVercelPreviewEnvVars(
  vercelToken: string,
  projectId: string,
  branchName: string,
  vars: Array<{ key: string; value: string }>,
);
```

---

## Key Files to Modify

| File                                              | Change                                      |
| ------------------------------------------------- | ------------------------------------------- |
| `packages/backend/convex/_convexPreview/setup.ts` | **NEW** — internalAction for preview setup  |
| `packages/backend/convex/convexPreview.ts`        | **NEW** — barrel export                     |
| `packages/backend/convex/_daytona/sessions.ts`    | Add preview setup step after services start |
| `apps/mcp/src/tools.ts`                           | Add `setup_convex_preview` tool             |
| `apps/mcp/src/convex-management-api.ts`           | **NEW** — Convex Management API client      |
| `apps/mcp/src/vercel-api.ts`                      | **NEW** — Vercel API client                 |

## Existing Code to Reuse

| Utility                   | Location                                       | Purpose                                      |
| ------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `resolveAllEnvVars()`     | `packages/backend/convex/envVarResolver.ts`    | Get repo env vars including non-sandbox ones |
| `resolveSandboxContext()` | `packages/backend/convex/_daytona/helpers.ts`  | Get Daytona client + sandbox vars            |
| `exec()`                  | `packages/backend/convex/_daytona/helpers.ts`  | Run commands in sandbox                      |
| `WORKSPACE_DIR`           | `packages/backend/convex/_daytona/helpers.ts`  | `/workspace/repo`                            |
| `getRepoEnvVars()`        | `apps/mcp/src/convex-api.ts`                   | MCP route to get decrypted repo env vars     |
| `runLoggedSessionStep()`  | `packages/backend/convex/_daytona/sessions.ts` | Logged step wrapper                          |

## Verification

1. Add `CONVEX_ACCESS_TOKEN` and `CONVEX_PROJECT_ID` to a repo's env vars in the UI
2. Start a session on that repo
3. Check Convex dashboard → preview deployment created for the branch
4. Check sandbox has `.env.local` at `{rootDirectory}/` with correct values
5. Verify `npx convex deploy` ran successfully (functions pushed to preview)
6. Test MCP tool: Claude calls `setup_convex_preview` → gets deploy key + URL
7. Test Vercel env vars (if configured): check Vercel dashboard → preview env vars scoped to branch

## Unresolved (Phase 2)

- DB seeding from main deployment
- Cleanup of preview deployments (currently auto-expire after 1 week)
- Design session (`startDesignSandbox`) support
