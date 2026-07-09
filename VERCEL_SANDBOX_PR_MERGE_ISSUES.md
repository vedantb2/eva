# Vercel sandbox PR merge issues

**Base PR:** [#425](https://github.com/vvedantb/eva/pull/425) — `feat/vercel-sandbox-migration` → `main`  
**Fix PR:** stacked on #425 — `fix/vercel-sandbox-id-lifecycle`  
**Checked:** 2026-07-09  
**Verdict:** Actionable code items on stacked PR done (#1–#6, #8–#10, #13, #15–#16). Ops #7 + E2E #5 re-check remain. Deferred: #11/#12/#14 (known limitations).

**PR status (base):** MERGEABLE, checks green, `REVIEW_REQUIRED`. Title still says WIP.

---

## Blockers

### 1. `saveAuditFixSandboxId` never persists `vercelSandboxId` — FIXED

- **Stacked fix:** `saveAuditFixSandboxId` + audit create path persist `vercelSandboxId`.

### 2. Clear/stop mutations leave stale `vercelSandboxId` — FIXED

- **Stacked fix:** `clearSandbox` / `clearProjectSandbox` / `clearTaskSandbox` / `clearInterview` / PR-merge project clear all unset both ids; project delete uses `vercelSandboxId ?? sandboxId`.

---

## High

### 3. Doc workflows omit `vercelSandboxId` — FIXED

- **Stacked fix:** `docInterviewWorkflow` + `docPrdWorkflow` pass/persist via `saveDocSandboxId`.

### 4. `resolveTaskSandboxIdForRun` is provider-blind — FIXED

- **Stacked fix:** uses `preferPersistedSandboxId`.

### 5. Design post-create install still flaky on pnpm monorepos — MITIGATED

- **Stacked fix:** stronger `detectPackageManager` (`packageManager: pnpm@` + `workspace:` → pnpm). Still worth E2E re-check on carepulse designs.

### 6. `sessionExecuteWorkflow` thaw gated only on `data.sandboxId` — FIXED

- **Stacked fix:** thaw when `sandboxId || vercelSandboxId`.

### 7. Production needs a Vercel seeded `snap_*` before flip — OPS (open)

- Not a code change. Document/run seed per repo before `SANDBOX_PROVIDER=vercel`.

---

## Medium

### 8. `projectInterviewWorkflow` thaw only when `projectData.sandboxId` — FIXED

### 9. Auth `updateProjectSandbox` sets only `sandboxId` — FIXED

### 10. `auditFixWorkflow` catch clears only one resume id — FIXED

### 11. Daytona persistence volumes disabled on Vercel — known limitation (defer)

### 12. `kickOffSnapshotBuild` still Daytona-only — known limitation (defer)

### 13. Audit-fix fallback omits `vercelSandboxId` persist — FIXED (with #1)

### 14. Design create is one long action — defer (architecture)

---

## Low

### 15. Design/PTY guards check `sandboxId` only — FIXED

- **Stacked fix:** design stop + design chat launch use `preferPersistedSandboxId`.

### 16. Dead `unwrapDaytonaSandbox` import in `git.ts` — defer cleanup

### 17. Changelog overclaims full entity cutover — FIXED via #3 wiring + stacked changelog entry

---

## What’s OK (not blocking)

- Provider factory + `SANDBOX_PROVIDER` + credential validation
- `resolveExistingSandboxId` — Vercel never uses Daytona UUID for `get`
- Thaw polling via `resumeSandboxSteps` for session/task/project/design startup
- Happy-path persist of both ids on session/task/project/design ready
- Automations create on Vercel + persist `vercelSandboxId` (verified E2E)
- Agent run reuse of Vercel sandbox (verified E2E)
- Session/task/project preview create/resume (verified E2E)

---

## Recommended before production cutover

1. ~~Fix #1 and #2~~ done on stacked PR
2. ~~Fix #4~~ done
3. ~~Wire #3~~ done
4. Re-verify #5 design start on carepulse after pnpm fix (E2E)
5. Ensure each flipped repo has a successful Vercel seed build (#7) before setting `SANDBOX_PROVIDER=vercel`
