# Plan: Add Model Selector to TaskDetailModal

## Context

The task execution pipeline currently hardcodes `model: "sonnet"` in `execute-task.ts`. We need to let users pick a model (opus/sonnet/haiku) per task, defaulting to sonnet, and thread that choice through to execution.

## Changes (5 files)

### 1. `packages/backend/convex/validators.ts`

Add `claudeModelValidator`:

```ts
export const claudeModelValidator = v.union(
  v.literal("opus"),
  v.literal("sonnet"),
  v.literal("haiku"),
);
```

### 2. `packages/backend/convex/schema.ts` (line 101)

Add optional `model` field to `agentTasks` table:

```ts
model: v.optional(claudeModelValidator),
```

### 3. `packages/backend/convex/agentTasks.ts`

- **`agentTaskValidator`** (line 9): Add `model: v.optional(claudeModelValidator)`
- **`update` mutation** (line 153): Add `model` to args and handler updates
- **`startExecution` mutation** (line 579): Add `model` to return type and return `task.model`

### 4. `apps/web/lib/components/tasks/TaskDetailModal.tsx`

- Add a **Model** `<Select>` dropdown in the sidebar between "Assign" and "Pull Request", following the same pattern as Status/Assign selects
- Value: `task?.model ?? "sonnet"` (default to sonnet for tasks without model set)
- On change: call `updateTask({ id: taskId, model: val })` with a type guard (no `as` keyword)
- In `handleStartExecution`: pass `model: result.model` in the Inngest event data

### 5. `apps/web/lib/inngest/functions/execute-task.ts`

- Destructure `model` from `event.data` (line 49)
- Use `model ?? "sonnet"` instead of hardcoded `"sonnet"` on line 151

## Verification

1. Run `npx tsc` in `apps/web` to verify types
2. Open TaskDetailModal → verify Model dropdown appears in sidebar with Sonnet selected by default
3. Change model to Opus → verify the task updates in Convex
4. Click "Run Eva" → verify the Inngest event includes the selected model
