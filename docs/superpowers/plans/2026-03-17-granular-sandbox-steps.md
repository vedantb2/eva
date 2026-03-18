# Granular Sandbox Preparation Steps — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break `prepareSandbox` into granular workflow steps so each git operation gets its own 10-min action budget.

**Architecture:** 4 new `internalAction`s in `execution.ts` replace the monolithic `prepareSandbox` for callers that use `baseBranch`. `configureGitHubOrigin` is exported from `git.ts` so the new actions can refresh auth tokens. Each workflow caller orchestrates progress streaming via `step.runMutation`.

**Tech Stack:** Convex actions, `@convex-dev/workflow`, Daytona SDK

**Spec:** `docs/superpowers/specs/2026-03-17-granular-sandbox-steps-design.md`

---

## Chunk 1: New granular actions

### Task 1: Export `configureGitHubOrigin` from `git.ts`

**Files:**

- Modify: `packages/backend/convex/_daytona/git.ts:89`

- [ ] **Step 1: Export the function**

In `packages/backend/convex/_daytona/git.ts`, change line 89 from:

```typescript
async function configureGitHubOrigin(
```

to:

```typescript
export async function configureGitHubOrigin(
```

- [ ] **Step 2: Commit**

```bash
git add packages/backend/convex/_daytona/git.ts
git commit -m "refactor: export configureGitHubOrigin for use by granular sandbox actions"
```

---

### Task 2: Add `createOrResumeSandbox` action

**Files:**

- Modify: `packages/backend/convex/_daytona/execution.ts`
- Modify: `packages/backend/convex/daytona.ts`

- [ ] **Step 1: Add the action to `execution.ts`**

Add after the existing `prepareSandbox` export (after line 272). This extracts the sandbox creation/resume logic with the Daytona-network-issue retry loop:

```typescript
export const createOrResumeSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    ephemeral: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
    sessionPersistenceId: v.optional(v.id("sessions")),
    attachRunId: v.optional(v.id("agentRuns")),
    streamingEntityId: v.optional(v.string()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const completedSteps: Array<{
      type: string;
      label: string;
      status: string;
    }> = [];
    const emitProgress = async (label: string): Promise<void> => {
      if (!args.streamingEntityId) return;
      const steps = [
        ...completedSteps,
        { type: "tool", label, status: "active" },
      ];
      await ctx.runMutation(internal.streaming.internalSet, {
        entityId: args.streamingEntityId,
        currentActivity: JSON.stringify(steps),
      });
      completedSteps.push({ type: "tool", label, status: "complete" });
    };

    const setupStartedAt = Date.now();
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts = args.sessionPersistenceId
      ? await ensureSessionClaudeVolume(daytona, args.sessionPersistenceId)
      : undefined;

    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 3;
    const attachRunSandbox = async (
      sandboxToAttach: Sandbox,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            daytona,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            EPHEMERAL_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            attachRunSandbox,
            emitProgress,
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = true;
        } else {
          const prepared = await getOrCreateSandbox(
            daytona,
            args.existingSandboxId,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            SESSION_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            emitProgress,
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = prepared.isNew;
        }

        if (!args.ephemeral && args.attachRunId && sandbox) {
          await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
            runId: args.attachRunId,
            sandboxId: sandbox.id,
          });
        }

        break;
      } catch (error) {
        if (deleteSandboxOnFailure && sandbox) {
          try {
            await sandbox.delete();
          } catch {}
        }

        const message = errorMessage(error, "Sandbox setup failed");
        const elapsed = Date.now() - setupStartedAt;
        const shouldRetry =
          isDaytonaNetworkIssue(message) && elapsed < MAX_SETUP_ELAPSED_MS;

        if (!shouldRetry || attempt >= maxSetupAttempts) {
          throw error;
        }

        const delayMs =
          2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
        console.warn(
          `[daytona] createOrResumeSandbox transient failure (attempt ${attempt}/${maxSetupAttempts}), retrying in ${delayMs}ms: ${message}`,
        );
        await sleep(delayMs);
        completedSteps.length = 0;
        await emitProgress("Retrying sandbox setup...");
        attempt += 1;
        sandbox = undefined;
        deleteSandboxOnFailure = false;
      }
    }

    if (!sandbox) {
      throw new Error("Sandbox setup failed");
    }

    return { sandboxId: sandbox.id };
  },
});
```

- [ ] **Step 2: Re-export from `daytona.ts`**

In `packages/backend/convex/daytona.ts`, update the execution re-export (line 9-15) to include the new action:

```typescript
export {
  runSandboxCommand,
  getPreviewUrl,
  prepareSandbox,
  createOrResumeSandbox,
  launchOnExistingSandbox,
  validateSandbox,
} from "./_daytona/execution";
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/_daytona/execution.ts packages/backend/convex/daytona.ts
git commit -m "feat: add createOrResumeSandbox granular action"
```

---

### Task 3: Add `fetchBaseBranch` action

**Files:**

- Modify: `packages/backend/convex/_daytona/execution.ts`
- Modify: `packages/backend/convex/daytona.ts`

- [ ] **Step 1: Add the action to `execution.ts`**

Add after `createOrResumeSandbox`. Import `configureGitHubOrigin` in the existing import from `"./git"` at line 19.

First, update the import at line 18-25:

```typescript
import {
  fetchOrigin,
  setupBranch,
  configureGitHubOrigin,
  createSandboxAndPrepareRepo,
  getOrCreateSandbox,
  EPHEMERAL_LIFECYCLE,
  SESSION_LIFECYCLE,
} from "./git";
```

Then add the action:

```typescript
export const fetchBaseBranch = internalAction({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await fetchOrigin(
      sandbox,
      args.installationId,
      args.repoOwner,
      args.repoName,
      args.baseBranch,
      { prune: false, timeoutSeconds: 240 },
    );
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null || true`,
      10,
    );
    return null;
  },
});
```

- [ ] **Step 2: Re-export from `daytona.ts`**

Add `fetchBaseBranch` to the execution re-export in `daytona.ts`:

```typescript
export {
  runSandboxCommand,
  getPreviewUrl,
  prepareSandbox,
  createOrResumeSandbox,
  fetchBaseBranch,
  launchOnExistingSandbox,
  validateSandbox,
} from "./_daytona/execution";
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/_daytona/execution.ts packages/backend/convex/_daytona/git.ts packages/backend/convex/daytona.ts
git commit -m "feat: add fetchBaseBranch granular action"
```

---

### Task 4: Add `checkoutBaseBranch` action

**Files:**

- Modify: `packages/backend/convex/_daytona/execution.ts`
- Modify: `packages/backend/convex/daytona.ts`

- [ ] **Step 1: Add the action to `execution.ts`**

Add after `fetchBaseBranch`:

```typescript
export const checkoutBaseBranch = internalAction({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await configureGitHubOrigin(
      sandbox,
      args.installationId,
      args.repoOwner,
      args.repoName,
    );
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && git checkout ${quote([args.baseBranch])} && git pull --ff-only origin ${quote([args.baseBranch])}`,
      240,
    );
    return null;
  },
});
```

- [ ] **Step 2: Re-export from `daytona.ts`**

Add `checkoutBaseBranch` to the execution re-export:

```typescript
export {
  runSandboxCommand,
  getPreviewUrl,
  prepareSandbox,
  createOrResumeSandbox,
  fetchBaseBranch,
  checkoutBaseBranch,
  launchOnExistingSandbox,
  validateSandbox,
} from "./_daytona/execution";
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/_daytona/execution.ts packages/backend/convex/daytona.ts
git commit -m "feat: add checkoutBaseBranch granular action"
```

---

### Task 5: Add `setupSandboxBranch` action

**Files:**

- Modify: `packages/backend/convex/_daytona/execution.ts`
- Modify: `packages/backend/convex/daytona.ts`

- [ ] **Step 1: Add the action to `execution.ts`**

Add after `checkoutBaseBranch`:

```typescript
export const setupSandboxBranch = internalAction({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await configureGitHubOrigin(
      sandbox,
      args.installationId,
      args.repoOwner,
      args.repoName,
    );
    await setupBranch(sandbox, args.branchName, args.baseBranch);
    return null;
  },
});
```

- [ ] **Step 2: Re-export from `daytona.ts`**

Add `setupSandboxBranch` to the execution re-export:

```typescript
export {
  runSandboxCommand,
  getPreviewUrl,
  prepareSandbox,
  createOrResumeSandbox,
  fetchBaseBranch,
  checkoutBaseBranch,
  setupSandboxBranch,
  launchOnExistingSandbox,
  validateSandbox,
} from "./_daytona/execution";
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/_daytona/execution.ts packages/backend/convex/daytona.ts
git commit -m "feat: add setupSandboxBranch granular action"
```

---

## Chunk 2: Update workflow callers

### Task 6: Update `taskExecutionWorkflow`

**Files:**

- Modify: `packages/backend/convex/_taskWorkflow/workflowDefinition.ts:60-76`

- [ ] **Step 1: Replace prepareSandbox call with granular steps**

Replace lines 60-75 (the single `prepareSandbox` call) with:

```typescript
const streamingEntityId = getTaskRunStreamingEntityId(args.runId);

const setupResult = await step.runAction(
  internal.daytona.createOrResumeSandbox,
  {
    existingSandboxId: data.projectSandboxId,
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    ephemeral: !args.projectId,
    repoId: args.repoId,
    attachRunId: args.runId,
    streamingEntityId,
  },
  { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
);
sandboxId = setupResult.sandboxId;

if (args.baseBranch) {
  await step.runMutation(internal.streaming.internalSet, {
    entityId: streamingEntityId,
    currentActivity: JSON.stringify([
      { type: "tool", label: "Creating sandbox...", status: "complete" },
      { type: "tool", label: "Fetching base branch...", status: "active" },
    ]),
  });

  await step.runAction(internal.daytona.fetchBaseBranch, {
    sandboxId,
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    baseBranch: args.baseBranch,
    repoId: args.repoId,
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
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    baseBranch: args.baseBranch,
    repoId: args.repoId,
  });
}

if (data.branchName) {
  await step.runMutation(internal.streaming.internalSet, {
    entityId: streamingEntityId,
    currentActivity: JSON.stringify([
      { type: "tool", label: "Creating sandbox...", status: "complete" },
      ...(args.baseBranch
        ? [
            {
              type: "tool",
              label: "Fetching base branch...",
              status: "complete",
            },
            {
              type: "tool",
              label: "Checking out base branch...",
              status: "complete",
            },
          ]
        : []),
      { type: "tool", label: "Setting up branch...", status: "active" },
    ]),
  });

  await step.runAction(internal.daytona.setupSandboxBranch, {
    sandboxId,
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    branchName: data.branchName,
    baseBranch: args.baseBranch ?? "main",
    repoId: args.repoId,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/backend/convex/_taskWorkflow/workflowDefinition.ts
git commit -m "refactor: use granular sandbox steps in taskExecutionWorkflow"
```

---

### Task 7: Update `automationExecutionWorkflow`

**Files:**

- Modify: `packages/backend/convex/automationWorkflow.ts:76-89`

- [ ] **Step 1: Replace prepareSandbox call with granular steps**

Replace lines 76-89 with:

```typescript
const streamingEntityId = `automation-run-${String(args.runId)}`;

const setupResult = await step.runAction(
  internal.daytona.createOrResumeSandbox,
  {
    installationId: args.installationId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    ephemeral: true,
    repoId: args.repoId,
    streamingEntityId,
  },
  { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
);
sandboxId = setupResult.sandboxId;

await step.runMutation(internal.streaming.internalSet, {
  entityId: streamingEntityId,
  currentActivity: JSON.stringify([
    { type: "tool", label: "Creating sandbox...", status: "complete" },
    { type: "tool", label: "Fetching base branch...", status: "active" },
  ]),
});

await step.runAction(internal.daytona.fetchBaseBranch, {
  sandboxId,
  installationId: args.installationId,
  repoOwner: data.repoOwner,
  repoName: data.repoName,
  baseBranch: data.defaultBaseBranch,
  repoId: args.repoId,
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
  installationId: args.installationId,
  repoOwner: data.repoOwner,
  repoName: data.repoName,
  baseBranch: data.defaultBaseBranch,
  repoId: args.repoId,
});

await step.runMutation(internal.streaming.internalSet, {
  entityId: streamingEntityId,
  currentActivity: JSON.stringify([
    { type: "tool", label: "Creating sandbox...", status: "complete" },
    { type: "tool", label: "Fetching base branch...", status: "complete" },
    { type: "tool", label: "Checking out base branch...", status: "complete" },
    { type: "tool", label: "Setting up branch...", status: "active" },
  ]),
});

await step.runAction(internal.daytona.setupSandboxBranch, {
  sandboxId,
  installationId: args.installationId,
  repoOwner: data.repoOwner,
  repoName: data.repoName,
  branchName: args.branchName,
  baseBranch: data.defaultBaseBranch,
  repoId: args.repoId,
});
```

- [ ] **Step 2: Add `internal` import for streaming**

The file already imports `internal` from `./_generated/api` at line 2. No change needed.

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/automationWorkflow.ts
git commit -m "refactor: use granular sandbox steps in automationExecutionWorkflow"
```

---

### Task 8: Update `evaluationWorkflow` — eval phase

**Files:**

- Modify: `packages/backend/convex/evaluationWorkflow.ts:48-59`

- [ ] **Step 1: Replace prepareSandbox call with granular steps**

Replace lines 48-59 (first `prepareSandbox` call) with:

```typescript
const streamingEntityId = String(args.reportId);

const { sandboxId } = await step.runAction(
  internal.daytona.createOrResumeSandbox,
  {
    installationId: args.installationId,
    repoOwner: docData.repoOwner,
    repoName: docData.repoName,
    ephemeral: true,
    repoId: docData.repoId,
    streamingEntityId,
  },
);

if (args.branchName) {
  await step.runMutation(internal.streaming.internalSet, {
    entityId: streamingEntityId,
    currentActivity: JSON.stringify([
      { type: "tool", label: "Creating sandbox...", status: "complete" },
      { type: "tool", label: "Fetching base branch...", status: "active" },
    ]),
  });

  await step.runAction(internal.daytona.fetchBaseBranch, {
    sandboxId,
    installationId: args.installationId,
    repoOwner: docData.repoOwner,
    repoName: docData.repoName,
    baseBranch: args.branchName,
    repoId: docData.repoId,
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
    installationId: args.installationId,
    repoOwner: docData.repoOwner,
    repoName: docData.repoName,
    baseBranch: args.branchName,
    repoId: docData.repoId,
  });
}
```

Note: `baseBranch` here is `args.branchName` (the eval checks out a specific branch). The `if (args.branchName)` guard matches current behavior — without `baseBranch`, `prepareSandbox` skipped the fetch/checkout.

- [ ] **Step 2: Commit**

```bash
git add packages/backend/convex/evaluationWorkflow.ts
git commit -m "refactor: use granular sandbox steps in evaluationWorkflow eval phase"
```

---

### Task 9: Update `evaluationWorkflow` — fix phase

**Files:**

- Modify: `packages/backend/convex/evaluationWorkflow.ts:98-110`

- [ ] **Step 1: Replace prepareSandbox call with granular steps**

Replace lines 98-110 (second `prepareSandbox` call) with:

```typescript
const { sandboxId: fixSandboxId } = await step.runAction(
  internal.daytona.createOrResumeSandbox,
  {
    installationId: args.installationId,
    repoOwner: fixData.repoOwner,
    repoName: fixData.repoName,
    ephemeral: true,
    repoId: fixData.repoId,
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
  sandboxId: fixSandboxId,
  installationId: args.installationId,
  repoOwner: fixData.repoOwner,
  repoName: fixData.repoName,
  baseBranch: args.branchName ?? "main",
  repoId: fixData.repoId,
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
  sandboxId: fixSandboxId,
  installationId: args.installationId,
  repoOwner: fixData.repoOwner,
  repoName: fixData.repoName,
  baseBranch: args.branchName ?? "main",
  repoId: fixData.repoId,
});

await step.runMutation(internal.streaming.internalSet, {
  entityId: streamingEntityId,
  currentActivity: JSON.stringify([
    { type: "tool", label: "Creating sandbox...", status: "complete" },
    { type: "tool", label: "Fetching base branch...", status: "complete" },
    { type: "tool", label: "Checking out base branch...", status: "complete" },
    { type: "tool", label: "Setting up branch...", status: "active" },
  ]),
});

await step.runAction(internal.daytona.setupSandboxBranch, {
  sandboxId: fixSandboxId,
  installationId: args.installationId,
  repoOwner: fixData.repoOwner,
  repoName: fixData.repoName,
  branchName: fixBranchName,
  baseBranch: args.branchName ?? "main",
  repoId: fixData.repoId,
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/backend/convex/evaluationWorkflow.ts
git commit -m "refactor: use granular sandbox steps in evaluationWorkflow fix phase"
```

---

## Chunk 3: Verify & cleanup

### Task 10: Typecheck

- [ ] **Step 1: Run Convex codegen typecheck**

```bash
cd packages/backend && npx convex codegen --typecheck enable
```

Expected: no type errors related to the new actions or updated callers.

- [ ] **Step 2: Fix any type errors**

If errors, fix them in the relevant files.

- [ ] **Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve type errors from granular sandbox refactor"
```

---

### Task 11: Update changelog

- [ ] **Step 1: Add entry to `internal/changelog.md`**

Add a new entry at the top:

```markdown
## Granular Sandbox Preparation Steps

**Date:** 2026-03-17

Split the monolithic `prepareSandbox` action into 4 granular actions (`createOrResumeSandbox`, `fetchBaseBranch`, `checkoutBaseBranch`, `setupSandboxBranch`) for workflow callers that use `baseBranch`. Each operation now runs as its own workflow step with an independent 10-minute action budget, preventing git fetch timeouts from killing the entire sandbox preparation. Also bumped all git fetch timeouts to 240s.

**Reason:** `git fetch` on repos like vmem was exceeding the 120s exec timeout within the monolithic action, causing the entire sandbox preparation to fail. Breaking into separate steps gives each operation its own timeout budget and enables per-step retries via the workflow component.
```

- [ ] **Step 2: Commit**

```bash
git add internal/changelog.md
git commit -m "docs: add changelog entry for granular sandbox steps"
```
