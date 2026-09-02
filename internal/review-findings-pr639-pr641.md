# Review findings — PR 641 (usage limits) and PR 639 (harness skills)

Handoff doc for follow-up work. Both PRs merged to main on 23 Aug 2026 (639 then 641); Convex deployed to prod the same day. 4 of 20 findings were fixed pre-merge (marked FIXED); the remaining 16 are open. Line numbers are from the PR-time diffs — re-locate by symbol, not line.

---

## PR 641 — "Fetch Claude Agent SDK usage limits" (agentUsageLimits table, UsageLimits UI chip)

### 1. OPEN — Partial one-shot report wipes fuller stored windows
`packages/backend/convex/usageLimits.ts` (~57, `report` mutation, `db.replace`)
The mutation upserts with a whole-row `db.replace`, assuming every report is a complete snapshot. One-shot (fresh-process) captures are partial: if the `/usage` control request times out (5s) but a `rate_limit_event` supplied one window, the report contains only that window and `db.replace` deletes the previously stored weekly/Opus windows. UI windows flap in and out across turns.
Fix direction: merge into the stored row (or only replace when the capture came from a successful `/usage` read), instead of blind replace.

### 2. FIXED — Chip hides rejected account when another has windows
`apps/web/src/lib/components/usage-limits/_utils.ts` (`chipSummary`)
Fixed in 0b5f931e: status tone now merges for every row before the `utilization === undefined` skip; regression test added.

### 3. OPEN — Warm daemon re-reports vanished windows/status forever
`packages/backend/callback-src/runtime/usageLimits.ts` (~127, `mergeWindow` / `captureClaudeUsage`)
The process-level snapshot (`S.usageLimitSnapshot`) is merge-only: `mergeWindow` never deletes and nothing ever refreshes/clears `status`. A daemon that once saw `overage` at 98% keeps upserting that window every turn even after the period ends and `/usage` returns null for it; a stale `status: "rejected"` persists until daemon restart.
Fix direction: rebuild the snapshot from each successful `/usage` response rather than merging into it; clear status when a fresh read carries none.

### 4. OPEN — Stale rows never expire; red chip days after reset
`packages/backend/convex/usageLimits.ts` (~69, `getByRepo`) + `chipSummary`
Rows have no TTL and the UI applies no `capturedAt`/`resetsAt` gating. A 96% reading captured Monday keeps painting a danger chip days later even though the window reset hours after capture. Only the hover footer's "updated X ago" hints at staleness.
Fix direction: gate or grey-out rows whose `resetsAt` has passed or whose `capturedAt` is old (pick a threshold), in `getByRepo` or `chipSummary`.

### 5. FIXED — Hover "resets in" frozen at first render
`apps/web/src/lib/components/usage-limits/UsageLimitsIndicator.tsx` / `UsageLimitsDetails.tsx`
Fixed in 0b5f931e: `Date.now()` is now taken inside `UsageLimitsDetails`, which mounts on hover-open.

### 6. OPEN — providerAccountId stored and displayed unvalidated
`packages/backend/convex/usageLimits.ts` (~44, `report` mutation)
The mutation accepts a sandbox-supplied `providerAccountId` with only a repo-access check — no existence/ownership/provider match. `getByRepo` does a bare `ctx.db.get` and returns `account.label` to anyone with repo access, bypassing the ownership/shared gating every other `userProviderAccounts` read path enforces. Bounded by id unguessability and label-only exposure.
Fix direction: validate the id resolves to a `userProviderAccounts` row of the right provider that the launching user may use, at report time.

### 7. OPEN — One-shot capture can delay completion up to 5s
`packages/backend/callback-src/providers/claudeSdk.ts` (~445)
The one-shot path awaits `captureClaudeUsage` before `deliverCompletionWithMedia`, so a hung `/usage` control request adds up to `USAGE_LOOKUP_TIMEOUT_MS` (5s) to every one-shot turn's user-visible completion, including error turns. The daemon path deliberately orders capture after completion.
Fix direction: mirror the daemon ordering, or `void captureClaudeUsage(...).then(() => reportUsageLimits("claude"))`.

### 8. OPEN — Daemon turn-end capture stalls persist/pump up to 5s
`packages/backend/callback-src/providers/claudeSdkDaemon.ts` (`finalizeTurn`, ~514)
`finalizeTurn` awaits `captureClaudeUsage` between the completion mutation and `syncClaudeStateToPersist` / the message pump. A degraded SDK control channel costs 5s per turn before state persists and the next queued message dequeues; a sandbox death in that window loses a persist that previously ran immediately. Nothing after the await needs the result synchronously.
Fix direction: same as 7 — detach with `.then()` to preserve capture→report ordering without blocking.

### 9. OPEN — One-shot usage report killed by process.exit(0)
`packages/backend/callback-src/providers/claudeSdk.ts` (~446)
`void reportUsageLimits("claude")` races the hard `process.exit(0)` in `index.ts` (~361). If the report HTTP request (or its retry backoff) is in flight when completion delivers, the mutation never lands. A repo that only runs one-shot turns may never grow/refresh its usage row.
Fix direction: await the report (with a short timeout) before exit, or move the report ahead of completion delivery.

### 10. OPEN — Capture+report pair duplicated; finalizeTurn over-widened
`packages/backend/callback-src/providers/claudeSdkDaemon.ts` (~447) + `claudeSdk.ts`
The `await captureClaudeUsage(...); void reportUsageLimits("claude")` pair is duplicated verbatim at both turn-end sites, and `finalizeTurn` was widened to take the whole `WarmRunner` solely to reach `readUsage` (used once).
Fix direction: a single `captureAndReportClaudeUsage(readUsage)` helper in `runtime/usageLimits.ts`; narrow `finalizeTurn` back to a thunk. Fold in the fixes for 7–9 while touching it.

---

## PR 639 — "Integrate Claude Skills Across Harnesses" (harnessSkillCatalogs table, /-picker built-ins)

### 11. FIXED — Repo-local skills leak into the global harness catalog
`packages/backend/callback-src/providers/claudeSdkDaemon.ts` (`reportHarnessSkillCatalog`)
Fixed in 67b4bcf7: the daemon now excludes command names found in the checkout's and sandbox user's `.claude/skills` / `.claude/commands` before POSTing. Note this is name-based exclusion — a repo skill that shadows a genuine built-in's name is also excluded from the report (acceptable; the built-in returns on the next boot from a repo without the shadow).

### 12. FIXED — Whole report 400s when >100 commands
`packages/backend/convex/_harnessSkills/report.ts` (Zod caps) + daemon
Fixed in 67b4bcf7 on the daemon side: descriptions trimmed to first non-empty line, oversized names dropped, argument hints clamped to 400 chars, list capped at 100. The server still rejects whole reports at the boundary (unchanged, defense in depth).

### 13. OPEN — Fleet-constant HMAC in sandbox env = global write token
`packages/backend/convex/_sandbox_runtime/launch.ts` (~267)
`HARNESS_CATALOG_HMAC = HMAC(ENCRYPTION_KEY, "harness-catalog:claude")` signs only the scope string, not the payload, and is injected into every sandbox env where arbitrary agent/user code runs. One read (e.g. a repo's postinstall script) grants permanent, from-anywhere write access to the global catalog every user's composer renders. Cannot be revoked without rotating `ENCRYPTION_KEY` deployment-wide.
Fix direction: payload-bound signature (sign the skillsJson hash) or per-sandbox derivation with server-side sandbox liveness check.

### 14. OPEN — Catalog HMAC doubles as valid heartbeat signature
`packages/backend/convex/http.ts` (~92 heartbeat, ~130 catalog route)
Both routes verify `computeScopedHmac` over non-disjoint message namespaces: the heartbeat verifies over the raw caller-supplied `entityId`, so the catalog HMAC is a valid heartbeat signature for `entityId="harness-catalog:claude"`. Low impact today (no UI maps that entity), but the one-signature-one-scope invariant is gone.
Fix direction: domain-prefix the heartbeat message (e.g. `"streaming-heartbeat:" + entityId`) with a migration window.

### 15. OPEN — Stale catalog row unclearable; shadows static fallback
`packages/backend/convex/harnessSkills.ts` (~51, `upsertForProvider`)
Empty filtered reports short-circuit (`skills.length === 0 → return null`) and no deletion/reset path exists. A polluted or outdated non-empty row persists indefinitely and fully shadows the curated static fallback (`CLAUDE_HARNESS_SKILLS`) in the frontend.
Fix direction: an internal admin mutation to clear/reset the row per provider; consider letting an all-filtered report clear it.

### 16. OPEN — AI_PROVIDERS can silently drift from AIProvider union
`packages/backend/convex/_validators/aiModels.ts` (~174)
`AI_PROVIDERS` is a third hand-maintained copy of the provider list; its tuple annotation checks element membership but not completeness. Adding a provider to the union compiles clean while `z.enum(AI_PROVIDERS)` 400s that provider's reports after HMAC passes — silent, retry-burning failure.
Fix direction: derive the union and Convex validator from the array (single source of truth).

### 17. OPEN — Skill shape hand-declared three times, not Infer-derived
`packages/backend/convex/_harnessSkills/filter.ts` (~11) + web `HarnessSkill`
`ReportedHarnessCommand`/`HarnessCatalogSkill` are hand-declared shape-twins of `harnessSkillValidator`, and the web's `HarnessSkill` is a third copy (which already silently drops `argumentHint`). Violates docs/eva-convex.md's "never duplicate schema types manually" — `Infer<>`/`FunctionReturnType<>` precedent exists in the same files.
Fix direction: derive all three from the validator via `Infer<>` / `FunctionReturnType<>`.

### 18. OPEN — Harness skill chip click lands on a page lacking the skill
`apps/web/src/lib/components/chat/MarkdownMentionText.tsx` (~203) and `MessageMentionText.tsx` (~69)
`evabuiltinskill_` ids fail `isSkillTokenId` and fall into the branch whose click navigates to Settings → Skills, which lists repo and system skills but never harness built-ins. Clicking a rendered `/loop` chip dead-ends.
Fix direction: render harness chips as non-navigating (or link to something meaningful, e.g. a tooltip with the description).

### 19. OPEN — Deterministic 4xx report failures retried 5 times
`packages/backend/callback-src/http/convexClient.ts` (~135, `callHarnessSkillCatalogReport` via `postSignedForm`/`withRetries`)
`postSignedForm` throws a generic Error on any `!res.ok` and `withRetries` retries indiscriminately: a 400/401 (key rotation, validation reject) burns 5 identical signed POSTs with ~15s backoff per daemon boot.
Fix direction: carry the status in the thrown error; retry only network errors and 5xx.

### 20. OPEN — Claude-only pipeline with dead multi-provider wiring
`apps/web/src/lib/components/mentions/harnessSkills.ts` (~104)
Only the Claude daemon reports, yet `HARNESS_CATALOG_HMAC` is injected into codex/cursor/opencode sandboxes nothing reads, and the frontend hard-gates `if (provider !== "claude") return []`, discarding any future non-claude row. Badge text "Claude" (`useSkillSlashItems.ts` ~129) and `BADGE_LOGO` (`MentionRow.tsx` ~43) are further hidden edit points.
Fix direction: either wire the other providers' daemons to report, or stop injecting the credential where it is unused and centralise the per-provider display bits.

---

## Suggested grouping for follow-up sessions

1. **Usage-limit data semantics** (1, 3, 4, 6): replace-vs-merge, snapshot pruning, staleness gating, account validation — one coherent change to `usageLimits.ts` + `runtime/usageLimits.ts`.
2. **Turn-end capture plumbing** (7, 8, 9, 10): one refactor to a shared non-blocking `captureAndReportClaudeUsage` helper.
3. **Catalog auth hardening** (13, 14): payload-bound HMAC + heartbeat namespace prefix.
4. **Catalog hygiene** (15, 16, 17, 19): reset path, single-source provider list, Infer-derived types, status-aware retries.
5. **UI polish** (18, 20): chip click behaviour, multi-provider wiring or removal.
