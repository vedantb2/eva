# Fix: Session workflow timeout handling

## Context

When `setupAndExecute` times out (600s Convex limit) or Daytona SDK calls hang, the assistant message stays empty forever ("Working..." / "Starting...") because `saveResult` never runs. No workflow has error handling for this.

## Changes

### 1. `packages/backend/convex/daytona.ts` — Add timeout wrapper + apply

- Add `withTimeout<T>(promise, ms, label)` helper after `sleep()` (~line 76). Uses explicit Promise constructor to preserve generic type without `as`.
- Apply to `ensureSessionClaudeVolume`:
  - Line 107: wrap `daytona.volume.get(volumeName, true)` → 30s timeout
  - Line 125: wrap `daytona.volume.get(volumeName)` → 30s timeout
- Apply to `getOrCreateSandbox`:
  - Line 303: wrap `daytona.get(existingSandboxId)` → 30s timeout
- Apply to `launchScript` uploadFile calls:
  - Lines 723-726, 730-733: pass explicit `30` timeout param (SDK supports it, currently defaults to 30 min)

Scope: only `setupAndExecute` hot path. Other `daytona.get()` calls in separate actions are a follow-up.

### 2. `packages/backend/convex/sessionWorkflow.ts` — Add try/catch

- Wrap steps 2-7 (everything after `addAssistantPlaceholder`) in try/catch
- Catch block calls `step.runMutation(saveResult, { success: false, error: message })` — reuses existing cleanup (clears streaming activity, updates message, clears `activeWorkflowId`)

## Verification

- `npx tsc` in packages/backend — no type errors
- Confirm no `any`, `unknown`, or `as` introduced
