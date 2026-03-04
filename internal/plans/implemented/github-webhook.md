# GitHub Webhook: PR Lifecycle → Task Status

## Context

When Eva runs a task, it creates a branch, does the work, and opens a PR. The task then sits in `business_review` or `code_review`. Once the PR is merged or closed on GitHub, nothing happens in Eva — the task stays in its current column until someone manually moves it.

**Goal**: Listen to GitHub `pull_request.closed` events. Merged → `done`. Closed without merge → `cancelled`. Applies to all tasks (quick + project).

## How PR → Task linking works today

- `taskWorkflow` creates PR via `taskWorkflowActions.createPullRequest`
- PR URL (e.g. `https://github.com/owner/repo/pull/123`) stored on `agentRuns.prUrl`
- `agentTasks` does NOT store prUrl
- Lookup: webhook PR URL → `agentRuns.prUrl` (new index) → `run.taskId` → `agentTasks`

## Implementation

### 1. `packages/backend/convex/validators.ts` — add webhook event status

```ts
export const webhookEventStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("skipped"),
);
```

### 2. `packages/backend/convex/schema.ts` — add index + new table

Add to `agentRuns`:

```
.index("by_pr_url", ["prUrl"])
```

New table for audit trail:

```ts
githubWebhookEvents: defineTable({
  event: v.string(), // "pull_request"
  action: v.string(), // "closed"
  prUrl: v.optional(v.string()),
  merged: v.optional(v.boolean()),
  taskId: v.optional(v.id("agentTasks")),
  status: webhookEventStatusValidator,
  createdAt: v.number(),
}).index("by_status", ["status"]);
```

### 3. New env var

`GITHUB_WEBHOOK_SECRET` — HMAC secret from GitHub App settings

### 4. `packages/backend/convex/http.ts` — webhook route

Add `POST /api/github/webhook`:

1. Read `X-Hub-Signature-256` header
2. Read raw body
3. Verify HMAC-SHA256 via Web Crypto (`crypto.subtle`) against `GITHUB_WEBHOOK_SECRET`
4. Return 401 if invalid
5. Read `X-GitHub-Event` header
6. Parse payload with `isRecord()` pattern (no `any`/`as`)
7. For `pull_request` event with `action === "closed"`:
   - Extract `pull_request.html_url`, `pull_request.merged`
   - `ctx.scheduler.runAfter(0, internal.githubWebhook.handlePrClosed, { prUrl, merged })`
8. Return 200 immediately

HMAC verification (V8 runtime, Web Crypto):

```ts
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed =
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return computed === signature;
}
```

### 5. `packages/backend/convex/githubWebhook.ts` — NEW file

**`handlePrClosed` (internalMutation)**

Args: `{ prUrl: string, merged: boolean }`

1. Store webhook event: insert into `githubWebhookEvents` with status `"pending"`
2. Query `agentRuns` by `by_pr_url` index where `prUrl === args.prUrl`
3. If no run found → patch event status to `"skipped"`, return
4. Get task via `run.taskId`
5. If task not found or already `done`/`cancelled` → patch event to `"skipped"`, return
6. New status: `merged ? "done" : "cancelled"`
7. Patch task: `{ status, updatedAt: Date.now() }`
8. Cancel scheduled functions (if any, same pattern as `updateStatus` in `agentTasks.ts:169-181`)
9. Notify `createdBy` and `assignedTo` (reuse `createNotification` pattern)
10. If task has `projectId` and status is `"done"` → check all project tasks done → patch project phase to `"completed"` (same pattern as `updateStatus` in `agentTasks.ts:206-226`)
11. Patch event: `{ status: "completed", taskId: task._id }`

## Files changed

| File                                       | Change                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `packages/backend/convex/validators.ts`    | Add `webhookEventStatusValidator`                                     |
| `packages/backend/convex/schema.ts`        | Add `by_pr_url` index on `agentRuns`, add `githubWebhookEvents` table |
| `packages/backend/convex/http.ts`          | Add `POST /api/github/webhook` route with HMAC verification           |
| `packages/backend/convex/githubWebhook.ts` | **NEW** — `handlePrClosed` internalMutation                           |

## Edge cases

- **No matching run**: PR not from Eva → event stored as `"skipped"`
- **Task already done/cancelled**: Idempotent, event stored as `"skipped"`
- **Duplicate webhooks**: Idempotent — second event finds task already updated, skips
- **Multiple runs same prUrl**: Takes first match (shouldn't happen)
- **Project tasks**: When moved to `done`, checks if all sibling tasks are done → auto-completes project phase

## Verification

1. `npx convex dev` — deploy schema + functions
2. Set `GITHUB_WEBHOOK_SECRET` in Convex dashboard
3. In GitHub App settings: set webhook URL `{CONVEX_SITE_URL}/api/github/webhook`, subscribe to `pull_request` events
4. Run a task → creates PR
5. Merge PR → verify task moves to `done`, notification sent
6. Run another task → close PR without merge → verify task moves to `cancelled`
7. Check `githubWebhookEvents` table for audit trail
8. Test with project task → merge PR → verify project phase auto-completes if all tasks done
