# Two-week regression hardening audit

**Status:** implemented for deterministic repository tests; browser, connector, and live-sandbox layers remain planned

**Audit window:** 2026-07-27 00:00 through 2026-08-09 23:59 Europe/London

## Audit inventory

- 472 commits reachable from `origin/main` in the window; 398 are non-merge commits.
- 183 non-merge subjects matched fix, revert, repair, restore, bug, or hardening terms; 161 titles remain after exact-title deduplication.
- 15 explicit test/automation commits landed in the same period, including daily “tests for past fix commits” jobs.
- GitHub returned no standalone closed issues for the window; bug history is carried primarily in commit messages and pull requests.
- Recent PR descriptions documented 18 known failures on `main`: 10 backend, 6 web, and 2 UI assertions.
- Staging/main duplicate histories, reverts, and iterative visual adjustments were collapsed into failure-mode families before choosing tests.

## What this branch implements

### Restore a trustworthy baseline

All 18 pre-existing failures are repaired to assert the current intended contracts:

- ffmpeg is probed by execution, not binary presence, so missing `libjack.so.0` is detectable;
- monorepo links use slash path segments rather than the retired `repo--app` form;
- bulk snapshot-retention repair is an explicitly allowed resume-after-stop path;
- persistent snapshots never expire and are deleted through the entity lifecycle;
- light-theme tokens are read from the real surface-token block after Tailwind v4 introduced earlier `:root` blocks;
- drag-sensor and kanban highlight source matchers follow their current multi-line forms.

### Add deterministic regression coverage

This branch adds 79 cases around failure modes that daily automation missed:

| Failure family              | Added coverage                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Auth snapshot rebinding     | Clerk-ID lookup precedence, email guard, in-place rebind, insert-only-after-both-miss                                         |
| Session PR lifecycle        | merged/closed mapping, draft/reopen mapping, archive/unarchive, sandbox stop, grace delete/cancel, merge-verification fencing |
| System automation lifecycle | authorization ordering, row revival, schedule preservation, cron replacement/removal, idempotent uninstall, soft delete       |
| Preview annotations         | predeploy build hook, pre-bundle typecheck, helper rejection, protocol marker, checked-in bundle, generated-script injection  |
| Callback termination        | heartbeat/tool precedence, every timeout phase, OOM kill, interrupted kill, ordinary non-zero exit                            |
| Eva URL generation          | slash-form app paths, nested root directories, empty/trailing roots, all entity destinations                                  |
| Snapshot policy             | never-expire persistent policy, one-day ephemeral floor, Vercel update payload, explicit retention repair allow-list          |
| Session read-only UI        | every PR state, manual archive, terminal reason precedence, live-state behavior                                               |
| Session tab partitioning    | active/terminal/manual archive partitions, stable ordering, duplicate avoidance, empty pages                                  |
| Sidebar settings            | every persisted enum, stale values, preview count bounds/non-finite input, activity fallback, immutable sorting, manual order |
| Quick-task navigation       | TanStack-aware stretched link, no location assignment, href at every caller, selection-mode cancellation                      |
| Desktop media tooling       | executable ffmpeg probe, repair ordering, libjack fallback, idempotent fail-open install                                      |

## Full test architecture to add next

The remaining bugs are not all best represented by Vitest source contracts. The robust end state is a test pyramid with explicit ownership.

### 1. Convex mutation integration suite

Add an isolated Convex test database harness and exercise real mutations rather than only source ordering:

- provision a user by Clerk ID, restore with a new Clerk ID and the same email, and prove every owned record remains attached;
- prove an email-less MCP identity never claims another email-less record;
- feed every GitHub PR webhook action and verify `prState`, `archived`, sandbox-stop request, grace schedule, and reopen cancellation;
- replay duplicate and out-of-order PR events and verify idempotency;
- install, customize, uninstall, and reinstall every system automation while preserving runs and schedule;
- test session owner/provider-account visibility across two users and a shared team;
- test recap timeout recovery, pending-without-workflow recovery, and retry eligibility;
- test stale sandbox reconciliation for sessions, tasks, and projects with mismatched sandbox IDs;
- test snapshot cleanup candidates at 47h59m, 48h, reopen, and already-deleted boundaries;
- test authorization-negative cases for every public action that accepts a repo, task, session, message, sandbox, or installation ID.

### 2. Callback and process integration suite

Run the callback against controlled child processes and a fake Convex HTTP endpoint:

- exit 0 with a result, exit 0 without a result, ordinary non-zero exit, SIGTERM, SIGKILL, and an OOM-shaped 137;
- silence before first event, before first assistant text, after first text, during a tool, and after a terminal result;
- cancellation while idle, in a tool, while finalizing, and while a queued turn is claimed;
- daemon pidfile ownership, incumbent signature mismatch, stale owner, duplicate spawn, and teardown races;
- completion delivery before and after media upload for chat versus proof runs;
- delayed old-turn completion and stream writes after a newer turn starts;
- Cursor reasoning parameter, variant, unsupported-level, and bare-model fallback paths against recorded SDK model payloads.

### 3. Shell/runtime executable contracts

Execute generated shell fragments inside the closest available Linux image:

- ffmpeg present and healthy; present but missing libjack; absent; package-manager failure; repeated start;
- git-lfs registration with missing `/opt/git/etc`, pre-existing config, and a failed registration;
- pnpm/yarn/npm/pip manifest combinations and independent Node/Python lockfile drift;
- swap provisioning under adequate, marginal, and insufficient disk; repeated provisioning; snapshot release;
- startup marker success/failure ordering and commands containing shell blocks;
- preview recovery with dead proxy, dead dev server, OOM exit, throttled repeat, and user stop.

### 4. Component tests in a browser DOM

Add a single maintained browser-DOM component harness, then cover:

- localStorage hydration and cross-tab synchronization for sidebar layout, group-open state, shortcut overrides, and explicit reasoning levels;
- composer send failure, optimistic user bubble, no optimistic assistant bubble, queued-message placement, paste undo, and type-to-focus newline;
- quick-task cards in ordinary, selection, context-menu, keyboard, and nested-control interactions;
- terminal/preview tab APIs and keyboard shortcuts, including custom `Mod+J` bindings;
- drag/drop enter-leave nesting, drop highlight, mouse distance, touch hold, keyboard drag, and cancel;
- terminal PR banners, archive controls, and reopened state;
- external-link chip labeling and URL-first mention parsing.

### 5. Playwright interaction and visual suite

Use `/?agent` and preserve SPA state while testing real browser behavior:

- assert quick-task/list/project navigation never increments the document navigation count;
- assert monorepo slash URLs survive reload, back/forward, copied links, and every entity route;
- wheel-scroll nested panes at top/bottom, drag scrollbar thumbs, and verify only explicit overscroll containers contain chaining;
- touch-reveal every hover-only control and perform kanban, gantt, and quick-task drag with touch emulation;
- capture light/dark/neutral surface-token screenshots for cards, sidebars, overlays, focus rings, switches, toasts, and tab seams;
- verify favicon unread badges at 0, 1, 9, 10, 99, and 100+ under each theme accent;
- test dictation probe failures, ZDR copy, retry, AudioContext reuse, and reply-row positioning;
- verify message enter/crossfade/collapsible motion and motion utility output without layout-animation regressions;
- test annotation select mode against native inputs, nested elements, transformed iframes, navigation, and stale proxy restart.

### 6. GitHub integration suite

Use a disposable repository and GitHub App installation:

- a turn with no commits neither pushes nor opens/refreshes a PR;
- a pushed branch targets the session base branch, adopts an existing PR, and handles a not-ahead branch;
- merge, close, reopen, convert-to-draft, and ready-for-review events converge session state;
- duplicate-tip merge verification detaches only the false-positive PR;
- oversized diffs rebuild from `listFiles`, including binary, renamed, deleted, truncated, and paginated files;
- first-install ownership proof and installation/repository filtering reject cross-tenant metadata.

### 7. Live Vercel sandbox chaos suite

Run nightly or before sandbox-runtime releases because mocks cannot prove provider behavior:

- kill a runner during staged, launching, running, tool-active, finalizing, summary, and completion phases;
- stop/resume while prewarm, deadline extension, preview healing, snapshot capture, and bulk-retention repair race;
- verify a background prewarm never resurrects a user-stopped sandbox;
- create multiple auto-snapshots, confirm keep-last-one, archive/complete the owner, wait through a shortened grace, and confirm sandbox plus snapshots disappear;
- delete the current snapshot and prove session/task/project start falls through to a fresh sandbox and re-checks out the remote branch;
- exhaust memory and disk independently and verify recoverable status, useful error copy, and bounded cleanup;
- verify IPv4-only dependency, Git LFS, package install, desktop, PTY scrollback, and preview readiness on a fresh seed.

## CI layout

1. Every PR: TypeScript, all Vitest suites, generated-bundle freshness, compiler bailout check.
2. Browser PR lane for changed web/UI paths: component DOM tests plus targeted Playwright specs.
3. Nightly: full Playwright matrix, disposable GitHub integration, shell image matrix.
4. Scheduled/provider release: live Vercel chaos and snapshot billing lifecycle.
5. Quarantine is time-boxed and owner-tagged; a red deterministic suite is never accepted as the baseline again.

## Scope decisions

- Pure styling iterations are grouped into visual scenarios instead of one brittle class-string test per commit.
- Reverted/staging-only copies are not tested twice.
- Open PRs whose production code is absent from `main` keep their regression tests on those PR branches; this branch does not encode contracts for code it cannot execute.
- Destructive snapshot and sandbox cases stay out of ordinary PR CI and use isolated provider projects.
