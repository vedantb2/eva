# Eva retrospective: biggest learning curves

_Written 25 July 2026. A look back at the hardest-won lessons building eva — the platform that manages other codebases and runs them remotely in sandboxes._

The common thread across everything below: eva sits on top of managed primitives (Convex actions, Vercel/Daytona sandboxes) whose **invisible limits and side-effects** — time ceilings, lazy resume, OOM, cross-origin auth — are not in the docs and only surface as confusing production symptoms. Most of the steepest curves were reverse-engineering those boundaries from evidence.

---

## 1. Convex execution-time ceilings shaped the whole architecture

This is the deepest one.

**The 10-minute action cap drove the core design decision.** Eva deliberately runs the agent loop _inside_ the sandbox, not from a host-held connection. The in-sandbox callback self-drives, pushes HMAC-signed heartbeats to Convex over HTTP (150 ms flush, 10 s keep-alive ping), and blocks on completion events the sandbox fires back via mutation. The host holds no live socket.

Why: Convex actions cap at ~10 minutes wall-clock, and long agent turns exceed that. Work is decomposed into short durable-workflow steps plus `awaitEvent` blocks that wait for sandbox completion POSTs. This avoids a persistent host tier — new infra, a new failure domain, new reconnect semantics.

**A nastier variant: the hidden ~300s nested-action ceiling.** A nested `ctx.runAction` from a `"use node"` action dies at ~300 seconds — not 600 — with a bare, message-less `Error` thrown from `performAsyncSyscall` in Convex's bundled runtime. The child action may keep running; the error just crosses the boundary with no message or cause. Four production incidents (23–24 July 2026) all died at +5m12–29s before the cause was pinned.

The fix is unintuitive until you have been burned: never `ctx.runAction` a potentially-long (>4 min) action from another action. Export the handler body as a plain helper and call it directly, so the only limit is the caller's 10-minute budget. Workflow `step.runAction` is not affected (top-level execution).

**Lesson:** the platform's time limits are not a footnote — they are the primary architectural force. Design for decomposition into short, durable steps from day one.

---

## 2. Sandbox lifecycle: "resume" is invisible and everywhere

A whole cluster of bugs came from one non-obvious fact: on Vercel, **any `exec` lazily resumes a stopped VM**. That produced repeated, confusing symptoms.

- **Prewarm resurrects a closed sandbox.** Opening a closed session's page silently woke its VM. The page effect fired `prewarmDaemon` whenever `sandboxId` was set — it never checked `status`, and a closed session keeps its `sandboxId`. The VM woke, but `status`/`updatedAt` never changed, so it was invisible. Fixed at three layers (page effect, mutation, action), then again for the inverse case where the DB said "active" but the Vercel VM had auto-stopped.
- **`convex dev` wedging permanently.** Under heavy load (seeding + esbuild + next build) on sandbox resume, each local-backend spawn died before passing the CLI health check. After the 240s startup timeout, the CLI stopped spawning and looped "Unable to pull deployment config from 127.0.0.1:3210" forever. The binary and seeded SQLite were healthy — only the daemon was wedged.
- **Cold-storage thaws exceeding the 10-min limit.** An archived-sandbox restore can take longer than a single Convex action allows. This forced the async `ensureSandboxStartedSteps` pattern — poll the thaw across durable-workflow steps (ceiling ~20 min) — which now fronts every sandbox-resume path: chat, runs, start-sandbox, project interview, audit-fix, and design start.

**Lesson that runs through all of them:** resume paths must never fake "active" or launch services. Only the startup workflow launches things. Every open/poll-triggered path must gate on real status and avoid the lazy-resume `exec`.

---

## 3. Debugging blind — the surfaced error is rarely the cause

**"Run killed by watchdog: no heartbeat" was not a watchdog or network problem.** 39 of 1071 runs ended `watchdog_killed`. Kills always landed at exactly the full stale threshold (300s → 900s → 1500s as it was raised), meaning heartbeats stopped permanently — the callback Node process died, not a transient transport blip. Activity-log snapshots showed the active step at death was always a short, bounded command (`timeout 120s npx tsc --noEmit` in half the samples). Best-fit cause: the **OOM killer SIGKILLing the callback during memory-heavy steps** (tsc on the big monorepo). The watchdog message masked it, and kill-path sandbox deletion destroyed the done-file/dmesg evidence.

This built a durable habit: go to `agentRunActivityLogs` per runId before trusting the surfaced error. The same theme runs through the message-less 300s `Error` in section 1.

**Lesson:** when the error is generic (watchdog, bare `Error`), treat it as a symptom, not a diagnosis. Preserve evidence _before_ cleanup destroys it, and read the raw activity logs.

---

## 4. Cross-origin auth vs. Convex's raw WebSocket

Exposing the sandbox-local Convex backend to the preview took a same-origin proxy trick. The preview proxy reserves two path prefixes — `/__convex` → local Convex client port 3210, `/__convex-site` → HTTP-actions port 3211.

Why: Convex's browser client opens a raw WebSocket and cannot attach the preview token, so it cannot follow a cross-origin auth redirect to a separate preview origin. Routing through the already-authenticated app preview origin avoids the handoff entirely. Add the IPv4-only sandbox constraint on top.

There is a sharp edge here too: the same `NEXT_PUBLIC_CONVEX_URL` env var is reused by the MCP layer, so pointing it at the proxy can silently break MCP queries against staging.

**Lesson:** networking-through-a-proxy was not obvious up front. Managed clients (like Convex's) make assumptions about origin and auth that break the moment you introduce a sandbox indirection layer.

---

## 5. The Daytona → Vercel sandbox migration

A large, recent effort (completed 25 July 2026): Vercel became the only provider. The win was snapshot restore going from minutes-long Daytona cold starts to ~0.3s lazy block-fetch, flat with snapshot size.

The learning curve was as much about **what _not_ to clean up**. Several pieces of Daytona residue must stay until a data migration runs, or things break:

- the `DAYTONA_UUID` guard (legacy sandbox ids are UUIDs, Vercel names are not — removing it creates duplicate sandboxes),
- provider inference for historical builds plus the build-row badge (so old builds still render correctly),
- `v.literal("daytona")` in enum validators (existing data still uses it).

There was also a process lesson: a parallel PR did the same removal but forked 184 commits back (109 conflicts), so it was replayed on current code rather than merged.

**Lesson:** removing a provider is not just deleting its code. Historical data and id-format assumptions outlive the code path, so schema/validator cleanup needs a real migration behind it.

---

## Recurring themes

1. **Managed primitives have undocumented limits.** Time ceilings (10 min, hidden 300s), lazy resume, OOM behaviour, WebSocket/origin assumptions — none of these were in the docs; all surfaced as production incidents.
2. **The error message is rarely the root cause.** Watchdog kills were OOM; bare `Error` was a syscall timeout. Trust the raw activity logs over the surfaced label.
3. **Side effects hide in "read-only" paths.** Opening a page, fetching a preview, probing a daemon — each could silently resume a VM. Every such path needs a status gate.
4. **Deletions leave data behind.** Legacy ids and validator literals outlive the code that wrote them; clean up with a migration, not a sweep.
5. **Design for decomposition.** Durable-workflow steps + `awaitEvent` are the answer to almost every long-running-work problem on this stack.
