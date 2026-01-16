# Implementation Plan: Plan Feature Creates Subtasks Within Tasks

## Overview

Modify the plan feature so that when a plan is converted to a feature (via `createFromPlan`), each generated task also receives subtasks. The AI-generated spec will include subtasks for each task, and these will be automatically created when the feature is generated.

## Current State

- **Plans** generate a `generatedSpec` JSON with `tasks` array (title, description, dependencies)
- **Tasks** (`agentTasks`) are created when `features.createFromPlan()` is called
- **Subtasks** exist as a separate table linked to `agentTasks` via `parentTaskId`
- Subtasks are currently only created manually through the UI (`SubtaskList.tsx`)

## Proposed Changes

Extend the spec format to include subtasks for each task, and modify the `createFromPlan` mutation to create subtasks alongside tasks.

---

## Files to Modify

### 1. Backend: Spec Parsing and Feature Creation

| File | Change |
|------|--------|
| `web/lib/utils/parseSpec.ts` | Add `subtasks` array to `ParsedTask` interface |
| `backend/convex/features.ts` | Update `parseSpec()` and `createFromPlan()` to handle subtasks |

### 2. AI Prompts

| File | Change |
|------|--------|
| `web/lib/prompts/planPrompts.ts` | Update `SPEC_GENERATION_PROMPT` to include subtasks in output format |

### 3. Frontend: Display Subtasks in Spec Preview

| File | Change |
|------|--------|
| `web/lib/components/plan/PlanFinalizationModal.tsx` | Display subtasks under each task in the preview |

---

## Step-by-Step Implementation Tasks

### Task 1: Update Spec Format and Parsing

**File: `web/lib/utils/parseSpec.ts`**

Update the TypeScript interfaces to include subtasks:

```typescript
interface ParsedSubtask {
  title: string;
}

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
  subtasks: ParsedSubtask[];  // NEW
}
```

Update the `parseSpec()` function to parse subtasks:

```typescript
export function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map((t) => ({
      title: t.title ?? "",
      description: t.description ?? "",
      dependencies: t.dependencies ?? [],
      subtasks: (t.subtasks ?? []).map((s: { title?: string }) => ({
        title: s.title ?? "",
      })),
    })),
  };
}
```

---

### Task 2: Update Backend parseSpec and createFromPlan

**File: `backend/convex/features.ts`**

Update the local `ParsedTask` interface (lines 259-264):

```typescript
interface ParsedSubtask {
  title: string;
}

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
  subtasks: ParsedSubtask[];  // NEW
}
```

Update the local `parseSpec()` function (lines 271-284):

```typescript
function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map(
      (t: { title?: string; description?: string; dependencies?: number[]; subtasks?: { title?: string }[] }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
        subtasks: (t.subtasks ?? []).map((s) => ({
          title: s.title ?? "",
        })),
      })
    ),
  };
}
```

Update `createFromPlan` mutation to create subtasks after creating each task. Add after the task creation loop (after line 377):

```typescript
// Create subtasks for each task
for (let i = 0; i < spec.tasks.length; i++) {
  const task = spec.tasks[i];
  const taskNumber = i + 1;
  const taskId = taskIdMap.get(taskNumber);
  if (!taskId) continue;

  for (let j = 0; j < task.subtasks.length; j++) {
    const subtask = task.subtasks[j];
    await ctx.db.insert("subtasks", {
      parentTaskId: taskId,
      title: subtask.title,
      completed: false,
      order: j,
    });
  }
}
```

---

### Task 3: Update AI Prompt for Spec Generation

**File: `web/lib/prompts/planPrompts.ts`**

Update `SPEC_GENERATION_PROMPT` to include subtasks in the output format:

```typescript
export const SPEC_GENERATION_PROMPT = `Based on our conversation, generate a detailed implementation spec for this feature.

Output as JSON with this structure:
{
  "title": "Clear, concise feature title (max 60 chars)",
  "description": "Detailed description of the feature including scope and goals",
  "tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "dependencies": [],
      "subtasks": [
        { "title": "Specific implementation step" },
        { "title": "Another implementation step" }
      ]
    }
  ]
}

Generate 2-5 tasks that represent ownership boundaries in the codebase. Each task should:
- Represent a complete area of responsibility (e.g., "backend infrastructure" or "UI integration")
- Encompass ALL related changes within that boundary (multiple file edits expected)
- Be comprehensive enough that completing the task means that entire area is done

For each task, include 2-6 subtasks that break down the specific implementation steps within that ownership boundary. Subtasks should be:
- Actionable and specific
- Small enough to complete in one coding session
- Ordered logically (dependencies within the task)

Examples of good task/subtask structure:
- "Dark theme toggle":
  - Task: "Theme infrastructure"
  - Subtasks: ["Create theme context", "Define CSS variables for themes", "Add localStorage persistence", "Wire up context provider"]
- "Search feature":
  - Task: "Search backend"
  - Subtasks: ["Add search index to schema", "Create search API endpoint", "Implement ranking algorithm", "Add result pagination"]

Avoid micro-tasks at the task level - those belong as subtasks instead.

Only output the JSON, no other text.`;
```

---

### Task 4: Update Finalization Modal to Display Subtasks

**File: `web/lib/components/plan/PlanFinalizationModal.tsx`**

Update the task list rendering (around line 100-117) to show subtasks:

```tsx
<ul className="space-y-2">
  {parsedSpec.tasks.map((task, i) => (
    <li
      key={i}
      className="text-xs sm:text-sm bg-default-100 p-2 rounded"
    >
      <div className="flex items-start gap-2">
        <span className="text-default-400 font-mono flex-shrink-0">{i + 1}.</span>
        <div className="min-w-0 flex-1">
          <span className="font-medium">{task.title}</span>
          {task.dependencies.length > 0 && (
            <span className="text-default-400 ml-1 sm:ml-2 block sm:inline">
              (depends on: {task.dependencies.join(", ")})
            </span>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <ul className="mt-2 ml-4 space-y-1">
              {task.subtasks.map((subtask, j) => (
                <li key={j} className="text-default-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-default-300 flex-shrink-0" />
                  {subtask.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  ))}
</ul>
```

---

## Dependencies and Prerequisites

1. No database schema changes required - the `subtasks` table already exists with the correct structure
2. No new npm packages required
3. Existing subtask mutations (`subtasks.create`, `subtasks.update`, etc.) will continue to work for manual editing

## Testing Checklist

- [ ] Create a new plan and go through the interview process
- [ ] Verify the generated spec JSON includes subtasks for each task
- [ ] Verify the finalization modal displays subtasks under each task
- [ ] Click "Create Feature" and verify tasks are created with subtasks
- [ ] Navigate to a created task and verify subtasks appear in the SubtaskList component
- [ ] Verify subtasks can be toggled as complete
- [ ] Verify existing plans without subtasks in their spec still work (backwards compatibility)

## Backwards Compatibility

The implementation handles backwards compatibility by:
- Using `t.subtasks ?? []` when parsing, so specs without subtasks default to empty array
- The UI conditionally renders subtasks only if `task.subtasks.length > 0`
- Existing subtask CRUD operations remain unchanged

## Summary

This implementation adds subtask support to the plan feature with minimal changes:
- 2 TypeScript interface updates (frontend + backend parseSpec)
- 1 AI prompt update
- 1 backend mutation update (createFromPlan)
- 1 UI component update (PlanFinalizationModal)

Total estimated files to modify: **4 files**
