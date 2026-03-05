# Vercel Deployment Status Tracking for Tasks

## Context

When Eva pushes code to a branch, Vercel (via GitHub integration) automatically creates a preview deployment. Currently there's no visibility into deployment status — users check Vercel manually. This adds deployment status tracking + preview URL to both the task card and detail view.

**Scope:** Both quick tasks and project tasks (workflow is shared, both push code).

**Approach:** Use **GitHub Deployments API** (not Vercel API). Vercel auto-creates GitHub Deployment records when building. We already have GitHub App tokens via `getInstallationOctokit()` — no new auth needed. Also provider-agnostic (works with Netlify, etc).

**Pattern:** Self-scheduling Convex action. Workflow schedules first poll with 30s delay → action polls GitHub API → if not terminal, schedules itself again (60s interval, max 20 attempts = ~20 min). Keeps polling until terminal state (deployed/error) or max attempts reached.

---

## Changes

### 1. Validator + Schema

**`packages/backend/convex/validators.ts`** — add:

```
deploymentStatusValidator = v.union("queued", "building", "deployed", "error")
```

**`packages/backend/convex/schema.ts`** — add to `agentRuns` table:

```
deploymentStatus: v.optional(deploymentStatusValidator)
deploymentUrl: v.optional(v.string())
```

### 2. Backend: `agentRuns.ts`

- Update `agentRunValidator` (line 17) with `deploymentStatus` + `deploymentUrl` fields (so queries return them to UI automatically)
- Add `updateDeploymentStatus` **internal mutation** — patches run with new status/url

### 3. Backend: `taskWorkflowActions.ts` — new `pollDeploymentStatus` action

```
pollDeploymentStatus(runId, installationId, repoOwner, repoName, branchName, attempt):
  1. octokit = getInstallationOctokit(installationId)
  2. GET /repos/{owner}/{repo}/deployments?ref={branchName}&per_page=1
  3. If no deployments found:
     - attempt < 20 → schedule self in 60s
     - attempt >= 20 → clear deploymentStatus (no Vercel on this repo)
     - return
  4. GET /repos/{owner}/{repo}/deployments/{id}/statuses?per_page=1
  5. Map GitHub state → our status:
     - queued → "queued"
     - pending, in_progress, waiting → "building"
     - success → "deployed"
     - error, failure, inactive → "error"
  6. Extract preview URL from status.environment_url || status.target_url
  7. Call updateDeploymentStatus mutation
  8. If not terminal & attempt < 20 → ctx.scheduler.runAfter(60s, self)
```

Polling: 30s initial delay, then 60s intervals, max 20 attempts (~20 min total). Covers long Vercel builds.

### 4. Backend: `taskWorkflow.ts` — trigger tracking

Add `scheduleDeploymentTracking` **internal mutation**:

- Sets `deploymentStatus: "queued"` on the agentRun immediately
- Schedules `pollDeploymentStatus` with 30s delay

Call as new workflow step **after step 5 (sandbox completion)** when `result.success === true`:

```typescript
if (result.success) {
  await step.runMutation(internal.taskWorkflow.scheduleDeploymentTracking, {
    runId: args.runId,
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    branchName: data.branchName,
  });
}
```

Placed BEFORE PR creation (step 6) since the git push already happened in the sandbox — Vercel starts building immediately on push, not on PR creation.

### 5. UI: `QuickTaskCard.tsx`

Derive latest deployment from runs (same pattern as `latestPrUrl`):

```
const latestDeployment = runs?.find(r => r.deploymentStatus);
```

**Inline on card:** Small colored dot/badge near the status bar or next to the PR icon — visible without opening dropdown. Use same color scheme as status mapping table below.

**Dropdown menu:** After "View PR" item, add "View Preview" item when `latestDeployment.deploymentUrl` exists (opens in new tab, rocket icon).

### 6. UI: `useTaskDetail.tsx`

Next to `run.prUrl` "View Pull Request" link (line 561-570):

- Show deployment status badge (color-coded: green=deployed, blue-animated=building/queued, red=error)
- Show "View Preview" button/link when `run.deploymentUrl` exists

---

## Status Mapping

| GitHub Deployment State               | Our Status | Badge Color | Label    |
| ------------------------------------- | ---------- | ----------- | -------- |
| `queued`                              | `queued`   | blue pulse  | Queued   |
| `pending` / `in_progress` / `waiting` | `building` | amber pulse | Building |
| `success`                             | `deployed` | green       | Deployed |
| `error` / `failure` / `inactive`      | `error`    | red         | Error    |

---

## Files to Modify

| File                                                    | Change                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/backend/convex/validators.ts`                 | Add `deploymentStatusValidator`                                   |
| `packages/backend/convex/schema.ts`                     | Add 2 fields to `agentRuns`                                       |
| `packages/backend/convex/agentRuns.ts`                  | Update validator + add `updateDeploymentStatus` internal mutation |
| `packages/backend/convex/taskWorkflowActions.ts`        | Add `pollDeploymentStatus` internal action                        |
| `packages/backend/convex/taskWorkflow.ts`               | Add `scheduleDeploymentTracking` mutation + call in workflow      |
| `apps/web/lib/components/quick-tasks/QuickTaskCard.tsx` | Deployment badge + "View Preview" dropdown item                   |
| `apps/web/lib/components/tasks/useTaskDetail.tsx`       | Deployment badge + "View Preview" next to PR link                 |

---

## Prerequisite

GitHub App must have **`deployments:read`** permission. Check in GitHub App settings → Permissions → Repository permissions → Deployments → Read-only.

---

## Verification

1. `npx convex dev` — schema deploys without errors
2. `npx tsc` in `apps/web/` — no type errors
3. Create a quick task on a repo with Vercel GitHub integration
4. Run task → after push, verify:
   - `agentRun.deploymentStatus` updates from "queued" → "building" → "deployed"
   - `agentRun.deploymentUrl` gets populated with preview URL
   - QuickTaskCard shows deployment indicator + "View Preview" in dropdown
   - TaskDetailModal shows deployment badge + preview link next to PR link
5. Test error case: trigger on a repo without Vercel → should gracefully stop polling after 20 attempts (~20 min) with no deployment found
