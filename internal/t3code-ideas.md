# t3code research → eva adoption ideas

Reference doc for later adoption decisions. Source repo: https://github.com/pingdotgg/t3code (refs are repo-relative). Not implemented — store only.

## How t3code integrates MCP (answer summary)

No conversational fast path; MCP attached unconditionally per thread (`apps/server/src/provider/Layers/ClaudeAdapter.ts:3442-3480`); tiny 13-tool surface; per-thread bearer creds (SHA-256 hashed, 30min idle/8h max, capability set `["preview"]`, revoke+reissue per session — `apps/server/src/mcp/McpSessionRegistry.ts`); localhost HTTP `McpServer.layerHttp`. Latency via persistent query + steering. Eva's fix: escalation sentinel + `ENABLE_TOOL_SEARCH` (see changelog).

## Eva already has (verified 2026-07-11 — don't re-adopt)

AskUserQuestion option cards (`MultipleChoiceQuestion.tsx`); turn folding "Worked for Ns" (`packages/ui/src/ai-elements/activity-tasks.tsx:209`); skills slash-autocomplete (`MentionTextarea.tsx`); cumulative token/cost widget (`EntityContextUsage.tsx`); dev-port detection (`_daytona/devServer.ts:57`); PR recaps; planning via the `eva-plan` system skill.

## A. MCP / Agent SDK

1. **Tool annotations drive approval classes** — `Tool.Readonly/Destructive/Idempotent/OpenWorld` annotations on every MCP tool (`apps/server/src/mcp/toolkits/preview/tools.ts:30-37`); eva could annotate its 21 tools for future permission surfaces.
2. **Never-yield capabilities probe** — SDK query whose prompt generator never yields; `initializationResult()` returns account email/subscription + slash commands with zero API tokens, then abort (`ClaudeProvider.ts:570-636`). Use: surface sandbox slash commands/plugins in composer, account/plan display.
3. **Per-thread MCP credential lifecycle** — mint on session start, revoke-then-reissue, idle+max TTLs, hash-only storage (`McpSessionRegistry.ts:105-138`). Eva's HS256 JWT ≈ equivalent; TTL/idle pruning is the delta.

## B. Session/turn lifecycle

4. **Mid-turn steering** (user shortlisted) — prompt queue → AsyncIterable feeds one long-lived `query()`; message sent during a live turn joins the SAME turn/turnId instead of queueing a follow-up (`ClaudeAdapter.ts:3101-3109, 3648-3733`). Eva queues follow-up turns (`_sessions/execution.ts:151-181`).
5. **Synthetic turns** — assistant output with no active turn auto-opens a turn flagged `synthetic`, auto-closed on next real send (`ClaudeAdapter.ts:123-138, 2466-2506, 3648-3657`). Directly relevant to eva's orphan "Working" placeholder bugs (recent fixes a42c0d1f, d059103e).
6. **Interrupt normalization** — one classifier collapsing interrupt signals from message text / result subtype / cause tree (`ClaudeAdapter.ts:278-317, 2916-2947`).
7. **Canonical event union + `raw` native envelope** — one Schema-validated event stream serving 5 provider CLIs; every event optionally carries the provider-native payload tagged by source (`packages/contracts/src/providerRuntime.ts:21-40, 967-1017`). Strategic if eva adds Codex/Cursor.
8. **Sequence-cursor replay** — subscribe-before-read (fork live buffer → read persisted after-cursor → concat; client dedupes by sequence) + pure client recovery state machine `ignore/defer/recover/apply` (`apps/server/src/ws.ts:1152-1240`, `apps/web/src/orchestrationRecovery.ts`). Convex reactivity covers most of this; reference-grade pattern.

## C. Remote architecture

9. **"Remote = the same server over a forwarded WebSocket," no bespoke daemon** — idempotent launch-or-reuse script: pid file + HTTP readiness probe + runner-hash respawn, state in `~/.t3/ssh-launch` (`packages/ssh/src/tunnel.ts:413-591`; philosophy `docs/architecture/remote.md`). Strategic alternative to eva's fragile callback daemon (watchdog OOM history). Launch (how process starts) kept strictly separate from access (how client connects).
10. **Tailscale as pure endpoint discovery**, never managed tunnels (`packages/tailscale/src/tailscale.ts`).

## D. Git / workspace

11. **Shadow-git per-turn checkpoints** (user shortlisted) — temp `GIT_INDEX_FILE` → `read-tree HEAD` → `add -A` → `write-tree` → `commit-tree` (dangling) → `update-ref` hidden ref; user index/history untouched; ref-vs-ref diffs power per-turn diffs + revert-to-checkpoint (`apps/server/src/vcs/GitVcsDriver.ts:651-730`, `checkpointing/CheckpointStore.ts`). Eva has nothing per-turn (PR-level only).

## E. UX / product

12. **Live context meter** (user shortlisted) — SDK `getContextUsage()` control request for authoritative `{totalTokens, maxTokens, isAutoCompactEnabled}` + `compact_boundary` pre/post-token reset; donut red >90%, "auto-compacts" note (`ClaudeAdapter.ts:1773-1794, 477-512, 2609-2626`; `apps/web/…/ContextWindowMeter.tsx`). Eva's widget is a static 200k lookup of cumulative tokens.
13. **Plan-mode deny-and-capture** — intercept `ExitPlanMode` in `canUseTool`, capture plan markdown as `turn.proposed.completed`, DENY the tool so plan mode can never execute; proposed plan carries `implementedAt`/`implementationThreadId` linking plan → implementing thread (`ClaudeAdapter.ts:3270-3290, 1796-1841`).
14. **Plan renders from tool INPUT** — TodoWrite parsed at input time (steps appear as the model types); TaskCreate/Update/List reconstructed into steps with "(blocked by #x)" suffixes (`ClaudeAdapter.ts:677-831`).
15. **Question-panel polish** — number keys 1-9 select options, optimistic single-select with 200ms auto-advance, i/N progress (`ComposerPendingUserInputPanel.tsx`). Gotcha worth recording: SDK ≥2.1.121 looks up answers by FULL question text — id must equal question text (`ClaudeAdapter.ts:3132-3151`).
16. **"Accept for session" via SDK `updatedPermissions`** — return suggestions from `canUseTool`, SDK persists the rule; zero own storage (`ClaudeAdapter.ts:3384-3393`). N/A while eva runs `bypassPermissions`; relevant if approvals ever surface.
17. **Descriptor-driven model options** — models declare `optionDescriptors` (effort/contextWindow/fastMode/thinking); UI renders generically; product levels normalize: `ultracode`→`xhigh`+`settings.ultracode`, `ultrathink`→prompt prefix, `1m`→`model[1m]` suffix; semver-gated per installed CLI version (`packages/shared/src/model.ts:146-367`, `ClaudeProvider.ts:55-380`).
18. **Stable row identity in streaming timeline** — per-variant shallow compare reuses prior row objects so unchanged rows skip re-render (`MessagesTimeline.logic.ts:538-601`).
19. **Text-generation service** — commit msg / PR title+body (forced `## Summary`/`## Testing`) / branch name / thread title via provider CLI with structured `outputSchema` + per-repo `TextGenerationPolicy` custom instructions (`apps/server/src/textGeneration/`). Eva: titles are user-typed; recaps are freeform markdown — auto-titles + schema-validated recaps are the deltas.

## F. Preview / browser (agent self-verifies UI)

20. **One-shot semantic snapshot** — single tool returns url/title/visibleText (20k cap)/≤200 interactive elements {role,name,stable selector,bbox}/full a11y tree/console+network-failure ring buffers (200, captured continuously)/agent action timeline, plus screenshot split out as a real MCP `image` content block with everything else in `structuredContent` (`apps/desktop/src/preview/Manager.ts:1850-1952`; image split `McpHttpServer.ts:122-196`). Eva's agent-browser CLI deltas: continuous console/network buffers, action timeline, image-block split.
21. **Playwright injected selector engine** — inject Playwright runtime for `role=`/`text=` locator resolution + visible/enabled asserts; typed content-free selector errors (kind+length only — privacy) (`Manager.ts:1000-1043, 1963-2017`).
22. **Broker invariants** — sticky lease pins agent session→one browser target (fail, don't migrate, mid-flow), requestId correlation, 15s default timeout, remembered "current tab" guarded by tabSequence (`apps/server/src/mcp/PreviewAutomationBroker.ts:420-578`).
23. **Recording evidence artifacts** (user shortlisted) — recording_start/stop → real mp4/webm artifact `{id, path, mimeType, sizeBytes, createdAt}`, single-active guard, path-traversal guard (`Manager.ts:1740-1815`). Eva version: Playwright `record_video`/tracing in sandbox + upload to eva storage as typed session/turn artifact rendered in UI (like task-proof screenshots, generalized).
24. **`environment-port` navigation target + auditable resolution** — agent says `{kind:"environment-port", port:5173}`, resolver returns `{requestedUrl, resolvedUrl, resolutionKind}` record (`packages/contracts/src/previewAutomation.ts:113-141`, `browserTargetResolver.ts:32-92`). Eva already has the better resolution side (preview proxy — t3code's is a TODO); the tool abstraction + audit record are the steal. Plus `PortScanner` (lsof/`Get-NetTCPConnection` + common-ports fallback, PID→terminal attribution) to verify the dev server actually listens vs eva's package.json guess.
25. **Collaborative co-control** (reference only, Electron-specific) — agent cursor overlay, human `pointerdown` bumps a control epoch aborting agent CDP mid-action, expected-input pre-registration distinguishes agent's own synthetic input from human input (`Manager.ts:1082-1208, 2052-2071`).

## G. Engineering hygiene

26. **Per-thread NDJSON event logs** — native SDK stream AND canonical translation, rotating 10MB×10 sinks, 200ms batched, best-effort (`EventNdjsonLogger.ts`). Invaluable for adapter-drift debugging.
27. **Custom lint plugin encodes architecture** — e.g. `no-global-process-runtime` forces DI for `process.platform` (`oxlint-plugin-t3code/`).
28. **Deterministic per-clone dev ports** — hash repo path → port offset, so parallel worktrees never collide (`scripts/dev-runner.ts:25-30`).
29. **Capability-versioned operation sets** — client advertises `supportedOperations`, missing = V1 baseline set; rolling upgrades without breaking old clients (`previewAutomation.ts:29-48`).
