# Granular Sandbox Preparation Steps

## Problem

`prepareSandbox` is a monolithic action that runs multiple sequential operations (create sandbox, fetch origin, checkout base branch, setup branch) within a single Convex action. Each operation shares the action's 10-min timeout budget. The `git fetch` for base branches can exceed the 120s exec timeout on repos like vmem, causing the entire preparation to fail — even though the workflow component could retry individual steps independently.

## Solution

Break `prepareSandbox` into granular actions for callers that use `baseBranch`. Each operation becomes its own workflow step with an independent 10-min action budget. Workflow callers own orchestration (progress streaming, sandbox ID persistence) between steps.

## Scope

Only the 4 callers that pass `baseBranch`:

- `taskExecutionWorkflow` (workflowDefinition.ts)
- `automationWorkflow` (automationWorkflow.ts)
- `evaluationWorkflow` eval phase (evaluationWorkflow.ts line 48)
- `evaluationWorkflow` fix phase (evaluationWorkflow.ts line 98)

The remaining simple callers (no `baseBranch`) continue using `prepareSandbox` unchanged.

## New Actions (execution.ts)

### `createOrResumeSandbox`

Creates sandbox from snapshot + syncRepo, or resumes existing sandbox.

**Args:**

- `existingSandboxId?: string`
- `installationId: number`
- `repoOwner: string`
- `repoName: string`
- `ephemeral?: boolean`
- `repoId: Id<"githubRepos">`
- `sessionPersistenceId?: Id<"sessions">`
- `attachRunId?: Id<"agentRuns">`
- `streamingEntityId?: string`

**Returns:** `{ sandboxId: string }`

**Logic:** Same as current `prepareSandbox` lines 167-197. Creates ephemeral or session sandbox via `createSandboxAndPrepareRepo` / `getOrCreateSandbox`. For the ephemeral path, handles `attachRunId` via `onSandboxAcquired` callback (saves sandbox ID to run as soon as acquired). For the non-ephemeral (session) path, `attachRunId` save happens after `getOrCreateSandbox` returns. Passes `streamingEntityId` through to sub-functions for "Creating sandbox..." / "Syncing repository..." progress. Does NOT fetch base branch, checkout, or setup branch. Retains the existing Daytona-network-issue retry loop (`isDaytonaNetworkIssue` + exponential backoff) for sandbox creation specifically.

### `fetchBaseBranch`

Fetches the base branch from origin.

**Args:**

- `sandboxId: string`
- `installationId: number`
- `repoOwner: string`
- `repoName: string`
- `baseBranch: string`
- `repoId: Id<"githubRepos">`

**Returns:** `v.null()`

**Logic:** Calls `fetchOrigin(sandbox, ..., baseBranch, { prune: false, timeoutSeconds: 240 })` then `git stash --include-untracked`.

### `checkoutBaseBranch`

Checks out the base branch and fast-forward pulls.

**Args:**

- `sandboxId: string`
- `installationId: number`
- `repoOwner: string`
- `repoName: string`
- `baseBranch: string`
- `repoId: Id<"githubRepos">`

**Returns:** `v.null()`

**Logic:** Calls `configureGitHubOrigin` first to refresh the auth token in the remote URL (token from `fetchBaseBranch` may have expired between steps). Then runs `git checkout <baseBranch> && git pull --ff-only origin <baseBranch>` with 240s timeout.

### `setupSandboxBranch`

Creates/checks out the feature branch and pushes.

**Args:**

- `sandboxId: string`
- `installationId: number`
- `repoOwner: string`
- `repoName: string`
- `branchName: string`
- `baseBranch: string`
- `repoId: Id<"githubRepos">`

**Returns:** `v.null()`

**Logic:** Calls `configureGitHubOrigin` first to refresh auth token. Then calls existing `setupBranch(sandbox, branchName, baseBranch)`.

## Workflow Caller Pattern

Each of the 4 callers replaces their single `step.runAction(prepareSandbox)` with:

```typescript
const { sandboxId } = await step.runAction(
  internal.daytona.createOrResumeSandbox,
  {
    existingSandboxId,
    installationId,
    repoOwner,
    repoName,
    ephemeral,
    repoId,
    attachRunId,
    streamingEntityId,
  },
);

await step.runMutation(internal.streaming.internalSet, {
  entityId: streamingEntityId,
  currentActivity: JSON.stringify([
    { type: "tool", label: "Creating sandbox...", status: "complete" },
    { type: "tool", label: "Fetching base branch...", status: "active" },
  ]),
});

await step.runAction(internal.daytona.fetchBaseBranch, {
  sandboxId,
  installationId,
  repoOwner,
  repoName,
  baseBranch,
  repoId,
});

await step.runMutation(internal.streaming.internalSet, {
  entityId: streamingEntityId,
  currentActivity: JSON.stringify([
    { type: "tool", label: "Creating sandbox...", status: "complete" },
    { type: "tool", label: "Fetching base branch...", status: "complete" },
    { type: "tool", label: "Checking out base branch...", status: "active" },
  ]),
});

await step.runAction(internal.daytona.checkoutBaseBranch, {
  sandboxId,
  installationId,
  repoOwner,
  repoName,
  baseBranch,
  repoId,
});

if (branchName) {
  await step.runMutation(internal.streaming.internalSet, {
    entityId: streamingEntityId,
    currentActivity: JSON.stringify([
      { type: "tool", label: "Creating sandbox...", status: "complete" },
      { type: "tool", label: "Fetching base branch...", status: "complete" },
      {
        type: "tool",
        label: "Checking out base branch...",
        status: "complete",
      },
      { type: "tool", label: "Setting up branch...", status: "active" },
    ]),
  });
  await step.runAction(internal.daytona.setupSandboxBranch, {
    sandboxId,
    installationId,
    repoOwner,
    repoName,
    branchName,
    baseBranch,
    repoId,
  });
}
```

## What Stays

- `prepareSandbox` remains for the remaining simple callers (no `baseBranch`).
- `startDesktopWithChrome` only used by `sessionWorkflow` — out of scope.
- All existing git/sandbox helper functions in `git.ts` unchanged.

## Retry Behavior

- `createOrResumeSandbox` retains the existing Daytona-network-issue retry loop internally (up to 3 attempts with exponential backoff).
- `fetchBaseBranch`, `checkoutBaseBranch`, `setupSandboxBranch` rely on the workflow's default retry config (3 attempts, 1s backoff, base 2). Callers can override per-step.

## Error Handling

- `createOrResumeSandbox` handles its own cleanup (delete sandbox if creation succeeded but syncRepo failed) — same as current `createSandboxAndPrepareRepo` behavior.
- If a subsequent step fails, the workflow's existing try/catch handles sandbox cleanup (delete if newly created).

## Token Expiry Between Steps

GitHub installation tokens expire after ~1 hour. `fetchBaseBranch` gets a fresh token via `fetchOrigin` (which calls `configureGitHubOrigin` internally). `checkoutBaseBranch` and `setupSandboxBranch` call `configureGitHubOrigin` explicitly at the start to refresh the auth token in the remote URL. This ensures a fresh token even if there's a gap between steps due to retries or workflow scheduling.
