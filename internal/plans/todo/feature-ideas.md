# Feature Ideas for Conductor

Curated list of features to improve AI usage and UX, based on full codebase scan. Excludes the 3 features already planned (task screenshots, MCP in sandbox, reports/charts).

---

## Tier 1 — High Impact, Leverages Existing Infrastructure

### 1. AI Code Review on PR Creation

**Why:** Tasks execute code but there's zero validation loop. The agent creates a PR and walks away.
**What:** After `execute-task` creates a PR, trigger a new Inngest job (`review-pr.ts`) that:

- Checks out the branch in a sandbox
- Runs Claude in read-only mode to review the diff
- Posts review comments on the PR via GitHub API
- Stores review results in a new `codeReviews` table
  **Files:** New `web/lib/inngest/functions/review-pr.ts`, new table in `backend/convex/schema.ts`

### 2. Session Summaries (Auto-generated)

**Why:** Session list shows timestamps but no indication of what happened. Users must open each session to remember context.
**What:** After a session goes idle or is closed, auto-generate a 2-3 line summary of what was done (files changed, commands run, outcome). Store in the session record. Show in session list.
**Files:** `backend/convex/sessions.ts` (add `summary` field), new Inngest function or inline in cleanup

### 3. File Diffs in Chat

**Why:** When the AI makes changes in a session, the user sees terminal output but no visual diff of what actually changed.
**What:** After an execute-mode message completes, run `git diff` in the sandbox, parse the output, and store structured diffs alongside the message. Render with a diff viewer component in the chat panel.
**Files:** `web/lib/inngest/functions/execute-session-task.ts`, session message schema, new diff viewer component

### 4. Connect Sessions to Project Tasks

**Why:** This is the biggest UX gap. Projects define tasks, sessions do the work, but they're completely disconnected. Users can't tell which task a session worked on or mark tasks done from sessions.
**What:**

- Add optional `taskId` to sessions
- "Start Session" button on task detail
- When session creates a PR for a task, auto-update task status
- Show linked session(s) on task detail view
  **Files:** `backend/convex/schema.ts` (sessions table), `backend/convex/sessions.ts`, task detail components

### 5. Finish Saved Queries + Routines UI

**Why:** Backend tables (`savedQueries`, `routines`) and Convex functions already exist. The analyse pages show "coming soon". This is literally just wiring up UI.
**What:** Build the saved queries list page and routines management page. Add a scheduler Inngest function for routines.
**Files:** `web/app/(main)/[repo]/analyse/saved-queries/page.tsx`, `web/app/(main)/[repo]/analyse/routines/page.tsx`, new `execute-routine.ts` Inngest function

---

## Tier 2 — Medium Impact, Fills Real Gaps

### 6. AI Test Generation

**Why:** Agent generates code but never writes tests. This means quality is unverified.
**What:** New Inngest function that generates tests for the code changes in a task/session. Runs tests in sandbox. Reports pass/fail.
**Files:** New `web/lib/inngest/functions/generate-tests.ts`

### 7. Error Categorization & Learning

**Why:** `execute-task` retries 3 times on failure but doesn't learn. Same errors repeat.
**What:** Add `errorCategory` and `rootCause` fields to `agentRuns`. After a failure, classify the error (git, syntax, timeout, logic). Surface error patterns in analytics.
**Files:** `backend/convex/schema.ts`, `backend/convex/agentRuns.ts`, analytics components

### 8. Cost & Token Tracking

**Why:** No visibility into AI spend per session/task/project. Can't optimize what you can't measure.
**What:** Log token counts and estimated cost per AI operation. Add `tokenCount`, `estimatedCost` to `agentRuns` and session messages. Dashboard in stats section.
**Files:** Schema updates, sandbox-helpers.ts (capture usage from Claude response), analytics dashboard

### 9. GitHub CI Awareness

**Why:** Agent creates PRs but has no idea if CI passes or fails. Can't self-correct.
**What:** After PR creation, poll GitHub Actions status. If CI fails, parse the failure and optionally trigger a fix attempt.
**Files:** New Inngest function, GitHub API integration

### 10. Global Search

**Why:** No way to search across projects, tasks, sessions, and queries. Users must navigate to each section separately.
**What:** Command palette (Cmd+K) that searches across all entities. Uses Convex search indexes.
**Files:** New search component, Convex search indexes on key tables

---

## Tier 3 — UX Polish & Quality of Life

### 11. Keyboard Shortcuts

Cmd+K for search, Cmd+Enter to send messages, Cmd+N for new session/project. No shortcuts exist today.

### 12. Session Branching

Fork a session at any point to try a different approach without losing the original.

### 13. Project Progress Bar

Visual progress indicator on project cards showing % of tasks completed. Currently no at-a-glance progress.

### 14. Quick Port Suggestions in Web Preview

Suggest common ports (3000, 5173, 8080) instead of requiring manual entry every time.

### 15. Chrome Extension — Accessibility Auditing

The extension already captures DOM context and React component trees. Add a11y checks using that captured context to flag issues and create tasks.

### 16. Smart Model Selection

Auto-select Haiku for simple queries, Sonnet for planning, Opus for complex execution — instead of hardcoded model per function. Base it on task complexity estimation.

### 17. Onboarding Wizard

After connecting GitHub, guide the user through: create first project → start session → build something. Currently no first-time guidance.

### 18. Active Project Phase Fix

The "Active" project phase shows hardcoded "Sandbox (coming soon)" and "Chat (coming soon)" placeholders. This is a dead end in the core workflow.

---

## Recommended Priority Order

Based on impact-to-effort ratio:

1. **Session Summaries** (#2) — small effort, immediately useful
2. **Finish Saved Queries + Routines** (#5) — backend already done
3. **Connect Sessions to Project Tasks** (#4) — biggest UX gap
4. **File Diffs in Chat** (#3) — high visibility improvement
5. **AI Code Review** (#1) — closes the quality loop
6. **Active Project Phase Fix** (#18) — removes a dead end
7. **Project Progress Bar** (#13) — quick win
8. **Cost Tracking** (#8) — operational necessity as usage grows
9. **Global Search** (#10) — UX multiplier
10. **Error Learning** (#7) — improves AI reliability over time
