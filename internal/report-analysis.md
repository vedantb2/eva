# Autonomous Agent Patterns: Codebase Analysis

Analysis of Conductor's agent infrastructure against proven patterns for running autonomous agents unattended. Each principle is assessed with evidence from the codebase and concrete recommendations.

---

## 1. Sandbox Everything

**Status: Aligned**

Every agent run executes inside a Daytona sandbox created from a pre-built Docker snapshot (`eva-snapshot`). Sandboxes are configured with auto-stop (15 min) and auto-delete (30 min) intervals, scoped network access, and injected environment variables.

| Property       | Implementation                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| Ephemeral      | `evaluate-doc.ts` creates ephemeral sandboxes, explicitly deletes after use                 |
| Isolated       | Each sandbox gets its own filesystem, process space, and git workspace at `/workspace/repo` |
| Disposable     | Daytona auto-deletes after 30 minutes; explicit `sandbox.delete()` on completion            |
| Scoped network | `networkAllowList` parameter supported at creation (`sandbox.ts:38`)                        |

**Evidence:** `web/lib/inngest/sandbox.ts:16-52` (createSandbox), `web/lib/inngest/functions/evaluate-doc.ts:153-160` (explicit cleanup).

**Gap:** Session and project sandboxes are persistent (reused across runs via `sandboxId` stored in Convex). This means state accumulates between runs within the same session/project context.

**Recommendation:** Consider making task execution sandboxes ephemeral by default, only reusing sandboxes when the user explicitly needs continuity (e.g., interactive sessions). For `execute-task.ts`, create a fresh sandbox per task rather than reusing the project sandbox.

---

## 2. No Access to External Databases

**Status: Partial**

Sandboxes do not run databases internally, which is good. However, sandboxes receive Convex credentials (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`) at creation time (`sandbox.ts:25-30`), giving agents indirect read access to the shared Convex database.

The `execute-research-query.ts` function goes further: it spawns a Convex MCP server to let the agent query the production database directly (`execute-research-query.ts:38-49`).

**Recommendation:** For task execution, strip Convex credentials from sandbox environment variables. Agents editing code should not need database access. If database context is required, inject it as a static snapshot in the prompt rather than live credentials.

---

## 3. Environment Garbage

**Status: Partial**

Ephemeral sandboxes (evaluations) start clean every time and are correctly immune to environment garbage. However, session and project sandboxes persist across multiple agent runs:

- `session-sandbox.ts:47` runs `git fetch && git reset --hard && pnpm install` to sync state, but does not clear stray files, caches, or orphaned processes.
- `execute-task.ts:87-95` reuses the project sandbox across sequential tasks in `build-project.ts`, accumulating git history, node_modules changes, and any side effects from previous tasks.

**Evidence:** `build-project.ts:42-50` runs tasks sequentially on the same sandbox, relying on `step.waitForEvent()` between tasks.

**Recommendation:** For sequential task execution (`build-project.ts`), reset the sandbox workspace between tasks: `git clean -fdx && git checkout . && git pull` before each task. This ensures each task declares its own dependencies and does not inherit hidden state from a previous run.

---

## 4. Run Agents Independently of User Sessions

**Status: Aligned**

This is a strong point. All agent execution runs through Inngest background functions, fully decoupled from browser sessions:

- Execution persists if the user closes their browser (`session-execute.ts` runs as Inngest function)
- State syncs via Convex reactive queries; the frontend is a pure observer
- Users can reconnect to running sessions; sandbox reuse logic checks liveness via `echo 1` heartbeat (`sandbox.ts:439-446`)
- Cancellation is explicit via `session/execute.cancel` event, not implicit via disconnect

**Evidence:** `web/lib/inngest/functions/session-execute.ts:22` (cancelOn event), `web/app/(main)/[repo]/sessions/[id]/ChatPanel.tsx:56-99` (reactive Convex queries).

**Recommendation:** No major changes needed. One improvement: add a "reconnected to existing sandbox" indicator in the UI so users know when they're resuming rather than starting fresh.

---

## 5. Define Outcomes, Not Procedures

**Status: Partial**

Prompts are a mix of outcome-based and procedural:

- **Outcome-based (good):** `planPrompts.ts:1-16` asks agents to understand scope and intent before acting. The interview flow (`interview-question.ts`) gathers requirements conversationally.
- **Procedural (problematic):** `execute-task.ts:131-148` prescribes specific steps: "read CLAUDE.md", "edit source files", "commit changes", "push to branch". `session-execute.ts:284-304` instructs agents to create `plan.md` in a specific location and commit it.

The execution prompts define both the outcome AND the procedure, which constrains agent flexibility and can degrade quality when the prescribed steps don't fit the actual task.

**Evidence:** `web/lib/inngest/functions/execute-task.ts:131-148` (procedural prompt), `web/lib/prompts/planPrompts.ts:52-78` (outcome-based spec generation).

**Recommendation:** Refactor execution prompts to state the acceptance criteria and constraints, then let the agent decide how to achieve them. Instead of "read CLAUDE.md, edit files, commit, push", say: "Implement the following task. The result must be committed and pushed to branch X. Constraints: stay within the described scope, follow existing patterns in CLAUDE.md."

---

## 6. Direct, Low-Level Interfaces

**Status: Aligned**

Agents interact with the operating system through Claude Code CLI, which provides direct access to:

- **Command execution:** Bash tool
- **File operations:** Read, Write, Edit, Glob, Grep tools
- **Network:** Not exposed by default (WebFetch/WebSearch excluded from most tool lists)

The interface is flat and composable. No wrapper abstractions sit between the agent and the filesystem/shell. The CLI is invoked as: `echo <prompt> | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model <model> --allowedTools <tools>` (`sandbox.ts:165`).

**Evidence:** `web/lib/inngest/sandbox.ts:147-192` (runClaudeCLI), tool lists defined per execution mode.

**Recommendation:** No changes needed. The current approach of direct CLI primitives is exactly what the blog post advocates.

---

## 7. Avoid MCPs and Overbuilt Frameworks

**Status: Partial**

Core agent execution is CLI-first with no framework overhead, which is good. However:

- `execute-research-query.ts` uses `@ai-sdk/mcp` to spawn a Convex MCP server for database queries. This adds an abstraction layer (MCP protocol + stdio transport) between the agent and a database that could be queried directly.
- The AI SDK (`ai` package) is used for the research query function with `generateText()` and tool integration.

The rest of the system (task execution, sessions, evaluations) avoids frameworks and relies on direct CLI invocation, which is the right call.

**Evidence:** `web/lib/inngest/functions/execute-research-query.ts:38-49` (MCP client), `web/lib/inngest/sandbox.ts:147` (direct CLI for everything else).

**Recommendation:** For research queries, consider replacing the MCP layer with a direct Convex client call or a pre-built query endpoint. The MCP protocol adds indirection that makes debugging harder and provides no benefit when the agent is querying a single, known database.

---

## 8. Persist State Explicitly

**Status: Partial**

State is persisted, but not all of it is explicit or inspectable:

- **Messages and activity logs:** Stored in Convex sessions table with full conversation history, tool execution traces, and timestamps (`backend/convex/sessions.ts:110-114`).
- **Git diffs:** Captured after execution and stored as `fileDiffs` (`sandbox.ts:400-420`).
- **Summaries:** AI-generated session summaries stored as bullet points.

**Gap:** There is no workspace directory for intermediate artifacts. Agents do not persist planning artifacts, intermediate results, or execution logs as files. All state goes to Convex (database) rather than the filesystem. This means:

- Post-run analysis requires querying the database, not inspecting files
- Intermediate reasoning is lost unless captured in activity logs
- No structured artifact output (e.g., test results, coverage reports)

**Recommendation:** Add a writable artifacts directory per run (e.g., `/workspace/artifacts/`). Instruct agents to write intermediate plans, test outputs, and execution logs there. After the run, persist the artifacts directory contents to Convex or object storage for inspection.

---

## 9. Introduce Benchmarks Early

**Status: Gap**

The codebase has an evaluation system (`evaluationReports`) that checks if code meets document requirements, but this is requirements validation, not agent output benchmarking.

There is no system for:

- Measuring agent output quality across runs
- Comparing different prompts, models, or configurations
- Tracking regression in agent behavior over time
- A/B testing prompt strategies

The analytics system (`backend/convex/analytics.ts`) tracks operational metrics (success rates, PR counts, task completion) but not output quality metrics.

**Evidence:** `backend/convex/evaluationReports.ts` (requirements-only evaluation), `backend/convex/analytics.ts` (operational metrics only).

**Recommendation:** Build a benchmark suite that:

1. Defines a set of representative tasks with known-good outputs
2. Runs agents against these tasks on a schedule or before prompt/model changes
3. Scores outputs against acceptance criteria (correctness, code quality, test passing)
4. Tracks scores over time to detect regression

Even a crude benchmark (5-10 tasks, manual scoring) would surface quality issues that operational metrics miss.

---

## 10. Plan for Cost

**Status: Gap**

There is no cost tracking, budget enforcement, or usage metering anywhere in the codebase.

- No token counting on Claude API calls
- No per-user or per-project spend limits
- No alerting on unusual consumption
- The only resource limit is `stepCountIs(5)` on research queries (`execute-research-query.ts:77`)
- Timeouts exist (120-600s) but are for reliability, not cost control

The system uses Opus (most expensive model) as default for task execution and evaluations. Sessions can run unlimited messages with no cost guardrails.

**Evidence:** `web/env/server.ts` (only `OPENROUTER_API_KEY`, no budget vars), no token/cost references in any function.

**Recommendation:**

1. **Track token usage:** Log input/output tokens per agent run to Convex. OpenRouter returns usage data in API responses.
2. **Set per-run budgets:** Add a `maxTokens` parameter to `runClaudeCLI` that aborts if exceeded.
3. **Model tiering:** Use Sonnet instead of Opus for routine tasks. Reserve Opus for complex multi-file implementations. The summarization function already does this with Haiku (`summarize-session.ts`), but task execution should follow the same pattern.
4. **Dashboard:** Surface cost data in the existing analytics system so spend is visible alongside operational metrics.

---

## Summary

| #   | Principle                       | Status  | Priority |
| --- | ------------------------------- | ------- | -------- |
| 1   | Sandbox Everything              | Aligned | Low      |
| 2   | No External Databases           | Partial | Medium   |
| 3   | Environment Garbage             | Partial | High     |
| 4   | Independent of User Sessions    | Aligned | Low      |
| 5   | Define Outcomes, Not Procedures | Partial | Medium   |
| 6   | Direct Low-Level Interfaces     | Aligned | Low      |
| 7   | Avoid MCPs/Frameworks           | Partial | Low      |
| 8   | Persist State Explicitly        | Partial | Medium   |
| 9   | Introduce Benchmarks Early      | Gap     | High     |
| 10  | Plan for Cost                   | Gap     | High     |

## Priority Recommendations

**High priority (quality and sustainability risks):**

1. **Add cost tracking and budgets** — Without visibility into spend, autonomous execution is a financial risk. Log token usage per run, set per-run limits, and surface data in analytics.

2. **Build a benchmark suite** — There is no way to know if agent output is getting better or worse. Define 5-10 representative tasks, run them periodically, and track quality scores over time.

3. **Reset environments between sequential tasks** — `build-project.ts` runs tasks on the same sandbox sequentially. Add `git clean -fdx` between tasks to eliminate hidden state dependencies.

**Medium priority (correctness and flexibility):**

4. **Strip database credentials from execution sandboxes** — Agents editing code don't need live Convex access. Inject context as static data in prompts instead.

5. **Refactor prompts to be outcome-based** — Execution prompts currently prescribe steps. Define acceptance criteria and constraints instead, and let agents plan their own approach.

6. **Add artifact persistence** — Create a `/workspace/artifacts/` directory per run for intermediate results, making post-run analysis possible without database queries.
