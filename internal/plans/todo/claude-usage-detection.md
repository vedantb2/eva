# Plan: Claude Usage Limit Detection + Auto-Switch + Schedule Later

## Context

When running quick tasks or sessions, Claude Code CLI (via Max OAuth) can hit usage limits. Currently, rate limit errors are treated as generic failures — stderr is discarded, no error classification exists, and users see a vague "Failed" badge with no actionable options.

**Goal**: Detect rate limits, auto-switch to a backup Claude account, show clear UI feedback, and offer "schedule for later" when all accounts are exhausted.

---

## Step 1: Detection — Classify errors in callback script

**File**: `packages/backend/convex/daytona.ts` — `buildCallbackScript()` (line 144)

**Changes**:

- Capture stderr (currently discarded at line 307): `child.stderr.on("data", (chunk) => { stderrOutput += chunk.toString(); })`
- After CLI exits, classify the error by checking both `resultEvent.result` and `stderrOutput` for rate limit indicators:
  - Keywords: `usage limit`, `rate_limit_error`, `rate_limit`, `429`
  - Extract reset time from message pattern: `"Your limit will reset at <TIME>"`
- Add two new fields to the completion mutation call (lines 329-336):
  - `errorType`: `"rate_limit"` or `null`
  - `limitResetAt`: ISO timestamp string or `null`

---

## Step 2: Schema changes

**File**: `packages/backend/convex/schema.ts`

### 2a: Add `errorType` to `agentRuns` (line 133)

```
errorType: v.optional(v.union(v.literal("rate_limit"), v.literal("generic"))),
limitResetAt: v.optional(v.number()),
```

### 2b: New table `aiAccountStatus`

Tracks which OAuth accounts are rate-limited and when they reset.

```
aiAccountStatus: defineTable({
  accountKey: v.string(),       // env var name, e.g. "CLAUDE_CODE_OAUTH_TOKEN"
  isLimited: v.boolean(),
  limitResetAt: v.optional(v.number()),
  updatedAt: v.number(),
}).index("by_key", ["accountKey"]),
```

### 2c: Add `scheduledRetryAt` to `agentTasks` (line 112)

```
scheduledRetryAt: v.optional(v.number()),
```

### 2d: Add new notification type

**File**: `packages/backend/convex/validators.ts` — `notificationTypeValidator`

Add `v.literal("rate_limit")` to the union.

---

## Step 3: Update completion handlers to accept `errorType`

All completion mutations need to accept the new optional fields from the callback script.

### 3a: Task completion handler

**File**: `packages/backend/convex/taskWorkflow.ts` — `handleCompletion` (line 528)

Add to args:

```
errorType: v.optional(v.union(v.literal("rate_limit"), v.null())),
limitResetAt: v.optional(v.union(v.string(), v.null())),
```

Forward these in the `workflow.sendEvent()` value.

Update `taskCompleteEvent` event definition (line 13) to include `errorType` and `limitResetAt` in its validator.

### 3b: Session completion handler

**File**: `packages/backend/convex/sessionWorkflow.ts` — `handleCompletion` (line 474)

Same additions as task handler.

### 3c: Other workflow handlers (design, summarize, doc, eval, etc.)

Add `errorType` and `limitResetAt` as **optional** args. No behavioral changes — just accept and ignore so the shared callback script doesn't break them.

---

## Step 4: Multi-account rotation logic

### 4a: Account discovery helper

**File**: `packages/backend/convex/daytona.ts` — new function

```
function getAvailableOAuthTokens(): Array<{ key: string; token: string }>
```

Reads env vars matching pattern: `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN_2`, `CLAUDE_CODE_OAUTH_TOKEN_3`, etc. Returns array of `{key, token}` pairs.

### 4b: Account status mutations

**File**: `packages/backend/convex/aiAccounts.ts` (new file)

- `markAccountLimited` (internal mutation): Sets `isLimited: true` and `limitResetAt` for an account key
- `clearExpiredLimits` (internal mutation): Clears limits where `limitResetAt < Date.now()`
- `getAccountStatuses` (internal query): Returns all account statuses
- `getAvailableAccountKey` (internal query): Returns the first account key that isn't currently limited

### 4c: Pass OAuth token dynamically

**File**: `packages/backend/convex/daytona.ts`

- `createSandbox()`: Accept optional `oauthToken` parameter. If provided, use it instead of `requireEnv("CLAUDE_CODE_OAUTH_TOKEN")`.
- `setupAndExecute`: Add optional `oauthTokenEnvKey` arg. Before launching, query `getAvailableAccountKey()` to pick the right account. Read the token from `process.env[accountKey]`. Pass to `createSandbox()`.
- Also pass `accountKey` as an env var to the sandbox so the callback script can report which account was used.

### 4d: Callback script reports account key

**File**: `packages/backend/convex/daytona.ts` — `buildCallbackScript()`

Add `accountKey: process.env.ACCOUNT_KEY || null` to the completion mutation call.

---

## Step 5: Workflow retry on rate limit

### 5a: Task workflow retry

**File**: `packages/backend/convex/taskWorkflow.ts` — `taskExecutionWorkflow` (around line 158)

After `const result = await step.awaitEvent(taskCompleteEvent)`:

```
if (!result.success && result.errorType === "rate_limit") {
  // Mark the account as limited
  await step.runMutation(markAccountLimited, {
    accountKey: result.accountKey,
    limitResetAt: result.limitResetAt ? new Date(result.limitResetAt).getTime() : undefined,
  });

  // Check if another account is available
  await step.runMutation(clearExpiredLimits, {});
  const nextAccount = await step.runQuery(getAvailableAccountKey, {});

  if (nextAccount) {
    // Retry with different account
    await step.runAction(setupAndExecute, { ...originalArgs, oauthTokenEnvKey: nextAccount });
    const retryResult = await step.awaitEvent(taskCompleteEvent);
    // Process retryResult normally (success or error)
  } else {
    // All accounts exhausted — fall through to error handling with rate_limit type
  }
}
```

### 5b: Session workflow retry

**File**: `packages/backend/convex/sessionWorkflow.ts`

Same pattern as task workflow.

---

## Step 6: Store error type in run completion

**File**: `packages/backend/convex/taskWorkflow.ts` — `completeRun` (line 329)

- Accept `errorType` and `limitResetAt` args
- Store on `agentRuns` record: `errorType`, `limitResetAt`
- If `errorType === "rate_limit"`, create notification with type `"rate_limit"` instead of `"run_completed"`

---

## Step 7: UI — Rate limit banner in task detail

**File**: `apps/web/lib/components/tasks/TaskDetailModal.tsx` (around line 336)

When the latest run has `errorType === "rate_limit"`:

- Show a yellow/amber banner instead of the generic red error box:
  ```
  "Usage limit reached on Account 1. Resets at [time]."
  ```
- If auto-retry succeeded (next run is success), show: "Auto-switched to Account 2"
- If all accounts exhausted, show the schedule popup (Step 8)

---

## Step 8: UI — Schedule for later popup

**File**: `apps/web/lib/components/tasks/TaskDetailModal.tsx`

When `errorType === "rate_limit"` AND all accounts exhausted:

- Show a dialog/popup:
  - Title: "All accounts have reached their usage limits"
  - Body: "Next reset at [earliest reset time]"
  - Buttons: "Schedule retry" | "Dismiss"
- "Schedule retry" calls a new mutation:

**File**: `packages/backend/convex/agentTasks.ts` — new `scheduleRetry` mutation

- Accepts `taskId` and `retryAt` (timestamp)
- Updates task: `scheduledRetryAt: retryAt`
- Calls `ctx.scheduler.runAt(retryAt, internal.taskWorkflow.startTaskExecution, { taskId })`
- Frontend shows "Scheduled for [time]" badge on the task card

---

## Step 9: UI — Rate limit notification

**File**: `apps/web/lib/components/notifications/notification-config.tsx`

Add config for the new `rate_limit` notification type:

- Icon: `IconAlertTriangle` (or similar warning icon)
- Label: "Rate Limited"
- Badge variant: "warning" (amber/yellow)
- Icon color: warning themed

---

## Step 10: Quick task card — show rate limit indicator

**File**: `apps/web/lib/components/quick-tasks/QuickTaskCard.tsx` (around line 59)

- Check if latest run has `errorType === "rate_limit"`
- Show "Rate Limited" badge (amber) instead of "Failed" badge (red)
- If `scheduledRetryAt` is set, show "Retrying at [time]" badge

---

## Files Changed Summary

| File                                                            | Change                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/backend/convex/daytona.ts`                            | Capture stderr, classify errors, accept dynamic OAuth token, report accountKey                             |
| `packages/backend/convex/schema.ts`                             | Add `aiAccountStatus` table, `errorType`/`limitResetAt` to `agentRuns`, `scheduledRetryAt` to `agentTasks` |
| `packages/backend/convex/validators.ts`                         | Add `rate_limit` notification type                                                                         |
| `packages/backend/convex/aiAccounts.ts`                         | **New file** — account status CRUD mutations/queries                                                       |
| `packages/backend/convex/taskWorkflow.ts`                       | Update event definition, completion handler, add retry logic, store errorType                              |
| `packages/backend/convex/sessionWorkflow.ts`                    | Same as taskWorkflow                                                                                       |
| `packages/backend/convex/agentTasks.ts`                         | Add `scheduleRetry` mutation                                                                               |
| Other workflow handlers (8 files)                               | Add optional `errorType`/`limitResetAt` to completion handler args                                         |
| `apps/web/lib/components/tasks/TaskDetailModal.tsx`             | Rate limit banner + schedule popup                                                                         |
| `apps/web/lib/components/quick-tasks/QuickTaskCard.tsx`         | Rate limit badge + scheduled retry badge                                                                   |
| `apps/web/lib/components/notifications/notification-config.tsx` | New rate_limit notification config                                                                         |

---

## Verification

1. **Detection test**: Manually trigger a rate limit (or mock the error text in callback script) — verify `errorType: "rate_limit"` flows through to `agentRuns`
2. **Account rotation test**: Set two OAuth tokens, limit the first — verify the workflow retries with the second
3. **UI test**: Verify rate limit banner shows in TaskDetailModal when run has `errorType === "rate_limit"`
4. **Schedule test**: Exhaust all accounts — verify popup appears, "Schedule retry" creates a scheduled job, and the job fires at the right time
5. **Type check**: `npx tsc` from `apps/web/` and `npx convex dev` from `packages/backend/`
6. **Backwards compatibility**: Ensure all other workflows (design, summarize, doc, eval, etc.) still work — the new optional fields should not break them
