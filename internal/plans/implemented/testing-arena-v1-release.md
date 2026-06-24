# Release Testing Arena

## Context

Testing Arena (run AI evals of codebase vs doc requirements, auto-fix failures via PR) is dev-only (`devOnly: true` in sidebar). Core code-testing flow works end-to-end. To release: remove gate, fix security/robustness gaps, make auto-fix opt-in, mark UI Testing tab "coming soon", polish test-all copy.

**User decisions:** UI Testing tab = visible "Coming soon" state. Auto-fix = opt-in button. Test-all = keep, polish copy. Hardening = all three fixes (access check, duplicate-run guard, zero-requirements guard).

## Backend

### 1. Shared fields + new `branchName` field

- `packages/backend/convex/_validators/tableFields.ts`: add `export const evaluationReportFields = { ... }` (current schema fields + new `branchName: v.optional(v.string())` — branch eval ran against, so fix uses same base). No migration needed (optional field).
- `packages/backend/convex/schema.ts:162-177`: `evaluationReports: defineTable(evaluationReportFields)` keep both indexes. Prune unused imports.
- `packages/backend/convex/evaluationReports.ts`: `reportValidator = v.object({ _id, _creationTime, ...evaluationReportFields })` (matches `docValidator` pattern in docs.ts).

### 2. Workflow split — `packages/backend/convex/evaluationWorkflow.ts`

- **`evaluationWorkflow`**: delete fix phase (lines 92–169). Becomes: setRunning → getDocData → prepareSandboxSteps → launchOnExistingSandbox → awaitEvent(evalCompleteEvent) → saveResult. Keep catch → saveWorkflowFailure.
- **`saveResult`**: always set `activeWorkflowId: undefined` (line 304 currently keeps it when hasFailures). Simplify `returns` to `v.null()` — caller no longer branches.
- **New `fixWorkflow`** (same file): args `{ reportId, docId, userId, installationId, baseBranch (optional), fixBranchName }`. Body = current fix phase: getFixData → prepareSandboxSteps (baseBranch ?? FALLBACK_GIT_BASE_BRANCH, branchName: fixBranchName) → launchOnExistingSandbox (completionMutation `evaluationWorkflow:handleFixCompletion`, tools Read,Write,Edit,Bash,Glob,Grep) → awaitEvent(fixCompleteEvent) → on success pushSandboxBranch + createPullRequest + saveFixResult, else saveFixError. Catch → saveWorkflowFailure (already handles `completed` + `fixing` → fix_error). **fixBranchName must be generated in startFix, not in the workflow handler** (handlers replay; keep deterministic).
- **New public `startFix` mutation**: authMutation, args `{ reportId }`. Checks: report exists + `hasRepoAccess(ctx.db, report.repoId, ctx.userId)` (import from `./functions`); idempotent return if `activeWorkflowId` set or fixStatus fixing/fix_completed; require status "completed" + ≥1 failed result. Branch name: `eva/eval-fix-{last8}`, on retry (existing fixBranchName) suffix `-r${Date.now().toString(36)}` (push is non-force, name reuse would fail). Patch `fixStatus: "fixing"`, `fixBranchName`, start fixWorkflow with `baseBranch: report.branchName`, then `trackEvaluationWorkflow`. Delete `setFixing` (work moves into startFix).
- **Watchdog: no changes** (verified): `trackEvaluationWorkflow` guard passes for completed report w/ cleared activeWorkflowId; `handleStaleEvaluation` handles fix-only timeout → fix_error; stale eval handler no-ops on workflowId mismatch.
- **Harden `startEvaluation`** (lines 556–593):
  - Load doc; throw if missing or `doc.repoId !== args.repoId`.
  - `hasRepoAccess` check, throw if no access.
  - Throw if `(doc.requirements ?? []).length === 0` ("Add requirements to this document before running a test").
  - Duplicate guard: query `by_doc` index, if any report pending/running → return its `_id` (idempotent — keeps test-all loop safe). `fixStatus: "fixing"` does NOT block a new eval.
  - Store `branchName: args.branchName` on insert.

## Frontend

### 3. Remove dev gate

- `apps/web/src/lib/components/Sidebar.tsx:271`: delete `devOnly: true` from Testing Arena item only. Leave Designs + root "Testing" gated.

### 4. `$arenaTab.tsx` (`apps/web/src/routes/_repo/$owner/$repo/testing-arena/$id/$arenaTab.tsx`)

- Replace manual `EvalResult`/`EvaluationReport` interfaces (lines 65–81) with `type EvaluationReport = FunctionReturnType<typeof api.evaluationReports.listByDoc>[number]` (CLAUDE.md rule).
- **Fix issues button** in ReportCard header actions (lines 130–158), when completed + failures:
  - no fixStatus → "Fix issues" button → `startFix({ reportId })`
  - `fixing` → existing spinner (unchanged)
  - `fix_error` → existing "Fix failed" warning + "Retry fix" button (same mutation)
  - `fix_completed` → existing PR link covers it
- **Run Test gating**: `hasActiveRun = reports?.some(r => pending || running)`, `hasRequirements = (doc?.requirements?.length ?? 0) > 0`. Disable button when either fails; hint when no requirements.
- **UI tab**: wrap BranchSelect + Run Test (lines 452–466) in `{activeTab === "code" && ...}`; optional "Soon" badge on UI TabsTrigger.

### 5. `UITestingPanelClient.tsx` — Coming soon

- Replace fake WebPreview/URL input/console with centered coming-soon state (IconWorld, "UI Testing is coming soon", one-line copy). Keep exported name `UITestingPanel`. Drop dead useState hooks.

### 6. `TestingArenaSidebar.tsx` — test-all polish

- `handleTestAll`: filter to docs with requirements; per-doc try/catch so one failure doesn't abort loop.
- Modal copy: explain runs eval per doc with requirements, skips others; button "Yes save me Eva" → "Run all tests"; title → "Test all documents".

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable`
2. `cd apps/web && npx tsc --noEmit`
3. No `any`/`unknown`/`as`/`!` introduced.
4. Manual e2e (agent-browser at `/?agent`):
   - Sidebar shows Testing Arena (prod build hides Designs/root Testing still).
   - Doc w/o requirements: Run Test disabled + hint.
   - Run eval: report stores branchName; Run Test disabled while running; duplicate start returns same report.
   - Eval w/ failures completes → workflow ends (no auto sandbox #2), "Fix issues" shows.
   - Click Fix issues → fixing spinner → branch + PR → "View Fix PR".
   - fix_error → "Retry fix" → new `-r…` suffixed branch.
   - All-pass eval: no Fix button. UI tab: coming soon, no controls.
   - Test all: new copy, skips reqless docs.
5. Run `/changelog` after.

## Known accepted risks

- Retry after a fix that pushed+PR'd before erroring → second PR, `prUrl` overwritten. Accepted v1.
- Reports mid-fix at deploy time fail replay → land fix_error → recoverable via Retry. Deploy at quiet moment.
- Duplicate guard `.collect()`s all reports per doc — fine at current volume.

## Unresolved questions

- None blocking. Pre-existing `id as Id<"docs">` cast at $arenaTab.tsx:380 violates no-`as` rule — fix opportunistically or leave?
