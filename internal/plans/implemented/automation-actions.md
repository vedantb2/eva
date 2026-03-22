# Automation Findings → Task Creation

## Context

Read-only automations currently produce free-form markdown reports. User wants structured, actionable output: automation reports findings, user selects which ones to act on via checkboxes, then creates quick tasks from selected findings. This gives human control over what gets fixed.

## Design Decisions (confirmed with user)

- **Approach**: Create quick tasks from findings (not inline fix)
- **Scope**: Read-only automations only (when new `actionsEnabled` toggle is on)
- **Output**: Structured JSON findings stored on `automationRuns`
- **Finding fields**: title, description, severity, filePaths, suggestedFix
- **Per-finding status tracking**: Each finding tracks whether a task was created from it
- **UI**: Replace `resultSummary` display when `actionsEnabled=true`; otherwise show markdown as-is
- **Execution option**: "Create" vs "Create & Run" toggle at submit time

---

## Step 1: Schema changes

**`packages/backend/convex/validators.ts`**

Add finding severity validator:

```
export const findingSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);
```

Add finding validator:

```
export const automationFindingValidator = v.object({
  id: v.string(),          // unique id within the run (e.g. "finding-0", "finding-1")
  title: v.string(),
  description: v.string(),
  severity: findingSeverityValidator,
  filePaths: v.optional(v.array(v.string())),
  suggestedFix: v.optional(v.string()),
  taskId: v.optional(v.id("agentTasks")),  // set when task is created from this finding
});
```

Add to `automationFields`:

```
actionsEnabled: v.optional(v.boolean()),
```

Add to `automationRunFields`:

```
findings: v.optional(v.array(automationFindingValidator)),
```

**`packages/backend/convex/schema.ts`** — no changes needed (uses spread of field objects).

## Step 2: Update automation prompt for structured findings

**`packages/backend/convex/automationWorkflow.ts`**

When `actionsEnabled=true` AND `readOnly=true`, use a new prompt builder `buildActionableReportPrompt()` that instructs Claude to:

1. Analyze the codebase per the prompt
2. Output findings as a JSON array at the end, fenced in a ` ```json ` block with a `<!-- FINDINGS_JSON -->` marker
3. Each finding: `{ id, title, description, severity, filePaths, suggestedFix }`

The workflow handler parses the JSON from `result.result`, stores it in `findings` field on the run.

Pass `actionsEnabled` through workflow args.

## Step 3: Parse findings from Claude output

**`packages/backend/convex/automationWorkflow.ts`** (or new helper)

Add `parseFindingsFromResult(resultText: string)` function:

- Looks for JSON block after `<!-- FINDINGS_JSON -->` marker
- Parses array, validates shape, assigns sequential IDs if missing
- Returns typed array or null if parsing fails (graceful fallback to markdown display)

After `step.awaitEvent(taskCompleteEvent)`, if `actionsEnabled`:

```
const findings = parseFindingsFromResult(result.result ?? "");
```

Pass `findings` to `updateRunStatus`.

## Step 4: Backend mutation to create tasks from findings

**`packages/backend/convex/_automations/` or `packages/backend/convex/automations.ts`**

New mutation `createTasksFromFindings`:

```
args: {
  runId: v.id("automationRuns"),
  findingIds: v.array(v.string()),
  autoRun: v.boolean(),
}
```

Logic:

1. Get the run, get the automation (for repoId, model)
2. For each selected finding ID:
   - Build task title from finding title
   - Build task description from finding description + filePaths + suggestedFix
   - Call `ctx.db.insert("agentTasks", ...)` (inline, same pattern as `createQuickTask`)
   - Patch the finding in the run's `findings` array: set `taskId` to the new task ID
3. If `autoRun=true`, for each created task, schedule execution via `ctx.scheduler.runAfter(0, internal.taskWorkflow.triggerExecution, { taskId })`
4. Return created task IDs

## Step 5: Update `updateRunStatus` mutation

**`packages/backend/convex/automations.ts`** (internal mutation)

Add optional `findings` arg to `updateRunStatus`. When provided, patch the run with findings.

## Step 6: Settings UI — add "Actions" toggle

**`AutomationClient.tsx` → `SettingsForm`**

Add new toggle card below "Report Only" (only visible when `readOnly=true`):

```
Actions Enabled
"Parse findings into actionable items you can convert to tasks"
```

Same toggle pattern as readOnly. Save `actionsEnabled` field.

Track `actionsEnabled` in hasChanges + handleSave.

## Step 7: Run history UI — findings display

**`AutomationClient.tsx` → `RunAccordion`**

When expanded and run has `findings` array (non-empty):

- Show findings list instead of `resultSummary` markdown
- Each finding = row with:
  - Checkbox (disabled if `taskId` is set)
  - Severity badge (color-coded: critical=red, high=orange, medium=yellow, low=blue)
  - Title (bold)
  - Description (truncated, expandable)
  - File paths (small, monospace)
  - Suggested fix (collapsed by default)
  - If `taskId` set: "Task created" badge (links to task)
- Bottom bar: "Create Tasks" / "Create & Run Tasks" button pair
  - Disabled if no checkboxes selected
  - Calls `createTasksFromFindings` mutation

When findings parsing fails: show warning banner ("Could not parse findings from report") + fall back to `resultSummary` markdown below it.

Task description format (simple concatenation):
`{description}\n\nFiles: {filePaths}\nSuggested fix: {suggestedFix}`

Extract findings UI into `_components/FindingsList.tsx` if it exceeds ~100 lines.

## Step 8: Update `automations.update` mutation

Accept and persist `actionsEnabled` field.

---

## Files to modify

1. `packages/backend/convex/validators.ts` — new validators + field additions
2. `packages/backend/convex/automationWorkflow.ts` — new prompt, parse findings, pass to updateRunStatus
3. `packages/backend/convex/automations.ts` — updateRunStatus accepts findings, new createTasksFromFindings mutation, update mutation accepts actionsEnabled
4. `apps/web/app/(repo)/[owner]/[repo]/automations/[id]/AutomationClient.tsx` — settings toggle, findings UI in run accordion

## Existing code to reuse

- `createQuickTask` pattern from `_agentTasks/mutations.ts:154` for task creation logic
- `startExecution` from `_agentTasks/execution.ts:13` for auto-run
- `runStatusValidator`, `claudeModelValidator` from validators.ts
- Toggle pattern already used for readOnly in SettingsForm
- Badge component from `@conductor/ui`
- `createQuickTasksBatch` pattern from `_agentTasks/mutations.ts:200`

## Verification

1. Create a read-only automation with `actionsEnabled=true`
2. Run it → confirm structured findings appear in run history with checkboxes
3. Select 2 of N findings → click "Create Tasks" → confirm tasks created in quick-tasks page
4. Return to run → confirm those 2 findings show "Task created" badge, checkboxes disabled
5. Select remaining findings → "Create & Run Tasks" → confirm tasks created AND execution starts
6. Test fallback: if Claude output doesn't contain valid JSON findings, falls back to markdown display
7. Test with `actionsEnabled=false` → normal markdown resultSummary shown
8. Run `npx tsc` in both packages/backend and apps/web
