# Agent Prompt Issues

Principle: **Define outcomes, not procedures.** Let the agent own planning and execution.

---

## 1. Task Execute — `web/lib/inngest/functions/execute-task.ts`

**Problem:** Numbered steps prescribe execution order (read CLAUDE.md → implement → update CLAUDE.md → git add → git push). This is a predefined execution graph.

**Fix:** Replace with outcome + acceptance criteria:

```
Implement the following on branch ${branchName}.

Task: ${task.title}
Description: ${task.description}
${subtasksList}

Acceptance criteria:
- Changes committed and pushed to origin/${branchName}
- Implementation matches the task and subtask descriptions

Constraints:
- Don't run build, lint, test, or dev commands
- GITHUB_TOKEN is set for git operations
- Use the lockfile to determine the package manager
```

---

## 2. Session Execute (execute mode) — `web/lib/inngest/functions/session-execute.ts` (~L382-403)

**Problem:** Same numbered-step pattern (read CLAUDE.md → explore → make changes → commit → push).

**Fix:** Same approach as above — define the outcome (changes committed/pushed on branch), constraints (no build commands, no PRs), and let Claude decide how to get there.

---

## 3. Session Execute (plan generate mode) — `web/lib/inngest/functions/session-execute.ts` (~L254-307)

**Problem:** Prescribes plan.md format ("Overview of changes, List of files, Step-by-step tasks, Dependencies"). Tells the agent how to structure its thinking.

**Fix:** Just say: "Create a plan.md that describes what needs to change and why, based on the planning conversation. Commit and push it." Let Claude decide the structure.

---

## 4. Doc Evaluation (judgment phase) — `web/lib/inngest/functions/evaluate-doc.ts` (~L102-151)

**Problems:**

- Boolean pass/fail removes nuance (partial, N/A, unclear)
- "No file paths in details" limits explainability
- Forcing exactly N results is brittle if Claude groups or splits requirements
- Two separate CLI calls may lose context between exploration and judgment

**Fix:**

- Allow a status enum: `passed | partial | failed | n/a`
- Remove the "no file paths" restriction
- Relax "exactly N" to "one result per requirement" without hard failure on count mismatch
- Consider a single pass with structured output at the end instead of two separate passes

---

## 5. Session Execute (ask mode) — `web/lib/inngest/functions/session-execute.ts` (~L151-171)

**Problem (minor):** "How to find information" section tells Claude which tools to use (Glob, Grep, Read). Claude already knows its tools.

**Fix:** Remove the tool instructions. Just keep the outcome ("answer questions for a non-technical user") and the response constraints (short, plain text, no jargon).

---

## Summary

| File                            | Severity | Core Issue                                      |
| ------------------------------- | -------- | ----------------------------------------------- |
| `execute-task.ts`               | High     | Step-by-step execution graph                    |
| `session-execute.ts` (execute)  | High     | Step-by-step execution graph                    |
| `session-execute.ts` (plan gen) | Medium   | Prescribed output format                        |
| `evaluate-doc.ts` (judgment)    | Medium   | Over-constrained output + two-pass context loss |
| `session-execute.ts` (ask)      | Low      | Unnecessary tool instructions                   |
