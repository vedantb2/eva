# Changelog

## Claude Agent SDK only (CLI spawn removed) - 2026-07-25

Claude no longer has a `claude -p` attempt mode — the Agent SDK (`sdk` / `sdk-daemon`, default `sdk-daemon`) is the only Claude runtime. Unset `CLAUDE_ATTEMPT_MODE` now means the warm daemon path, so prod flips on deploy without an env change. Codex, OpenCode, and Cursor keep their CLI spawn paths. Follow-up env-var cleanup is tracked in `internal/plans/todo/claude-cli-removal-followups.md`.

## Agents can host captures at public URLs (upload_media MCP) - 2026-07-24

Agents had no way to embed screenshots in PR comments or Linear issues — chat attachments are invisible outside Eva and GitHub's API cannot upload comment images, so they fell back to plain-text comments. New eva MCP tools: `upload_media` returns a one-time Convex storage upload URL the agent curls the file to, and `get_media_url` exchanges the storageId for a permanent public link; the session prompt's recordings block now documents the flow.

## Draggable app/repo and sessions sidebar - 2026-07-24

The secondary sidebar was locked at `w-80`, so dense session lists and long nav labels couldn’t reclaim or release canvas space. Desktop users can now drag the panel edge (240–480px, default 320px = prior width); width persists in localStorage and applies to both the in-repo nav and global Sessions column.

## Cross-repo spotlight search (titles/names) - 2026-07-24

⌘K only searched the current repo’s pages and a few entity lists, so it drifted from the real product surface. Spotlight now runs a Convex `spotlight.search` over every team/repo the user can access (pages, repos, teams, projects, tasks, sessions, docs, designs, automations, artifacts — titles/names only), uses shared `@conductor/ui` Command primitives (still cmdk), and is available on global routes as well as in-repo. The left rail also exposes Search between collapse and the avatar (same opener as ⌘K).

## Rail collapse fully hides the second sidebar - 2026-07-24

The rail toggle only narrowed the app/repo/session column to icon width, so nav still competed with the canvas. Collapsed now hides that column entirely (rail-only, `pl-16`), matching other global rail-only pages; mobile drawer still opens the full panel.

## Duplicate session PRs merge independently without killing the session - 2026-07-24

Agents can now create a "duplicate PR" on request: squash a session branch onto a fresh branch (new commit SHAs) so it merges independently instead of pushing identical SHAs that make GitHub auto-merge the session's own PR. If a tip-copy still auto-marks a session PR merged because its SHAs landed via another PR, the webhook now schedules a delayed check against GitHub's commit-to-PR association data and, when the merge is foreign, detaches the PR and posts a chat alert instead of permanently locking the session.

## Preview iframe keeps sandboxed app session cookies - 2026-07-24

Sign-in inside the preview tab succeeded at the app but the session never stuck — browsers drop default `SameSite=Lax` `Set-Cookie` responses in Eva’s cross-site iframe (`*.vercel.run`), so the next request looked logged-out (while a top-level new tab worked). The in-sandbox preview proxy now rewrites upstream `Set-Cookie` headers for non-loopback clients to `Secure; SameSite=None; Partitioned` (same as the proxy’s own gate cookie), strips upstream `Domain`/`SameSite`, and bumps the proxy script to `annotate-v12` so health-check relaunches pick it up without manual sandbox restarts. Partitioned sessions stay per-visitor and separate from a new-tab session; third-party IdPs that refuse framing still need a top-level window.

## Sessions sidebar archives merged/closed PRs - 2026-07-24

Active session lists still mixed in merged/closed PRs beside live draft/open work. The Sessions sidebar now keeps only draft/open (or no-PR) sessions active and folds merged/closed into the Archived collapsible with manually archived ones.

## Bake ffmpeg into sandbox snapshots for agent-browser record - 2026-07-24

`agent-browser record stop` encodes WebM via ffmpeg on PATH; sandboxes lacked it so walkthrough captures failed at stop. Snapshot builds now install ffmpeg (Debian apt on Daytona images; AL2023 SPAL `ffmpeg-free` on Vercel seed + desktop bootstrap).

## Composer file chips show type icons - 2026-07-24

Pasted/dropped non-image attachments in session/task/project composers all used a generic file icon, so HTML vs Markdown vs text looked identical. Chips (and sent-message file links) now pick IconHtml / IconMarkdown / IconFileTypeTxt / IconFile from MIME or extension.

## Send for Review no longer archives the session - 2026-07-24

"Send for Review" promoted the draft PR then archived/closed the session and sandbox, so follow-up work required unarchiving. It now only marks the PR ready (`prState: open`); archiving stays an explicit user action.

## Kanban columns tint by status/phase - 2026-07-24

Kanban columns used a uniform muted wash, so status was only readable from badges. Columns now use the existing status/phase `cardBg` tokens (e.g. light yellow for In Progress) so each lane’s colour matches its state at a glance.

## Sidebar collapse control lives on the rail - 2026-07-24

The collapse toggle sat in the secondary sidebar header, competing with titles/back and disappearing from muscle memory when the panel was icon-narrow. It now lives on the vertical rail directly above the user avatar (always reachable), and the panel headers keep only navigation/close chrome.

## Skill sync runs on cron + base-branch push - 2026-07-24

Manual Settings sync left repo skills stale until someone clicked the button. Shared scan logic now also runs from a 6h cron across connected codebases and from GitHub `push` webhooks when the base branch touches `.agents/skills` (subscribe the GitHub App to `push`).

## Quick tasks kanban sorts by updatedAt - 2026-07-24

Kanban columns defaulted to `lastRun`, so edits/comments/status changes left cards buried until the next agent run. Default sort is now `updated` (`agentTasks.updatedAt`, already bumped on activity and mutations); storage key bumped so returning users pick up the new default.

## Shared browser works in task/project sandboxes - 2026-07-23

The MCP `browser_*` tools hard-gated on a session entity, so quick-task and project chat agents (whose prompts advertise the shared-browser flow) always fell back to headless Chrome — the user could never watch live despite those panels already having a Browser tab. Sandbox tokens now carry `task`/`project` entity kinds, `browser_start` resolves the sandbox from the owning table, and `agentBrowsingAt` (+ `releaseBrowserLock`, takeover overlay, auto-switch to Browser) is generalized to `agentTasks`/`projects`, mirroring the session wiring.

## Reduce layout shifts across web routes - 2026-07-23

Async shells and theme/font paint were still nudging content after first paint (sidebar header growing when team art loaded, spinner→content height swaps, padding transitions, font check icons, late custom-theme vars). Reserved stable heights/skeletons, early theme hints, and metric-matched Geist swap so route loads stay visually still. Follow-up pass reserved sidebar stats/logo slots and kept PageWrapper mounted for drafts/artifacts/quick-tasks/inbox/teams/sessions sidebars.

## Snapshot seed commands split from startup commands - 2026-07-23

Startup commands served two lifecycles at once: one-time data seeding (env set, convex import) and per-boot work (readiness gates, docker restarts). Seed steps consume their inputs at snapshot build, so the forced per-boot re-run failed on every fresh sandbox and wasted 1-2 minutes re-applying baked env vars. New `repoSnapshots.seedCommands` run once per seeded build in the post-daemon phase (services up) and never on boot; the Snapshots settings page gains the field, startup-command copy now states the real build-and-every-boot contract, and eva/eprocurement/staging configs were migrated in prod (eva boots with 2 commands instead of 31). Startup-command failures now also surface on the session as a startup warning instead of vanishing into transient console logs, and message-less startup errors persist their constructor and stack so the recurring anonymous ~5-minute failure can identify itself.

## Chat renders all agent media via mediaStorageIds - 2026-07-23

Task chat recordings were stranded in the sandbox: the stub-spam fix disabled proof capture for chat, which also gated media upload, and task-chat media routed to the proof timeline instead of the chat message. The capture flag now only gates RUN_ID runs, task chat attaches via `attachMedia`, and messages hold an ordered `mediaStorageIds` array (legacy single image/video fields resolve as fallback) so multiple recordings/screenshots per turn all render inline instead of only the last one.

## Task/project Files tab uses repo tree - 2026-07-23

Quick-task and project sandbox Files tabs only mounted the bare file viewer (usable via `?file=` chips), so they lacked the searchable tree sessions already had. Both now mount the same `FilesPanel` as sessions.

## Restraint UI motion pass - 2026-07-23

A few surfaces still teleported (mobile sandbox panel, task prev/next, empty states, log raw reveal, panel toggle icons). Wired enter/exit + soft icon swaps using existing Motion tokens so occasional state changes feel spatially consistent without slowing high-frequency chrome.

## Live notification toasts animate in - 2026-07-23

New notifications already streamed into a top-right toast stack, but they teleported on arrive/dismiss. Enter/exit now slide from that same top edge (`opacity` + `translateY(-8px)`) via Motion `AnimatePresence`, with a gentler opacity-only path when reduced motion is preferred.

## Task/project sticky chat traits + project chat model - 2026-07-23

Sandbox chat effort/thinking/1M lived in localStorage, and project chat model did too, so picks reset across devices unlike sessions. Traits now stick on `agentTasks` / `projects` (`lastReasoningLevel` / …) via `setTraits` (and on send/enqueue); project composer model uses sticky `lastChatModel` via `setChatModel`. Task model stays on shared `agentTasks.model`.

## Task/project sticky Preview path/port + console tail - 2026-07-23

Quick-task and project sandboxes still kept Preview path and console scrollback in sessionStorage (and never wrote user port changes back to `devPort`), so they reset across devices unlike sessions. Same Convex sticky contract now: `previewPath`, port via `devPort`, and a debounced 500-line `terminalHistoryTail` on `agentTasks` / `projects` (no `updatedAt` bump).

## Session sticky Preview path/port + console tail - 2026-07-23

Preview path and port (via `devPort`) and the last ~500 lines of Preview Console scrollback reset across devices when they only lived in sessionStorage. Sessions now persist path/port and a debounced console tail on the session doc (no `updatedAt` bump); device viewport stays tab-local, and full scrollback still uses sessionStorage.

## Session sticky provider account on change - 2026-07-23

Account picker still only patched `sessions.providerAccountId` on send, so a pre-send switch stayed in localStorage and did not sync across devices. Owner changes now write through `setProviderAccountId` (optimistic, no `updatedAt`), matching model/mode/traits.

## Session sticky edit/plan mode on Convex - 2026-07-23

Composer mode still lived in localStorage after model/traits moved to Convex, so Plan↔Edit resets across devices. Sessions now store `lastMode` via `setMode` (same optimistic sticky contract), written on change and on create/send/enqueue; legacy ask/execute values normalize to edit on read.

## Session sticky thinking + 1M toggles on Convex - 2026-07-23

Effort was already session-sticky via `lastReasoningLevel`, but thinking / 1M still lived in localStorage and reset across devices. Sessions now store `lastThinkingEnabled` / `lastUse1mContext` through a unified `setTraits` mutation (replacing effort-only `setReasoningLevel`), written on change and on create/send/enqueue.

## Session sticky reasoning effort on Convex - 2026-07-23

`lastModel` was moved to Convex but composer effort stayed in localStorage, so a Medium pick silently reset to the Claude model default (High) on reload / another device. Sessions now store `lastReasoningLevel` (set on change + create/send/enqueue), wired like `lastModel`.

## System alerts no longer clear "turn executing" UI - 2026-07-23

Mid-turn system messages (`isSystemAlert`) append after the empty Working bubble, so `isExecuting` (last-message-only) flipped false and the composer offered a fresh send while the agent was still running. Executing state now skips system alerts; streamed tokens stay on the live Working bubble even when an alert is newest.

## Session chat model icon under assistant reply - 2026-07-23

The provider icon sat under the user bubble (with account as plain text), which read as "who asked" rather than "what answered". It now sits under the assistant turn; tooltip is `model · effort · account` using the preceding user message's snapshot (`userProviderAccounts` label / "Team"), matching the run-accordion pattern.

## Rail app tiles support middle-click new tab - 2026-07-23

App icons on the left RepoRail were `<button onClick={navigate}>`, so middle-click / cmd-click had no `href` and could not open another tab. They are now `Link`s to `repoHref(...)` (same destination as before); left-click still SPA-navigates and closes the mobile drawer.

## Session title gen uses AI Gateway flex tier - 2026-07-23

Session titles are background work (placeholder until the LLM returns), so paying default Gateway latency rates was waste. `textGen.generateSessionTitle` now requests `providerOptions.gateway.serviceTier: "flex"` (~0.5x cost; higher latency acceptable). Invalid tiers fail; unavailable flex best-effort-falls back to default billing.

## Session deep links show root Sessions sidebar - 2026-07-23

After dropping the per-app Sessions sidebar, cold loads of `/$owner/$repo/.../sessions/$id/...` still defaulted `sessionsNavMode` to `"repo"`, so the app nav appeared instead of the cross-app Sessions list. Session routes now always open the root Sessions sidebar (and highlight the Sessions rail tile).

## Global Sessions sidebar shows Archived again - 2026-07-23

The cross-app Sessions rail sidebar listed only active sessions, so archived work was unreachable without leaving the global view. Each app group now has a nested Archived disclosure (default collapsed), matching the old per-repo sessions sidebar.

## ActionCache for PR Overview + Diffs - 2026-07-23

Overview and Diffs always re-hit GitHub on every open (multi-call Octokit), so repeat visits felt slow. Both now use `@convex-dev/action-cache` (60s / 120s TTL); Refresh and Retry pass `force` to bypass.

## Sandbox Review Overview tab - 2026-07-23

Reviews already had Overview (description, conversation, checks); sandbox Review only offered Diffs/Recap, so users left the surface to inspect PR status. Overview is now a third Review sub-tab (path-backed like Recap) for sessions, projects, and quick tasks, reusing `ReviewOverviewPanel`.

## AskUserQuestion no longer stuck loading - 2026-07-23

Blocking AskUserQuestion keeps the turn `isExecuting` while waiting for the user, but the MCQ card used that flag as `isLoading` — options greyed out and Next spun forever from first paint. Loading now tracks only the answer submit in flight.

## Rail active badge ignores sessions - 2026-07-23

Session sandboxes were lighting the left-rail repo/app dot even when nothing else was running, which made the indicator noisy. The badge now only reflects active quick-task or project sandboxes.

## Project tasks share Make-changes model + Options - 2026-07-23

Project tasks still hid the composer model picker and Options behind `!isProjectTask`, while Properties kept a duplicate model field — so the same shared components looked different by surface. Both now use the quick-task Make-changes controls; project Options persist proof/audit on the task for the next build. Create-from-project also gets the same assignee/tags/projects props as the quick-task modal.

## More space between Global Sessions app groups - 2026-07-23

App collapsibles in the root Sessions sidebar sat too tight (`space-y-1`), so related groups felt like one block. Spacing between app groups is now `space-y-3` for clearer separation when scanning across codebases.

## Install gh CLI in Vercel snapshot seeds - 2026-07-23

Daytona base images already apt-install `gh`, but Vercel seed-prep (Amazon Linux dnf) did not, so agents in Vercel sandboxes lacked GitHub CLI. Seed toolchain now installs a pinned `gh` release tarball into `/usr/local/bin` before snapshot capture.

## Auto-stop session sandbox when PR merges/closes - 2026-07-23

Merged/closed sessions became read-only but the webhook only patched `prState`, so Vercel VMs could stay active with no clean teardown. GitHub PR terminal events now request the same stop path as the Stop button; opening an already-stuck merged session also triggers stop (and skips daemon prewarm that would resume the VM).

## Sandbox chat model follows task.model - 2026-07-23

Quick-task sandbox chat kept its model in localStorage (often the repo default), so switching between `/quick-tasks/$id` and `/sandbox/preview` could show Claude on the activity page and Grok in the sandbox. Sandbox now binds to and persists `task.model` / owner accounts like the activity composer; only traits stay local.

## Run accordion: account as provider-icon tooltip - 2026-07-23

Activity run headers showed the credential account as a text badge next to the model chip, which crowded the row. The chip is now icon-only; hover shows model + account (e.g. Claude Opus · Vedant).

## Drop app Sessions sidebar + nav tab - 2026-07-23

Repo home already owns session create/list entry, so the per-app Sessions drill-down sidebar and SHIP nav tab were redundant. Sessions routes stay for deep links; Designs and other context sidebars are unchanged.

## Prewarm stops resurrecting stopped Vercel sandboxes; stale "active" self-heals - 2026-07-23

An auto-stopped Vercel VM whose DB status still read "active" was silently rebooted by the page-open daemon prewarm (any exec lazily resumes a stopped VM) — leaving a running sandbox with no dev server, no Convex backend, and an empty Console, since services only launch in the startup workflow. Prewarm now checks live provider state before any exec and skips non-running sandboxes; on definitely-dead states it flips the stale "active" status to "closed" (sessions, agent tasks, projects) so the UI offers Start — the one path that relaunches services — and the terminal-attach guard stops resurrecting the VM too.

Reason: "active" must mean the VM and its services are actually up; hidden resurrection produced sandboxes that looked alive but could never serve a preview.

## Diffs tab file accordion + Viewed - 2026-07-23

Long PR diffs forced every file open at once, so reviewers lost place. Each file is now a collapsible accordion with a GitHub-style Viewed checkbox (persisted per PR in localStorage); checking Viewed collapses that file, and the file tree still expands + scrolls to a selection.

## Sandbox start survives trailing stops; in-sandbox Convex self-heals - 2026-07-23

Clicking Start right after a run finished failed with "was stopped while a start was in progress": the Vercel provider let any in-flight stop win, even against an explicit user start. `start()` now takes `resumeAfterStop` — explicit start paths (session/task/project reuse, design reuse, Start-clicked resume) wait the snapshotting stop out and resume; background paths (prewarm, watchdog) still refuse so they cannot resurrect a just-stopped sandbox.

Separately, `convex dev` wedges permanently if the local backend misses its 240s startup window on a busy resume (retries :3210 forever, never respawns — dead preview backend, session 29). Convex background commands now run under a bash supervisor that health-checks `127.0.0.1:3210/version`, confirms the wedge signature in the log (so cloud-mode `convex dev` is never touched), and kills + relaunches the tree, up to 3 attempts.

Reason: both bugs left users with sandboxes that looked started but were not, with no recovery short of manual surgery.

## Warm seed-prep from base Image - 2026-07-23

Seeded snapshot builds on Vercel often spun a blank sandbox and reinstalled the full toolchain, racing flaky project lookups. Seed-prep now boots from `baseSnapshotId` when present, skips already-installed toolchain pieces, and only runs pure `sandbox-config` file moves before daemons so chained seed/env work still waits on Postgres/`convex dev`.

Reason: warm Image boots cut seed time and avoid cold-install 404s without breaking daemon-dependent startup commands.

## Queue row uses provider icon - 2026-07-22

Queued follow-ups still led with a blank status dot and hid model details behind an info icon. The left rail is now the provider mark (tooltip: model · effort), so the redundant info action is gone. Provider mark + action icons share a 16px line box with the row text so they sit vertically centered.

## Sandbox chat model + effort on messages - 2026-07-22

Sandbox chat turns only remembered credentials, so you could not tell which model/effort powered a past message. User messages now snapshot `model` + `reasoningLevel` at send/dequeue (sessions, tasks, projects), and the bubble/queue row shows a provider icon with a tooltip of the model and effort.

## Session synthetic turns (Tranche C) - 2026-07-22

Task sandbox chat and project chat now use the same warm Claude daemon pull path as sessions: `pendingTurn` staging, entity-scoped daemon markers, synthetic turn plumbing, and the background-agents chip. Chat daemons gate on `activeChatWorkflowId` only so they never compete with a task's main run (`activeWorkflowId`).

Reason: extend Tranche A/B architecture to the other in-sandbox chat surfaces without double-executing turns or killing the main run on chat cancel.

## Session synthetic turns (Tranche B) - 2026-07-22

Sessions now surface the rest of the Claude SDK stream in the activity log (compaction, hooks, file persistence, tool progress) and track background Agent/Task runs on the session doc with a composer chip and stop path drained through `claimPendingTurn`.

Reason: product surface for background subagents — users see lifecycle telemetry and can stop in-flight agents without hunting the timeline.

## Session synthetic turns (Tranche A) - 2026-07-22

Background subagents could finish after the main turn closed and their report-back was silently dropped because the daemon stopped consuming the SDK stream on `result`. The session daemon now keeps a session-lifetime pump, mints synthetic continuation turns for post-result output, and parks user claims until a live synthetic turn finishes — so background agent completions land as normal assistant bubbles.

Reason: architectural — turn boundaries are daemon state changes on a never-stopping stream (synara model), not loop exits.

## Global Sessions rail + cross-app sidebar - 2026-07-22

Sessions were only reachable per-repo, so hopping across apps meant hunting through each codebase's nav. A Sessions tile on the left rail now opens a sticky global sidebar grouped by app (collapsible, empty apps kept, `+` jumps to that app's composer), while the in-repo Sessions list stays as the alternate entry point.

## Cache session Preview across sidebar switches - 2026-07-22

Switching between sessions remounted each detail shell, so Preview iframes always cold-loaded again. The sessions layout now keeps the last three opened session shells mounted (hidden), freezes inactive sandbox tabs / preview polling, and only bumps the iframe when the preview URL actually changes.

## Cache sandbox tabs across switches - 2026-07-22

Switching Preview ↔ Review (or any other sandbox tab) remounted the whole session/project shell, wiping iframes, Console PTY scrollback, and editor state. Session and project layouts now stay mounted across tab URL changes; pane slots keep Files / PRD / custom tabs hidden instead of unmounting, and a default preview pane is created up front so the running app can stay cached.

## Quick-task activity model + composer picker - 2026-07-22

Runs never stored which model powered them, and the Properties model switcher was easy to miss next to Make changes. Each run now snapshots its model (provider icon + label in the activity timeline), the picker lives in the comment composer (disabled until Make changes), and it lists the task owner's personal accounts — with Team for that provider dimmed when personal is selected.

## Owner-sticky personal AI accounts - 2026-07-22

Personal provider accounts used to fall back to Team whenever someone other than the account owner ran a task (e.g. Make changes). Credentials now follow the entity owner (`createdBy` / project `userId`): creates default to that owner's matching personal account for the model provider (else Team), labels are the owner's first name, and only the owner can change the sticky account.

## Reviews PR title above tabs - 2026-07-22

PR title lived inside Overview only, so Recap/Diff had no shared chrome. Title, author, and GitHub link now sit above the tab row for every review tab.

## Reviews overview meta column - 2026-07-22

Overview was description-only; reviewers still had to bounce to GitHub for status, checks, and diff size. Overview is now a wider 60/40 layout with a sticky meta column (open/closed/merged, check runs, files + lines).

## Repo Reviews tab for GitHub PRs - 2026-07-22

PR review lived awkwardly under Documents (recap filter) and only inside sandbox Review once a surface already had a prUrl. Reviews is now a sibling nav item with a PR list and Overview / Recap / Diff tabs keyed by GitHub PR number, shared across monorepo apps. Documents no longer lists recaps; sticky GitHub recap comments link to Reviews.

## Pin Convex local backend to Jul 14 for AL2023 glibc - 2026-07-22

Vercel Sandbox is Amazon Linux 2023 (glibc 2.34). Convex linux-gnu builds from `2026-07-15` onward need GLIBC_2.35 via `libm`, so pinning `07-20` still failed. We now plant `precompiled-2026-07-14-7b3d1a5` (last verified ≤2.34 binary) under the CLI's latest cache label so anonymous `npx convex dev` can start on seeded CarePulse snapshots.

## Proof upload before completion (no double capture) - 2026-07-22

Proof completion used to wake the task workflow before the screenshot was saved, so `hasMediaForRun` often failed and a full second proof turn ran — two real images on one run. Proof callbacks now persist media first; the workflow also waits briefly before retrying.

## Proof capture accordion on timeline - 2026-07-22

Make-changes only showed `type: "run"` activity logs, so proof-capture steps were invisible after a run. The Eva attached proof row now expands to the proof activity log, and multiple screenshots from the same run (retry) group into one timeline item with a multi-capture gallery.

## Comment Options disabled until Make changes - 2026-07-22

Quick-task comment Options stays visible next to Make changes but is disabled (with a short tooltip) until Make changes is on, so the control is discoverable without looking active for plain comments.

## Comment Options always visible on quick tasks - 2026-07-22

Proof/audit for a change-request run lived behind Make changes, so the Options control was easy to miss. It now sits next to Make changes whenever the composer is shown for a quick task (still only applies when that request starts a run).

## Vercel Preview proxy on 3000; leave 54321 for Supabase - 2026-07-22

CarePulse web Preview showed Kong's "no Route matched" because Eva's auth proxy shared 54321 with local Supabase, while eprocurement (no Supabase) worked. Public Preview proxy is now always on exposed port 3000; 54321 stays for Kong. When the UI port is 3000 the app listens on 13000; otherwise it listens on the UI port (e.g. 3001). Eva launches `pnpm exec next|vite -p <listen>` in the sandbox Console so customer package.json `-p` flags are not used — no repo edits required.

## Create task modal field rows - 2026-07-21

Create-task metadata was one crowded wrap row. Core run settings (priority, code reviewer, model, branch) now sit on the first row; proof/audit, tags, and project move to a second row.

## Drop repo screenshotsVideosEnabled after migration - 2026-07-21

Ran `migrations:removeRepoScreenshotsVideosEnabled` on evalucom clouddev and prod (2 / 3 repos patched), then removed the unused field from `githubRepoFields` so the schema matches the opt-in-per-area model.

## Run options button shows checked count - 2026-07-21

The Options control next to Run Eva hid whether proof/audit were on. A small badge now shows how many of those steps are checked.

## Remove Add UI details scaffold - 2026-07-21

The create/edit task “Add UI details” button and description hint pushed a Route/Control/Acceptance template that was rarely used. Removed the UI scaffold; agent-side UI-task detection from title/description keywords remains.

## Proof/audit create toggles are plain switches - 2026-07-21

Create-dialog and project-metadata proof/audit controls still used vestigial inherit/on/off after repo defaults went away. They are now boolean Switch controls for the task/project default.

## Task proof/audit is now a per-run choice - 2026-07-21

- Proof/audit for tasks moved off the task-detail properties sidebar and onto the run itself. A task-level default (set in the create dialog, and editable via an Options control next to the task's Run button) drives runs started from a plain Run button, including the first run.
- Requesting changes now has its own Capture proof / Run audit options in the comment composer, applying to that run only and defaulting to off — so a change request never silently repeats a proof or audit pass unless you ask for it.
- Under the hood the effective choice is recorded on the run: a per-run override wins, otherwise the run falls back to the task, then project, default. Removed the task-detail proof/audit selects.
- Reason for change: proof/audit read better as "what this run should do" than as static task properties, and re-runs were carrying the steps forward when users did not want them to.

## Proof/audit off by default, plus sandbox-chat toggles - 2026-07-21

- Removed the repo-level "Screenshots and Videos" default: proof and audit are now off by default everywhere and opt-in per area (task, project, session, sandbox chat). Project tasks no longer auto-audit unless enabled on the project or task. Resolution is task, then project, else off.
- Added a migration to clear the deprecated `screenshotsVideosEnabled` field from repo docs; the field stays in the schema until the migration has run in prod, then a follow-up drops it.
- The quick-task and project sandbox chats gained an "Options" entry in the composer "+" menu with Capture proof / Run audit, persisted per task/project. Proof adds a capture step to the chat turn; audit runs after a successful turn.
- Project sandbox-chat proof and audit required widening the media-attach and audit-entity types to accept projects (projects previously had no audit path at all).
- Reason for change: teams wanted proof/audit decided per piece of work rather than a repo-wide default, and wanted the same control inside the in-sandbox chats, not just runs and sessions.

## Project View PR lives in More - 2026-07-21

Project header kept View PR as a standalone button while quick tasks tuck it into More with Create PR / Preview. Projects now match that menu grouping.

## Review Diffs chrome on shared tab row - 2026-07-21

Unified/Split and Refresh sat on a second bar under Diffs/Recap. They now share the Review header row and only appear while Diffs is active (sessions, projects, quick tasks).

## Docs Reviews hides Eva-created PR recaps - 2026-07-21

Eva session/project/quick-task PR recaps were listed under docs Reviews because webhook refreshes never set `prRecapOrigin`. Those stay on the sandbox Review tab; the docs list is for external PRs only.

## Docs Reviews filter and recap tab labels - 2026-07-21

Docs sidebar “PR recaps” is now Reviews (`?docFilter=reviews`); recap docs use Recap/Summary tabs at `/recap` and `/summary` instead of Walkthrough/Markdown on `/html`/`/content`.

## Quick-task sandbox breadcrumb shows title - 2026-07-21

Sandbox view only showed `#{numId}`, which was hard to identify. The truncated task title now follows the number in the breadcrumb.

## Projects and quick tasks use Review path tabs - 2026-07-21

Projects/quick-tasks still drove Diffs/Recap and unified/split via `?prTab=` / `?diffView=`. They now match sessions with `/sandbox/review/diffs/…` and `/sandbox/review/recap`; old query URLs redirect.

## Review tab route is /review - 2026-07-21

The sandbox tab was labeled Review but still lived at `/pr`. Sessions now use `/review/diffs/…` and `/review/recap` (projects/quick-tasks use `/sandbox/review`); old `/pr` URLs redirect.

## Copy link lives in More menus - 2026-07-21

Copy link sat as a separate header button next to More on sessions, projects, and quick tasks. It now lives in More with dividers between action groups so the chrome stays lighter.

## Sandbox PR tab labeled Review - 2026-07-21

"PR" was opaque for a tab that holds diffs and recap. The sandbox tab label is now Review; route segment stays `pr` and the pull-request icon is unchanged.

## Diff layout is path-backed Tabs too - 2026-07-21

Unified/split lived in `?diffView=` beside path-based PR tabs. Sessions now use `/pr/diffs/unified` and `/pr/diffs/split` with the same Tabs component; `?diffView=` still works as a fallback/redirect on other surfaces.

## Session PR Diffs/Recap use path tabs - 2026-07-21

PR sub-views lived in `?prTab=`, which was hard to share and inconsistent with docs tabs. Sessions now use `/pr/diffs/…` and `/pr/recap` with the shared Tabs component; old `?prTab=` and bare `/pr` URLs redirect.

## Composer toolbar: + first, model on the right - 2026-07-21

Composer chrome put model/reasoning next to attach, crowding the left. + is now first on the left; model and reasoning sit with send on the right. Skills/Documents submenu rows match the @/`/` picker (prefix, title, truncated description).

## Conversational turns self-escalate to agent for MCP - 2026-07-21

The Haiku fast path stripped tools, so soft MCP asks ("list my repos?") silently failed. Conversational turns can now emit `<<EVA_ESCALATE>>` and the daemon re-dispatches the same turn onto the full agent query; agent turns also set `ENABLE_TOOL_SEARCH=auto` so large MCP schemas stay deferred. See `internal/t3code-ideas.md` for related t3code research (not implemented).

## Repo home and /sessions share new-session landing - 2026-07-21

Repo root only showed a logo, while `/sessions` had a carded composer. Both routes now render the same landing (app icon + title, prompt copy, cardless composer) so starting a session is consistent wherever you land.

## Composer "+" menu for attach, skills, and docs - 2026-07-21

Composer actions were split across paste/drop, `@`/`/` typing, and a separate Options control. A single "+" dropdown now groups Options (session submenu), Attach files / Add photos, and Skills / Documents submenus so attachments and mentions are reachable without memorizing shortcuts.

## Preview select-element annotations + device presets - 2026-07-21

Session Preview could browse the app but not point Eva at a specific UI element. The preview toolbar now has a Cursor-style select tool (hover highlight, click → comment card → immediate chat message with rich selector/HTML/React context) and mobile/tablet/desktop width presets, so visual feedback reaches the agent without leaving the sandbox.

## Expandable tool output/diff detail in chat - 2026-07-21

Per-call rows showed _what_ ran but not _what came back_. The sandbox harness now captures command output, exit codes, edit before/after, and write previews (budget-capped) for Claude/Codex/Cursor/OpenCode, and rows with detail expand in place — so you can verify a turn without digging through raw logs.

## Synara-style per-call tool rows in chat - 2026-07-21

Grouped activity blocks ("Ran 3 commands") hid what the agent actually did. Chat now shows one humanized row per tool call — Checked "git status", Searched for "x", Edited Foo.tsx — with tense flip while running and per-command icons, so historical and live sessions read as a clear step-by-step trail without a backend change.

## Session Files tab is a full repo explorer - 2026-07-21

The Files tab only opened when a chat chip set `?file=`, with no way to browse the sandbox. It now shows a searchable left-hand tree (`git ls-files`, ignoring gitignored paths) beside the existing viewer, so you can explore the whole repo while chip deep-links keep working.

## Sandbox Diffs tab becomes PR (Diffs + Recap) - 2026-07-21

Eva draft PRs never got recaps (webhook skips drafts), so sandbox work had diffs but no walkthrough. The Diffs tab is now a PR tab with Diffs/Recap sub-tabs; when `prRecapsEnabled` is on, finishing a task/session turn auto-generates an Eva-origin recap for draft PRs, hidden from the Documents sidebar but openable from the panel.

## Message-first session creation with LLM titles - 2026-07-21

Creating a coding session used to mean naming it in a modal before you could type. Sidebar `+` and `/sessions` now open a composer: submit creates the session as "New session", queues the first message until the sandbox is ready, and generates a short title via AI Gateway (`openai/gpt-5-nano`) without overwriting a manual rename.

## Team sidebar background banners - 2026-07-21

Teams only had a square logo, so app sidebars looked the same at the top. Teams can now upload a rectangular background that renders behind the app name in every sidebar for that team's codebases.

## Preview remount no longer kills Next mid-compile - 2026-07-21

Session preview polls treated a slow first-route compile as "not ready", then `fuser`-killed `:13000` and relaunched — while `launchDevServerInBackground`'s 20s cooldown often no-op'd, so Console showed Ready → Compiling `/` → exit forever. Ready now means the port is listening (`/proc/net/tcp` when `ss` is missing), and remount skips while a boot/lock/grace window is active.

## Local Convex survives backend binary bumps - 2026-07-21

CarePulse eproc sandboxes died on `:3210` after `npx convex dev` auto-upgraded the local backend in non-TTY: snapshot-export of huge tables (`answersHistory`) stuck on `ExportInProgress`, and zombie `/tmp/bg-*.pid` files made Preview heal skip relaunch. Background Convex launches now treat zombies as dead, clear leftover backends, unset `CONVEX_AGENT_MODE`, and align `.convex` `backendVersion` with the newest cached binary so the CLI skips the upgrade/export path.

## Sandbox chat no longer spams "decided not to capture" proofs - 2026-07-21

Task sandbox chat shares `entityIdField=taskId` with formal proof runs, and proof capture defaulted on. Every chat turn with no screenshot wrote a `taskProof` stub ("Eva decided not to capture"), flooding the activity timeline. Chat now disables proof capture; no-media stubs only record when a real run id is present.

## Project/task Start resumes background only - 2026-07-21

Hitting Start on an existing project or quick-task sandbox re-ran startupCommands whenever the seed marker was missing (or seed had failed), so CarePulse eproc spent minutes re-importing instead of just bringing `npx convex dev` back. Resume Start now only relaunches background daemons; seed/import stays on first create or the explicit Retry startup action.

## Inbox shows app icon + title per notification - 2026-07-21

Inbox rows only showed a type icon and the notification title, so scanning which CarePulse/Eva app a ping came from meant reading each href or guessing. Each row now joins `repoId` to the app logo and display label so the source is visible at a glance.

## Restart dead background daemons when Preview polls - 2026-07-21

`npx convex dev` (and other repo background commands) only relaunched on sandbox start/resume. If they died while the sandbox stayed active, Preview kept serving a frontend with a dead Convex. Preview readiness now runs `runBackgroundCommands({ onlyRestartDead: true })` so dead daemons come back without Stop/Start.

## Heal Vercel preview when app still listens on pre-remap port - 2026-07-21

After app preview moved to listen on port+10000, sandboxes that still had Next on 3000/3001 never became "ready" (Preview polls forever). getPreviewUrl now remounts the app onto the remapped listen port when the probe misses, so eproc (3001→13001) and similar recover without a full sandbox recycle.

## Stop Console PTY reconnect loop on preview - 2026-07-21

TerminalPanel listed its `connectWebSocket` function in a `useEffect` dependency array. Parent re-renders (preview polling, Convex) recreated that function, tore down the WebSocket, and called `connectPty` again — clearing the Vercel console and spamming `resolveSandboxProviderKind` in prod logs. Connect logic now lives behind a ref; the effect only re-runs when sandbox/owner/pane identity changes.

## Vercel app preview proxy moves off Supabase port 54321 - 2026-07-21

Vercel app/dev preview used exposed 54321 as the auth proxy in front of Next/Vite. CarePulse (and any repo with local Supabase) already binds Kong there, so the public `*.vercel.run` preview URL returned Kong's `no Route matched` JSON while Next was fine on 3000. App preview now matches desktop/editor: the auth proxy owns the **app's configured port** (3000, 3001, 5173, …), the app listens on port+10000, and 54321 stays free for Supabase. Loopback requests through the proxy skip the grant gate so Inngest/`BASE_APP_URL` on localhost still work.

## React Compiler enabled on web; drop ceremonial memoization - 2026-07-21

apps/web now runs React Compiler via `@vitejs/plugin-react` + `@rolldown/plugin-babel`. Manual `useMemo`/`useCallback` were stripped where the compiler owns memoization (~300 → ~9 kept for SortableContext/TerminalPanel/ref/iframe identity). Agents should not add those hooks by default.

## Session chat can attach HTML/MD/TXT design files - 2026-07-21

Session coding chat now accepts HTML (and Markdown/plain text) attachments alongside images. Files land in the sandbox as `/tmp/eva-attachment-*` with the same prompt note pattern as images, so Claude Design HTML exports can drive implementation without paste-only workarounds. Project sandbox chat stays images-only.

## Project/task sandboxes run background before startup - 2026-07-21

Task and project preview sandboxes used to run startup commands before background processes. Repos like carepulse eproc wait in startup for `npx convex dev` (background) to log “Convex functions ready” before importing data — so import never succeeded and the frontend came up with a dead backend. Order now matches sessions: background → startup → Preview Console. Contract test locks the order across session/task/project + prepareSandboxSteps.

## Project/task sandbox panel reopen control - 2026-07-21

Project and quick-task sandbox chat now get the same show/hide control sessions already had. Without it, a collapsed `project-sandbox-collapsed` / `task-sandbox-collapsed` localStorage value could hide Preview/Files with no way back.

## Other users' chat messages sit on the left - 2026-07-20

Sandbox/session chat now right-aligns only your own user turns; teammates' messages use the same bubble on the left with their first name above the bubble (Apple Messages-style) so shared chats read as a conversation.

## Restore repo root as icon + title - 2026-07-20

Repo root (`/$owner/$repo`) renders again with the app logo and display name instead of redirecting to Sessions; stats stay in the sidebar.

## Cook rate uses settled tasks; sidebar shows Tasks ran - 2026-07-20

Cook/ship rate is now done ÷ (done + cancelled) instead of sessions-with-PR ÷ sessions. Sidebar stats label “PRs shipped” → “Tasks ran” (terminal task count).

## Sidebar stats card hosts online teammates - 2026-07-20

Removed the repo Home header button. Footer stats keep PRs shipped + cook rate and drop cookers/tasks rows; online team avatars live in that space in the same card.

## Task creation shown in activity timeline - 2026-07-20

Creator avatar, name, and date no longer sit between the task title and description; they appear as the first activity event (“created the quick task”), so provenance lives with the rest of the history.

## Delete orphan Vercel sandboxes when post-create setup fails - 2026-07-20

`createSandbox` now deletes the VM if jq/git/docker setup fails after `client.create`, and treats the eva-env bashrc hook as best-effort. Fixes orphans left when the hook threw before the handle was returned to callers.

## Fix sandbox create crash from eva-env bashrc hook - 2026-07-20

`ensureEvaEnvInteractiveHookScript` joined a `for` loop with `;`, producing invalid `do;` and failing every Vercel sandbox create. Loop is now one statement; test guards the SOURCE_ENV prefix concat.

## Preview Console loads sandbox env for typed commands - 2026-07-20

Vercel Console tmux shells now source `/vercel/sandbox/.eva-env.sh` on create (plus login/bashrc hooks), so manually typed `pnpm run dev` sees the same secrets as agent exec and auto-launch. Existing bare sessions need a sandbox restart or a new terminal tab.

## Task + project sandboxes launch Preview Console like sessions - 2026-07-20

Quick-task and project preview sandboxes now start the app server in the Preview Console tmux session (same as sessions) instead of relying on fragile frontend auto-type when the PTY is new. Stops idle Consoles after Vercel resume/early-ready. Contract tests pin the backend call sites and `runConsoleDevCommandOnConnect={false}` on all three panels.

## Files tab on task and project sandboxes - 2026-07-20

Quick-task and project sandboxes now include the session Files viewer (URL-routable + chat file-chip open), so sandbox file reads aren’t session-only anymore.

## Browser tab on task and project sandboxes - 2026-07-20

Quick-task and project sandbox views now expose the same Browser tab as sessions (URL-routable), so agent Chrome is reachable outside session detail. Agent auto-switch still session-only until browsing lock is wired on those entities.

## Task + project sandbox chat: drafts + blocking questions - 2026-07-20

Quick-task and project sandbox chat now persist composer drafts (`taskChat` / `projectChat`) and answer blocking AskUserQuestion like sessions, so remounts and paused turns work the same.

## Repo home title matches sidebar label - 2026-07-20

Repo home widget header shows the same display name as the sidebar (custom label or app leaf) instead of "Eva's Stats" + owner/name subtitle.

## Keep audit rail icon top-aligned when open - 2026-07-20

Audit accordion icon no longer stretches/centers with open content — it stays beside the trigger like run rows.

## Activity timestamps inline with duration on the right - 2026-07-20

Relative time sits after a · next to the event copy/badges; run and audit duration stay at the far end of the accordion trigger so elapsed time stays scannable.

## Rounded Eva icon on activity rail + run fallback - 2026-07-20

Activity audit/proof marks and run rows without a requester now use the same rounded-full Eva icon as chat, so system-authored success/error runs still show a clear actor on the timeline.

## Custom display labels for GitHub apps - 2026-07-20

- Optional per-app `label` on `githubRepos` (e.g. "CarePulse v2", "Eva Web") shown in the sidebar header instead of the GitHub/path name; logo appears left of the title when set.
- Set via App settings → Identity, or Rename in the sidebar rail / home / team codebases context menus. Empty clears back to the default name.
- Team tab route renamed `/teams/:id/repos` → `/teams/:id/codebases` (legacy URL redirects).
- Reason for change: monorepo apps and similarly named repos were hard to tell apart as `owner/name` or leaf folders.

## Tidy quick-task More menu and sandbox + tabs - 2026-07-20

- Quick-task "View PR" moves into the More dropdown so the header stays focused on Run / Sandbox.
- Sandbox Editor joins Computer in the `+` menu (pinned closable tab when opened) across sessions, tasks, and projects.
- Archived sidebar rows use full-width justify-between for title vs date (flex was overridden by `block`).
- Reason for change: primary chrome was crowded with secondary actions and less-used tabs.

## Read-only sessions when PR is merged or closed - 2026-07-20

- Sessions whose PR is `merged` or `closed` use the same read-only chrome as archive (banner, no composer, no sandbox start, PRD locked), without auto-archiving.
- Banner copy is PR-specific; reopening the PR on GitHub (webhook → `open`/`draft`) unlocks the session again. No in-app unlock.
- Reason for change: post-merge/closed sessions were still editable even though the work was done.

## Persist list scroll across detail navigation - 2026-07-20

- Quick tasks / projects (list, kanban columns, table) and the sidebar nav restore scroll via sessionStorage when returning from a detail view.
- Positions are per tab and clear when the tab closes; nested scroll containers are keyed by repo + view (and kanban column).
- Reason for change: opening a task/project unmounted the list and dropped you back at the top.

## Convex env slots + fixed provider logos - 2026-07-20

- Env vars UI adds a Convex section: staging (`CONVEX_DEPLOY_KEY` / `CONVEX_ADMIN_KEY`, `NEXT_PUBLIC_CONVEX_URL` / `VITE_CONVEX_URL` / `CONVEX_URL`) and prod (`PROD_CONVEX_DEPLOY_KEY` / `PROD_CONVEX_ADMIN_KEY`, `PROD_CONVEX_URL`); secrets and prod URL default to `sandboxExclude`.
- OpenAI/Codex mark uses current B&W brand (not legacy green); Cursor from svgl; Daytona from daytona.io favicon; theme-aware fills for dark mode.
- Reason for change: Convex BYOK keys were free-form only, and several brand marks were wrong or invisible on dark surfaces.

## Proof and audit as top-level activity events - 2026-07-20

- Proofs and audits no longer nest under the run accordion; each is its own timeline row on the shared rail.
- Audits use a dedicated accordion titled "Eva performed audit" (with running/error/fix variants) and expandable results.
- Reason for change: nested proof/audit under the run made the timeline hard to scan as discrete events.

## Flat activity timeline with shared rail - 2026-07-20

- Run rows (success / made changes / running / error / queued) drop the muted card; proof and nested audit sit as sibling events under the run, not indented inside it.
- Contiguous non-comment activity shares a vertical rail through icon centers; comment cards stay off the rail with the avatar inside the card.
- Reason for change: activity felt like stacked cards instead of a readable event timeline.

## Quick task detail: sections, copy link, activity coalesce - 2026-07-20

- Sidebar fields split into Properties / Labels / Project; page content capped at `max-w-7xl` and centered; hairline divider above Activity.
- Header gains a Copy link control next to More (clipboard gets the current URL).
- Same actor+field task activity edits within 5 minutes coalesce into one timeline row instead of stacking duplicates.
- Reason for change: quick-task chrome felt flat/wide, and rapid description edits spam the activity feed.

## Fix empty proof captures (retry + longer cap) - 2026-07-20

- Proof max runtime raised from 10m → 30m; empty media message is now "Eva decided not to capture."
- Uses the repo Proof Capture Model from settings (e.g. cursor:grok); retries once with a hard capture prompt if the first turn left no file.
- Proof activity is stored on the run (`type: "proof"`) so empty captures are debuggable.
- Reason for change: carepulse PRs #1916–#1918 burned the old 10m proof budget and attached no media despite real UI changes.

## Harden proof capture runtime + fallback copy - 2026-07-20

- Empty proof media now records "No proof media captured" (not "No UI changes"); the uploader also scans `rootDirectory/recordings|screenshots`.
- Before the proof agent, the platform revives dead background daemons (Convex) and starts the app so captures are not error pages from undeployed functions.
- Proof prompt uses the repo's real `devPort`/`devCommand`, requires captures under `/tmp/repo/...`, and mandates re-capture when Convex/runtime errors appear.
- Reason for change: PRs like carepulse #1910 labeled UI work as "No UI changes", and some proofs were screenshots of Convex errors because the backend was cold.

## Purge Vercel snap\_\* on ephemeral sandbox delete - 2026-07-19

- `sandbox.delete()` now lists and deletes snap\_\* for that sandbox name (SDK cascade was leaving never-expiring storage that bills Snapshot Storage).
- Create always sets an explicit `snapshotExpiration` so children of expiration:0 seeds don't inherit forever-TTL; seed-prep delete preserves the new base/seeded id.
- `purgeUnreferencedVercelSnapshots` reclaims orphans while keeping base + seeded ids **and** every snap still owned by a live sandbox (session / task / project resumes).
- Reason for change: automation/ephemeral sandboxes deleted cleanly but snapshots stayed forever on the Vercel Snapshots dashboard.

## Infrastructure env slots + colored provider logos - 2026-07-19

- Env vars UI adds an Infrastructure section (Daytona API key, Vercel token/team/project) with brand-colored logos; agent logos recolored too.
- Infra secrets default to `sandboxExclude`; `VERCEL_PROJECT_ID` slot is repo-only; team tab omits it.
- `SANDBOX_PROVIDER` toggle (Daytona / Vercel) in Infrastructure; listed in plaintext since it is not a secret.
- Reason for change: Vercel/Daytona creds were buried in free-form vars; first-class slots match coding-agent UX and keep project id per app.

## Shared automations use sibling Vercel project for sandboxes - 2026-07-19

- Automation runs (and the shared `resolveSandboxRepoId` / `pickSandboxRepoId` helpers) now create/launch sandboxes with a monorepo app row that has `VERCEL_PROJECT_ID`, not the bare root.
- Unit tests lock the carepulse-shaped root→web credential pick so this regresses loudly.
- Reason for change: shared Daily digest on carepulse root failed because Vercel is required but project id only exists on `apps/web` / `eprocurement`.

## Eva oxlint plugin: vmem-style rules + fixture tests - 2026-07-19

- Restructured `scripts/oxlint-plugin-eva/` (`.mjs`, `rules/`, `utils`, fixture harness) — vmem internals, eva `scripts/` location.
- Kept `eva/no-is-record` (error); added `eva/no-json-parse` and `eva/no-double-cast` (warn); dropped soft `eva/no-explicit-unknown`.
- `no-json-parse` only allows Zod `.safeParse` / `.parse` wrappers — not `: unknown` / `as unknown`.
- Reason for change: name-ban rules were low signal; match vmem’s high-signal boundary-parse checks with real oxlint tests.

## Richer session PRD artifact + Plan Ready composer banner - 2026-07-18

- PRD card gains Download .md, uses the first markdown heading as title, and keeps Copy / Save as Document / Approve.
- When a plan exists but the compact card is hidden (Edit mode or PRD tab open), a Plan Ready strip above the composer offers View + Approve.
- Reason for change: plans felt like a mode panel, not a portable artifact with a clear "ready to implement" cue (t3code-style).

## Debounced "Scroll to end" chat pill - 2026-07-18

- Scroll-to-bottom control now shows after 150ms away from the live edge (hide stays immediate), resets on conversation switch, and uses a labeled pill like t3code.
- Reason for change: the old icon flashed during stick-to-bottom settle and thread switches.

## Collapse long user chat messages behind "Show full message" - 2026-07-18

- Session/task chat user prompts longer than 8 lines or 600 chars collapse with a fade and expand toggle (same idea as t3code).
- Reason for change: long pasted prompts were dominating the timeline and burying agent replies.

## Session walkthrough recordings go to chat player, not artifacts - 2026-07-18

- Edit-turn prompts now require agent-browser captures under `recordings/` / `screenshots/` and forbid `create_artifact` for walkthrough media.
- MCP `create_artifact` description says the same; recording-related messages always take the full agent turn.
- Reason for change: agents were hosting WebMs as HTML artifacts, so chat never got Convex storage + VideoPreview speed controls.

## Claude daemon turns upload recordings/screenshots into chat - 2026-07-18

- sdk-daemon finalize now uploads sandbox `recordings/` / `screenshots/` and attaches them to the last assistant message (same path as one-shot callbacks).
- Chat already had VideoPreview with 1×/3×/5×/8× speed controls; media was simply never attached on daemon turns after the Claude SDK migration.
- Reason for change: agent recordings worked before daemon migration but disappeared from session chat.

## Computer tab pins open with gated close - 2026-07-18

- Opening Computer from `+` keeps the tab in the bar (with an X) until you close it; close is disabled with a tooltip while Computer is running/starting.
- Idle/start copy for that surface now says Computer (not Desktop).
- Reason for change: Computer disappeared when switching tabs, and closing while it was running left a dangling desktop process with no UI.

## Session Preview Console shows Vercel dev-server logs - 2026-07-18

- New/resumed Vercel session sandboxes start the app in the Preview Console tmux session instead of a detached `/tmp/devserver.log` process.
- Preview readiness no longer background-restarts the app on Vercel (that was stealing the process away from Console).
- Reason for change: Console was empty while the real server ran invisibly in the background.

## Session preview respects app settings port before services finish - 2026-07-18

- Preview used `session.devPort ?? 3000`, so early-ready sessions (before services wrote the port) always hit 3000 even when App settings had 3001.
- Early-ready now seeds repo `devPort`/`devCommand`; the UI also falls back to repo settings.
- Reason for change: eProcurement (and similar apps) listen on non-3000 ports configured in settings.

## Cursor session turns no longer stage Claude pendingTurn - 2026-07-18

- Only Claude daemon-pull stages `pendingTurn` / schedules prewarm; Cursor/Codex/Opencode clear it and one-shot launch.
- Reason for change: a leftover Sonnet daemon was spam-claiming Cursor-tagged turns (`claimPendingTurn model mismatch`) while launch ran.

## Don't delete session sandboxes after early-ready - 2026-07-18

- Late startup failures (e.g. startup-commands 300s timeout) used to `delete()` the new VM and `sandboxError`-close the session — even after early-ready had already unlocked chat.
- Now keep the sandbox running, leave status active, and post a non-fatal warning instead.
- Reason for change: users mid-session lost their Vercel sandbox when background setup timed out after the UI already said "Sandbox started".

## Agent-driven Browser tab for sessions - 2026-07-18

- New first-class Browser tab (Preview stays; Computer stays in `+`) watches the shared desktop Chrome while the agent drives it via `agent-browser connect 9222`.
- MCP `browser_start` / `browser_lock` / `browser_unlock` (session tokens only), edit-prompt rule, soft-lock auto-switch + takeover overlay, lock cleared on turn end.
- Reason for change: Cursor-browser parity — user watches live agent browsing without replacing Preview or Computer.

## Cursor session turns no longer launch with an empty prompt - 2026-07-18

- Cursor/Codex/Opencode session turns are pushed via one-shot launch again; Claude keeps the sdk-daemon pull path. Also map Grok to Cursor’s `cursor-grok-4.5-*` CLI slugs and drop Composer 2 from the picker (keep 2.5).
- Reason for change: with `sdk-daemon` on, picking Cursor still prewarmed the Claude-only daemon path, which fell through to a one-shot with an empty prompt and died as “no parseable stream-json events within 90000ms”.

## Chat queue UI matches Cursor-style follow-up cards - 2026-07-18

- Queued prompts sit in a quieter collapsible card with two-line wrap, move-to-front, edit, and delete; while a turn is running the composer placeholder becomes “Add a follow-up…”.
- Reason for change: the old marquee queue felt like a separate control strip rather than pending follow-ups above the input.

## Session turns no longer run on the wrong prewarmed model - 2026-07-18

- Page-open daemon prewarm used to always boot Claude Sonnet, which could claim the next turn before a Cursor/Codex daemon respawned — so picking Grok still ran as Claude.
- Pending turns now carry the target model; claim rejects mismatches; optsmismatch respawns when the staged turn needs a different daemon; `lastModel` steers the next page-open prewarm.
- Reason for change: model picker only updated client state while the warm Sonnet daemon kept winning the claim race.

## Native per-model effort traits replace broken thinking budgets - 2026-07-17

- Reasoning lever now maps to Claude `--effort` / SDK `effort` and Codex `model_reasoning_effort` with per-model levels/defaults (plus thinking toggle, 1M context, Ultrathink prompt prefix); deprecated `MAX_THINKING_TOKENS` budgets are gone so Low/Medium/High are no longer identical on Opus 4.6+/Fable 5.
- Traits menu (sessions, projects, tasks, designs) omits model defaults from the send payload; localStorage renames `reasoningLevel` → `effortLevel` so the old sticky no-op medium is dropped.
- Reason for change: Agent SDK 0.3.201 treats thinking-token budgets as on/off only; t3code-style native effort is the real control.

## Session chat: changed-files card + ephemeral diff review comments - 2026-07-17

- Per-turn changed-files card lists edit/write/notebook paths; View diff best-effort strips `/tmp/repo/` or `/workspace/repo/` then sets `diffFile` and opens the Diffs tab (PR sessions only).
- Diffs tab line selection drafts ephemeral review comments (in-memory only): chips above the composer, serialized into the prompt on send, comments-only sends allowed; history/queue strip the XML blocks for display.
- Reason for change: t3code parity so reviewers can jump to a file and attach line-anchored feedback without leaving session chat.

## Session chat refactored toward t3code layout - 2026-07-17

- Split `ChatBody` into utils / queued-mutation hook / memoized `ChatMessage` / `ChatComposer`, and `ChatPanel` into header/modals/mode/summary/`useSessionSend` modules; removed a duplicate unreachable activity-tasks block.
- External ChatBody props and type re-exports unchanged so projects/tasks keep compiling.
- Reason for change: 800+ line orchestrators blocked t3code parity (changed-files card, diff review comments) and forced every stream tick through a giant `renderMessage` closure.

## Documented sandbox-driven agent architecture and harness evaluation - 2026-07-17

- Added `packages/backend/docs/ARCHITECTURE.md` comprehensively documenting why eva runs agent loops inside sandboxes (Convex ~10-min action limit), the 7 custom capabilities the callback owns (blocking AskUserQuestion, tool-UI parser with subagent nesting, usage tracking, heartbeat/watchdog, MCP-config injection, background-task disabling, warm daemon), and the sandbox provider abstraction (Daytona vs Vercel implementations).
- Evaluated `@ai-sdk/harness-claude-code` (Vercel's new experimental host-driven bridge) and documented why we rejected adoption: architectural mismatch (would require new persistent host tier, conflicts with Convex action limits), feature regression (loses all 7 custom capabilities), no net gain (Vercel Sandbox support already built, multi-runtime support already multiplexed), and maturity risk (6 weeks old, breaking-changes warning).
- Reason for change: future decisions about agent architecture, runtime upgrades, or sandbox changes need to understand the constraints and rationale behind the current design.

## Session chat shows killable agent background processes - 2026-07-17

- Session Claude runs can background Bash again; a panel above the composer lists live shells and can stop them (ppid-tree TERM→KILL), while Task sub-agents stay forced foreground so Wayfinder-style “I’ll report back” holes stay closed.
- Tasks/projects/CLI keep `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` from launch — only SDK session children unset it.
- Reason for change: backgrounded Bash was invisible and survived Stop; without a panel, re-enabling it would recreate unkillable leaks.

## Renaming a session/project/task updates the linked GitHub PR title - 2026-07-17

- Renaming in Eva now best-effort updates the open GitHub PR to `Eva: <new title>`; merged PRs are left alone so shipped work is not re-titled.
- Reason for change: PR titles were only set at creation, so renames left GitHub out of sync with the Eva UI.

## Model picker matches t3code's searchable popover - 2026-07-17

- Replaced the nested provider → account → model dropdowns with a t3code-style popover: left provider/account rail, search across all models, and a flat two-line list with account accent badges.
- Same `ModelSelect` props API at every call site — picking a model still sets team vs personal credential via `onAccountChange`.
- Reason for change: deep submenus made switching models/accounts slow and undiscoverable once personal accounts landed.

## Stop keeps the partial reply instead of "Execution cancelled" - 2026-07-17

- Killing a session/task/project chat turn now saves whatever text and tool timeline had already streamed; the hardcoded "Execution cancelled by user." string is gone.
- If nothing streamed and no tools ran, the empty assistant bubble is deleted instead of left as a cancelled stub.
- Reason for change: users were watching a real partial answer stream in, then stop replaced it with boilerplate.

## Session sub-agents no longer vanish mid-turn - 2026-07-17

- Sandboxes now set `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` so Agent/Bash cannot background; sub-agent work finishes inside the same turn before Eva finalizes the reply.
- Reason for change: Claude Code backgrounds sub-agents by default, Eva treats the SDK `result` as end-of-turn, and the “I’ll report back” promise never arrives — the idle sandbox then auto-stops and kills the still-running sub-agent.

## Richer agent-SDK tool UIs: subagent drill-in, todo checklists, blocking questions - 2026-07-17

- Subagent activity now nests: a subagent row expands to show the reads, edits, and commands it ran, instead of a single opaque "Ran agent" line.
- Fixed subagent runs going unrecognised — the Agent SDK renamed the tool from `Task` to `Agent`, and both names are now mapped.
- TodoWrite/TaskCreate/TaskUpdate now render as a single live checklist with per-item status instead of a generic "Updating tasks" row.
- AskUserQuestion can now block the turn: in SDK sessions the agent pauses via `canUseTool` until the user answers, and the answer resumes the same turn as a real tool result (no timeout while waiting).
- Reason for change: the Agent SDK integration surfaced these tools generically; this makes subagent work, task tracking, and clarifying questions first-class in the chat.

## Chat jump rail matches t3code timeline minimap - 2026-07-17

- The chat jump rail is now a short, vertically-centered scrubber (8px per tick) with fisheye hover and a floating preview of the user turn plus muted assistant reply, instead of a full-height tick strip.
- Reason for change: the first implementation was hard to discover and didn’t match the t3code minimap interaction people expected.

## PR recap GitHub comments link to the correct Eva doc URL - 2026-07-17

- Sticky PR recap comments now use the per-repo numeric `/docs/N` path instead of the Convex document id, which Eva routes do not resolve.
- Reason for change: “View recap in Eva” links were 404ing / failing to load the doc after a successful recap.

## PR recaps no longer hang on monorepo root sandboxes - 2026-07-17

- PR recap sandboxes now resolve credentials from a sibling app that has `VERCEL_PROJECT_ID` (preferring the default visible app) instead of the codebase root row, which typically has no project id.
- Sandbox/prep failures now finalize the doc as `error` with a message instead of leaving status stuck on `pending` / “Generating…”.
- Reason for change: carepulse-style monorepos with `SANDBOX_PROVIDER=vercel` were silently failing sandbox create on the root repo and never updating the doc.

## Credential source shown on runs and chat turns - 2026-07-17

- Each task run and chat turn now snapshots whether it used Team credentials or a personal account label (e.g. “Personal”) at launch/send time.
- That label shows as a badge on the run timeline and next to the user message metadata in session, task, project, and design chat.
- Reason for change: after picking a personal account there was no durable way to tell which credential a past run had used once the picker moved on.

## Team icons on list, detail, and sidebar - 2026-07-17

- Teams can now have an uploaded icon (same Convex storage pattern as app/repo logos); any team member can set, change, or remove it, including personal teams.
- The icon shows on the Teams list cards, the team detail header, and next to the team name in the sidebar “N online” block.
- Reason for change: teams were only a name + generic users icon; custom icons make them recognizable the same way codebases already are.

## Per-user accounts wired across all sandbox chats - 2026-07-17

- Extended per-user provider accounts beyond session chat and quick-task runs to also cover design chat, project sandbox chat, and task sandbox chat.
- Each of those pickers now offers the user's accounts, and the chosen account's credentials are injected at launch (overriding the team credential) for that run.
- Reason for change: accounts appeared in some sandbox surfaces but silently fell back to team credentials in others; now every interactive run honours the selected account.

## Clickable file tree in sandbox Diffs tab - 2026-07-17

- Added a Pierre `@pierre/trees` file tree to the left of the Diffs tab across quick-tasks, projects, and sessions, showing the changed files in nested folder hierarchy.
- File tree displays git-status colours per file (added/modified/deleted/renamed); clicking a file scrolls its diff into view on the right and highlights the node.
- Selected file path persists in the `?diffFile=` URL parameter so the highlighted file survives reload and is shareable; selection is remembered when reopening a sandbox.
- Reason for change: large PRs with many files across folders are now easy to navigate — instead of scrolling through every diff, jump straight to the one you want via the tree.

## Model picker nests accounts as submenus - 2026-07-17

- With personal provider accounts, the model dropdown is now Provider → Team/Account → models, instead of listing every account's models in one flat submenu.
- Reason for change: many accounts made the old flat list hard to scan; nesting by account matches how people choose whose credential to use.

## Failed run notifications use danger styling - 2026-07-17

- Task/quick-task failures now emit `run_failed` (instead of reusing `run_completed`) and render with a red destructive badge and exclamation icon in inbox, bell, and toasts.
- Legacy failure rows still stored as `run_completed` are detected from their title/message so existing inbox items look correct too.
- Reason for change: a failed run showing a green checkmark made the inbox easy to misread.

## Per-user provider accounts ("bring your own login") - 2026-07-17

- Users can add their own coding-agent accounts (Claude Code OAuth token, Cursor API key, Codex/opencode auth) under Settings → Accounts; credentials are encrypted at rest and revealed only on demand.
- The model picker now shows each provider's models under "Team" and once per user account; picking an account injects its credentials at sandbox launch, overriding the shared team credential so usage bills to that account.
- Wired end-to-end for session chat and quick-task runs; a provider becomes available in the picker whenever the user has an account for it, even if the team has no key.
- Reason for change: teammates wanted their own runs billed to their own accounts instead of the shared team credentials.

## Quick-task URLs drop the unused `/activity` segment - 2026-07-17

- Canonical quick-task detail is now `/quick-tasks/$numId`; old `/quick-tasks/$numId/activity` links redirect there.
- Reason for change: the detail-tab segment was leftover from when quick tasks had multiple tabs, and cluttered every task URL.

## Shared “does not exist” empty state for missing entities - 2026-07-17

- Loading a deleted or invalid task/session/project/doc/design/automation/team/artifact URL now shows a clear empty state (“This … does not exist”) with optional back link, instead of a blank pane, infinite spinner, or “Select a task…”.
- Added shared `EntityNotFound` and upgraded `EntityNumIdGate`; quick tasks and `useTaskDetail` distinguish loading vs missing.
- Reason for change: missing entities were easy to misread as an empty selection or a hung load.

## Separate proof capture step after implementation - 2026-07-17

- Task runs now code on the selected task model, then (when screenshots/videos are enabled) run a dedicated proof-capture agent on `proofModel` after push and before PR creation.
- Proof soft-fails like audit (implementation success is preserved). The sandbox callback persists proof media before firing completion so PR enrichment sees the captures.
- Restored the Proof Capture Model settings control with accurate copy. Conflict-resolution runs still skip proof.
- Reason for change: using `proofModel` for the whole coding turn silently ignored Claude (etc.) task picks whenever proof was enabled.

## Coding-agent auth as paste-in provider slots in env settings - 2026-07-17

- The environment-variables settings (team and repo) now show a "Coding agents" section above the free-form table with a dedicated slot per agent — Claude Code, Codex, OpenCode, Cursor — each with its brand logo. An unconfigured slot offers a single paste-in field; a configured one shows a "Configured" badge with reveal/copy/replace/remove.
- Slots write to the same encrypted key/value store as before under the exact keys the backend keys agent availability off (`CLAUDE_CODE_OAUTH_TOKEN`, `CODEX_AUTH_JSON`, `OPENCODE_AUTH_JSON`, `CURSOR_API_KEY`); a configured agent key is hidden from the free-form table so it appears only in its slot. The slot "configured" check reuses the backend's exported key lists, so it stays in sync with availability logic.
- Reason for change: enabling an agent previously meant knowing the exact magic env-var name from a paragraph of help text and typing it correctly; surfacing the known keys as logo-labelled slots turns it into "find the logo, paste the token".

## Image attachments in the design chat - 2026-07-17

- The design chat composer now takes pasted/dropped images too (same limits and preview as the other chats), and delivers them to the design agent as readable files at launch.
- The shared composer image-attachment logic (upload, preview strip, message thumbnails) was extracted into one module now used by both the main chat and the design chat.
- Reason for change: the earlier image-attachment work skipped the design chat because it uses a separate composer; users expect to paste a reference screenshot when describing a design too.

## Rail sandbox dots use indexed lookups - 2026-07-17

- `listReposWithActiveSandboxes` now finds live project/task sandboxes via `by_repo_and_sandbox_status` indexes (bounded `.take`) instead of collecting every project/task per app.
- Reason for change: the previous full collects scaled with historical task volume and made every sidebar load unnecessarily expensive.

## Per-task, per-project, and per-session proof/audit toggles - 2026-07-17

- Proof capture (screenshots/videos) and audit are no longer repo-only defaults: they can now be turned on or off per task, per project, and per session, so runs no longer inherit a single repo-wide setting they cannot override.
- Task creation and the task detail sidebar gained an Audit control alongside the existing Proof control, both tri-state (inherit / force on / force off); resolution order for a run is task, then project, then repo/default.
- Projects gained proof and audit defaults in the metadata bar that their tasks inherit; a task's audit toggle can now force an audit on a quick task too (previously audits ran only on project tasks), still requiring at least one enabled audit category.
- The session chat composer gained an Options menu with "Capture proof" and "Run audit" checkboxes that persist on the session and apply to every subsequent turn until unchecked — proof adds a capture step to the turn, and audit runs after each successful agent turn.
- Reason for change: teams needed to decide proof/audit per piece of work rather than flipping a repo-wide default, and to opt individual quick tasks and sessions in or out on the fly.

## Paste and attach images in sandbox chat - 2026-07-17

- The chat composer (shared by session, project sandbox, and quick-task sandbox chats) now accepts images: paste with Ctrl+V, drag-and-drop, and see thumbnails before sending. Attached images render back in the sent user message.
- Images upload to Convex file storage on send and are delivered to the agent as files it reads. The two CLI-based chats (projects, quick tasks) write the images into the sandbox at launch and point the agent at their paths; sessions carry the images on the pulled turn so the warm daemon downloads them before running the model (no file-write race).
- Limited to images, up to 5 per message and 10 MB each, with a toast on rejects or failed uploads. Attachments also survive being queued while the agent is busy.
- Reason for change: users needed to show the model a screenshot or mockup directly in chat rather than describing it or committing it to the repo first.

## PR recaps generate an interactive file-by-file walkthrough - 2026-07-17

- PR recap generation now produces **two outputs** in a single agent run: the existing markdown recap (stored in the doc's Markdown tab and posted to GitHub) and a new interactive HTML walkthrough (stored in the doc's HTML field and shown as the Walkthrough tab). The agent emits them separated by a marker; older runs without the marker fall back to markdown-only.
- The walkthrough is a self-contained file-by-file stepper: an overview screen with the PR summary, stats, schema/API changes, and risks, followed by one screen per changed file showing its diff hunks (added lines green, removed lines red) and a plain-English explanation. Prev/Next buttons and a clickable file list let reviewers jump around.
- The HTML is rendered in a sandboxed iframe with `allow-scripts` but no same-origin access, so the page's inline JS runs (interactivity works) but it cannot reach eva's cookies, storage, or DOM. The prompt requires the page to be fully self-contained: no external resources, CDN scripts, or storage APIs.
- Both Markdown and HTML tabs are available on all recap docs (regular docs also have an HTML tab for future use); the Walkthrough tab shows an empty state if the recap was generated before this change.
- Reason for change: reviewers spent time hunting the diff; a guided walkthrough that threads the code changes through the recap's rationale is much faster to follow.

## Task Activity reorganized: audits nested under runs, sandbox events removed from feed - 2026-07-16

- Audit results now appear inline under each code-run in the Activity timeline (not a separate tab), with an always-visible "Eva completed audit" row showing the pass/fail badge; expanding it reveals the per-section results and Run Fixes button.
- Sandbox lifecycle events (started/reconnected/stopped) are no longer shown in the Activity feed, since they already appear in the sandbox preview chat (the backend writes both a `taskSandboxEvents` row and an `isSystemAlert` chat message; the chat copy is sufficient).
- The separate "Audit" tab and "Activity" / "Audit" tab bar are gone; the task detail view now shows a single Activity feed.
- Reason for change: audits provide context when shown alongside the run that was audited (one timeline view instead of two tab-swaps); sandbox events in the feed were redundant noise because they're already in the chat.

## Rail app icons show a live sandbox indicator - 2026-07-16

- App tiles on the left rail show a glowing green dot (bottom-right) when that app has any active sandbox on a session, quick task, or project.
- Reason for change: makes it obvious at a glance which apps currently have a running sandbox without opening each one.

## File Viewer tab with clickable chat file chips - 2026-07-16

- Clicking a file chip in a session's chat activity now opens that file's current contents, read live from the sandbox, in a new read-only Files tab.
- The sandbox callback carries the full file path on read/write/edit/notebook steps so chips can resolve the file; older messages keep plain (non-clickable) chips.
- Reading a stopped sandbox is refused rather than resumed, so clicking a file never silently wakes (and bills) a Vercel VM.
- The viewer loads only when the selected file changes or on Refresh, and caches the last read, so the agent's 5-second heartbeat no longer re-fetches and flickers.
- Reason for change: while following along in chat, jumping to a referenced file's live contents was previously only possible via the full code-server Editor tab.

## Global pages are rail-only; Home/Teams/Artifacts live on the icon rail - 2026-07-16

- Teams and Artifacts join Eva and Inbox on the left rail; the empty root sidebar panel is gone on global routes so content uses full width (`lg:pl-16`).
- Dev-only Testing sits above the account avatar on the rail (`IconCode`). Online teammates stay in the repo sidebar footer only.
- Reason for change: after moving settings into the rail menu, the second column on `/home`/`/teams`/etc. was empty chrome — folding remaining global nav into the rail finishes that cleanup.

## Global settings live under the rail settings menu - 2026-07-16

- A settings gear under the rail avatar opens Theme, Personalisation, Notifications, and Sandboxes as global `/settings/*` routes.
- Those links are gone from the repo Settings sidebar PREFERENCES section and from the root sidebar (Theme / Notifications / Sandboxes); old `/$owner/$repo/settings/{theme,personalisation}` URLs redirect to the global pages.
- Reason for change: user-level settings belong with the always-visible account rail, not scattered across root nav and repo settings.

## Inbox moves onto the left icon rail - 2026-07-16

- Inbox is now a top tile on the vertical repo rail (links to global `/inbox`), with an unread count badge on the bottom-right of the icon when there are notifications.
- The Eva mark sits above Inbox on the same rail (links to `/home`) in a white rounded-full chip; the sidebar header wordmark is gone so brand + global actions live in one place.
- The account menu is an avatar-only tile at the bottom of the rail (name/email in the dropdown); online teammates stay in the main sidebar footer.
- Drafts stay in the main sidebar above the BUILD/SHIP nav because they are per-repo/app; only the global Inbox left the sidebar list.
- On `/inbox`, the main sidebar no longer shows the global Home/Teams/Theme list — Eva and Inbox already live on the rail, so that panel stays empty aside from the header and footer.
- Reason for change: Inbox, Eva home, and account access are cross-cutting and belong with always-visible rail actions, while keeping Drafts next to the active app's workflow.

## Repo switching moved to a left icon rail - 2026-07-16

- The RepoSwitcher popover is gone; a slim icon rail now sits to the left of the main sidebar showing one icon per repo/monorepo app, and clicking one switches to it in a single action while preserving the current sub-page (Sessions in repo A → click repo B → Sessions in repo B).
- The main sidebar keeps its familiar single-repo layout (Drafts, then the BUILD/SHIP/TEST/MORE nav and the Sessions/Settings/etc. drill-downs) — the rail handles switching and global Inbox, so those concerns stay visually separate.
- Each rail icon uses the repo's logo, falling back to a coloured letter tile, with a hover tooltip naming the owner/repo (and app for monorepos); the active icon carries the surface-fill chip.
- Reason for change: an activity-bar-style rail makes switching a one-click, always-visible action while leaving the per-repo navigation untouched — clearer than nesting every repo in an accordion.

## Docs slim to Markdown + HTML tabs; testing arena flags issues into tasks - 2026-07-16

- Documents now have two tabs: **Markdown** (the content editor, renamed from Content) and **HTML** (renders a stored `html` field read-only in a sandboxed iframe). The Description, Requirements, and User Flows tabs and the "Re-extract" flow (`docPrdWorkflow`) are gone; PRD upload no longer auto-parses.
- The Testing Arena no longer scores a fixed requirement checklist. A run reads the document itself as the specification and returns a severity-ranked list of issues found in the codebase (may differ between runs). Each run lists its issues with per-item checkboxes and **Create Tasks** / **Create & Run** buttons that turn selected issues into agent tasks, matching the automations "actions only" flow. The opt-in auto-fix PR button remains.
- Runs now require the document to have content (not requirements) before testing. Report results move from `results` (per-requirement pass/fail) to a new optional `issues` array; the legacy `results` field is kept optional for old rows and cleared by the `clearEvaluationReports` migration.
- Reason for change: the four-tab doc model and the rigid pass/fail scoring added maintenance and friction; a freeform issue list that converts straight into tasks is simpler and more actionable.

## Custom sandbox tabs use name slugs in the URL - 2026-07-16

- Session URLs for custom tabs now use a slug of the tab name (e.g. `/sessions/25/supabase`) instead of the Convex document id, so links stay readable and stable as long as the name stays the same.
- Settings → Tabs enforces unique names per app (case-insensitive via the slug) and blocks names that collide with built-in tabs (`preview`, `editor`, `terminal`, `desktop`, `diffs`, `prd`).
- Reason for change: opaque ids in the URL were hard to share and recognize; duplicate or reserved names would also break slug-based routing.

## Nest Eva proofs under the related run in Activity - 2026-07-16

- Proofs linked to a run now sit under that run's accordion header (visible when collapsed): media opens via "View capture" / "View captures (N)" gallery, message-only proofs stay truncated inline.
- New captures store `runId` from the agent callback so they attach to the correct run; legacy proofs without `runId` remain standalone timeline rows.
- Reason for change: proofs belong to a specific run but floated as separate events, making the Activity thread harder to scan.

## Keep sandbox tabs visible when stopped on tasks and projects - 2026-07-16

- Quick-task and project sandboxes now keep the tab bar mounted when the sandbox is stopped (same as sessions), so Diffs and other panes stay reachable without starting the sandbox first.
- Individual panes still show their own inactive empty states; only tasks/projects that never had a sandbox get the full empty message.
- Reason for change: the whole-panel "Start Sandbox" gate blocked tabs that do not need a running sandbox (especially Diffs).

## Custom sandbox tabs per app - 2026-07-16

- You can now define custom tabs per app under Settings → Tabs: give each a name, a Tabler icon name (e.g. `IconBolt`), and a sandbox port. Enabled tabs show in every session for that app, alongside Preview/Editor/Terminal/Diffs — for example a "Supabase" tab on port 53432 or a "Convex" dashboard tab.
- Each custom tab opens the service running on that port inside the sandbox, resolved through the same authenticated preview proxy as the Preview tab. It auto-connects (polls until the port is reachable) — there is no start/stop, since the service is launched by the app's own dev/startup commands.
- Tabs can be toggled on and off; disabling or deleting one removes it from sessions, and stale deep-links to a removed tab fall back to Preview.
- Reason for change: developers run extra local services (Supabase Studio, the Convex dashboard, and so on) in the sandbox with no way to view them in-app.

## Doc/automation hover cards show author - 2026-07-16

- Docs and automations sidebar hover cards now show the author's avatar and name next to the updated time, matching the session hover pattern more closely.
- New docs store optional `createdBy` going forward (no backfill); legacy docs omit the author until recreated.
- Reason for change: title/preview alone made it hard to see who owns an item when scanning the sidebar.

## Move Computer to the + menu and add a Diffs tab - 2026-07-16

- The sandbox "Computer" (remote desktop) tab moves out of the tab row into the `+` menu, where it is rarely needed; picking it there still opens the desktop view. The tab row is now Preview, Editor, Terminal, Diffs.
- New "Diffs" tab shows the pull request's diff in a GitHub-style viewer (powered by `@pierre/diffs`): syntax-highlighted, unified or split view (the choice persists in the URL), with a Refresh button and light/dark theming. Surfaces with no PR yet show an empty state.
- The diff is the canonical pushed PR diff fetched from GitHub. Applies to all three sandbox surfaces: sessions, projects, and quick tasks.
- Reason for change: the Computer tab held a permanent slot in the tab bar despite little use, and there was no in-app way to review a PR's changes without switching to GitHub.

## Sidebar hover previews for docs and automations - 2026-07-16

- Docs and automations sidebars now use the same whole-row hover card as sessions: title, a short preview (doc description or content / automation description), and updated time — so scanning stays title-first without losing context.
- Session rows get the same vertical spacing as the docs list (`space-y-1`) so the sidebars feel consistent.
- Reason for change: hover-revealed timestamps were easy to miss and inconsistent with the denser session hover pattern users preferred.

## Compact session sidebar rows with hover details - 2026-07-16

- Session and design-session sidebars show only title + PR/status indicators; author, created time, and first-message preview move into a whole-row hover card so the list stays denser.
- List queries attach `firstMessagePreview` from the earliest user message so existing chats get previews without a schema migration.
- Reason for change: the always-visible author/date row made the sidebar taller than needed for scanning titles.

## Merge Proof into the Activity timeline - 2026-07-16

- The separate "Proof" tab is gone. Each proof Eva attaches (screenshot, video, or note) now appears inline in the Activity thread at the moment it was captured, so proofs sit in chronological order alongside runs, audits, and comments.
- Each proof is its own collapsible accordion showing the Eva logo and "Eva attached proof"; opening it reveals the image, video, or message. This replaces the old carousel, so multiple proofs no longer hide behind one another.
- Old `.../proof` tab URLs redirect to Activity automatically.
- Reason for change: proofs were siloed in a tab and stacked in a carousel, disconnected from when they happened; folding them into the timeline makes it obvious what Eva did and when.

## Chat-style task Activity tab - 2026-07-16

- The task Activity tab now reads like a Slack/Discord thread: activity (runs, audits, comments, sandbox events) is ordered oldest-first/newest-last, the list scrolls in its own bounded region, and the view auto-scrolls to the newest item with a "scroll to bottom" button that appears when you scroll up.
- The comment composer is pinned at the bottom of the tab instead of sitting above the timeline; the task header, description, and tab bar stay fixed above the scrolling list.
- Applies everywhere the task detail view is used (quick tasks, split list pane, project layout). Proof and Audit tabs keep their existing page-scroll behavior.
- Reason for change: the old newest-first list with a top composer was the opposite of familiar chat UX, making it harder to follow a task's conversation and see the latest activity.

## Per-repo logos for easier navigation - 2026-07-16

- Repos can now have an uploaded logo image shown next to the repo name on the home page (`/home`), team repos page (`/teams/:id/repos`), and in the repo settings (App tab). Logos are per-app, not shared across monorepo siblings.
- Upload/change/remove controls available via right-click context menu on repo cards (home + team pages) and a dedicated Logo section in the App settings page. Convex file storage stores the image; old logos are deleted when replaced or removed to avoid orphaned files.
- Added `logoStorageId` optional field to the `githubRepos` table; `list` and `listByTeam` queries now resolve logo URLs via Convex storage.
- Reason for change: generic icons made it hard to distinguish repos at a glance; branded logos improve visual scanning and recognition.

## Merge Preview and Terminal tabs; Terminal shows user terminals only - 2026-07-16

- The Preview and Terminal tabs are now merged: Preview stays top-level, and the default dev-server terminal is relocated to the bottom as a collapsible "Console" row (terminal icon + title left, chevron right). Collapsed by default; when expanded it splits the preview/console at an adjustable 60/40 ratio with a draggable divider (clamped 15–85%), and expanded state + ratio persist in localStorage.
- The Terminal tab is now hidden until you create a user terminal (via the `+` dropdown → "New Terminal"); it shows only the user-created terminals (panes 1+), each with a close button, and hides again when the last one closes. Browsing to the Terminal tab URL with no user terminals auto-switches to Preview.
- The Console pane (the shared dev-server terminal that auto-runs the dev command) is never closable and always mounted, so it preserves the PTY websocket, xterm buffer, and dev-server scrollback through preview tab switches, console collapse/expand, and divider drag. Same for preview iframes — no remounts.
- Applies to all three surfaces sharing this sandbox stack: sessions, quick tasks, and projects.
- Reason for change: the separate Terminal tab consumed vertical space in the tab bar and often sat unused when only checking the preview; the collapsible Console saves space while keeping dev-server logs accessible. User terminals are a separate, optional flow in the `+` menu.

## Composer message-history recall and reorderable queue - 2026-07-16

- The chat composer now recalls previously sent messages: ArrowUp on the first line steps back through your sent messages and ArrowDown moves forward to your live draft, terminal-style. Works across session, quick-task, project, and design chats.
- Queued messages can be dragged to reorder how they run; the new order persists and dequeue follows it. Recalled messages that contained @/‍ mentions come back as plain text (a known limit of the editor's mount-time chip map).
- Added an `order` field + index to `queuedMessages` with a `reorder` mutation and a backfill migration for legacy rows; run order no longer depends on creation time.
- Reason for change: retyping past prompts and being stuck with fixed FIFO queue order were both friction points in day-to-day chat use.

## Autosave automation settings and add a Sonner toast - 2026-07-16

- The automation Settings tab no longer has a Save button: text fields (title, prompt, cron) autosave on blur and toggles/model select save immediately, so changes persist without an extra click.
- Toggle and model changes use an optimistic update so they feel instant, and every save confirms with a "Saved" toast in the top-right.
- Added Sonner as the app's first imperative toast API (`toast` from `@conductor/ui`), mounted globally and themed to match light/dark.
- Reason for change: the explicit Save button was easy to forget and out of step with the rest of the settings screens, which already autosave.

## Compact session sidebar rows with hover details - 2026-07-16

- Session and design-session sidebars show only title + PR/status indicators; author, created time, and first-message preview move into a whole-row hover card so the list stays denser.
- List queries attach `firstMessagePreview` from the earliest user message so existing chats get previews without a schema migration.
- Reason for change: the always-visible author/date row made the sidebar taller than needed for scanning titles.

## Tag sandboxes from Convex ENVIRONMENT when set - 2026-07-14

- Sandbox creates stamp Eva tags (`eva.managed`, `eva.env`, `eva.purpose`, `eva.repoId`, `eva.deployment`) only when Convex `ENVIRONMENT` is set; otherwise labels behave as before (caller-only, e.g. seed-prep).
- `eva.env` mirrors `ENVIRONMENT` (`development` / `production`). Set that var per Convex deployment for Vercel dashboard filtering across shared projects.
- Reason for change: local and prod sandboxes shared one Vercel project with no filter key; a general `ENVIRONMENT` var is reusable beyond sandbox tags.

## Ban the generic `isRecord` type guard; parse boundaries with Zod - 2026-07-11

- Removed every `isRecord(value: unknown)` guard from the codebase (9 sites) and replaced each with a Zod boundary schema (`safeParse`), so external JSON — GitHub webhooks, Linear/Daytona API responses, LLM findings/audit/question output, sandbox package.json, Claude Code result events — is typed at entry instead of narrowed from `unknown` downstream.
- Added a root ESLint flat config with a single custom rule `eva/no-is-record` that flags any `isRecord` identifier; its error message instructs the author (human or agent) that the leaked `unknown` is the real bug and to parse at the boundary. Wired into `pnpm lint` and lint-staged so a reintroduction blocks the commit.
- Reason for change: the generic guard is a recognisable AI-generated pattern that masks an `unknown` leaking past where it should have been parsed; the ban plus the prompt-injecting lint message force the underlying fix rather than the symptom.

## Remove project/quick-task sandbox chats from the sessions sidebar - 2026-07-10

- The sessions sidebar no longer interleaves virtual project and quick-task sandbox chat entries; it lists real sessions only, as it did before. Backend `sessions.listChatEntries` and its `_sessions/chatEntries` query are gone.
- Reason for change: the merged chat entries were reverted at the user's request; project and quick-task chats stay reachable from their own pages.

## Stop prewarm from killing a mid-turn session daemon - 2026-07-10

- `prewarmSessionDaemon` no longer kills an opts-mismatched daemon while a turn is in flight (`pendingTurn` or `activeWorkflowId`); that race claimed the prompt then wiped the daemon, leaving chat stuck on Working.
- Page-open prewarm now boots with edit-mode tools + sonnet defaults so the first message is less likely to optsmismatch at all.
- Reason for change: prod session 36 stuck ~2m+ on Working after first message — daemon claimed then was killed by startExecute's tool-aware prewarm.

## Auto-open draft session PRs after first push - 2026-07-10

- Sessions open a draft GitHub PR as soon as the first agent commit is pushed (and retry on later turns if that failed); "Send for Review" only promotes draft → ready and archives the sandbox.
- Reason for change: sessions had commits on the branch but no PR until manual create, and Send for Review was creating open PRs from scratch instead of flipping an existing draft.

## Stop viewing a closed session from waking its Vercel sandbox - 2026-07-10

- `prewarmDaemon` now skips closed/stopping sessions; it previously fired whenever a `sandboxId` was set, and on Vercel the prewarm's sandbox exec lazily resumes a stopped VM (SDK `withResume`), silently resurrecting it.
- The resurrection was invisible: the session stayed `closed` in the UI while the sandbox showed active on Vercel, because prewarm never writes session status.
- Reason for change: prod session 40 was stopped at 11:50 but reappeared as active on Vercel hours later — traced to the session page's mount-time prewarm running against the still-set `sandboxId`.

## Session agent commits actually publish to GitHub - 2026-07-10

- Session workflow no longer gates `pushSandboxBranch` on a dirty working tree; after the agent commits the tree is clean, so that check skipped every publish and left commits stranded in the sandbox.
- Sandboxes now set `pull.rebase true` (create + resume) so agent `git pull` no longer fatals on divergent branches, and session prompts tell the agent to commit only — Eva still owns pull/push/ship.
- Reason for change: prod session "test2" committed locally but never pushed; agent also hit `git pull --tags origin main` divergent-branch fatal.

## Suppress spurious "Resuming sandbox" step for active chats - 2026-07-10

- Session, project, and agent-task chats no longer flash a "Resuming sandbox..." step on every message when the sandbox is already active; on Vercel the step now only shows for a genuine resume.
- Each chat's data query now surfaces its sandbox status so the resume workflow can skip the cosmetic activity when the status is "active", with no extra query or latency.

## Session-wide reasoning/thinking lever for sandbox chats - 2026-07-10

- Added a reasoning-effort lever (Off/Low/Med/High/Max slider in a toolbar popover) to session, task, and project sandbox chats so users can tune how hard the agent thinks; the level persists per-chat and applies to every message.
- The lever only shows for Claude and Codex, which expose a runtime control; it is hidden for Cursor (reasoning baked into the model id) and Opencode (no runtime lever).
- One abstract level is threaded to the sandbox and mapped per provider — Claude via `MAX_THINKING_TOKENS`, Codex via `model_reasoning_effort` — and folded into the session daemon signature so changing it mid-session respawns the daemon.

## Vercel session preview for non-3000 ports (Vite 5173) - 2026-07-10

- Vercel app/dev preview now always fronts the real listen port through the reserved auth proxy on 54321, so Vite (and any non-3000) sessions no longer call `sandbox.domain(5173)` and hit "No route for port".
- Reason for change: session 34 preview on prod threw Uncaught Error: No route for port 5173 — Vercel only exposes 3000/8080/6080/54321.

## Unblock session Working UI before git publish - 2026-07-10

- Session workflow now saves the assistant reply as soon as the daemon completes, then publishes the branch; a hung `git push` no longer leaves the chat stuck on Working after a successful answer.
- Reason for change: session 34's daemon finished ("dev server is running") and wrote completion logs, but the UI stayed on Working because saveResult ran only after pushSandboxBranch.

## Fix session stuck Working after cancel race with Agent SDK daemon - 2026-07-10

- Cancel no longer clears a newer `pendingTurn` / `activeWorkflowId` staged by a concurrent `startExecute`, which left the daemon polling empty forever while the workflow waited on completion.
- Workflow re-stages `pendingTurn` after daemon prewarm if the turn is still open, so a wiped prompt recovers automatically.
- Reason for change: session 34 on prod stuck on Working after "hi" — Convex logs showed continuous empty `claimPendingTurn` polls with no completion callback.

## Per-app Vercel project for monorepo snapshot builds - 2026-07-10

- Vercel credential resolution no longer borrows a sibling app's `VERCEL_PROJECT_ID` when inheriting `SANDBOX_PROVIDER`; token/team can still come from team/siblings, but project id must be on the target app.
- Rebuild Now from an app under a shared monorepo snapshot config lazily creates a per-app `repoSnapshots` row so eprocurement builds stay separate from apps/web.
- Reason for change: triggering eprocurement snapshot rebuild created sandboxes under the apps/web Vercel project and shared build history with web.

## Agent SDK daemon review fixes - 2026-07-10

- Prewarm now respawns the warm daemon when a turn's model or tools differ from the daemon's frozen options (model+tools signature written to `/tmp/eva-daemon.opts` at boot), so an edit-mode turn can no longer run on a stale read-only daemon.
- Prewarm is a no-op unless `CLAUDE_ATTEMPT_MODE=sdk-daemon`, so a non-daemon deployment never launches an empty-prompt runner.
- Turn classification no longer routes every short question ending in "?" to the stateless conversational path — context-dependent follow-ups stay on the agent path and keep session context.
- Removed the dead file-based daemon handoff (`buildDaemonHandoffCommand`, `tryWarmDaemonHandoff`) and the `devStartExecute` harness.
- Reason for change: review of the Agent SDK migration found the daemon could serve turns with the wrong model/tools, lose context on follow-up questions, and carried dead dispatch code.

## Monorepo snapshot builds use sibling Vercel credentials - 2026-07-10

- Snapshot credential resolution walks monorepo siblings so `SANDBOX_PROVIDER=vercel` on apps/web applies to eprocurement and shared parent configs; silent fallback to Daytona when Vercel creds are incomplete now errors loudly.
- Rebuild Now passes the triggering app repo into the workflow so seeded builds use that app's stop commands and provider instead of the shared parent config repo.
- Reason for change: carepulse eprocurement snapshot builds still created Daytona sandboxes despite Vercel being configured on apps/web.

## Snapshot builds table shows type and provider - 2026-07-10

- Added Type column showing "base image" (toolchain only) or "seeded" (boots + seeds DB) for each build.
- Added Provider column showing "vercel" or "daytona" with tooltip; resolves from team/repo SANDBOX_PROVIDER env vars.
- Reason for change: operators need visibility into which provider and build kind created each snapshot to understand build behaviour and debug misconfigurations.

## Vercel base Image snapshot builds - 2026-07-10

- Rebuild Now is provider-aware: Daytona keeps the declarative Image path; when `SANDBOX_PROVIDER=vercel`, the workflow builds a fresh sandbox, runs toolchain/install/build commands, captures `snap_*`, and stores it on `repoSnapshots.baseSnapshotId` for sandbox boot.
- Reason for change: eva on Vercel-only credentials could not rebuild its base snapshot because the image-only path always called Daytona APIs.

## Warm conversational query latency - 2026-07-06

- Boot a persistent Haiku conversational `query()` at daemon start, complete on assistant text (skip slow `result` tail), and strip settings/MCP from conversational SDK options.
- Reason for change: conversational turns spawned a fresh SDK subprocess each message (~14s); warm query + early finalize brings simple Q&A under 5s on a live daemon.

## Conversational latency hardening - 2026-07-06

- Force Haiku on conversational one-shots, skip transcript bookkeeping, fingerprint callback bundles on sandboxes, and upload refreshed scripts without killing a live mid-turn daemon.
- Reason for change: stale-script prewarm was pkilling the daemon after claim (losing the turn) and conversational turns still inherited the session Opus model; claude.ai parity needs a safe fast path without interrupting in-flight work.

## Session conversational fast path - 2026-07-06

- Classify simple Q&A turns and run them as fresh one-shot Agent SDK queries (no resume, no tools/MCP) instead of the warm coding-agent session with full transcript context.
- Skip git push for conversational turns; log `claimWaitMs` and `turnKind` for latency debugging.
- Reason for change: warm daemon worked but Opus still took ~11s on math questions because every message paid for coding-agent prompt scaffolding and 50+ turn resume context; claude.ai answers in ~3s on a fresh thread.

## Session turn latency improvements - 2026-07-06

- Stream live assistant tokens in the chat UI via `streamingContent` while a turn is in progress.
- Persist assistant replies before git push so the UI updates as soon as the Agent SDK daemon finishes.
- Faster daemon claim polling (50ms) and stream heartbeats when only text content changes.
- Reason for change: Agent SDK warm daemon was working but perceived latency stayed ~10s because the UI waited for workflow bookkeeping and never rendered streamed tokens.

## Snapshot build falls back to base Image when no seedable apps - 2026-07-10

- Snapshot rebuild no longer errors with "No seedable apps configured"; repos without app Stop Commands rebuild the declarative base Image only, with UI copy explaining how to enable seeded snapshots.
- Reason for change: eva prod snapshot builds failed immediately because no app repos had stop commands configured.

## Deduplicate sandbox start/resume mechanics across entity flows - 2026-07-09

- Extracted `resolveReusableVercelSandboxId`, `seedSandboxStartupActivity`/`clearSandboxStartupActivity`, and `resumeReusedSandbox` so the Vercel-id fallback, startup streaming seed/clear, and reuse ordering live in one place instead of being copy-pasted across the session, task, and project sandbox flows.
- Reason for change: the resume ordering fix (start docker after early-ready) had to be applied in four separate sites; centralising the mechanics stops the next fix landing in one path but not the others.

## Reissue Vercel stop while session remains running - 2026-07-09

- Stop confirmation now actively reissues Vercel stop against the latest session id when a sandbox keeps reporting `running`, instead of passively waiting until timeout.
- Reason for change: concurrent multi-session stops could leave one sandbox running for 180s despite an initial stop request; reissuing stop confirmed `coral-novel-pig-9y4qKG` stopped.

## Stop by session id; never mark closed on failed stop - 2026-07-09

- When `get(resume:false)` has no attached session but listSessions still shows `running`, stop via Vercel session-id API instead of waiting (old path never called stop, timed out at 60s, then Eva marked closed while Vercel stayed running).
- `stopSandbox` propagates real failures; finalize only marks closed on success and reverts to active on failure; start aborts if session is already stopping/closed.
- Reason for change: Convex logs showed stop confirmation timing out at `last status: running`, errors swallowed, UI off while Vercel still had live sandboxes / auto-restart.

## Stop waits for Vercel terminal state; no silent resume mid-stop - 2026-07-09

- Stop confirmation polls `listSessions` when `get(resume:false)` omits the session, and requires consecutive terminal/idle readings before Eva marks closed — so UI no longer flips to stopped while Vercel still shows stopping.
- Missing session is no longer mapped to idle-stopped; `start()` refuses `resume:true` while stop/snapshot is in flight (and on stop-in-flight API errors) so in-flight resume cannot auto-restart a sandbox the user just stopped; `sandboxReady` ignores stopping/closed.
- Reason for change: Eva showed stopped while Vercel was still stopping, and one of four stopped sandboxes silently became active again.

## Fix Vercel stream-closed orphan after early-ready - 2026-07-09

- Retry Vercel `exec` once after refresh when the command stream closes; stop the VM on start failure after early-ready so UI closed matches a stopped sandbox.
- Reason for change: resume could mark the session active then fail on git, leaving a live Vercel sandbox while the UI showed inactive / "Failed to start".

## Fix resume creating a second sandbox + stop/start UI copy - 2026-07-09

- Session reuse no longer silently creates a replacement on prepare errors (`fallbackOnPrepareError: false`); Vercel resume copy is "Resuming sandbox..." (cold-storage wording stays Daytona-only); stop clears startup streaming and no longer shows start steps.
- Legacy rows missing `vercelSandboxId` fall back to a non-UUID `sandboxId` so Vercel resume reuses instead of creating.
- Reason for change: resume was orphaning the old VM and the UI reused start activity / Daytona cold-storage labels on Vercel stop/resume.

## Faster sandbox resume parity (session + task + project) - 2026-07-09

- Vercel start mutations schedule the start action directly (skip ~6s workflow scheduling); credentials-only client on resume; full env map deferred until create.
- Task/project early-ready + streaming seed aligned with sessions; ActivityTasks drops random "inferring" above real tool steps / uses step label when only thinking.
- Reason for change: measured non-resume overhead and blank/inferring UI before Vercel `start()` began.

## Readable per-repo numId URLs + soft delete - 2026-07-09

- Sessions, docs, testing arena, projects, tasks, design sessions, and automations now use per-repo sequential `numId` in URLs (`/sessions/3`, `/projects/1/5`, etc.) instead of Convex `_id`; `getByNumId` resolves routes while internal refs stay on `_id`.
- Entities soft-delete via `deletedAt` (hidden from lists, direct URL → not-found); `repoEntityCounters` allocates ids atomically; `backfillNumIds` migration backfills existing rows.
- Reason for change: human-readable shareable URLs and safer deletes without orphaning related data or breaking internal Convex references.

## Faster Vercel session resume - 2026-07-09

- Vercel kickoff no longer blocks ~15–30s waiting for resume with no progress UI; restore happens in `ensureSandboxRunning` with a restoring label.
- Session reuse marks the sandbox active as soon as the VM is up (before docker/git/services), and docker bootstrap prefers the Vercel path first to avoid a failed Daytona-style restart.
- `ensureSandboxRunning` refreshes state first and skips the exec probe when already stopped — a stopped Vercel sandbox was burning ~20s on a timed-out `echo` before `start()`.
- Reason for change: measured resume spent ~17s in silent kickoff, then ~20s on a useless stopped-sandbox probe, plus docker before chat unlocked.

## Cursor-style chat scroll pin - 2026-07-09

- Latest user turn now fills the chat viewport height so stick-to-bottom places that message near the top while the assistant streams below; older messages stay reachable by scrolling up.
- Reason for change: match Cursor/ChatGPT send behavior so new prompts aren't buried at the bottom of a long thread.

## AI Elements Queue for sandbox chat pending messages - 2026-07-09

- Upgraded `@conductor/ui` Queue to the current AI Elements API (bordered container, scrollable list, hover-reveal actions, attachment primitives) and aligned `QueuedMessagesPanel` so sessions, quick tasks, projects, and designs share the same pending-message UI.
- Reason for change: replace the older custom-styled queue with the documented Elements Queue look across all sandbox chat composers.

## Session chat UI (without Agent SDK) - 2026-07-09

- Optimistic send via Convex `.withOptimisticUpdate`, live streamed tokens on the active bubble, per-turn "Worked for Ns" collapsible with activity overflow cap, turn-duration footer, and empty activity-log accordion hidden on text-only replies.
- Reason for change: ship the session chat UX improvements from the Agent SDK branch without coupling to `claude -p` → SDK migration.

## Vercel sandbox id lifecycle fixes - 2026-07-09

- Persist and clear `vercelSandboxId` with `sandboxId` on audit-fix, docs, sessions, projects, tasks, and PR-merge cleanup so Vercel reuse never thaws a stale or missing name.
- Shared `preferPersistedSandboxId` for provider-blind callers; thaw gates and design stop/launch use either id; stronger pnpm detect for `workspace:` monorepos.
- Reason for change: stacked fixes on the Vercel cutover PR so close→start and audit/doc reuse work after provider flip.

## Vercel everywhere cutover - 2026-07-09

- All sandbox create/resume paths (sessions, tasks, projects, designs, automations, agent runs) now use Vercel when `SANDBOX_PROVIDER=vercel`, with `vercelSandboxId` as the only reuse key so Daytona UUIDs never hit Vercel `get`.
- Chat/interview/audit thaw callers pass `vercelSandboxId`; automations persist it on runs; package-manager detect falls back to the monorepo root lockfile so pnpm workspaces install correctly after snapshot restore.
- Reason for change: finish the Daytona→Vercel migration for every entity type, not just interactive sessions.

## Vercel session parity: Computer, Editor, auth, fast start - 2026-07-08

- noVNC on Vercel now loads RFB from jsDelivr and strips `crossorigin` so ES modules instantiate behind `*.vercel.run`; static assets bypass auth while HTML/WebSocket stay gated (auth-v10).
- Editor and desktop run on internal ports (18080/16080) with auth proxies on 8080/6080 so open-in-new-tab matches Preview’s sign-in gate.
- Session goes active right after `Sandbox.create` (before jq/git/docker); Vercel env is written post-create so the first-command boot penalty does not block “Sandbox started”.
- Reason for change: Vercel migration needed Computer/Editor tabs, auth on all preview surfaces, and ~1–2s new-session ready time instead of waiting on full post-create setup.

## Vercel desktop VNC zombie fix - 2026-07-08

- Stopped using `setsid … &` inside Vercel desktop start — that left Xvnc/websockify as zombies so noVNC HTML loaded but the RFB WebSocket hung on "Loading".
- Desktop iframe no longer paints a stale cached URL before start+ready; skips preview-grant query params on direct 6080/8080 Vercel ports.
- Reason for change: Computer tab showed permanent Loading while direct VNC worked after a clean non-setsid restart.

## Vercel desktop VNC + preview auth parity - 2026-07-08

- Desktop now follows vercel-sandbox-gui: TigerVNC + noVNC + Chrome on Xvnc without a window manager (Amazon Linux has no openbox/fluxbox packages).
- Preview auth accepts `*.vercel.run` return hosts; proxy rewrites absolute vercel.run Location headers and fails loudly if the 54321 auth proxy cannot start.
- Seeded snapshot rebuilds keep `keepLastSnapshots: 1` and bake agent CLIs + PATH into the snap; session start skips redundant config copies when restoring from snap\_\*.
- Reason for change: Vercel desktop was a black screen (missing WM package) and open-in-new-tab auth rejected Vercel preview hosts.

## Stabilize Vercel desktop and seeded snapshots - 2026-07-08

- Switched Vercel desktop startup to TigerVNC `Xvnc` with noVNC/websockify so the desktop tab can run like a real cloud VM desktop instead of a fragile Xvfb bridge.
- Increased the default Vercel sandbox allocation to 8 vCPU, giving desktop sessions the documented 16 GB memory envelope while keeping `SANDBOX_VERCEL_VCPUS` as the override.
- Hardened Vercel preview and desktop process cleanup to use exact process names or port-based cleanup, preventing shell self-matches that caused exit 143 log spam.
- Fixed Cursor provider fallback and seeded snapshot installation so `cursor-agent` resolves consistently in both old live Vercel sandboxes and new snapshots.
- Updated the desktop iframe service to reconcile/start the VNC service even when a stale cached URL exists, avoiding cached-but-dead noVNC sessions.

## Vercel sandbox terminal and desktop parity - 2026-07-08

- Hydrate Vercel terminal panes from shared tmux capture on connect so new viewers see the shared terminal state instead of only their browser-local history.
- Switched Vercel desktop startup from unavailable `x11vnc` to Amazon Linux-compatible TigerVNC/noVNC tooling, and fixed display readiness on non-root sandboxes.
- Reason for change: Vercel sandboxes use a different base distro and controller PTY model than Daytona, so terminal replay and desktop startup needed provider-specific handling.

## Vercel sandbox resume trigger - 2026-07-08

- Trigger Vercel persistent sandbox resume with a tiny command during provider `start()`, instead of only refreshing metadata.
- Let restore polling kick stopped sandboxes once so in-flight session starts can recover after the provider fix deploys.
- Reason for change: UI verification showed session start spinning indefinitely because Vercel `Sandbox.get()` returns the saved sandbox record but does not by itself resume compute.

## Vercel sandbox chat launch fixes - 2026-07-07

- Fixed agent cleanup `pkill` patterns so the sandbox exec shell is not SIGTERM'd (bracket-regex trick), which was aborting `launchOnExistingSandbox` before runner files were written.
- Launch the callback runner through the provider-native detached path and save launch failures through the normal session result path, preventing Vercel command termination from leaving an empty active chat bubble.
- Install `@anthropic-ai/claude-code` on demand for Vercel sandboxes (Daytona snapshots already bundle it) and pass `CLAUDE_BIN_PATH` into the callback runner.
- Auto-accept Claude workspace trust and only `--resume` when a transcript exists, avoiding stale session state after failed launches.
- Reason for change: chat on Vercel never produced a reply because launch died at cleanup and Claude CLI/session prerequisites were missing.

## Vercel sandbox session stabilization - 2026-07-07

- Shared Vercel terminal panes through per-pane `tmux` sessions instead of per-browser shells, so terminal state follows the sandbox pane rather than the viewer.
- Hardened chat runner cleanup so stale pid reuse cannot kill the launch shell before prompt/script upload, and throttled preview self-healing when the dev server is already launching or just failed.
- Centralized chat model availability on the backend provider-availability query so chat model menus use one repo/team env view.
- Reason for change: Vercel's interactive PTY and command execution semantics differ from Daytona's, so session chat, preview recovery, and terminal sharing need provider-aware behavior while keeping Daytona paths intact.

## Vercel sandbox chat + preview reliability - 2026-07-07

- Launch the AI runner with a synchronous exec (not detached) so the launcher script finishes before readiness polling; source `.eva-env.sh` and export env vars explicitly.
- Guard dev-server launches with a pid lock, free the target port before start, bind `HOSTNAME=0.0.0.0`, and restore `cd /tmp/repo` in the launcher script (regression dropped it).
- Send Vercel PTY stdin as binary `Uint8Array` frames so keystrokes reach the shell.
- Reason for change: Vercel `execDetached` returns before short launcher scripts complete, and repeated preview self-heal stacked multiple `next dev` processes on wrong ports.

## Seeded snapshot database restore artifact - 2026-07-05

- Captured a compressed Supabase Postgres dump into the seeded snapshot filesystem after seed commands complete, then restored it once when fresh sandboxes boot from that snapshot.
- Restored the dump before preview dev servers and workflow background commands start, while leaving non-Supabase and non-seeded snapshots as no-ops.
- Reason for change: Daytona snapshot creation did not preserve the Supabase Docker volume for fresh sandboxes, so a warmed seeded snapshot could still start with an empty local DB unless the database state was exported as ordinary filesystem data.

## Preserve seeded snapshot runtime state - 2026-07-05

- Preserved untracked runtime state when booting from a seeded snapshot marker so post-create repo cleanup does not remove stopped local database restore files while still skipping seed commands.
- Started session background services before running startup/seed commands, and made background command launches return immediately after detaching the daemon script.
- Reason for change: fresh sandboxes could boot from the correct seeded snapshot but start an empty Supabase DB if `git clean -fd` removed the snapshot's untracked local-service state before background services restarted; repair/retry paths also need Supabase and Convex local daemons running before seed/import commands wait on them.

## Seeded snapshot config restore and warm-up fix - 2026-07-05

- Force-restored baked sandbox config files when creating fresh session/task/project sandboxes from seeded snapshots so the app keeps the DB connection and seed files captured during the snapshot build.
- Reintroduced per-app seeded snapshot cache warming during snapshot builds so the first slow Daytona create-from-snapshot happens before a user creates a sandbox, with build-level warmup status staying pending until every app has settled.
- Reason for change: seeded snapshots carry the startup-complete marker by design, but that marker was also preventing config restore after checkout, and fresh seeded snapshots still need an explicit warm-up pass before normal sandbox creation is fast.

## Snapshot seed bootstrap and leak guard - 2026-07-05

- Added an explicit base-Image seeding mode for snapshot builds so stale per-app seeded snapshots can be refreshed without triggering cron retry cascades.
- Label new seed-prep sandboxes and sweep unreferenced labelled prep sandboxes at build start to prevent future runner-pool leaks.
- Reason for change: eprocurement needed a safe bootstrap path out of a stale seeded snapshot while preserving keep-last-good behavior for normal builds.

## Seeded-snapshot capture polling fix - 2026-05-31

- Fixed seeded-snapshot filesystem capture timeouts by switching from a blocking SDK call to non-blocking trigger-and-poll, preventing silent fallback to the base image when DB volumes exceed the 600s Convex action ceiling.

## Seeded running-sandbox snapshots for fast cold starts - 2026-05-31

- Bake the seeded local database into per-app Daytona filesystem snapshots so new sandboxes skip the ~10-minute Supabase and Convex seed on every start.
- Added per-app Stop Commands to app settings, and clarified Startup commands (seed, run once) versus Background commands (services, run every start).
- Sandbox prep now runs background services before startup commands so seeding has its dependencies available; sandboxes prefer the app's seeded snapshot when one exists.

## Seeded-snapshot reliability and observability - 2026-05-31

- Gate per-app seeding on a base-image propagation probe so seeding only starts once the freshly built snapshot is actually bootable, fixing "No available runners" failures and silent fallbacks to the base image.
- Surface per-app seeding outcomes in snapshot settings: the status tab shows each app's current state (seeded with snapshot name, or using the base image), and build history shows per-build results as a seeded/total count with per-app detail on expand.
- Removed the snapshot-cache warmup pass (now redundant with the propagation probe, which also warms the runner cache) and cleared its orphaned fields from existing build records.

## Sandbox chats surface in the sessions sidebar - 2026-07-02

- Project sandbox chats and quick-task sandbox chats now appear in the sessions sidebar as virtual entries whenever they have at least one message, interleaved with real sessions by last activity, so ongoing conversations are reachable from one place instead of buried in project/task pages.
- Entries are derived on read by the new `sessions.listChatEntries` query (no new tables or duplicated state) and deep-link to the existing project/task sandbox page, staying highlighted on any tab there; right-click offers Copy title/Copy link only since they are not real sessions.
- Extracted the per-session row (`SidebarSessionRow`) out of `SessionListSidebar` to keep it within the component-size guideline.

## Cursor-style grouped activity tasks - 2026-07-02

- Agent run activity now renders as Cursor/Claude-style task lines inline in chat ("Read 5 files", "Ran 3 commands"), each with its own accordion revealing the files or commands, replacing the single accordion that hid all steps behind one toggle.
- Thinking and question steps show as plain narration lines; the active task auto-expands with a spinner while streaming and collapses on completion, with a compact live-timer header above.
- Added reusable `Task`/`TaskTrigger`/`TaskContent`/`TaskItem`/`TaskItemFile` primitives (ai-sdk Task pattern) and retired `ActivitySteps` in favour of the drop-in `ActivityTasks` across all chat, task, doc, automation, and design surfaces.
- Grouping is a pure frontend transform over the existing step JSON, so all historical runs render in the new style with no callback or schema changes.
- The callback now captures the agent's actual reasoning and streamed response text into `reasoning`/`response` steps, so the activity flow shows the real words (reasoning as muted text, responses as markdown) instead of generic "Thought"/"Streamed response" labels; the trailing response is de-duplicated against the final chat message.

## Marquee-on-hover for truncated labels - 2026-06-30

- Truncated single-line labels (task card titles, sidebar session/arena items, search results, project and automation titles, leaderboard names) now scroll their hidden tail into view on hover and ease back on leave, so the full text is readable without a tooltip.
- Added a reusable `MarqueeOnHover` component that shows a plain ellipsis at rest, only animates when the text actually overflows, drives hover entirely in CSS (no re-renders), exposes the full text via a native tooltip for touch, and respects reduced-motion.

## Read-only automation deliverable extraction - 2026-06-24

- Read-only automations now require a `<!-- DELIVERABLE -->` marker in the agent prompt; only text after the marker is stored in `resultSummary` and emailed, so reasoning and preamble no longer leak into user-facing output.
- Applies to every read-only automation (not write-mode or actionable-with-findings), with a fallback to the full result when the marker is absent for legacy runs.

## Interface feel polish (hit targets, motion, typography) - 2026-06-24

- Added shared `hit-target`, `media-outline`, and `CrossfadeIcon` utilities so small controls meet 40px tap targets, images get neutral edge rings, and icon toggles cross-fade instead of swapping instantly.
- Tightened motion and typography across quick tasks, sidebars, env vars, and empty states: no `transition-all`, `AnimatePresence initial={false}` everywhere, tabular task numbers, and `text-balance`/`text-pretty` on headings and descriptions.
- Second pass: landing mock concentric radius, chat copy crossfade, theme menu icon animation, env-var hit targets, appearance picker press feedback.

## UI task authoring and agent targeting - 2026-06-24

- Task descriptions can include Route, Control, and Acceptance via an "Add UI details" scaffold so authors point agents at the right page and control instead of title-only UI tasks.
- Implementation prompts for UI-looking tasks now require locating the exact control (grep visible labels, disambiguate filters vs modals) and forbid false "no routes changed" summaries when frontend files were edited.

## PR recap version history, agent comments, and MCP tools - 2026-06-24

- PR recaps now snapshot prior ready content on each regeneration so reviewers can browse version history with head SHA context, matching how other Eva docs evolve.
- Comments on recaps can target Eva ("Ask Eva"); queued feedback drives a manual "Revise recap" workflow that regenerates with reviewer notes and auto-resolves consumed agent comments.
- MCP exposes trigger/get/publish PR recap tools plus a kind filter on list_eva_docs so agents can orchestrate recaps without the web UI.

## PR recap sandbox prep and workflow finalize fix - 2026-06-25

- PR recap and automation sandboxes skip repo startup and background commands (ephemeral agent runs only need checkout + Claude) so runs no longer spend minutes on supabase/convex setup before the agent starts.
- Fixed recap workflows crashing after the agent finished because finalize built the GitHub comment URL with `process.env` inside the workflow isolate.

## Doc content outline tracks cursor and tab order - 2026-06-25

- The "On this page" outline now follows the editor cursor and scroll position, and highlights the active section, by scanning live TipTap content instead of stale `doc.content`.
- PRD doc tabs show Content second (after Description) so the primary editor is one click from the summary.

## Sandbox start/stop events in project and task sandbox chat - 2026-06-25

- Project preview and quick-task sandbox chats now show the same "Sandbox started/stopped" system dividers as session chat, so sandbox lifecycle is visible in the conversation instead of only in status badges or the task activity timeline.
- System alert dividers in chat now include relative timestamps everywhere `ChatBody` renders them.

## PR recaps as Eva docs - 2026-06-24

- PR visual recaps now live as first-party Eva docs (`kind: pr-recap`) under the existing docs route, generated on PR open/sync via the Eva GitHub webhook instead of Agent-Native or per-repo GitHub Actions.
- Recaps use the same Claude Code OAuth subscription and configurable model as the rest of the platform — no Anthropic API key — with a sticky GitHub comment linking to the Eva doc.

## Eva product video agent skill - 2026-06-24

- Added an agent skill documenting how to capture real app footage and render Remotion demo videos with the repo's established defaults (720p, beat-sync cuts, agent-browser workflow), so future video work doesn't rediscover the same pitfalls.

## Archived sandbox restore survives past the 10-minute action limit - 2026-06-24

- Resuming a sandbox that had been archived to cold storage now restores reliably everywhere a sandbox is resumed — session/project/quick-task chat, task and project runs, and the "Start sandbox" buttons — by polling the multi-minute thaw across durable workflow steps instead of one blocking action, so it no longer fails when the restore runs past Convex's 10-minute action limit.
- Fast paths are unchanged — an already-running sandbox adds no delay and a merely-stopped one still fast-resumes — and a restore that genuinely stalls fails fast with a clear, retryable message instead of a silent timeout.
- Audit fixes now run as a durable workflow too, so the task's archived sandbox is thawed and reused across polling steps (falling back to a fresh sandbox only if the restore can't complete) instead of stalling at the action limit.
- Design-session start now resumes its existing sandbox the same way, instead of rebuilding a fresh one whenever the previous sandbox was stopped or archived.

## Live typing indicators in chat - 2026-06-19

- Chat composers now show when another teammate viewing the same conversation is typing ("Alice is typing"), so collaborators can see live activity before a message lands — covering session chat, the quick-task and project sandbox chats, the project discussion chat, and task comments + replies.
- Built on the existing presence component (the same mechanism as live cursors), so typing state is ephemeral and auto-clears when a teammate stops typing or goes offline — no new tables or cleanup jobs.
- The indicator shows teammate avatars, names, and an animated pulse, and never reflects your own typing or Eva's responses (the agent's progress is already shown via streaming).

## Eva document & artifact MCP tools - 2026-06-17

- External MCP clients (e.g. Claude with the Eva connector) can now create, read, list, and update Eva design documents (PRDs), so docs can be authored and edited without opening the web app.
- New `create_artifact` tool saves a self-contained HTML artifact built in Claude into Eva and returns a hosted view link, letting artifacts be persisted and shared straight from the conversation.
- `get_artifact` / `list_artifacts` retrieve saved artifacts with their view links, and `list_teams` surfaces the teams an artifact can be bound to.
- All new tools act as the calling user and reuse Eva's existing repo/team access checks; the write tools stay out of the read-only hosted-artifact allowlist so sandboxed artifacts can't invoke them.

## Projects timeline redesigned as Linear-style roadmap - 2026-06-17

- Project bars now show task-completion progress as a filled portion (e.g. 72% done) with a per-status tooltip breakdown, replacing the flat single-color bars.
- Timeline toolbar adds granularity control (Quarter / Month / Week zoom levels), zoom in/out buttons (50–200%), and a "Today" jump button for quick navigation.
- Sidebar rows display the project's phase icon, a circular completion ring, and lead avatar(s), making ownership and progress visible at a glance.
- Unscheduled projects (missing start/end dates) appear in a collapsible "No target date" section with a range picker to schedule them onto the timeline.
- Current month/quarter/day is now highlighted in the axis header; the "Today" line is refined with a solid accent color and centered pill label.
- Underlying Gantt engine now supports a `scrollToToday()` context method and got a proper card-surface treatment (border, shadow, rounded corners) instead of a tonal background.
- Backend adds a batched `listTaskProgress({ repoId })` query so the timeline fetches all project progress in one call instead of one request per row.
- The timeline is now a pannable canvas: drag the empty canvas to scroll the roadmap in any direction with no visible scrollbar, while the project column stays pinned — matching Linear's drag-to-pan interaction. Bars still open on click and drag-to-reschedule.
- The default zoom is a Linear-style weekly grid — week-start (Sunday) ticks under month labels, centered on today, with day-accurate bars — instead of coarse month columns.
- Zoom the timeline with Ctrl/Cmd + scroll (or trackpad pinch), matching Linear's gesture; the Quarter/Month/Week control and zoom buttons still work.
- Projects whose bars sit off the visible canvas show a clickable "← date" pointer at the edge that scrolls back to them.

## Host Cowork artifacts in eva - 2026-06-17

- Upload Claude "Cowork" artifacts (self-contained HTML dashboards) into eva and open them in-app, so live dashboards can be deployed and shared internally instead of living only in the Cowork host.
- Each artifact runs in a sandboxed, isolated iframe; an injected bridge resolves its `window.cowork.callMcpTool` calls against eva's read-only MCP tools using the viewer's signed-in session — no OAuth, and the artifact runs unmodified.
- Tool calls are restricted to read-only data tools across Postgres, the repo's Convex deployment, and Supabase (each read-only enforced) and re-check repo access per call, so an artifact can only read data the viewer already has access to. Write tools (e.g. task creation) are blocked.
- Artifacts are reachable from a global Artifacts section and a per-team Artifacts tab; they bind to a team for visibility and can be opened or deleted by any member of that team.

## Testing Arena: public release - 2026-06-17

- Testing Arena is now visible to all users — removed the dev-only gate on its sidebar nav item.
- `startEvaluation` and the new `startFix` now verify repo access (and that the doc belongs to the target repo), closing a gap where any signed-in user could run evals on any repo.
- The eval workflow was split so failures no longer auto-fix; "Fix issues" / "Retry fix" buttons start the fix on demand and surface the resulting PR.
- UI Testing tab now shows an explicit "coming soon" state instead of a non-functional preview, with a "Soon" badge on the tab.
- "Test all documents" skips docs without requirements, survives an individual failure, and the modal copy/button text were cleaned up.

## Testing Arena: opt-in eval fixes and safer test runs - 2026-06-16

- Eval fixes are now opt-in per report — "Fix issues" runs only when you click it, instead of auto-starting after every failed test.
- Fix retries get a fresh branch name; evaluations store the branch they ran against so fixes target the same base.
- Starting an evaluation is idempotent per doc (no duplicate runs from "test all") and blocked when the doc has no requirements.

## Editable project status on project detail page - 2026-06-16

- Project status (phase) is now editable via a dropdown in the metadata bar — select from In Progress, Business Review, Code Review, Merged, or Cancelled for quick status changes without leaving the detail view.
- Draft and Finalized projects keep a read-only badge, as their status is driven by the planning/interview flow, matching the page's existing gating pattern.

## Collapsible sidebar nav sections - 2026-06-16

- Repo and settings sidebar groups (BUILD, FIX, GENERAL, etc.) use a chevron header instead of section icons and divider lines — click to collapse/expand each group.
- Section open/closed state is held in component state; when the main sidebar is icon-collapsed, headers hide and all items stay visible.

## Drafts: save unsent input across all surfaces - 2026-06-16

- New Drafts page (`/$owner/$repo/drafts`) displays all unsent comment, chat, and quick-task input as cards; clicking a card returns to where the draft was started (task/session/design detail page or quick-tasks with modal).
- Task comment composers (top-level and replies) and chat prompts (session and design) now auto-save drafts as you type, persisting to Convex so drafts survive reload and sync across tabs in real time.
- Mentions (docs, users, skills) are stored tokenized so they survive reload and re-submit as real mentions; the editor's mention/skill maps are seeded from persisted tokens on restore, fixing prior mention degradation.
- Draft saves are throttled via single-flight (at most one request in flight; rapid keystrokes coalesce to the latest value), avoiding mutation spam on fast typing.
- Sidebar nav gained a "Drafts" item next to Inbox with a count badge showing total unsent drafts across all surfaces.
- Quick-task modal can deep-link via `?draft=<id>` on the `/quick-tasks` route and opens pre-loaded with the saved draft, including seeded mention maps for the description editor.

## Chrome extension: toolbar-first, side panel removed - 2026-06-10

- Removed the extension side panel entirely; clicking the icon now toggles an in-page toolbar per tab, with a green dot badge on the icon showing where the toolbar is active.
- The toolbar gained Annotate and Inspect mode buttons alongside the existing Run All / Add to Project actions, so annotating and element capture no longer need a separate panel.
- Inspect mode copies element info (page URL, selector, React component chain, props/hooks, HTML) to the clipboard as formatted markdown, ready to paste into a task or PR.
- "Add all to a Project" now opens an in-page modal (list, create, or assign) instead of the panel picker.
- All backend work (Clerk auth + Convex) moved from the panel into the background service worker over a typed request/response protocol; the content script polls task status while the toolbar is visible.
- Chat and sessions were dropped from the extension (they remain in the Eva web app), and the repo for new tasks is resolved automatically by matching the page domain.

## Shared layout background for sidebar navigation - 2026-06-10

- Sidebar tabs now use a Motion `layoutId` shared background that springs between items on hover and active state, replacing static `bg-sidebar-accent` fills — gives nav a cohesive, physical feel when moving between routes.
- Applied across global nav, repo main nav, settings groups, and all context sidebars (sessions, designs, docs, automations, testing arena).

## Postgres read replica MCP support - 2026-06-10

- New `postgres_query` MCP tool lets agents run read-only SQL against a repo's Postgres read replica, configured per repo via a `POSTGRES_READ_REPLICA_URL` environment variable — no new UI.
- Read-only is enforced server-side (READ ONLY transaction, single-statement-only extended query protocol, fixed 30s statement timeout) so the tool cannot write even against a primary.
- The connection string stays inside an internal Node action and never reaches the tool layer or output; query errors come back as clean Postgres error text instead of opaque failures.
- Results are capped by a row limit and a ~1 MB byte cap with an explicit `truncated` flag, keeping large `SELECT`s within Convex return limits.
- Schema discovery works through `information_schema`, so one tool covers both introspection and querying.
- `list_repos` now flags each repo with `hasPostgresReplica`, so agents can pick a query target directly instead of probing every repo for a connection string.

## Real-time collaborative document editing - 2026-06-10

- Documents are now always-live and multiplayer: edits from every collaborator sync in real time, replacing the click-Edit-then-Save flow where the last save clobbered everyone else's work.
- A mode switcher offers Editing, Suggesting, and read-only Viewing, and a presence facepile in the header shows who else currently has the document open.
- The description now lives in its own tab.
- Document content is mirrored to markdown — now parsed with full structure (headings, lists, code) rather than flattened — so requirement/user-flow extraction, copy, and AI workflows keep working.

## Anchored, resolvable document comments - 2026-06-10

- Select text to comment and the passage is highlighted in the document; clicking a highlight focuses its thread and clicking a thread scrolls to the text.
- Threads live in a side panel filtered by Open/Resolved; resolving clears the highlight for everyone in real time, and deleting the anchored text marks the thread as orphaned.
- Comments show the author's avatar and name with a live open-thread count, and @mentions, replies, and new comments notify the right people and auto-subscribe commenters, deep-linking back to the document.

## Suggestion mode for documents - 2026-06-10

- Edits made while in Suggesting mode are recorded as coloured insertions and struck-through deletions attributed to their author, instead of changing the document directly.
- Anyone with access can accept or reject suggestions individually or all at once; the markdown mirror reflects the accepted result.

## Document version history - 2026-06-10

- Automatic version snapshots are captured as edits settle, attributed to the contributors involved.
- Diff any saved version against the current document and restore it; restoring snapshots the current state first so it stays reversible.

## Manual PRD re-extraction - 2026-06-10

- Requirements and user flows no longer re-extract on every save; a "Re-extract" button with a stale indicator puts that under your control.

## OOM-protect the sandbox callback and capture watchdog kill diagnostics - 2026-06-09

- **Why**: Prod data showed `Run killed by watchdog: no heartbeat` failures are the callback process dying inside a still-running sandbox — heartbeats stop permanently (kills always land at the full stale threshold across every threshold raise), and activity-log snapshots show death mid-short-bounded-command (`timeout 120s npx tsc --noEmit` in half the sampled kills). Best-fit cause: the kernel OOM killer SIGKILLing the callback during memory-heavy tool steps.
- **OOM bias**: The callback lowers its own `oom_score_adj` to -600 at startup (best-effort, needs privilege) and raises the spawned CLI subtree to +300 (always permitted), so an out-of-memory sandbox kills the work — which the callback then reports as a normal failure — instead of the heartbeat/reporting process.
- **Kill diagnostics**: The watchdog kill path (`cleanUpStaleRun`) now routes quick-task sandbox cleanup through `captureDiagnosticsAndStopSandbox`, which first execs dmesg OOM lines, the `/tmp/run-design.done` file, and the callback log tail, persisting them to `agentRuns.logs` (new `appendRunLog` mutation) and the Convex logs — previously deletion destroyed this evidence, leaving every kill a generic mystery.
- **Stop, don't delete**: Watchdog-killed quick-task sandboxes are now stopped instead of deleted, and `task.sandboxId` is kept (marked `closed`) — quick-task sandboxes are persistent, so a kill no longer destroys uncommitted work or unpushed commits, and the next run resumes the same filesystem.
- **Reason**: Future watchdog kills become a 10-second diagnosis (OOM vs network vs crash) instead of an investigation, the dominant suspected cause stops killing runs outright, and a kill no longer throws away the agent's in-flight work.

## Quick tasks list view master/detail split - 2026-06-09

- The quick-tasks **List** view now shows the task list on the left and the selected task's detail on the right, mirroring the projects task-list layout, so you can step through tasks without losing the list.
- A `quick-tasks` layout route keeps the list mounted while the open task changes, so selecting a task never remounts or scroll-resets the list.
- Existing `/quick-tasks/$taskId` URLs are unchanged; the split is chosen from the persisted view preference, and Kanban/Table keep their full-page detail.
- Extracted prev/next neighbour navigation into a shared hook so the split and the full-page detail stay in sync.

## Doc/skill hover previews in session chat composer - 2026-06-06

- Session and design chat composers now show doc and skill preview cards on @ and / chip hover, matching task description mention behavior.

## Activity steps back to chain-of-thought timeline - 2026-06-06

- Reverted the task-variant split (`ActivityStepsTaskView`, AI Elements `Task` composition) and restored the single chain-of-thought timeline with scroll-to-latest on open.
- Landing mock uses `ActivitySteps` again so the sign-in preview matches production run progress UI.

## Dev testing page for dialog previews - 2026-05-28

- Root sidebar **Testing** tab (dev only) opens welcome-setup and changelog modals without URL hacks; preview hooks subscribe to router search params so dialogs open on click without refresh.

## Changelog requires explicit acknowledgment - 2026-05-28

- Dialog cannot be dismissed with X, outside click, or Escape; primary action reads "Yes, I've read this" so users confirm they saw the update.

## Welcome setup dialog for new users - 2026-05-28

- Five-step modal walks new users through role, theme, typography, and changelog email opt-in before they use the app; fixed height prevents layout shift between steps.
- Backend tracks `onboardingCompletedAt` and defers the changelog popup until setup finishes and a role is set.

## Full-radius theme no longer warps wide surfaces - 2026-05-28

- Introduced capped `rounded-surface`, `rounded-control`, and `rounded-menu-item` tokens so **Full** corner radius keeps pills on compact nav rows but stops modals, cards, dropdown panels, and textareas from becoming ovals.
- Repo and root sidebar active items use accent foreground on icons and labels for clearer selection state.

## Default theme cyan accent and xl radius - 2026-06-06

- New users and unset preferences now open on cyan accents with extra-large corner radius so the default Eva look matches the intended brand polish.

## Sign-in landing v2 with product preview - 2026-06-06

- New sign-in landing shows a static task-detail mock built from real Eva UI so visitors understand the product before creating an account; `VITE_NEW_LANDING=false` keeps the simpler hero + capability-cards layout for gradual rollout.
- Public route avoids Convex tooltips and auth-only providers; activity steps in the mock use the shared `ActivitySteps` component.

## Activity logs adopt AI Elements task composition - 2026-06-05

- Replaced the activity-step accordion/timeline presentation with the AI Elements `Task` composition so run progress uses the same collapsible task-list language as the rest of the AI UI kit.
- Split activity rendering into composable `task` and `timeline` variants behind the stable `ActivitySteps` API, making it easy to switch between the AI Elements design and the legacy timeline.
- File-oriented steps now render inline `TaskItemFile` chips in the task view, while commands, searches, and other tool details remain compact text rows.
- Tightened the callback progress contract so durable activity logs record tool/work events only; startup, thinking, response streaming, and finalization status stay out of the task list.

## Stats and home dashboard panels adopt a layered Widget look - 2026-06-05

- Stats page chart panels (PRs over time, activity over time, session funnel, top contributors, activity heatmap) and the repo home page now use a shared `Widget` container: a muted outer shell with a title/actions header above an elevated content area, modelled on the HeroUI Widget.
- Consolidates four duplicated card-with-`<h3>`-title patterns into one component and gives the dashboards a consistent layered surface treatment.
- The home page's "Eva's Stats" header (title, repo, time-range picker) and its stat cards are now a single Widget, with the cards sitting directly on the shell.

## Emoji reactions on task descriptions - 2026-06-05

- Task descriptions can now be reacted to with emoji, the same way as comments and replies — hover the description to add one, and toggle reaction chips beneath it.
- Reactions are now backed by a single generalised `taskReactions` table (polymorphic over comments and descriptions) instead of a comment-only table, so new reactable surfaces can be added without new tables. Existing comment reactions were migrated across.

## Quick-task bulk selection toolbar redesigned with responsive labels - 2026-06-05

- The floating action bar that appears when selecting quick tasks now follows the HeroUI Action Bar pattern: a compact pill with count prefix, primary actions (Status, Assign, Run) with responsive labels, a "More" dropdown for secondary actions, a red Delete button, and a dismiss ×.
- Action labels show inline on larger screens (`sm+`) and collapse to icon-only with tooltips on mobile, keeping the bar scannable and compact on all viewport sizes.
- Secondary actions (Assign to Me, Add Labels, Group into Project, Schedule Run) are tucked into a dropdown menu to avoid toolbar overflow while keeping them discoverable.

## Emoji reactions on comments and replies - 2026-06-05

- Comments and their replies now support emoji reactions: hover a comment to add one from a quick-react row or the full searchable emoji picker, and click a reaction chip to toggle it on or off. Reactions you added are highlighted with a primary-bordered chip, and counts update instantly.
- A single `listByTask` query loads all reactions for the thread and distributes them via context, so nested replies (and replies-on-replies) don't require prop-drilling; the toggle mutation applies optimistic updates keyed off the same query.

## Floating table of contents and styled scrollbars on docs - 2026-06-05

- Document pages now show a floating table of contents alongside the content (on large screens), letting readers jump between headings and track their position while scrolling.
- Applied the thin, themed scrollbar styling to every scroll area on the document page — content view, requirements/user-flows tabs, and the markdown edit input — for a consistent look matching the rest of the app.

## Activity timeline now shows PR merge/close events - 2026-06-05

- PR merge and close events now appear on the task activity timeline, making it visible when a PR is merged or closed without checking notifications.
- Replaced invisible system comments with a dedicated "pr" activity event that renders as "GitHub merged the PR — task moved to Done" or "GitHub closed the PR — task moved to Cancelled".
- System-driven webhook events now log with no actor, allowing the timeline to distinguish human actions from platform automation.

## Background commands now robust to self-backgrounding, improved documentation - 2026-06-04

- Fixed a race condition where background commands (e.g. `npx convex dev`) would die immediately if the user's command included a trailing `&` or `nohup` wrapper; the platform now uses `setsid` to fully detach daemons into their own session, surviving session teardown regardless of how the command is written.
- Clarified App-settings documentation to explain that background commands should be written as plain foreground commands — the platform automatically adds `nohup`, detachment (`&`), and log redirection (`>/tmp/bg-<N>.log`), so users should omit those.
- Background commands now work correctly both on first sandbox start and on resume of a paused sandbox.

## Notification cards show task/project context - 2026-06-04

- Every notification card (in the bell popover and `/inbox`) now displays the associated task or project title directly under the notification type, so "Kezia mentioned you" also shows which quick task or project issue it's about.
- Quick-task notifications show just the task title; project-task notifications show "Project title: issue title" for context at a glance.
- Context is snapshotted at notification creation time, keeping the reactive bell query fast (no per-render lookups); task renames after the notification don't affect old cards.

## Improve daily digest: filter to 24 hours, "View all" button, clarify scope - 2026-06-04

- Daily unread-notification digest now shows only notifications from the past 24 hours (not the entire unread backlog), keeping older items in the in-app inbox.
- Email CTA changed from generic "Open the app" to **"View all notifications"** linking directly to `/inbox` for immediate access to the full unread list.
- Added muted "From the past 24 hours" subtext under the digest heading to clarify the 24-hour scope.
- Task activity run timeline now shows triggering comments before the agent's result summary and keeps all accordions collapsed by default (expand manually to view).

## Fix run attribution and comment merging in task activity - 2026-06-04

- Fixed "Resolve Conflicts" runs showing the wrong initiator by replacing a broken timestamp-based heuristic with explicit `triggeredBy` tracking on every run.
- Prevented recent comments from being incorrectly merged into unrelated runs (especially Resolve Conflicts) by storing `triggeringCommentId` only on "Make changes" runs that actually have a triggering comment.
- Run initiators now display correctly: "Make changes" runs show the comment author, button-initiated runs (task start, Resolve Conflicts) show whoever clicked, legacy runs show blank (predating the field).

## Daily sandbox auto-stop scheduler - 2026-06-04

- Added app-wide setting for a daily time at which all running sandboxes automatically stop, preventing overnight cost/resource leakage; set via `/settings/sandboxes` with a native time input in the user's local timezone.
- Implemented a 15-minute cron that checks whether the configured stop time has been reached and, if so, sweeps every active sandbox (task, project, session, design) through each module's existing stop pipeline (Daytona stop → mark closed → event log), idempotent per day via last-run date tracking.
- Stop time is interpreted in the browser's IANA timezone (captured on save) so the entered time remains correct across DST transitions, and changing the schedule clears the daily guard so the new time can fire the same day.

## Run background commands from task/project headers - 2026-06-04

- Added "Run Background Commands" menu item to the More (⋯) menu on both quick-task and project preview headers, allowing users to respawn long-running daemons (e.g., `npx convex dev`) in an active sandbox without restarting.
- Implemented backend mutations (`agentTasks.runBackgroundCommands`, `projects.runProjectBackgroundCommands`) that schedule the existing daemon-launch action; requires an active sandbox and repo access.

## Agentation annotation widget works in remote previews - 2026-06-04

- Added `/__agentation` proxy route in preview proxy, forwarding widget requests to sandbox-local agentation server (port 4747), mirroring the existing `/__convex` pattern for Convex backend access.
- Sandboxed apps now resolve the agentation endpoint dynamically: Daytona preview hosts use the proxied `/__agentation` path, local dev continues to use `http://localhost:4747`.

## HeroUI palette applied across the web app - 2026-06-04

- Re-valued every neutral, surface, and base semantic CSS token (background, surfaces, borders, muted, destructive, success, warning) in `globals.css` to the HeroUI palette for both light and dark modes, so all token-driven components adopt the new look automatically.
- Preserved user-defined theme tokens (accent/primary, font, radius, letter spacing) untouched, since those stay controllable from theme settings.
- Mapped every surface token 1:1 to the exact HeroUI tiers (background → surface → surface-secondary → default) in both modes, verified live against the HeroUI reference templates.
- Adopted HeroUI's border-based structure to match the reference look: hairline borders on all cards and surfaces, a sidebar that shares the canvas tone with a divider border instead of a darker fill, and active nav items rendered as bordered surface chips. Rewrote the CLAUDE.md design system from tonal-only to border-based accordingly.
- Rolled the bordered treatment across every route: gave 74 borderless `bg-muted/40` section panels a hairline border, and added region dividers to the secondary sidebars (sessions, designs, automations, settings, docs). Verified light + dark on quick-tasks, projects, designs, sessions, stats, settings, automations, and inbox.
- Aligned the shared component library to the HeroUI reference templates: buttons are now flat solid/soft fills with neutral hovers (removed the hover-lift and accent-tinted hovers); dropdown/context menus use a solid surface with neutral hover (no translucent blur); segmented tabs use a solid white active segment with a subtle shadow; inputs/selects use a solid field-background fill with a full border. Fixed the project card, which rendered broken (translucent fill + hover-lift z-index) — now a solid bordered card like the rest.
- Swept the entire `packages/ui` component library component-by-component to remove every remaining non-HeroUI trait — translucent surfaces (`bg-*/95`), partial-opacity borders (`border-border/70`), `backdrop-blur`, and accent-tinted hovers — across dialog, sheet, popover, hover-card, tooltip, command, select, textarea, checkbox, alert, accordion, avatar, calendar, carousel, button-group, input-group, separator, and the menu classes. Overlays are now solid bordered surfaces, fields use the solid field-background fill, menu/select items hover neutral grey, and the KPI/status pills are fully rounded. Only the dark modal scrim is intentionally translucent.
- Fixed `cssColor` wrapping sRGB-triplet tokens in `oklch(...)` instead of `rgb(...)`, which made every Chart.js chart render clamped-garbage colours; re-valued the `--chart-2..5` palette from loud teal/amber/rose/emerald to a cohesive blue→indigo→violet→cyan family so charts harmonise with the accent.
- Did a final app-wide pass converting accent-tinted hovers (`hover:bg-accent`) to neutral `hover:bg-muted` across 13 components, solidified the remaining translucent/blurred popovers and toast (`bg-popover/95`/`backdrop-blur`/`bg-background/95` → solid `bg-popover`), and removed the last non-HeroUI hover-lifts on the page-header button, the Build/Run split buttons, and the logs summary cards.
- Unified the Stats page cards: the charts and funnel were using `Card` but overriding it with `shadow-none bg-muted/40` (flat grey panels) while the KPIs used the plain white card, and the activity heatmap was not in a card at all. Removed the overrides and wrapped the heatmap in a `Card` so every Stats surface is the same white bordered card, matching HeroUI's dashboard where KPIs and charts share one card style.
- Migrated hardcoded status colours to theme tokens where a direct match exists: errors to `destructive`, live/success indicators to `success`, warnings to `warning`, toggle "on" states and the follow-mode overlay to `primary`.
- Left genuinely categorical colour sets as-is (severity scales, priority levels, repo-avatar palette, phase badges) and intentional literals (logo, theme previews/pickers, per-user cursor colours).
- Fixed the projects timeline reading status-bar tokens through `hsl()` instead of `rgb()`, which was rendering wrong hues, and routed the draft colour through the `muted-foreground` token.
- Task descriptions and comments now render Markdown with inline mention chips via a shared `MarkdownMentionText` renderer (a remark plugin rewrites the `@[Label](id)`/`/[Label](id)` tokens): descriptions resolve `@`→doc and `/`→skill chips, comments resolve `@`→user chips, so formatting and chips both work instead of showing raw HTML/tokens. Restructured the comment composer to match the sessions/sandbox chat composer (bordered card + footer-row controls).

## Task subscribers and hybrid notification routing - 2026-06-03

- Added per-task subscriber management: auto-subscribe on create, assign, comment, or @mention; manual toggle in Activity-tab header with avatar stack, self subscribe button, and add-others picker (dev-role users only).
- Transitioned notification routing to hybrid model: broadcast events (comments, meaningful status changes, PR merge/close) fan out to all active subscribers; targeted events (mention, reply, assignment) remain distinct, high-signal types and also auto-subscribe their recipients.
- Added `status_changed` notification type for transitions to code_review, business_review, and cancelled; digest-only (no instant email) to limit noise; `task_complete` (instant-emailed) fires on done.
- Implemented sticky unsubscribe: explicit opt-out persists across auto-subscribe triggers, so commenting again doesn't silently re-subscribe you.
- Increased instant-email debounce from 5 to 30 minutes so comment bursts collapse into a single email, reducing notification fatigue on active tasks.
- Backfilled all existing tasks: each task's creator and (if set) assignee are pre-subscribed so historical tasks keep notifying the right people.

## Clean flat design system and analytics page reskin - 2026-06-03

- Flattened design tokens: neutralised base surfaces to grey/white (removed green tint), removed ambient background gradient and grid overlay, shifted main content to pure white with grey sidebar for tonal separation, kept accent colours user-driven via theme settings.
- Simplified surface styling: removed borders from `.ui-surface` and `Card` components, restored soft shadows for elevation, removed hover-lift micro-motions on interactive surfaces (hover now a background shift only).
- Cleaned sidebar chrome: collapsed translucent surface washes into one opaque panel, switched active nav item to a neutral fill instead of primary-tinted, kept group labels and section dividers.
- Redesigned analytics page (`/stats`): introduced `ScoreBar` (segmented tick-meter driven by real data) and `StatusChip` (soft pastel status pill) components, reskinned `StatCard` to reference-style KPI layout (icon chip + label, delta badge, big number, shadows), reskinned `Leaderboard` with avatar rows, metric lines, and score bars.

## Polished comment composers - 2026-06-03

- Comment composers now submit with a tactile send button that cross-fades to a spinner while posting, so every submit has clear in-flight feedback.
- The inline reply box submits on Enter (Shift+Enter for a newline) and refocuses after sending, making back-and-forth replies faster; the multi-line activity composer keeps Enter as newline.
- The borderless reply input reveals a subtle background well on hover for discoverability without adding a border, staying within the tonal design system.

## Compact relative dates everywhere - 2026-06-03

- Dates across the app now display in abbreviated form ("15m", "2d", "1h") instead of prose ("19 minutes ago"), making timelines scan faster and visually lighter.
- All relative-date displays (activity items, notifications, inbox, docs, sessions, testing arena, user presence) route through `RelativeDateTime` for consistency, which always shows the exact date/time in a hover tooltip.
- Removed the verbose `formatRelativeTime` helper; all relative dates use the compact `compactRelativeTime` variant.

## Task creators notified on new comments - 2026-06-03

- Task creators now receive a `comment_added` notification when someone comments on their task, matching the behavior for assigned users.
- Made `createdBy` required on `agentTasks` schema for data safety, since all existing tasks have a creator and every creation path populates it.

## Linear-style comment threads and activity refinements - 2026-06-03

- Replaced per-comment reply buttons with a persistent Linear-style "Leave a reply" input at the bottom of each thread, showing your avatar and a send button that's always visible (disabled when empty).
- Added user avatar before the actor name in status-change activity items, matching comment cards and improving visual hierarchy.
- Unified the card background to group comment, replies, separator, and reply input as a single surface so they read as related.
- Fixed layout shifts when expanding the reply input, editing a comment, and expanding activity rows by reserving fixed avatar slots and constraining text to a single line.

## Trust Daytona regional preview hosts - 2026-06-02

- Eva's preview-auth return guard now accepts Daytona's regional signed-preview host shape like `9001-<token>.daytonaproxy01.eu`, so shared previews can complete the Eva sign-in gate instead of being rejected as untrusted.
- The guard still requires HTTPS and a Daytona-style `port-*` preview subdomain, keeping localhost and arbitrary redirect targets blocked.

## Sign-in required to open shared sandbox previews - 2026-06-02

- Opening a sandbox preview link now requires signing into Eva and having access to the repo, so a shared or forwarded link no longer exposes the preview to anyone outside the team.
- Protection now covers every preview surface — app preview, code editor, desktop, and design preview — each served through an authenticated in-sandbox proxy.
- In-app previews still load seamlessly for the signed-in owner; links opened in a new tab or shared with someone prompt for sign-in first.

## Preview URLs restricted to repository members - 2026-06-02

- Requesting a sandbox preview URL now checks that the user has access to the repository, so previews can no longer be opened by people outside the repo's team.

## Animated logo and on-brand loading spinner - 2026-06-02

- The sidebar logo now draws itself on load and replays the draw when you hover it.
- Replaced the generic loading spinner with the Eva mark traced as an animated outline, so loading states are on-brand across the app.

## Enhanced prompt continuity for task changes - 2026-06-02

- Fixed "Make changes" re-runs to resolve `@mention` tokens in feedback comments, matching how task descriptions are prepared.
- Annotated each change request with the reviewer's name and date, helping the agent understand recency and authorship of feedback.
- Injected the previous successful run's summary into change-request prompts, so "Make changes" re-runs understand prior work instead of rediscovering it from scratch.

## Instant notification emails - 2026-06-02

- High-signal notifications (mentions, replies, comments, assignments) now email the user a few minutes after they happen, so time-sensitive activity no longer waits for the once-daily digest.
- The email is skipped if the user already read it in-app, and a burst within the window collapses into one email, mirroring Linear's inbox behaviour.
- Emailed items are marked so the daily digest never repeats them.

## Code reviewer assignment - 2026-06-02

- Reframed task "Assignee" as "Code Reviewer" across the create modal, detail panel, list filter, and card menu so assignment models the code-review step.
- User pickers now list only dev-role users, keeping code-review assignment to engineers.

## Mark notifications read without leaving the inbox - 2026-06-02

- Hovering an unread notification now reveals a labelled "Dismiss" button that marks it read in place, so users can clear high-volume rows without navigating away to the linked task or project.

## Pre-installed agentation-mcp in sandbox snapshots - 2026-06-02

- Sandbox snapshots now ship with agentation-mcp already installed, so it is available the moment a sandbox starts instead of being installed on first use.

## Per-automation email toggle - 2026-06-02

- Added a "Send email" toggle to automation settings so any automation can broadcast its run summary on success, replacing the hardcoded changelog-only behaviour.
- Generalised the changelog email into a reusable automation email (subject derived from the automation title plus its edition number) sent to all opted-in users.
- Extracted a shared SettingToggle component for the automation settings switches, removing duplicated markup.

## Email notifications ready for production - 2026-05-29

- Filtered out spammy task/quick-task run completion notifications from the daily digest so users see only impactful mentions and merged changes (run-finished notifications remain in the in-app bell).
- Daily digest now runs on weekdays only (Mon-Fri at 08:00 UTC) to avoid weekend inbox clutter.
- Re-enabled production email sending and weekly changelog auto-trigger so both emails now deliver to real recipients when deployed.

## Email notification opt-in - 2026-05-29

- Added a per-user email opt-in flag so the daily summary and weekly changelog only reach users who explicitly enable them; off by default for privacy.
- Both email recipient queries now skip users who have not opted in, gating all outbound email behind the single preference.
- Added a Notifications settings page with a toggle so users can self-serve, reachable from the root sidebar.

## Weekly changelog announcement email - 2026-05-29

- Email the weekly changelog to all users when a new one publishes, triggered automatically on automation success so it sends exactly once per edition.
- Converts the stored markdown summary to HTML for email rendering, with a pure template builder reusing the existing email layout wrapper.
- Integrates with the same changelog automation and dismissal tracking as the in-app modal, so email recipients and viewers stay in sync.

## Daily unread-notification email digest - 2026-05-29

- Daily 08:00 UTC cron emails each user a summary of their unread notifications so people who don't log in still see what needs attention.
- Added a reusable SendGrid `sendEmail` helper that redirects all mail to a test inbox outside production, keeping test runs from reaching real users.
- Added a pure HTML template builder for the digest, with escaped user content and inline styles for email-client compatibility.

## Task activity timeline polish - 2026-05-28

- Relative timestamps with exact datetime on hover are shared across runs, comments, field changes, and system alerts so activity reads consistently.
- Made-changes run accordions show who requested work (avatar, name, badge, duration) with started-at on the right.
- Comment and inline run headers put the date last beside actions, matching the run accordion pattern.

## Request-changes composer and mention previews - 2026-05-28

- Make changes is an in-input switch beside send (replacing the checkbox below) so the comment box stays compact while mode is obvious.
- Request-changes helper text sits above the input so users see submit behavior before typing.
- Request-changes comments support `@` docs and `/` skills like the task description, with tokens rendered correctly in run accordions.
- Hovering `@` or `/` mention chips shows a scrollable preview of doc or skill content in the editor and in saved comments.

## Quick task layout route for persistent header - 2026-05-28

- Quick task page chrome now lives on the `$taskId` TanStack Router layout so switching tabs or opening sandbox only swaps the main pane instead of remounting the header.
- Child routes handle URL validation only; shared layout reads the active segment and keeps context usage and header actions stable.

## Quick task actions in page header - 2026-05-28

- Run Eva, sandbox, PR, and More controls moved from the bottom footer into the quick task page header (after context usage, before prev/next) so the layout matches projects.
- The task detail pane uses the full height below the header without a separate action bar.

## Sticky sandbox chrome on projects and quick tasks - 2026-05-28

- Project header (title, metadata bar, context usage, build/PR/sandbox actions) stays visible when switching to sandbox; only the main pane swaps to chat + preview.
- Quick task footer and page header (title, context usage, prev/next) stay fixed on sandbox routes; View Sandbox toggles the content above and shows Back to Details while in sandbox.

## Sandbox chat commits and pushes like sessions - 2026-05-28

- Quick task and project preview chat now use the same edit rules as session chat: the agent commits locally when source changes and Eva publishes the branch after a successful message.
- Chat edits previously stayed in the sandbox working tree only, so preview and GitHub never saw them until a full task or project run.

## Quick task manual dev server restart - 2026-05-28

- Quick task activity footer More menu adds Run Dev Server with a confirmation dialog for when preview is stuck loading but the sandbox is already running.
- The action re-runs the dev server using the same App settings dev command and port overrides as sandbox startup, and resets the default terminal so the next connect can auto-start again.

## Fix dev server not starting on resumed sandbox - 2026-05-28

- Resuming a stopped quick-task, project, or session sandbox now clears the default dev terminal PTY so the UI treats the next connect as new and auto-runs the dev command again.
- Stopped sandboxes kept their old PTY session alive in Daytona, which skipped the terminal auto-start path even though the dev process itself was gone.

## Sandbox tab keyboard shortcut - 2026-05-28

- Shift+Tab cycles Preview, Computer, Editor, and Terminal (plus PRD on sessions) in every sandbox panel so you can switch views without clicking the tab bar.
- Session edit/plan mode toggle moved to Mod+Shift+Tab so it no longer conflicts with sandbox tab cycling.

## Unified user profile hover cards - 2026-05-28

- User avatars and @mention chips now open the same glass profile card (aurora header, role badge, email, presence) so identity previews feel consistent across the app.
- Profile card logic lives in shared `UserProfileHoverCardBody` and is wired into `UserInitials` on hover, reducing duplicate mention-only UI code.
- Project and quick-task cards got tighter spacing and gentler press/hover motion so dense boards read cleaner next to the richer avatar affordance.

## Fix stale project in_progress phase - 2026-05-28

- Project phase no longer stays `in_progress` after the build workflow ends: task completion now triggers `recomputeProjectPhase`, and recompute demotes stale `in_progress` when no `activeBuildWorkflowId` is set.
- Added `repairStuckProjectPhases` migration to correct existing projects stuck in build phase without an active build.

## Project card build state and planning source - 2026-05-28

- Project `in_progress` phase now means an active build workflow is running, not merely queued or running tasks, so the board status matches what users see when they click Start build.
- Project cards show the same spinning border animation as quick tasks while a build is active, making in-flight work obvious in kanban and list views.
- Project cards show an Interview vs Tasks only badge so it is clear whether a project came from the AI planning flow or was created as a task container.

## Align project phases with quick-task review lifecycle - 2026-05-28

- Project phases now follow `draft → finalized → in_progress → business_review → code_review → completed`, keeping `finalized` for spec-ready work and using `in_progress` only while agents are building.
- Manual phase changes and task-driven `recomputeProjectPhase` sync the project PR with GitHub the same way as quick tasks: business review keeps the PR as draft, code review marks it ready for review.
- Project PRs are created as drafts; inbound GitHub draft/ready webhooks update project phase when the PR is in a review state.

## Unify project interview chat and history modal design - 2026-05-28

- Extracted message parsing and type guards into `projectChatMessage.utils.ts` for reuse across components.
- Created `ProjectChatMessageList.tsx` component to render conversation messages with consistent styling, activity logs, and timestamps.
- Refactored `ProjectChatTab.tsx` to use the new component, eliminating ~220 lines of duplicate rendering logic.
- Refactored `PlanContextPanel.tsx` to use the shared component so the interview history modal displays with the exact same design as the project chat, including activity logs and timing information.
- Updated `ProjectActiveLayout.tsx` to accept the full `ConversationMessage` type (with `activityLog`, `startedAt`, `finishedAt`) so the modal can render complete message metadata.
- Moved plan and interview history buttons into a dropdown menu ("View plan" and "View interview history" options) for a cleaner sidebar layout.

## Skip heavy startup for project interviews - 2026-05-28

- Project interview and spec workflows now skip repo startup commands (convex import, env seeding) because agents only read the codebase, avoiding 10+ minute sandbox prep and workflow timeouts.
- Failed interview runs now reset `reviewProjectSandboxStatus` to closed so the UI does not stay stuck on "starting" after errors.
- Stuck-interview repair clears sandbox startup streaming activity and can drop a broken `sandboxId` so the next Continue starts clean.

## Stabilize Project Interview Sandboxes - 2026-05-28

- Project interviews now persist newly created sandbox ids before long startup work, so retries and later answers reuse the same Daytona sandbox.
- Duplicate interview/spec starts are ignored while a project workflow is active, preventing concurrent runs from spawning extra sandboxes.
- Project chat now shows sandbox startup activity steps before Claude launches, matching quick task and session progress behavior.
- Stuck interview repair now removes both empty and error assistant placeholders, making recovery from failed sandbox starts cleaner.

## Repair failed project interview cleanup - 2026-05-28

- **Summary**: Project interview/spec workflows now clean up failed sandbox starts by clearing the active workflow and replacing empty assistant placeholders with an error state, plus a one-off repair exists for stuck draft projects.
- **Reason**: A sandbox startup failure left a draft project with an active workflow id, closed sandbox status, and an empty assistant message, blocking the next interview step and making the page appear stuck.

## Compact interview controls and confirm before clearing - 2026-05-28

- **Summary**: The project interview now renders the "Answered: N" counter and the destructive Clear button inline on the submit row of `MultipleChoiceQuestion` (via a new `trailingControls` slot) instead of a separate footer row, and clicking Clear opens a confirmation dialog before wiping the conversation history.
- **Reason**: The dedicated footer row took vertical space and the Clear button was a single click away from destroying interview progress with no undo. Inlining the controls keeps the form footprint tighter and the confirmation makes the destructive action explicit.

## Unify project interview sandbox lifecycle with preview path - 2026-05-28

- **Summary**: Project interview and spec workflows now reuse the shared `startProjectPreviewSandbox` action instead of the generic task-style sandbox prep, so the sandbox id is persisted on the project and reused across answers, and `reviewProjectSandboxStatus` is set so the card/sidebar active indicator lights up while the interview runs. Each conversation message now also records `startedAt`/`finishedAt`, and the project interview chat shows the same live activity timer and duration label as quick tasks and sessions.
- **Reason**: Each interview answer was spawning a brand-new sandbox because the project doc never persisted `sandboxId`, and the card/sidebar indicator key (`reviewProjectSandboxStatus`) was only written by the preview-Start lifecycle, so neither artifact ever lit up. The interview chat also lacked the activity timer that other agent chats use, because conversation messages didn't carry timestamps.

## Same-origin Convex routing in Daytona preview proxy - 2026-05-28

- **Summary**: The in-sandbox preview proxy now routes `/__convex/*` to `127.0.0.1:3210` and `/__convex-site/*` to `127.0.0.1:3211` for both HTTP requests and WebSocket upgrades, so apps running inside a Daytona sandbox can point their Convex browser client at the already-authenticated app preview origin instead of a separate Convex port.
- **Reason**: Daytona previews bake `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` at build time, which is unreachable from the remote browser; pointing the client at a separate `3210-<sandbox>` preview origin failed because each per-port preview origin is auth-gated and a raw Convex WebSocket cannot follow the Auth0 redirect. Same-origin routing through the app's proxy keeps realtime working without exposing the sandbox publicly.

## Fix Cursor MCP OAuth redirect URI registration - 2026-05-25

- **Summary**: Dynamic OAuth client registration now keeps native redirect URIs like `cursor://…` instead of only `http(s)://`, so authorize no longer fails with redirect_uri mismatch when Cursor registers both a custom scheme and loopback HTTP.
- **Reason**: Cursor MCP could not complete Eva OAuth; the authorize page failed after sign-in because the stored client only had loopback URIs.

## Resolve project task logs into Projects grouping - 2026-05-25

- **Summary**: Logs queries now infer `projectId` from the linked agent task when older completion rows were stored without it, so project tasks roll up under Projects (By Type) and By Project instead of Quick Tasks.
- **Reason**: Project tagging on logs shipped recently; historical task completions only had `entityType: quickTask` with no `projectId`, so the UI could not group them correctly.

## Store and view synced SKILL.md contents - 2026-05-25

- **Summary**: GitHub skill sync now persists the full SKILL.md body on each repo skill; the settings Skills page adds a View contents dialog that lazy-loads stored markdown.
- **Reason**: Users needed to inspect harness skill instructions without leaving Eva or re-opening the repo on GitHub.

## Parse multiline SKILL.md description on GitHub skill sync - 2026-05-25

- **Summary**: Repo skill sync now accepts YAML-style `description:` blocks (indented lines after `description:` without `|`/`>`), and skip warnings name the real failure (missing file, frontmatter, name, or description) instead of a generic “missing valid SKILL.md”.
- **Reason**: CarePulse skills on `staging` use common Cursor skill frontmatter; the old parser treated them as invalid even though `SKILL.md` existed alongside other reference files.

## Strip Cursor commit attribution in git hooks - 2026-05-25

- **Summary**: Added a `prepare-commit-msg` husky hook that removes `Co-authored-by: Cursor` and `Made-with: Cursor` trailers before commits land, plus an agent rule not to add them.
- **Reason**: Cursor’s IDE agent injects co-author lines even when CLI attribution is disabled in `cli-config.json`, so repo-local stripping is the reliable fix.

## Remove Claude MCP connector icon workaround - 2026-05-25

- **Summary**: Dropped Convex HTTP favicon/site-identity routes, MCP `serverInfo.icons`, OAuth `logo_uri`, and the backend icon generator—Claude custom connectors do not render custom icons today (neither MCP metadata nor Google favicon lookup on the deployment hostname).
- **Reason**: The backend workaround added maintenance surface (generated `icon.ts`, extra HTTP routes) without improving the connector UI in Claude.

## Task run watchdog heartbeat hardening - 2026-05-25

- **Summary**: Lightweight touch-only streaming heartbeats (HMAC `/api/streaming/heartbeat` with `touchOnly`) keep `lastUpdatedAt` fresh during long silent tool runs without uploading full step JSON every 10s; touch upserts a minimal row if missing; callback flushes an extra touch when tools are in flight and recovers stuck ping locks; Daytona liveness accepts running agent CLI when callback PID bookkeeping is stale; watchdog better classifies grep/bash/work labels and avoids treating empty streaming as perpetual sandbox startup once a sandbox is attached.
- **Reason**: Legitimate builds and searches were dying as `Run killed by watchdog: no heartbeat for …` because heartbeats stalled on large payloads, missing rows, or misclassified thresholds—not because the sandbox was idle.

## Cursor-style @ and / mention picker - 2026-05-23

- **Summary**: `@`, `/`, and comment `@` pickers are a compact panel anchored to the caret (not full input width), flip above or below based on viewport space, use a light primary tint for the active row, truncate titles on the right with description/email on a second line, and scroll with the app’s styled scrollbar.
- **Reason**: The old full-width popover above the field felt unlike familiar autocomplete UIs and wasted space; anchoring and flipping matches how users expect mention menus to behave while drafting.

## Interactive mention chips in editors - 2026-05-23

- **Summary**: `@` doc and `/` skill pills in session chat and task description inputs navigate to the doc viewer or skills settings when clicked; `@` people pills in comment inputs show the profile hover card while composing, matching rendered comments; the comment `@` picker is labeled People and lists avatars beside names.
- **Reason**: Editor mention chips were visual-only—users expect the same navigation and people previews as in sent messages when drafting comments and descriptions.

## Mentions in task descriptions and richer chat chips - 2026-05-23

- **Summary**: Task and quick-task descriptions support `@` docs and `/` skills with the same picker as session chat, and Eva injects referenced doc content when a task runs; `@` and `/` chips in messages link to the correct doc or skills page (including monorepo app routes); mention pickers label sections Docs and Skills; Make changes mode highlights the activity composer with a primary border and the timeline has more spacing between items.
- **Reason**: Users needed to attach repo context when defining work, not only in session messages—mention chips should be actionable and task descriptions should feed Eva the same way as chat.

## Task and project detail tab polish - 2026-05-23

- **Summary**: Activity / Proof / Audit tabs are compact segmented controls with a clear primary active state, theme-driven corner radius, and content-width layout instead of a full-width bar; the edit-project description field is taller for longer copy.
- **Reason**: Full-width tabs were hard to scan and low-contrast active states blended into the page; project descriptions need more room when editing from the card menu.

## Threaded comment replies on task activity - 2026-05-23

- **Summary**: Task comments support unlimited reply depth with nested UI, inline reply composer (reply icon + menu next to each comment), soft-delete with placeholder text, and `comment_reply` notifications deduped per user alongside assignee and mention alerts; only top-level comments appear in the mixed activity timeline.
- **Reason**: Users needed Linear-style threads to discuss work in context without every reply becoming a separate timeline event.

## Task detail activity polish - 2026-05-23

- **Summary**: Comment headers group author name with a muted relative time; creator and comment avatars show online presence; Activity/Proof/Audit tabs no longer show a stray scrollbar; the comment composer uses one consistent, slightly shorter height for both add-comment and make-changes modes.
- **Reason**: Follow-up UX gaps after the comment redesign made attribution, presence, and the activity tab chrome feel unfinished.

## Task activity comments and themed mention chips - 2026-05-23

- **Summary**: Session and task inputs render `@` doc and `/` skill references as theme-accent pills; task comment `@user` tokens show a profile hover card; activity comments display author name, right-aligned time, and a menu to edit or delete (with confirmation); authors can edit their own comments; the Eva “make changes” field is taller and that mode defaults off.
- **Reason**: Mentions and comments were hard to scan and act on—users wanted theme-aware chips, Linear-style people previews, clearer comment attribution, and less friction when adding a note vs requesting Eva work.

## Remove idle stdout kill on quick tasks - 2026-05-22

- **Summary**: Removed the callback no-stdout watchdog (including the 45s quick-task override). Long silent stretches between Claude turns no longer fail runs; completion treats a stream-json success result as success even if a legacy timeout flag was set.
- **Reason**: Project tasks were marked failed with "terminated after no stdout for 45000ms" while stdout already contained a completed result — same false-failure class as the removed post-first-text stall.

## Sync repo skills from GitHub metadata - 2026-05-22

- **Summary**: Repo skills now sync display metadata from `.agents/skills/*/SKILL.md` on the configured base branch. Slash skills stay visible in chat, but Eva strips them back to `/skill-name` and no longer injects stored prompt text.
- **Reason**: Skills should be owned by the codebase and invoked by the agent harness, not duplicated as editable prompt snippets inside Eva.

## Raise callback max runtime to 90m; remove per-tool stall kills - 2026-05-22

- **Summary**: Callback CLI cap is now 90 minutes (matches Daytona sandbox autostop). Ephemeral sandboxes (automations/quick tasks) also use 90m autostop. Removed per-tool stall limits entirely — long bash/typecheck runs are only bounded by max runtime and idle no-output when no tools are in flight.
- **Reason**: Per-tool caps (5m non-shell, shared timers) caused repeated false failures on automations that completed successfully; max runtime + zombie + no-output is enough.

## Remove post-first-text CLI stall kill - 2026-05-22

- **Summary**: Dropped the callback watchdog that terminated Claude after silence following the first text block (`CLAUDE_POST_TEXT_STALL_TIMEOUT_MS`, 45s on quick tasks). Long tool runs after planning text no longer trigger a false failure when the agent is still working.
- **Reason**: Automations completed successfully (result event in stdout) but were marked failed with "stalled after first text block for 45000ms" during long bash/typecheck phases.

## Fix parallel tool stall killing long bash commands - 2026-05-22

- **Summary**: Tool stall detection now tracks each in-flight tool with its own deadline instead of applying the shortest timeout across parallel tools. Claude `tool_use_id` is wired through so bash/read/grep completions clear the right tracker.
- **Reason**: Automations failed at 300s with "Running command..." while Claude had finished — a long bash shared one timer with a parallel read/grep, so the 5-minute non-shell cap killed the run even though shell allowance is ~49 minutes.

## Modular callback script (TypeScript) - 2026-05-22

- **Summary**: Split the ~3500-line sandbox callback monolith into typed modules under `packages/backend/callback-src/`, unified Convex HTTP calls via `callConvexWithRetry`, extracted `evaluateAttemptHealth` from the CLI watchdog interval, and added esbuild bundling to regenerate `convex/_daytona/callbackScript.generated.ts`.
- **Reason**: The inline template literal was unmaintainable; modular source with node:test coverage and a build step preserves behavior while making provider/session/parse logic reviewable.

## Extend quick-task runtime and tool-active watchdog - 2026-05-22

- **Summary**: Quick-task sandbox runs now use a 50-minute total CLI cap (was 20 minutes). The heartbeat watchdog allows 25 minutes of silence while a tool step is active (was 15 minutes), so long builds/typechecks are less likely to die mid-command.
- **Reason**: Quick tasks were killed during `pnpm build` or other long shell steps before the 2-hour workflow backstop; the 20-minute callback cap and 15-minute tool-active threshold were tighter than needed once the 240s shell cap was removed.

## Remove sandbox 240s shell tool cap - 2026-05-22

- **Summary**: Stopped passing `CLAUDE_SHELL_TOOL_TIMEOUT_MS=240000` into sandbox runners. Shell tools now use the callback default (~49 min) until the external heartbeat watchdog kills the run. Removed the matching "240s shell kill" line from task and automation prompts.
- **Reason**: The 4-minute cap was killing automations after a successful commit when agents ran longer validation; watchdog failure is acceptable and matches prior behaviour.

## Add optimistic updates to all UI-facing Convex mutations - 2026-05-21

- **Summary**: Wrapped ~50+ UI-facing mutations in `apps/web/` with `.withOptimisticUpdate()` callbacks that patch the Convex client-side query cache before the server roundtrip completes. Covers toggles (enabled/disabled flags), updates (field edits, priority, assignee changes), removals (delete buttons), archive/unarchive, and status transitions. Fixed TypeScript type mismatches by destructuring nullable fields from mutation args (which use `v.union(type, v.null())`) and spreading them with `?? undefined` guards to match cached query types (which use `v.optional(type)` → `Type | undefined`).
- **Reason**: Users see instant feedback on mutations (no latency waiting for server response), improving perceived performance. Query caches stay in sync automatically — no `useEffect` refetch hacks or local state duplication.

## Claude MCP connector favicon on convex.site - 2026-05-21

- **Why**: Claude custom connectors do not render MCP `serverInfo.icons` (SVG or data URI). They fetch connector art via Google faviconV2 from the MCP server hostname (`*.convex.site`), which had no favicon — so settings showed a blank/generic icon.
- **Root cause (regional Convex)**: Claude/Google reduce `good-mule-506.eu-west-1.convex.site` to `eu-west-1.convex.site` for favicon lookup. That hostname does not resolve, so gstatic returns a 726-byte placeholder even when `/favicon.ico` returns 200 on the full deployment URL.
- **Change**: Serve raster PNG at `/`, `/favicon.ico`, `/favicon.png`, and `/robots.txt` on Convex HTTP; add `logo_uri` to OAuth metadata; copy PNG favicons to `apps/web/public/`; document Convex custom domain as the fix for connector icons. Regenerate via `node scripts/generate-mcp-icon.mjs`.
- **Reason**: Match the workaround used by other MCP servers until Claude reads `serverInfo.icons` natively; custom domain avoids hostname stripping on regional Convex URLs.

## New Eva logo (SVG, faceted two-tone) - 2026-05-21

- **Summary**: Added `apps/web/public/icon.svg` — a four-point sparkle with elongated horizontal arms, top half solid violet `#8B3FB8` and bottom half solid azure `#3B7DD8`, on a white rounded-square background. Switched the favicon, apple-touch-icon, PWA manifest icons, and every in-app `<img src="/icon.png">` reference (`EvaIcon`, `Sidebar`, `ChatMessage`, `RepoHomeClient`, sign-in route, MCP OAuth Shell) to the new SVG.
- **Reason**: Move to a vector mark that stays sharp at any size, unify the icon across browser tab, install prompts, and in-app surfaces, and align Eva's brand with the faceted polyhedron family (eprocurement, costmodel) rather than the flat-gradient family.

## Automation tabs are now URL-driven - 2026-05-21

- **Summary**: Split `automations/$id.tsx` into an `$id/` directory with `route.tsx` (Outlet), `index.tsx` (redirect to default), and `$automationTab.tsx`. Latest, Run History, and Settings are now `/latest`, `/run-history`, and `/settings` path segments. `AutomationClient` takes an `activeTab` prop and drives tab switches through `useNavigate`.
- **Reason**: Tabs used Radix `defaultValue` only, so refresh always landed on Latest and links could not deep-link to a specific tab — violating the project rule that primary tabs should be path segments with an index redirect to the default.

## Fix automation model provider picker - 2026-05-20

- **Summary**: Automation settings now resolve available providers from the current repo (matching Config/tasks), default unset models to the repo default, and use non-modal dropdown menus so provider submenus open inside scrollable settings pages.
- **Reason**: Provider list was keyed off `automation.repoId` and always fell back to Sonnet when no per-automation model was saved, so only Claude models appeared and nested provider menus could not be opened in the settings tab.

## Harden GitHub authentication with per-sandbox credential helper - 2026-05-21

- **Summary**: Replaced URL-embedded GitHub App installation tokens with a per-sandbox bearer secret + HTTP callback. Git operations now mint fresh tokens on demand via a bash credential helper, eliminating tokens from `.git/config`, process args, and reflogs. Self-heals on resume by rotating secrets and re-uploading the helper.
- **Reason**: Installation tokens (60-min TTL) leaked in git configuration and command-line args; `git pull` in paused sandboxes failed after 1 hour. New architecture supports day-long (or longer) sandbox pauses without credential expiry, and bounds token age to the 50-minute helper cache TTL.
- **Migration**: Existing sandboxes auto-migrate on next resume — no backfill or downtime required.

## Skip sandbox-config re-copy after startup commands ran - 2026-05-20

- **Summary**: `copySandboxConfigFilesToWorkspace` now no-ops when `/tmp/.startup-commands-done` exists, so large config blobs (e.g. SQL dumps, Convex backup zips) are not copied back to the repo root on every Start Sandbox resume.
- **Reason**: Startup commands run once and move/delete root copies, but config restore ran every resume — duplicating multi-GB files until the sandbox disk filled (`No space left on device`).

## Treat post-result CLI zombie as cleanup, not failure - 2026-05-20

- **Summary**: Sandbox callback no longer fails a run when the CLI enters zombie state after a successful stream-json `result` event. Cleanup termination may still exit non-zero, but success is preserved when the result was already received.
- **Reason**: Session runs were marked failed with "CLI process entered zombie state" even though stdout contained `"type":"result","subtype":"success"` — a false positive from grandchild stdio keeping the bash wrapper open after Claude finished.

## Extend archived sandbox thaw timeout to 10 minutes - 2026-05-20

- **Summary**: Raised `ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS` from 300s to 600s. Session/task/project reuse paths and sandbox validation now pass this budget so cold-storage restores are less likely to fail mid-thaw.
- **Reason**: Resuming archived sandboxes can exceed 5 minutes on larger filesystems; failures surfaced as `reuseSessionSandbox.prepare failed after 301.0s`.

## Audit fix prompt uses typecheck and platform push - 2026-05-20

- **Summary**: Audit fix agent prompt now uses `buildAuditFixPrompt` with `npx tsc --noEmit` instead of full build; Eva pushes the branch after success instead of instructing the agent to `git push`. Project tasks use the correct project branch name.
- **Reason**: Full builds stall in the 240s sandbox shell limit; agent-side push bypassed the same publish path as tasks and automations.

## Per-run branch names for automations - 2026-05-20

- **Summary**: Each automation run now pushes to `eva/automation-{automationId}-{runId}` instead of reusing one branch per automation, so every successful run opens its own PR from the base branch.
- **Reason**: Daily or repeated runs were updating a single rolling PR; per-run branches match the expected one-PR-per-run workflow.

## Require git commit for write-mode automations - 2026-05-20

- **Summary**: Write-mode automations now set `requireTaskCommit: true` when launching the agent, matching task workflows. Success without a new local commit is rejected before push/PR.
- **Reason**: Agents could report success without committing; push left `eva/automation-{id}` at the same SHA as `staging`, so GitHub refused PR creation with "not ahead of staging".

## Fix automation build stall at 240s shell limit - 2026-05-20

- **Summary**: Implementation automations now verify changes with `npx tsc --noEmit` (120s cap) instead of `npm run build`, matching quick tasks. Prompts state the 240s sandbox shell-tool kill limit and forbid full builds.
- **Reason**: Agents ran 5-minute production builds (`timeout 300 npm run build`) that exceeded `CLAUDE_SHELL_TOOL_TIMEOUT_MS` (240s), producing "Tool stalled while Running command" with no useful output.

## Remove unused client apps - 2026-05-20

- **Summary**: Deleted `apps/mobile`, `apps/desktop`, and `apps/teams-bot` plus their root npm scripts and lockfile entries. Docs now list only `apps/web` and `apps/chrome-extension`.
- **Reason**: These apps were unmaintained side projects with no integration into the Conductor platform; keeping them inflated the monorepo and confused onboarding.

## Remove dead backend exports and legacy CI - 2026-05-20

- **Summary**: Dropped unused Convex mutations/queries (`evaluationReports.create/get`, duplicate doc test-gen helpers, unused `messages` CRUD), removed orphan `userMigrations` schema table, deleted legacy E2B/Daytona snapshot GitHub workflows, and removed broken root npm scripts (`mcp:dev`, `mcp-v2:dev`, `turbo`).
- **Reason**: Workflows and clients had moved to direct DB writes or dedicated modules; keeping dead API surface and schema tables adds maintenance noise without callers.

## Per-automation monorepo sharing - 2026-05-20

- **Summary**: Each automation has a "Share across apps" toggle in Settings (monorepos only). Shared automations appear in every app's sidebar and run from the monorepo root; app-specific ones stay scoped to that app.
- **Reason**: Some automations apply repo-wide while others target a single app — sharing should be per automation, not a global repo switch.

## Inherit project base branch for tasks - 2026-05-20

- **Summary**: Tasks created inside a project now use the project's selected base branch (not the repo default). Project metadata bar shows the branch read-only; task creation modal inherits it with a tooltip when adding tasks to a project.
- **Reason**: Branch choice at project creation was ignored for child tasks, so Eva branched from the wrong base. Surfacing the branch on the project makes the shared setting visible.

## Move Request Changes into task footer More menu - 2026-05-20

- **Summary**: Task footer no longer shows a standalone Request Changes button; it lives under More alongside Resolve Conflicts, Create PR, etc.
- **Reason**: Request Changes is a review-state action, not a primary footer action. Moving it reduces footer clutter while keeping the flow available.

## Default proof capture to video walkthrough - 2026-05-20

- **Summary**: Task implementation proof prompt now defaults to recording a video walkthrough; screenshots are fallback only when video is impractical.
- **Reason**: Video better demonstrates UI changes end-to-end. The backend already prefers recordings over screenshots when persisting proof — the prompt now matches that behavior.

## Always concise chat responses; @/ skill hint banner - 2026-05-20

- **Summary**: Removed the Concise/Detailed response-length selector from sandbox chat. Eva now always uses hyper-concise replies (except PRD/plan mode, which stays concise plan-focused). Added a dismissible tip above the chat input: `@` for docs/PRDs, `/` for skills.
- **Reason**: Verbosity is better handled ad hoc via a `/verbose` skill than a global toggle most users never touch. The hint teaches @ and / without opening settings.

## Show doc/skill previews in chat @ and / menus - 2026-05-20

- **Summary**: `@` doc and `/` skill autocomplete menus now show a truncated muted preview on the right — doc description (or content excerpt) and skill prompt — so users can pick the right item without opening settings.
- **Reason**: Title-only rows made it hard to distinguish similar docs or skills at a glance.

## Add repo skills slash menu for sandbox chat - 2026-05-20

- **Summary**: New Settings → Skills page (title + prompt per skill). Session, task sandbox, and project sandbox chat support `/` to pick a skill — user sees a `/Title` chip; the prompt is injected server-side at execution, like `@` doc mentions.
- **Reason**: Teams repeat the same instructions in chat. Skills centralize prompts in repo settings while keeping sent messages readable and hiding long prompt text from the UI.
- **Schema**: Added `repoSkills` table with `repoId`, `title`, `prompt`, `createdAt`.
- **Backend**: CRUD via `repoSkills.ts`; `resolveSkillMentions` + `resolveMessageTokens` wired into session, task, and project chat workflows.
- **Frontend**: Extended `MentionEditor` for `/` trigger; `MentionText` renders skill tokens as chips; settings page at `/settings/skills`.

## Fix Cursor post-text stall killing in-progress edits - 2026-05-20

- **Summary**: Cursor task runs no longer hit the 45s "stalled after first text" watchdog mid-edit; timeout kills no longer count as success when stream-json already contains a result line.
- **Reason**: Cursor streams planning prose before long tool work with little stdout. The Claude-oriented post-text stall fired during edits, then a partial result event could still pass the commit gate — producing a confusing double error.

## Fail task runs without commits; label Cursor tools clearly - 2026-05-20

- **Summary**: Quick-task and project task agent runs now fail when the CLI reports success but the sandbox branch has no new git commit. Cursor stream-json tool steps now show read/edit/write/shell/MCP instead of generic "Used tool".
- **Reason**: Cursor (and other providers) could exit cleanly after planning text only; Eva still marked the run successful and `git push` was a no-op, so GitHub showed no new commit while the UI looked done. Generic tool labels hid whether any edits ran.

## Add per-repo proof capture model selector - 2026-05-20

- **Summary**: Repository settings now include a "Proof Capture Model" control under Screenshots and Videos, letting teams pick which model runs when proof capture is enabled on a task.
- **Reason**: Proof walkthroughs have different quality/cost trade-offs from implementation — some repos want a cheaper model for browser automation, others want stronger reasoning for complex UI flows. Per-repo selector mirrors the audit model pattern without changing behaviour when unset.
- **Schema**: Added `proofModel` optional field to `githubRepos`. Mutation `updateConfig` accepts it and propagates to monorepo siblings.
- **Backend**: Task execution workflow uses `repo.proofModel` when screenshots/videos are enabled (excluding conflict-resolution runs); falls back to the task model when unset.
- **Frontend**: Settings → Config shows "Proof Capture Model" dropdown inside the Screenshots and Videos section.

## Add per-repo audit model selectors - 2026-05-20

- **Summary**: Repository settings now include two new model controls: "Audit Review Model" (defaults to Haiku) and "Audit Fix Model" (defaults to Sonnet), replacing hardcoded model choices in the audit workflow.
- **Reason**: Different repositories have different quality/cost trade-offs for audits — some need stronger review (Sonnet), others prefer cheaper batch fixes. Per-repo selectors let teams tune audit behaviour independently, and sibling repos in a monorepo inherit settings automatically.
- **Schema**: Added `auditReviewModel` and `auditFixModel` optional fields to `githubRepos`. Mutation `updateConfig` now accepts these and propagates them to monorepo siblings.
- **Backend**: All four audit launch sites (`launchAudit`, `launchAuditFix`, `launchSelectedAuditFixes`, `runSessionAudit`) now fetch the repo config and use `repo.auditReviewModel ?? "haiku"` or `repo.auditFixModel ?? "sonnet"` instead of hardcoded models.
- **Frontend**: Settings page (`/settings/config`) now shows "Audit Review Model" and "Audit Fix Model" dropdowns below "Default Model", each wired to the updated `updateConfig` mutation.

## Extend timeout and surface progress for archived sandbox restores - 2026-05-20

- **Summary**: Sandbox startup now detects archived state via `refreshData()` and extends timeout from 60s to 300s; UI emits "Restoring sandbox from cold storage (can take a few minutes)..." progress message while waiting for Daytona to rehydrate from object storage.
- **Reason**: Starting an archived sandbox (cold storage) takes several minutes depending on size. The 60s default timeout was too short, causing spurious "Sandbox failed to become ready within the timeout period" failures on resumed tasks/projects. Extended timeout + user-facing message prevents confusion and false retries.

## Bound sandbox shell tools and safe typecheck output - 2026-05-19

- **Summary**: Implementation-task prompts now give Claude a typecheck command that writes output to a log before tailing it, and sandbox AI runner launches cap shell tool silence at four minutes.
- **Reason**: Long-running validation commands piped directly into `tail` could leave Claude inside a silent Bash tool until the watchdog killed the run for stale heartbeats.

## Prevent quick-task auto PR skips - 2026-05-19

- **Summary**: Successful quick-task runs now keep moving into auto PR creation even if deployment tracking scheduling fails or PR body enrichment cannot load optional proof/comment data.
- **Reason**: Post-run side work and synchronous PR body/link preparation were able to abort the workflow before the PR creation step, leaving successful runs with no PR URL and no PR error while the manual Create PR recovery still worked later.

## Guard stale schedules and PR base selection - 2026-05-19

- **Summary**: Scheduled quick tasks and project builds now carry their intended timestamp into the scheduler callback, and the callback only runs when the stored schedule is still due and matches the firing schedule. Manual project PR creation now resolves its base branch from the project, then repo setting, then fallback, and retargets an existing open PR if needed.
- **Reason**: Cancelling a scheduled function can race with execution, so callbacks must validate current persisted intent before starting work. Manual PR recovery also needs the same base-branch resolution as normal project builds to avoid falling back to `staging`.

## Separate sandbox navigation from sandbox lifecycle controls - 2026-05-18

- **What**: On quick task and project parent pages, "Start Sandbox" button becomes "View Sandbox" button that navigates to `/sandbox` without starting the sandbox. Start and Stop controls now live on the `/sandbox` page itself. Parent page View Sandbox button shows active state via emerald tint, pulsing green dot, and " · Active" suffix.
- **Why**: Clarifies the distinction between viewing the sandbox (navigation) and managing its lifecycle. Active indicator on parent ensures users remember to stop the sandbox when not in use. Chat remains available on `/sandbox` even when sandbox is inactive, so users can review conversation without starting.
- **Frontend**: Updated `TaskFooter` to always show "View Sandbox" when `canStartSandbox`, with active-state styling. Removed `onStartSandbox` and `onStopSandbox` props. `ProjectDetailClient` parent surface simplified to single "View Sandbox" button; sandbox surface now shows Start button when inactive (with chat on left) and Stop button in header when active. `QuickTaskSandboxClient` mirrors the project pattern.

## Clarify logs token totals - 2026-05-15

- **Summary**: Logs summary now separates pure input, output, cache read, and cache write usage into distinct cards beneath the cost and duration cards. Opencode log capture now treats input/cache-read as snapshots, accumulates output/cache-write across tool-call steps, and includes reasoning tokens in output-side totals.
- **Reason**: Token usage is easier to audit when cached and non-cached input categories are visible separately, and the opencode adapter previously over-counted repeated prompt snapshots while under-reporting generated reasoning tokens.

## Wire personalisation into sandbox chat responses - 2026-05-15

- **Summary**: Quick-task and project sandbox chat now include the sender's personalisation preset and custom instructions when building the chat prompt, so response style follows the user's selected communication preference without changing how autonomous task runs implement code.
- **Reason**: Personalisation is a response-formatting concern for conversational chat. Keeping it out of the main task execution prompt avoids altering implementation behavior while making sandbox chat consistent with user expectations.

## Stabilize quick-task auto PR creation - 2026-05-14

- **Summary**: Quick-task publishing now waits for GitHub to report the pushed task branch as ahead of the base branch before creating the pull request. This removes the timing window where the workflow pushed successfully but GitHub's PR API still could not see a PR-ready head, forcing users to click "Create PR" manually later.
- **Reason**: Auto PR creation depends on GitHub's branch comparison state after a fresh push. Waiting on the compare endpoint keeps publishing deterministic while preserving the existing manual recovery path.

## Add chat-in-sandbox for projects and quick tasks - 2026-05-13

- **What**: "View Sandbox" on a project or quick task now opens a two-pane layout — chat on the left, sandbox tabs (preview/terminal/logs) on the right — matching the standalone sessions experience. Each project has one persistent chat, each task has one persistent chat. Chat runs against the parent's existing sandbox; no new provisioning. Standalone sessions are unchanged.
- **Why**: Sessions, projects, and quick tasks had overlapping surfaces but inconsistent capability: sessions were chat+sandbox, projects/tasks were sandbox-only. Users who wanted to ask Eva about a running project or task had to leave for a separate session that did not know about the parent. Bringing the session-style two-pane in keeps the context with the running code.
- **Schema**: Extended `messages.parentId` and `queuedMessages.parentId` unions to include `Id<"projects">` and `Id<"agentTasks">`. Added `activeChatWorkflowId: v.optional(v.id("_scheduled_functions"))` to `projects` and `agentTasks` so chat workflow concurrency is tracked separately from existing build / task workflows.
- **Backend**: New `projectChatWorkflow.ts` and `agentTaskChatWorkflow.ts` (`addMessage`, `startExecute`, `enqueueMessage`, `cancelExecution`) mirror `sessionWorkflow.ts` rather than introducing a polymorphic dispatcher — duplication is cheap at 2 parent types and avoids premature abstraction. Per-parent system prompts in `_projects/chatPrompt.ts` and `_agentTasks/chatPrompt.ts` inject parent context (tasks, generated spec, description, tags, status). `queuedMessages.listByParent` widened to resolve `repoId` from any parent type. `_queues/helpers.ts` gains `startNextQueuedProjectChatMessage` / `startNextQueuedTaskChatMessage`. `workflowWatchdog.ts` adds `trackProjectChatWorkflow`, `trackAgentTaskChatWorkflow`, `handleStaleProjectChat`, `handleStaleAgentTaskChat` plus widens `timeoutLastMessage` parent union. Streaming entity IDs use `project-chat-${id}` / `task-chat-${id}` to avoid collision with existing project-build streaming.
- **Frontend**: Extracted parent-agnostic `ChatBody.tsx` from `sessions/ChatPanel.tsx` (messages list, queued messages, input area, model + response length + mode selectors). Session-specific chrome (summary accordion, plan-mode PRD view, PR controls) stays in `ChatPanel.tsx` and is passed in via slot props (`preConversationContent`, `beforeQueuedContent`, `preInputContent`, `toolsBefore`, `emptyStateOverride`). New thin wrappers `ProjectSandboxChatPanel.tsx` and `TaskSandboxChatPanel.tsx` wire mutations and per-parent local-storage settings. `ProjectDetailClient.tsx` sandbox surface, `TaskDetailInline.tsx` sandbox branch, and `QuickTaskSandboxClient.tsx` all now wrap the existing sandbox panel in `ResizablePanelLayout` with the chat wrapper on the left. Back to Tasks button moved from in-body header to `PageWrapper.headerRight` in projects. Added `defaultRightCollapsed?: boolean` to `ResizablePanelLayout` (defaults to `true` to preserve session behaviour) so View Sandbox can show the sandbox panel immediately rather than starting collapsed.
- **Reason**: Duplicating the session backend pattern is the right call at this scale — three near-identical workflow files is still less code than a polymorphic dispatcher with branch logic at every step. Revisit when a 4th parent type appears. Extracting `ChatBody` (not the entire `ChatPanel`) keeps session-specific UI co-located with session state and avoids forcing project/task wrappers to ignore unused props. `defaultRightCollapsed` keeps the existing session UX (chat-first, sandbox optional) while letting the new "View Sandbox" entry point default to showing both.

## Add "Open in new tab" context menu and Ctrl+click support to project and task cards - 2026-05-13

- **What**: Project and task cards now show an "Open in new tab" option in their right-click context menu. Ctrl+click (Cmd+click on Mac) on any card opens it in a new browser tab instead of the current view.
- **Why**: Improves workflow for users who want to open multiple items without losing their current position or view state. Common pattern across most web applications.
- **Change**: Updated `ProjectCard`, `QuickTaskCard`, and `TaskCardMenuItems` to accept an `href` prop and handle Ctrl/Cmd+click events. Propagated `basePath` from `useRepo()` context through all view components (list, kanban, table) to construct the proper URLs. Added context menu items with external-link icon in both card components.
- **Components touched**: `ProjectCard`, `ProjectsListView`, `ProjectsKanbanView`, `ProjectsTableView`, `QuickTaskCard`, `TaskCardMenuItems`, `QuickTasksListView`, `QuickTasksKanbanBoard`, `QuickTasksTableView`, `ProjectTaskListPanel`.

## Add project-level conflict resolution and startup command retry to More menus - 2026-05-12

- **What**: Task footer's "Resolve Conflicts" button moved to More dropdown. Project footer gains "Run Startup Commands" and "Resolve Conflicts" items in More dropdown (replacing standalone buttons on review screens).
- **Why**: Cleaner task footer with secondary actions consolidated. Projects now support force-rerunning startup commands (via `forceStartupCommands` workflow arg) and agent-driven conflict resolution on the project branch (spawns resolve_conflicts run on carrier task; agent runs in project sandbox on `project.branchName` vs `project.baseBranch`).
- **Backend**: `projectSandboxWorkflow` plumbed with `forceStartupCommands`; `daytona.startProjectPreviewSandbox` accepts force flag. New mutations `retryProjectStartupCommands` and `resolveProjectConflicts` in `_projects/sandbox.ts`.
- **Frontend**: Updated `useProjectSandbox` to expose `handleRetryStartupCommands`. `ProjectDetailClient` wired both dropdown items with appropriate show conditions (retry: `canStartSandbox && !starting && !stopping`; resolve: `project.prUrl && !activeBuild && phase === "active"`).

## Project "Make changes" queues to To Do for Build Project - 2026-05-20

- **Why**: Immediate `startExecution` on every change request fought the one-task-at-a-time project sandbox rule, left sibling tasks stuck in Business Review, and raced with in-flight workflow completions. Reviewers want to stack feedback on multiple tasks, then run everything once via Build Project.
- **Change**: Project tasks with "Make changes" now save the comment and move to To Do only (no instant Eva run). Build Project still runs `todo` tasks in `taskNumber` order; `getTaskData` feeds comments after the last successful run as change requests. Quick tasks still call `startExecution` immediately. Stale `completeRun` / build-event guards retained.

## Fix project task status stuck in Business Review on repeat "Make changes" - 2026-05-20

- **Why**: UI/backend mismatch and wrap-up race could reset status after a new run started; wrong `buildTaskDoneEvent` could advance the build for the wrong task.
- **Change**: Wrap-up window still blocks submit while a run is closing out. `completeRun` skips stale status updates. Build workflow waits for matching `taskId` on `buildTaskDoneEvent`.

## Projects badge shows running tasks; "Make changes" checkbox defaults true - 2026-05-12

- **Why**: Sidebar "Projects" badge only surfaced projects with active build workflows or sandboxes, leaving running agent tasks invisible at a glance. User review workflow defaulted "Make changes" checkbox to unchecked, requiring an extra click to request changes when most reviews prompt edits.
- **Change**: Backend `projects.getActive` now includes projects with `in_progress` task runs, counts them per project (`runningTaskCount`), and filters to active status. Frontend `BuildingProjectsBadge` renders a new "Running" section (loader glyph) listing projects with active tasks. Sidebar badge displays three indicators when active: running count, building count, sandbox count. Comments section "Make changes" checkbox defaults to `true` for reviewable statuses (`code_review`, `business_review`, `done`, `cancelled`), with placeholder and submit routing respecting the checkbox state; non-reviewable statuses continue to show plain "Add a comment" flow.
- **Reason**: Balances project visibility (running tasks ≠ builds, deserve equal prominence) and review UX (defaulting to "request changes" matches intent — user unchecks only if commenting without re-run).

## Replace remaining apps/web `as` casts with type guards and typed reducers - 2026-05-12

- **Why**: CLAUDE.md forbids `as` for type assertions, but several apps/web call sites still used `as` to paper over runtime-validated narrowing (parsed LLM JSON), unfortunate prop-type widening (kanban column status), and accumulator initialisation (status-grouped reduce). Bundle 22 of the refactor sweep targets these so the codebase stops treating its own type system as advisory and contributors stop pattern-matching on existing casts when they need their own narrowing.
- **Change**: `DocInterviewDialog.tsx` and `projects/ProjectChatTab.tsx` — lifted `isValidOption` (`"label" in o && typeof o.label === "string"`) and a new `isParsedQuestion` predicate to module scope so both the `currentQuestion` IIFE and the `handleAnswer`/equivalent code path narrow through the same guard; removed three `as ParsedQuestion` / `as OptionItem` casts. `kanban/KanbanBoard.tsx` — tightened the internal `VirtualKanbanColumn` prop type from `status: string` to `status: TaskStatus` (its callers already pass `KANBAN_STATUSES.filter(...)` values), so `statusConfig[status]` indexes without a cast. `projects/ProjectsClient.tsx` — added an exported `SORT_FIELDS = ["created", "title", "priority"] as const` tuple in `projects/_utils.ts` and derived `SortField` from it, then replaced `(Object.keys(SORT_FIELD_LABELS) as SortField[]).map(...)` with `SORT_FIELDS.map(...)`. `quick-tasks/QuickTasksListView.tsx` — replaced the `reduce(..., {} as Record<DisplayTaskStatus, Task[]>)` accumulator with a typed `for` loop building `Partial<Record<DisplayTaskStatus, Task[]>>`; the single consumer already used `?? []`. `tasks/_components/MarkdownEditor.tsx` — typed `placeholderStyle` as `CSSProperties & Record<\`--${string}\`, string>`so the CSS custom property`--placeholder-text`is allowed by the type system; dropped the`as React.CSSProperties`on the JSX`style`prop. Also folded the deferred Bundle 11 migration step:`\_migrations/deleteRepos.ts`now uses a`stepValidator` (`v.union(v.literal(...))`over every step) on the`internalMutation`args and`nextStep(step)`no longer needs`as Step`. Web typecheck clean; `convex codegen --typecheck enable` clean.
- **Reason**: Each cast was a runtime claim the type system was already capable of expressing once the surrounding shape was tightened. Removing them is cheap, mechanical, and stops the casts from spreading by precedent. Route-param `Id<>` casts (e.g. `id as Id<"docs">`) are deliberately deferred — those come from TanStack Router as strings and need a shared validator/boundary helper, which is a separate bundle.

## Split top-10 oversized web client components into `_components/` extractions - 2026-05-12

- **Why**: Seven of the top-ten largest `apps/web` client components had grown well past the 250-line guideline in CLAUDE.md, mixing the route-level orchestrator with self-contained sub-components and pure helpers. The largest offenders were `sessions/ChatPanel.tsx` (1,082 lines), `lib/components/Sidebar.tsx` (1,011 lines), `settings/SnapshotsClient.tsx` (813 lines), `quick-tasks/QuickTaskModal.tsx` (685 lines), `automations/AutomationClient.tsx` (645 lines), `EnvVarsTable.tsx` (579 lines), and `docs/DocViewer.tsx` (488 lines). Editing a `ConfirmDeleteButton` confirmation dialog or a `BuildRow` accordion meant scrolling through hundreds of lines of unrelated layout, queries, and form state to find the right place — and child components could not be reused or reasoned about independently.
- **Change**: Followed the established `_components/` and `_utils/` subfolder convention for "light split — obvious self-contained sub-components only" (no over-decomposition). Extracted: `docs/_components/ConfirmDeleteButton.tsx` (60 lines) from `DocViewer.tsx`; `_utils/parseEnvVars.ts` (27 lines) from `EnvVarsTable.tsx`; `sessions/_components/SessionPromptSubmit.tsx` (24 lines) plus `sessions/_utils/prStateIconClass.ts` (20 lines) from `ChatPanel.tsx`; `sidebar/TeamMembers.tsx` (126 lines) plus `sidebar/SidebarSearchButton.tsx` (20 lines) from `Sidebar.tsx`; `settings/_components/BuildRow.tsx` (146 lines, including `BuildStatusBadge` and `WarmupStatusBadge`) plus `formatFileSize` appended to `settings/_utils.ts` from `SnapshotsClient.tsx`; `quick-tasks/_components/AssigneeSelector.tsx` (96 lines) plus `quick-tasks/_components/ProjectPicker.tsx` (105 lines) from `QuickTaskModal.tsx`; and `automations/_components/RunAccordion.tsx` (320 lines, holding `LatestRun`, `RunHistory`, and the shared `RunAccordion` they both wrap) from `AutomationClient.tsx`. Each parent file removes the corresponding stale imports along with the inline definitions (e.g. `AutomationClient.tsx` drops `Badge`, `ActivitySteps`, `useElapsedSeconds`, `formatElapsed`, six tabler icons, `dayjs`, `formatDuration`, `parseActivitySteps`, `Streamdown`, `cjk`, `math`, `mermaid`, and `summaryPlugins` now that `RunAccordion` owns them). `AutomationClient.tsx` drops from 645 to 335 lines; `QuickTaskModal.tsx` from 685 to 523; `Sidebar.tsx` from 1,011 to 874; `SnapshotsClient.tsx` from 813 to 654. `ChatPanel.tsx`, `EnvVarsTable.tsx`, and `DocViewer.tsx` see smaller but still meaningful trims. Web typecheck clean.
- **Reason**: Splitting only the obvious sub-components (no premature interface design, no inventing new abstractions) gives the biggest readability win for the smallest behavioural risk. Route-level files now read closer to "orchestrator + layout composition" with the leaf widgets clearly named and locatable in `_components/`, which makes future targeted edits — a confirmation dialog tweak, a build-row status copy change, an assignee picker behaviour — touch ~100-line files instead of ~700-line ones. The remaining route files (especially `ChatPanel.tsx` at 1,038 and `Sidebar.tsx` at 874) are still large but only because their core logic genuinely belongs together; a deeper split would force a shared-prop or context plumbing layer that's not yet justified.

## Enforce 7-day minimumReleaseAge for pnpm dependencies — 2026-05-12

- **Why**: Newly published npm packages are the prime vector for supply-chain attacks (typosquats, compromised maintainer accounts, post-publish malicious updates). Installing a version within hours of its release means there is no community window for the wider ecosystem to flag and yank a bad release before it lands in `node_modules`.
- **Change**: Added `minimumReleaseAge: 10080` (minutes, = 7 days) to `pnpm-workspace.yaml`. pnpm will refuse to install any package version younger than seven days from its publish timestamp across all workspaces.
- **Reason**: Cheap, repo-wide policy that buys a meaningful detection window without touching CI or developer workflow for normal upgrades. Aligns with current industry guidance on supply-chain hygiene.

## Docs: URL tabs, markdown-first PRD, session-linked save — 2026-05-11

- **Why**: Doc viewer tabs (content vs requirements vs user flows) lived only in component state, so refresh, back/forward, and shared links could not land on the right surface. Requirements and user flows were edited as separate lists while the canonical PRD lived in `content`, which invited drift and duplicated mental models. Session PRD/plan content had no durable “save as repo document” path tied to the session, and the PRD-parse workflow still accepted a duplicate `prdContent` argument instead of always reading the stored document body.
- **Change**: Replaced `docs/$id` with a small route tree: `docs/$id` layout + `docs/$id/` redirect to the default tab + `docs/$id/$docTab` (`content` | `requirements` | `user-flows`) with `beforeLoad` validation and `DocViewer` tab changes via `navigate`. Added `DocViewerTab` / `DOC_VIEWER_DEFAULT_TAB` / `isDocViewerTab` in `search-params.ts` and updated doc links (Docs sidebar, Spotlight, chat mention navigation, save-as-document navigation) to include the tab segment. Reworked `DocViewer`: Content tab shows rendered markdown (or empty state), Edit uses a shared `MarkdownEditor` (file moved from `SessionPrdPlanEditor.tsx`), copy affordance, read-only Requirements/User Flows lists with counts on triggers, and saving markdown calls `startPrdParse` so structured fields stay derived from the PRD. Backend: optional `sessionId` on `docs` plus `by_session` index; `getBySession` and `createFromSession` (insert or patch when a doc already exists for the session); `create` / `update` no longer accept requirements/userFlows (extraction owns those); `docPrdWorkflow` / `startPrdParse` drop redundant `prdContent` and read `doc.content`; `saveResult` keeps a non-empty manual description instead of always overwriting from the model. Session PRD panel wires Save/Update Document, reuses `MarkdownEditor`, and navigates to `…/docs/<id>/content`. Sidebar: Documents nav item is no longer `devOnly`-gated (flag commented). Regenerated `routeTree.gen.ts`. Added `mention-documents-in-session-prompt-input.md` (design notes) and appended items to `internal/prompt-history.txt`.
- **Reason**: Aligns the product with “markdown PRD is authoritative, structured fields are extracted,” makes doc viewing bookmarkable and consistent with other tabbed areas (e.g. settings snapshots), and gives sessions an explicit, idempotent link to a persisted document for iteration without losing the association.

## Audit ChatPanel + SessionSidebar duplication; consolidate only chrome-ext formatDuration - 2026-05-11

- **Why**: Bundle 20 of the refactor sweep was scoped as "consolidate ChatPanel + SessionSidebar primitives between web and chrome-extension." On audit, the two ChatPanels (web `sessions/ChatPanel.tsx` at 1,082 lines vs chrome-extension `sidepanel/components/ChatPanel.tsx` at 658 lines) share UI primitives via `@conductor/ui` but diverge meaningfully in feature surface: web carries edit/plan modes, PR creation, code review, pending multiple-choice questions, queued messages with mode metadata; chrome-extension carries selection/annotation tools, captured-context display, page-URL injection, and ephemeral in-memory messages. Likewise the sidebars: web `SessionListSidebar.tsx` (538 lines) integrates TanStack Router, copy-link/copy-title context menus, rename, duplicate; chrome-extension `SessionSidebar.tsx` (352 lines) uses direct callbacks and Clerk's UserButton with none of those affordances. The one concrete duplication was chrome-extension ChatPanel's local `formatDuration` (lines 68–76), byte-identical to `packages/shared/src/utils/duration.ts`.
- **Change**: Replaced chrome-extension's local `formatDuration` with `import { formatDuration } from "@conductor/shared/duration"`. Removed the nine-line local function body. No behavioural change.
- **Reason**: Pulling a shared `<ChatMessage>` or `<ChatInputBar>` would force the shared component to handle every web mode/PR/review/question variant plus every chrome-extension selection/annotation/ephemeral variant — or strip features from one side. Either path violates "avoid premature abstractions" and grows surface area. The sidebar pair is similarly blocked on feature parity (chrome-extension has no rename/duplicate/copy-link). The right move is to keep the components separate and consolidate only the verified duplicate. Revisit when feature parity arrives or when one side rewrites toward the other.

## Consolidate parseActivitySteps into packages/shared - 2026-05-11

- **Why**: `parseActivitySteps` was duplicated identically in `apps/web/src/lib/utils/parseActivitySteps.ts` (11 callers) and `apps/chrome-extension/src/shared/parseActivitySteps.ts` (1 caller in `ChatPanel.tsx`). The function parses the JSON `activityLog`/`currentActivity` strings into `ActivityStep[]` arrays the `@conductor/ui` `<ActivitySteps>` component renders. Two copies meant fixing a parse bug (e.g. handling a new step shape) required touching two files in two apps, with no compiler to enforce parity.
- **Change**: Created `packages/shared/src/utils/parseActivitySteps.ts` containing the (single, unchanged) function and added `./parseActivitySteps` to the `@conductor/shared` package exports. Updated all 12 callers (11 web + 1 chrome-extension) to import from `@conductor/shared/parseActivitySteps`. Deleted both duplicate source files. Web and chrome-extension typecheck unchanged (no new errors introduced — only pre-existing `TS6133` unused-variable noise in unrelated backend/UI files remains).
- **Reason**: Removes the silent-divergence risk and preps Bundle 20 (consolidating `ChatPanel` + `SessionSidebar` between web and chrome-extension), which will need a single shared import path for `parseActivitySteps` rather than two app-local copies.

## Consolidate isRecord and formatDuration into packages/shared - 2026-05-11

- **Why**: `isRecord` was defined identically in four places (`apps/web/src/lib/utils/logs.ts`, `convex/linearActions.ts`, `convex/_automationWorkflow/findings.ts`, `convex/_taskWorkflow/auditParser.ts`) and `formatDuration*` lived in `apps/web/src/lib/utils/formatDuration.ts` with seven web callers — meanwhile, the backend had two divergent stubs of `formatDurationMs(ms) → "${ms}ms"` at `_daytona/git.ts:69` and `_daytona/sessions.ts:42` used across 16 log call sites. Same intent, drifting implementations, no single source of truth.
- **Change**: Created `packages/shared/src/utils/typeGuards.ts` exporting `isRecord`, and `packages/shared/src/utils/duration.ts` exporting `formatDuration`, `formatDurationMs`, `formatDurationMsShort` (lifted verbatim from the web util). Added `./typeGuards` and `./duration` to the `@conductor/shared` package exports and added `@conductor/shared` as a workspace dep on `@conductor/backend`. Deleted `apps/web/src/lib/utils/formatDuration.ts` and updated seven web callers to import from `@conductor/shared/duration`. Removed the four local `isRecord` definitions and routed callers through `@conductor/shared/typeGuards`. Replaced both backend `formatDurationMs` stubs with `formatDurationMsShort` (returns `"500ms"` / `"23.5s"` instead of `"23456ms"`), upgrading 16 daytona git/session log lines to human-readable durations.
- **Reason**: The duplication was small per file (~3 lines for `isRecord`, ~26 for `formatDuration`) but cumulatively meant six call-site behaviours diverging silently — particularly the backend stub losing the precision the web version already provided. Centralising both utilities makes `@conductor/shared` the natural home for cross-package primitives and unlocks the next bundles (more shared utils, then component sharing).

## Split audits.ts into \_audits/ subfolder - 2026-05-11

- **Why**: `convex/audits.ts` had grown to 343 lines holding eight Convex functions across three concerns: three read queries (`listByTask`, `getActivityLog`, `getBySession` + the shared `auditReturnValidator` shape — ~95 lines), the session-audit lifecycle (`startSessionAudit`, `handleSessionCompletion`, plus the `fail` internal mutation called from `_daytona/audit.ts` — ~140 lines), and the audit-fix flow (`runSelectedFixes`, `saveAuditFixSandboxId` + `auditFailureValidator` — ~95 lines). Tweaking the fix-flow scheduler or the session-audit JSON parsing meant scrolling through the three concerns.
- **Change**: Created `_audits/{queries,sessionAudit,fixes}.ts`. `queries.ts` (~105 lines) holds the three read queries plus `auditReturnValidator`. `sessionAudit.ts` (~135 lines) holds the two session-audit auth mutations plus the `fail` internal mutation (whose two call sites in `_daytona/audit.ts:299,328` are both inside the session-audit flow). `fixes.ts` (~100 lines) holds the audit-fix flow plus its local `auditFailureValidator`. Rewrote `audits.ts` as a 17-line barrel. Convex codegen keeps both `api.audits.X` and `api["_audits/Y"].X` paths registered, so the 12 caller references (5 frontend `api.audits.*`, 3 internal `internal.audits.{fail,saveAuditFixSandboxId}` from `_daytona/audit.ts`) resolve unchanged.
- **Reason**: Matches the established `_sessions/`, `_designSessions/`, `_automations/`, `_repoSnapshots/`, `_migrations/`, `_github/`, `_agentRuns/` subfolder pattern. Editing the session-audit prompt parsing or the fix-flow now touches a ~100-135 line file instead of the 343-line catch-all. Barrel keeps the change non-breaking.

## Extract owner resolution and Daytona PTY helpers from pty.ts - 2026-05-11

- **Why**: `convex/pty.ts` had grown to 363 lines mixing three concerns: a discriminated-owner type, validator, and `resolveOwner` function that maps session/task/project IDs to their sandbox + repo + default-pty pointer (~90 lines), three pure Daytona PTY helpers (`createPtyInWorkspace`, `ensurePtySessionReady`, `getToolboxBaseUrl` plus the `DAYTONA_API_URL` and `PTY_WORKSPACE_CANDIDATES` constants — ~65 lines), and the three Convex actions (`connectPty`, `resizePty`, `disconnectPty`) that compose those helpers. Tweaking the owner discriminator (e.g. adding a new owner kind) meant scrolling past 60+ lines of Daytona-specific HTTP/SDK glue.
- **Change**: Created `_pty/owners.ts` (~95 lines, no `"use node"` directive — owner resolution uses only Convex runQuery/runMutation, not Node APIs) for the `ownerArg` validator, `ResolvedOwner` interface, and `resolveOwner` function. Created `_pty/daytona.ts` (~80 lines, marked `"use node"` since it imports `@daytonaio/sdk`) for the three PTY helpers and the workspace/API-URL constants. `pty.ts` now imports both modules and contains only the three action definitions, down from 363 to 200 lines. No Convex API surface changed (the helpers are pure functions, not Convex functions) so no caller paths needed updating.
- **Reason**: Owner resolution and Daytona PTY mechanics are independent concerns that benefit from separation — owner kinds may grow as new sandbox-owning entity types appear, and the PTY helpers may grow as we extend reconnect/lifecycle handling. Both can now evolve independently in ~80-95 line files instead of the 363-line catch-all.

## Extract prompts and findings parser from automationWorkflow.ts - 2026-05-11

- **Why**: `convex/automationWorkflow.ts` had grown to 385 lines mixing three concerns: three prompt builders for the implementation, read-only, and actionable-findings modes (~110 lines combined), the `parseFindingsFromResult` parser plus its `ParsedFinding` interface, `Severity` type, `VALID_SEVERITIES` table, and the local `isRecord` type guard (~80 lines), and the actual `automationExecutionWorkflow` definition. Tweaking a prompt rule or adjusting the JSON schema for findings meant scrolling past the 180-line workflow handler.
- **Change**: Created `_automationWorkflow/prompts.ts` (~115 lines) for the three prompt builders (`buildAutomationPrompt`, `buildReadOnlyPrompt`, `buildActionableReportPrompt`) and `_automationWorkflow/findings.ts` (~80 lines) for the `parseFindingsFromResult` function, the `ParsedFinding` interface, the `VALID_SEVERITIES` table, and the local `isRecord` helper. Rewrote `automationWorkflow.ts` to import the helpers — the file is now down to 185 lines and contains only the workflow definition. No Convex API surface changed (the helpers are pure functions, not Convex functions) so no caller paths needed updating.
- **Reason**: Prompt copy is the most frequently edited part of automation logic, and the findings parser is pure logic that is unit-testable in isolation. Co-locating both with the workflow file made each easier to find but harder to navigate. Matches the established `_taskWorkflow/{prAudit,deploymentHelpers}` helper pattern.

## Split agentRuns.ts into \_agentRuns/ subfolder - 2026-05-11

- **Why**: `convex/agentRuns.ts` had grown to 414 lines mixing seven read queries (~205 lines for `get`, `getWithDetails`, `getActivityLog`, `listByTask`, `getTaskIdsWithLatestRunError`, `getLatestDeploymentStatuses`, `getLatestDeploymentByProject` plus the `agentRunValidator`/`agentRunSummaryValidator` shapes), three auth mutations (`updateStatus`, `appendLog`, `complete` — ~140 lines), one internal mutation (`updateDeploymentStatus` — ~20 lines), and the `buildRunNotificationMessage` helper used only by `complete`. Editing the run-completion notification copy meant scrolling past 200+ lines of unrelated query handlers.
- **Change**: Created `_agentRuns/queries.ts` (~210 lines) for the seven read queries plus the two validator shapes, and `_agentRuns/mutations.ts` (~200 lines) for all four mutations plus the `buildRunNotificationMessage` helper. Rewrote `agentRuns.ts` as a 16-line barrel. Convex codegen keeps both `api.agentRuns.X` and `api["_agentRuns/Y"].X` paths registered, so the 14 caller sites (`taskWorkflowActions.ts`, plus 11 frontend components and 2 plan docs) and the `internal.agentRuns.updateDeploymentStatus` reference all resolve unchanged.
- **Reason**: Matches the established subfolder pattern (`_sessions/`, `_designSessions/`, `_automations/`, `_repoSnapshots/`, `_migrations/`, `_github/`). Editing a notification message touches a 200-line file instead of a 414-line catch-all. Barrel keeps the change non-breaking.

## Migrate sessionWorkflow.ts into \_sessions/ subfolder - 2026-05-11

- **Why**: `convex/sessionWorkflow.ts` had grown to 738 lines holding ten distinct functions across three concerns: two prompt builders (`buildPlanPrompt`, `buildEditPrompt` — ~60 lines), two durable workflow definitions plus their supporting internal mutations (`sessionSandboxStartupWorkflow`, `sessionExecuteWorkflow`, `addAssistantPlaceholder`, `getSessionData`, `updateSandboxId`, `saveResult`, `scheduleSessionDeploymentTracking`, `handleCompletion` — ~460 lines), and the three frontend-facing auth mutations (`startExecute`, `enqueueMessage`, `cancelExecution` — ~140 lines). The `_sessions/` subfolder already existed (`queries.ts`, `mutations.ts`, `sandbox.ts`, `helpers.ts`, `internal.ts`, `pty.ts`) but the workflow definition lived in the top-level file, breaking the established pattern and forcing edits to a 738-line file when changing prompt copy or queue/cancel semantics.
- **Change**: Created `_sessions/prompts.ts` (~70 lines) for the two prompt-builder functions, `_sessions/workflow.ts` (~528 lines) for the two workflow definitions plus their internal mutations and the shared `sessionCompleteEvent`/`handleCompletion` pair, and `_sessions/execution.ts` (~140 lines) for the three frontend auth mutations. Rewrote `sessionWorkflow.ts` as a 16-line barrel that re-exports every public function. Convex codegen keeps both `api.sessionWorkflow.X` and `api["_sessions/Y"].X` paths registered, so internal cross-references (`internal.sessionWorkflow.sessionExecuteWorkflow` from `_queues/helpers.ts`, `internal.sessionWorkflow.sessionSandboxStartupWorkflow` from `_sessions/{sandbox,mutations}.ts`, the `"sessionWorkflow:handleCompletion"` callback string in `launchOnExistingSandbox`) and frontend callers (`api.sessionWorkflow.{startExecute,enqueueMessage,cancelExecution}` in both `ChatPanel` implementations) all resolve unchanged.
- **Reason**: Matches the established `_sessions/`, `_designSessions/`, `_automations/`, `_repoSnapshots/`, `_migrations/`, and `_github/` subfolder pattern. Editing prompt copy now touches a 70-line file, tweaking the cancel-execution semantics touches a 140-line file, and the durable workflow logic is isolated from the frontend control surface. Barrel keeps the change non-breaking.

## Split github.ts into \_github/ subfolder and deduplicate getAppOctokit - 2026-05-11

- **Why**: `convex/github.ts` had grown to 518 lines mixing three distinct concerns: read-only GitHub API actions (`getInstallationTokenAction`, `listBranches`, `listRepos`, `detectMonorepoApps`, `listAllAvailableRepos` — ~165 lines), session PR creation flow (`createSessionPr` for finalizing a draft and `createDraftSessionPr` for the initial draft — ~170 lines), and the heavy installation-walking `syncRepos` action with its monorepo detection (~165 lines). The `getAppOctokit` helper for authenticating as the GitHub App was defined inline in `github.ts` while `githubAuth.ts` already had three other Octokit/auth helpers (`getInstallationToken`, `getInstallationOctokit`, `getGitHubCredentials`) — a clear miss.
- **Change**: Created `_github/{helpers,api,prFlow,sync}.ts` — `helpers.ts` holds the two file-local helpers (`extractPrNumber`, `detectAppsForRepo`), `api.ts` holds the five GitHub API read actions, `prFlow.ts` holds the two PR creation actions, and `sync.ts` holds `syncRepos`. Moved `getAppOctokit` into `githubAuth.ts` alongside the other GitHub App auth helpers and imported it from the two consumers (`api.ts`, `sync.ts`). Rewrote `github.ts` as a 12-line `"use node"` barrel that re-exports every public action. Convex codegen keeps both `api.github.X` and `api["_github/Y"].X` paths registered, so the 9+ caller sites (`useBranches`, `MonorepoClient`, `sync.tsx`, `ChatPanel`, `RepoSetupClient`, `ReposClient`, the `internal.github.createDraftSessionPr` reference in `sessionWorkflow.ts`, and the `path: "github:getInstallationTokenAction"` string reference in `_daytona/callbackScript.ts`) resolve unchanged.
- **Reason**: Adding a new GitHub API endpoint, tweaking the PR-creation flow, or extending sync now touches one ~100-180 line file instead of the 518-line catch-all. Co-locating all `getAppOctokit`/`getInstallationOctokit`/`getGitHubCredentials` definitions in `githubAuth.ts` removes a duplicate `createAppAuth(creds)` construction and gives future callers a single import location for app-level auth.

## Split migrations.ts into \_migrations/ subfolder - 2026-05-11

- **Why**: `convex/migrations.ts` had grown to 525 lines holding six unrelated one-off operational scripts: a stale-run sweeper (`cleanupStaleRuns`), the 10-step repo-deletion pipeline plus its two scope helpers (`deleteRepoStep`, `deleteNonEvalucomRepos`, `deleteEvalucomRepos` — ~310 lines combined), a session-mode mode migration (`migrateSessionModes`), and a one-shot URL backfill (`backfillDeploymentUrlScheme`). Each script is its own self-contained story but landing in `migrations.ts` meant scanning past the 250-line `deleteRepoStep` switch to find a 30-line backfill.
- **Change**: Created `_migrations/{cleanup,deleteRepos,sessionModes,deploymentUrl}.ts`, each holding one logical migration concern (the three repo-deletion functions stay co-located in `deleteRepos.ts` since they share the `STEPS` constant and `nextStep` helper). Rewrote `migrations.ts` as an 8-line barrel. Convex codegen keeps both `api.migrations.X` and `api["_migrations/Y"].X` paths registered; the only `internal.migrations.deleteRepoStep` references are inside `deleteRepos.ts` itself (the recursive scheduler call and the two scope-filter handlers), and all resolve via the barrel.
- **Reason**: Future one-off migrations now drop in as a new ~30-line file in `_migrations/` instead of accreting onto a 500-line catch-all. Locating "the URL backfill" or "the stale-run sweeper" is now obvious from the filename. Barrel keeps the change non-breaking.

## Split repoSnapshots.ts into \_repoSnapshots/ subfolder - 2026-05-11

- **Why**: `convex/repoSnapshots.ts` had grown to 543 lines holding 14 Convex functions across three distinct concerns: snapshot config CRUD with cron management (~250 lines for `getRepoSnapshot`, `getRepoSnapshotName`, `getRepoSnapshotInternal`, `saveRepoSnapshot`, `setSnapshotEnabled`, `deleteRepoSnapshot`, plus the `findSnapshotForRepo` helper and `resolveCronspec`), the snapshot build lifecycle (~240 lines for `listBuilds`, `getBuild`, `getBuildStatus`, `triggerScheduledBuild`, `startBuild`, `completeBuild`, `updateWarmupStatus`, `appendLogs`, plus the `STALE_BUILD_MS` and `MAX_CRON_RETRIES` constants), and three repo-metadata queries used by the Daytona action layer (`getStartupCommands`, `getBackgroundCommands`, `getRepo`). Editing the build retry policy meant scrolling past the entire config-and-cron surface.
- **Change**: Created `_repoSnapshots/{config,builds,repoMetadata}.ts` — `config.ts` holds the six CRUD/cron functions plus the shared `findSnapshotForRepo` lookup, `builds.ts` holds the eight build lifecycle functions plus the timeout/retry constants, and `repoMetadata.ts` holds the three repo-info queries. Rewrote `repoSnapshots.ts` as a 23-line barrel that re-exports every function. Convex codegen keeps both `api.repoSnapshots.X` and `api["_repoSnapshots/Y"].X` paths registered, so the 25+ internal cross-references in `snapshotActions`, `snapshotWorkflow`, `_daytona/{lifecycle,execution,helpers}`, and the cron handler reference inside `config.ts` itself all resolve unchanged via the barrel.
- **Reason**: Matches the existing `_sessions/`, `_automations/`, and `_designSessions/` subfolder pattern — adding a new build retry tier or snapshot config field now touches one ~100-250 line file instead of the 543-line catch-all. Barrel keeps the change non-breaking.

## Split designSessions.ts into \_designSessions/ subfolder - 2026-05-11

- **Why**: `convex/designSessions.ts` had grown to 591 lines holding 19 Convex functions spanning five distinct concerns: read queries (list/listArchived/countActive/get), mutation CRUD (create/update/addMessage/updateLastMessage/selectVariation/archive/unarchive), the Daytona sandbox lifecycle (updateSandbox/startSandbox/stopSandbox/finalizeStopSandbox/markSandboxClosed/sandboxReady/sandboxError), the chat execution flow (executeMessage/enqueueMessage/cancelExecution), and the sandbox startup workflow definition. Editing a message-streaming helper meant scrolling past the entire sandbox state machine.
- **Change**: Created `_designSessions/{queries,mutations,sandbox,execution,workflow}.ts`, each grouping like with like (read queries plus the shared `designSessionValidator` in `queries.ts`, CRUD + message helpers in `mutations.ts`, the seven sandbox lifecycle handlers in `sandbox.ts`, the three chat-execution mutations in `execution.ts`, and the `designSandboxStartupWorkflow` in `workflow.ts`). Rewrote `designSessions.ts` as a 35-line barrel that re-exports everything — Convex codegen registers the functions at both `api.designSessions.X` (barrel) and `api["_designSessions/Y"].X` (canonical) paths so all existing caller sites work unchanged, and internal cross-references like `internal.designSessions.designSandboxStartupWorkflow`, `internal.designSessions.finalizeStopSandbox`, and `internal.designSessions.markSandboxClosed` resolve via the barrel without rewrites.
- **Reason**: Matches the existing `_sessions/`, `_agentTasks/`, and `_automations/` subfolder pattern — file responsibility is now obvious from the filename, and adding a new sandbox lifecycle field or chat-execution behaviour touches one ~30-205 line file instead of the 591-line catch-all. Barrel keeps the change non-breaking.

## Split automations.ts into \_automations/ subfolder - 2026-05-11

- **Why**: `convex/automations.ts` had grown to 645 lines holding 13 Convex functions for four distinct concerns: automation CRUD (list/get/create/update/remove), automation runs lifecycle (listRuns/acknowledgeRun/countUnreadByRepo/getAutomationData/updateRunStatus/clearRunWorkflow/cancelRun/handleCompletion), the cron-and-manual triggers (triggerAutomation/runNow with ~70 lines of duplicated workflow-start glue), and the findings-to-tasks pipeline (createTasksFromFindings/autoStartTask). Adding a new run-lifecycle field meant scrolling past the cron handler and findings pipeline.
- **Change**: Created `_automations/{crud,triggers,runs,findings}.ts`, each grouping by concern (CRUD in `crud.ts`, the two workflow-start triggers in `triggers.ts`, all run-lifecycle queries/mutations in `runs.ts`, and the findings flow in `findings.ts`). Rewrote `automations.ts` as a 19-line barrel that re-exports every function — Convex's codegen registers the functions at both `api.automations.X` (barrel) and `api["_automations/Y"].X` (canonical) paths, so all 20+ existing caller sites in the frontend (`AutomationClient`, `AutomationsSidebar`, `UnreadAutomationsBadge`, `FindingsList`, `$id`) and backend (`automationWorkflow.ts`, internal `update` cron handler, `createTasksFromFindings` scheduler) work unchanged.
- **Reason**: Matches the existing `_sessions/` and `_agentTasks/` subfolder pattern — file responsibility is now obvious from the filename, and adding a new run-lifecycle field or finding-mapping rule touches one ~150-line file instead of the 645-line catch-all. Barrel keeps the change non-breaking.

## Extract pr-audit and deployment helpers from taskWorkflowActions.ts - 2026-05-11

- **Why**: `convex/taskWorkflowActions.ts` had grown to 874 lines mixing three concerns: pure markdown helpers for the PR audit section (~100 lines), Convex actions that create/refresh/append PRs (~380 lines), and deployment status polling with its own helpers (~80 lines of pure logic on top of two `internalAction` polling loops). Splitting the Convex action exports out would change the `internal.taskWorkflowActions.X` references at ~25 call sites, but the pure helpers can move without renaming any API path.
- **Change**: Created `_taskWorkflow/prAudit.ts` for the markdown-table audit helpers (`escapeTableCell`, `buildAuditSection`, `mergeBodyWithAuditSection`, `AUDIT_SECTION_REGEX` and the local `AuditRow`/`AuditSection`/`ParsedAudit` types) and `_taskWorkflow/deploymentHelpers.ts` (marked `"use node"`, contains `mapGitHubDeploymentState`, `isTerminalDeploymentStatus`, `resolveStableDeploymentUrl`, plus the `MAX_POLL_ATTEMPTS` / `POLL_INTERVAL_MS` constants and the `DeploymentStatus` type). `taskWorkflowActions.ts` now imports the helpers and only houses the eight Convex actions (`createTaskPr`, `createProjectPr`, `createPullRequest`, `convertPrToDraft`, `markPrReadyForReview`, `appendAuditToPullRequest`, `refreshPullRequestBody`, `pollDeploymentStatus`, `pollSessionDeploymentStatus`) plus the local `findOpenPullRequestForBranch` helper — down from 874 to 698 lines.
- **Reason**: PR audit formatting and deployment status mapping are pure logic with no Convex action surface — keeping them in the actions file made the file harder to navigate without justifying the coupling. All Convex API references (`internal.taskWorkflowActions.*`, `api.taskWorkflowActions.*`) stay unchanged so no caller updates were needed.

## Split validators.ts into \_validators/ subfolder - 2026-05-11

- **Why**: `convex/validators.ts` had grown to 931 lines mixing four unrelated concerns: Convex validators (enums, shapes, table field defs), AI model configuration (validators + types + helper functions, ~390 lines), and the `PERSONALISATION_PRESETS` constant. Navigating to find "what statuses can a session have" required scrolling past the entire AI model registry.
- **Change**: Created `_validators/{enums,shapes,tableFields,aiModels,personalisation}.ts`, each grouping like with like (33 enum-style literal unions in `enums.ts`, 10 compound object validators in `shapes.ts`, 12 table `*Fields` defs in `tableFields.ts`, the full AI-model surface in `aiModels.ts`, and the role-based presets in `personalisation.ts`). `validators.ts` is now a 5-line barrel that re-exports everything via `export *`, so all 50+ existing import sites and the `@conductor/backend` public surface in `index.ts` continue to work unchanged.
- **Reason**: Adding a new task status, table field, or AI model now means opening one ~100-200 line file instead of the 931-line catch-all. Re-export barrel keeps the change non-breaking for consumers.

## Migrate remaining workflows from prepareSandbox action to prepareSandboxSteps - 2026-05-11

- **Why**: Five workflows (`docPrdWorkflow`, `docInterviewWorkflow` (x2), `projectInterviewWorkflow` (x2), `summarizeWorkflow`, `testGenWorkflow`) still called `step.runAction(internal.daytona.prepareSandbox, ...)` and unwrapped `{ sandboxId }` — the atomic action wrapper around sandbox setup. The newer `prepareSandboxSteps` helper performs the same work as discrete workflow steps and emits per-step progress (creating sandbox, fetching branches, setting up branch, running startup commands), giving users visible progress in the streaming UI during slow operations.
- **Change**: Replaced all 7 sites with `prepareSandboxSteps(step, { ... })`. The helper returns the `sandboxId` directly so the `{ sandboxId }` destructure becomes a plain assignment; `ephemeral` is now explicit at each call site (`false` everywhere except `testGenWorkflow`, which keeps `true`). Added `import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";` to each file.
- **Reason**: Sandbox setup progress is no longer hidden behind a single opaque action — interview, summarize, PRD-parse, and test-gen flows now report the same per-step progress that task and automation workflows already showed. Future improvements to sandbox preparation (extra steps, retry policies) only need to land in one file.

## Extract cancelTrackedWorkflow and safeReplaceCron helpers - 2026-05-11

- **Why**: Eleven mutations across the backend (`automations`, `buildWorkflow` x2, `designSessions`, `migrations`, `sessionWorkflow`, `testGenWorkflow`, `workflowWatchdog` x2, `_taskWorkflow/recovery`, `_taskWorkflow/publicMutations`, `_taskWorkflow/watchdog`) repeated the same try/swallow `workflow.cancel(ctx, entity.activeWorkflowId as WorkflowId)` pattern. Separately, `automations` and `repoSnapshots` each instantiated their own `Crons` client and inlined the same delete-if-tracked-then-register-if-spec sequence for managing cron jobs.
- **Change**: Added `cancelTrackedWorkflow(ctx, workflowId)` to `workflowManager.ts` (handles the undefined case and swallows already-cancelled errors), and a new `cronManager.ts` exporting a shared `crons` client plus `safeDeleteCron` and `safeReplaceCron<F>` helpers (`safeReplaceCron` preserves the link between `handler` and `args` via `FunctionArgs<F>`). Migrated all 12 cancel sites and 5 cron management sites; `sessionWorkflow.ts`'s user-initiated cancel now also swallows already-completed errors, matching the rest of the backend. Dropped redundant `WorkflowId`/`workflow`/`Crons`/`components` imports from the migrated files.
- **Reason**: The `WorkflowId` cast lives in one place. Cron lifecycle policy (e.g. logging which cron was replaced, retry behaviour on register failure) becomes a one-file edit instead of a four-site sweep.

## Extract sendCompletionEvent helper - 2026-05-11

- **Why**: Fourteen mutations across the backend (workflow completion callbacks in `summarizeWorkflow`, `testGenWorkflow`, `docPrdWorkflow`, `docInterviewWorkflow` (x2), `projectInterviewWorkflow` (x2), `evaluationWorkflow` (x2), `designWorkflow`, `sessionWorkflow`, `automations`, plus the build-task done senders in `_taskWorkflow/runLifecycle` and `_taskWorkflow/watchdog`, and the task completion + audit mutations in `_taskWorkflow/publicMutations`) repeated the same `workflow.sendEvent(...)` pattern: spread an event spec, cast `entity.activeWorkflowId` to `WorkflowId`, then build a `{ success, result, error, activityLog }` (or build-task-shaped) value.
- **Change**: Added a generic `sendCompletionEvent<Name, V>(ctx, event, workflowId, value)` helper to `_taskWorkflow/helpers.ts`. The helper accepts the event spec from `defineEvent`, a raw workflow id string, and a value typed via `Infer<V>` from the event's validator — so each call site gets the same per-event value type checking it had before. Migrated all 14 sites. Dropped six unused `WorkflowId` imports from the migrated workflow files; `_taskWorkflow/runLifecycle.ts` lost its `workflow`/`WorkflowId` imports entirely after migration.
- **Reason**: The `WorkflowId` cast now lives at one boundary instead of fourteen, ahead of the wider `as`-removal pass. Changing how completion events are dispatched (e.g. adding tracing, retry on transient errors) is a one-file edit.

## Extract per-entity workflow tracker helpers - 2026-05-11

- **Why**: Fourteen mutations across the backend repeated the same three-step pattern after `workflow.start(...)`: convert the workflow id to a string, patch `activeWorkflowId` (or `activeBuildWorkflowId`) on the owning entity, and schedule the matching `handleStaleX` watchdog with `RUN_TIMEOUT_MS`. Every entity (sessions, design sessions, docs, projects, evaluation reports, project builds) hardcoded its own copy of `internal.workflowWatchdog.handleStaleX` and `String(workflowId)`.
- **Change**: Added six per-entity tracker helpers (`trackSessionWorkflow`, `trackDesignSessionWorkflow`, `trackDocWorkflow`, `trackProjectWorkflow`, `trackEvaluationWorkflow`, `trackProjectBuildWorkflow`) to `workflowWatchdog.ts`. Migrated all 14 call sites in `summarizeWorkflow`, `testGenWorkflow`, `docPrdWorkflow`, `docInterviewWorkflow`, `projectInterviewWorkflow`, `evaluationWorkflow`, `sessionWorkflow`, `designSessions`, `_queues/helpers`, and `buildWorkflow` to use the helpers. The evaluation helper preserves the existing guard against late-arriving error states; the build helper supports an optional `clearLastBuildError` flag for the manual `startBuild` path. Queue helpers continue to use `QUEUE_RUN_TIMEOUT_MS` by passing it as the helper's optional timeout argument.
- **Reason**: Tracker helpers are operational mechanics. Future changes to how active workflows are recorded or staled (e.g. a different timeout policy, a new audit log row, a richer cancel handshake) belong in one place rather than spread across fourteen sites.

## Extract shared workflow helpers for completion logs and JSON parsing - 2026-05-11

- **Why**: Every workflow file (`summarizeWorkflow`, `testGenWorkflow`, `docPrdWorkflow`, `docInterviewWorkflow`, `projectInterviewWorkflow`, `evaluationWorkflow`, `designWorkflow`, `sessionWorkflow`, `audits`, `automations`, `_taskWorkflow/publicMutations`) repeated the same two patterns inline: building a `logs` row from `entityType`/`entityId`/`entityTitle`/`repoId`/`rawResultEvent` after sandbox completion, and pulling the first JSON value from LLM output via `llmJson.extract(text).json[0]`. Eleven copies of the log insert and several copies of the JSON-extract idiom meant changing the shape (e.g. adding a field to `logs`) required edits across the whole backend.
- **Change**: Added `recordCompletionLog` and `extractFirstJsonValue` exports to `_taskWorkflow/helpers.ts`. Migrated all 11 completion-log callers and 5 clean JSON-extract callers to the helpers. Rewrote `docPrdWorkflow.normalizeParsedDocFields` to narrow `unknown` safely without `as` casts. Two `as`-using JSON extracts (`docInterviewWorkflow`, `evaluationWorkflow`) remain on the original pattern and will move in the later `as`-removal pass.
- **Reason**: Shared operational mechanics belong in one place. Future schema or library changes touch the helper, not eleven workflow files.

## Backend-owned branch publishing for git actions - 2026-05-08

- **Why**: Session draft PR creation and deployment polling could run before the branch existed on GitHub. Sessions, automations, evaluation fixes, and test generation still relied on the model to run `git push`, unlike quick tasks where the backend already owns publishing.
- **Change**: Git-writing prompts now ask the model to commit only. After a successful run, the workflow pushes the sandbox branch via `pushSandboxBranch` before deployment polling or PR creation. Manual session PR creation also publishes the sandbox branch first so older failed sessions can recover. Draft PR creation errors are posted as session system alerts instead of only surfacing in Convex logs. The session startup progress label now says "Preparing branch" instead of "Pushing branch".
- **Reason**: Git publishing is deterministic platform work. Keeping it out of the model path prevents missing remote branches, which caused GitHub `head` validation failures and branch polling errors.

## Skip-planning mode for project creation - 2026-05-08

- **Why**: Users creating projects from task contexts want to skip the AI interview/planning phase entirely. Having to go through it every time slowed down the workflow.
- **Change**: Added planning-mode selector to `NewProjectModal`: dropdown with "With interview/plan" and "Tasks only" options. Default selection is context-aware (projects page defaults to interview/plan, task contexts like QuickTaskModal and StatusFieldsSection default to tasks-only). When "Tasks only" is selected, projects go straight to `active` phase with empty conversation and immediate branch name assignment.
- **Reason**: Task-focused workflows need fast project creation without the planning ceremony. Context-aware defaults reduce friction in common cases while preserving the full interview flow for users who want it.

## Per-task override for proof-of-completion toggle - 2026-05-08

- **Why**: The agent-browser screenshots/videos setting was global per repo. Users wanted to opt specific tasks in or out without changing the repo-wide setting.
- **Change**: Added `screenshotsVideosEnabled: boolean | undefined` field to `agentTasks` for tri-state override (undefined = inherit repo, true = force on, false = force off). New `ScreenshotsToggle` tri-state picker component wired into `QuickTaskModal` (creation time) and `StatusFieldsSection` (post-creation edit). Future runs read the latest task value, so changes take effect on next run (including change-requests after completion).
- **Reason**: Proof of completion is usually desired, but some tasks (e.g. internal-only tests, highly flaky UI flows) benefit from disabling it to avoid noise. Making it per-task avoids re-running tasks or changing repo settings just to skip screenshots. The tri-state preserves the ability to inherit repo defaults so changes to the org-level policy apply to new runs automatically.

## Sandbox lifecycle events in task activity timeline - 2026-05-08

- **Why**: Quick task activity tabs didn't show sandbox started/stopped/failed events like the session detail page does, leaving reviewers without visibility into when the sandbox became available for testing.
- **Change**: Added `taskSandboxEvents` table to log sandbox lifecycle (started, reconnected, stopped, stop_failed, failed) at mutation hook points. Frontend renders these as dividers with relative timestamps in the task activity timeline. Updated sessions to log stop outcomes async (success or failure) for consistency.
- **Reason**: Sandbox lifecycle is part of the task execution history. Showing these markers in the activity timeline gives reviewers clear context about testing availability without cluttering the main timeline with run/audit details.

## Surface PR step failures separately from run errors - 2026-05-08

- **Why**: PR creation/refresh failures were silently swallowed. When `createPullRequest` or `refreshPullRequestBody` threw (e.g. "Draft pull requests are not supported in this repository" on free-plan private repos, or "No open PR found" after a merge), the error was caught but discarded if the underlying run succeeded. UI showed `status: success`, `prUrl: null`, and no error — no signal anything went wrong, and users couldn't recover without checking server logs.
- **Change**: Added `prError: v.optional(v.string())` field to `agentRuns` to record PR-step-specific failures independently from run-level errors. The try/catch wrapper around PR actions now stores failures in `completionPrError` and passes it separately (not merged into `error`) through `finalizeRunStreamingPhase` / `completeRun` mutations. The run-level `error` field clears on success, but `prError` persists even on success runs. Frontend derives `latestPrError` from run query and displays it alongside the existing destructive-text error message in `TaskFooter`, so the "Create PR" recovery button is always accompanied by the actual error message explaining why.
- **Reason**: PR failures happen _after_ commits are already pushed (they're in the happy-path, not caught by outer exception handlers). Preserving the error separately lets users see what broke without obscuring the run's success status or losing debugging context. The existing manual "Create PR" button is the recovery path; now users know _why_ they need to click it.

## Per-app system prompt - 2026-05-08

- **Why**: Users wanted to specify recurring instructions per app (e.g. "run pnpm migrate after making backend changes") once instead of repeating them in every quick task and session message.
- **Change**: Added `systemPrompt` field on `githubRepos` (per-app, not propagated to monorepo siblings) edited via a new textarea on `Settings → App`. The text gets appended as a `## System Prompt` block to every quick task prompt (implementation + conflict resolution), every project task prompt (same code path), and every session prompt (plan + edit modes), alongside the existing user-level `## Custom Instructions` block.
- **Reason**: Recurring per-app commands belong on the app, not buried in user personalisation or repeated on every run. Keeps user-level personalisation orthogonal to app-level automation hooks.

## Skip redundant config file download on sandbox prepare - 2026-05-08

- **Why**: Every sandbox prepare (new or resume) re-downloaded config files via curl from the network, even though they were baked into the snapshot at `/home/eva/sandbox-config/` during snapshot build. Large files (100MB+) caused `curl: (23) Failure writing output to destination` on disk-full errors, and the download added 3+ minutes per resume.
- **Change**: Replaced all 6 session prepare paths (reuseSessionSandbox, newSessionSandbox, reuseTaskSandbox, newTaskSandbox, reuseProjectSandbox, newProjectSandbox) to call `copySandboxConfigFilesToWorkspace()` (local `cp -a` from the persistent baked location) instead of `downloadSandboxConfigFiles()` (network curl). Deleted the now-unused download function.
- **Reason**: Config files are snapshot artifacts already on disk. Local copy is idempotent, instant (~100ms), can't fail from network/disk issues, and eliminates the 3+ minute resume bottleneck.

## Shared sandbox terminals - 2026-05-08

- **Why**: Each browser was creating its own terminal PTYs from localStorage, so the dev server ran a duplicate copy per viewer (often on fallback ports), and collaborators couldn't see or control each other's terminal tabs.
- **Change**: Moved terminal pane identity to shared Convex state on `sessions`, `agentTasks`, and `projects`. New `sandboxPanes.ts` mutations (`ensureDefaultTerminalPane`, `createTerminalPane`, `closeTerminalPane`) own the pane list. Each viewer's selected tab stays in localStorage so one collaborator switching tabs doesn't move another's view. The first pane's id is stable, so everyone connects to the same dev-server PTY and can `Ctrl+C`/restart/run other commands in it.
- **Reason**: Terminal panes are sandbox process state, not per-browser UI state — sharing their ids makes the dev server (and every other terminal) a single PTY everyone can view and control.

## Preserve active quick-task sandbox after request changes - 2026-05-08

- **Why**: Requesting changes reused the same quick-task sandbox but always stopped it after the agent finished, creating a window where "View Sandbox" could point at a sandbox that was being stopped or had just been stopped.
- **Change**: Task workflow data now records whether the reviewer-facing quick-task sandbox was active when the run started. The workflow keeps that sandbox running after completion only when it was already active; closed sandboxes still stop after the run.
- **Reason**: The lifecycle should restore the user's previous review state instead of forcing every change-request run into the stopped state.

## Fix quick task detail navigation to respect filters and sort - 2026-05-07

- **Why**: Detail page prev/next buttons ignored the user's chosen sort field, sort direction, and search query, always using hardcoded status-grouped order sorted by creation date. Users complained buttons "don't respect the filters applied or anything".
- **Change**: Extracted filter+sort logic into shared `applyQuickTaskFilters()` helper and `useFilteredQuickTasks()` hook in `_utils.ts`. Both list and detail pages now use the same canonical filtered+sorted array. Detail page additionally applies view-aware grouping: in kanban view, tasks are regrouped by status (`TASK_STATUSES` order) while preserving sort order within each column, so prev/next walks top-of-todo → bottom-of-todo → top-of-in_progress (matching kanban's visual flow). In list/table view, prev/next uses the global sort order directly.
- **Reason**: Single source of truth for filtering/sorting eliminates duplication (was ~95 lines in each component) and ensures detail nav matches the list's order. View-aware grouping preserves kanban's spatial metaphor while respecting the user's sort preferences.

## Extract @mention primitives into reusable library - 2026-05-07

- **Why**: Task comment mentions and chat doc mentions were ~95% identical code; extracting shared primitives eliminates duplication and ensures consistent UX across surfaces.
- **Change**: Created `apps/web/src/lib/components/mentions/` with headless `MentionEditor<TItem>` generic component (contentEditable + portal popup, composition slots for rendering/filtering), `MentionText` render primitive (parses and renders `@[label](id)` tokens), and shared utilities (`mentionToken.ts`, `mentionEditorUtils.ts`). Both `chat/MentionTextarea` and `tasks/CommentMentionInput` now wrap `MentionEditor`; `chat/MessageMentionText` and `tasks/CommentsSection` use `MentionText` directly. Deleted local duplicate `tasks/CommentText.tsx`.
- **Reason**: Shared mention editor logic deduplicates ~300 lines. Generic `<TItem extends MentionItem>` prevents type casts (`as UserMentionItem`) and enables strong typing on `renderItem` callback. React 19 ref-as-prop pattern avoids `forwardRef` and eliminates `as` type assertions, adhering to project no-`as` rule.

## Custom animated sidebar icons - 2026-05-07

- **Why**: Generic static icons in the sidebar lacked visual polish and feedback.
- **Change**: Replaced Tabler icons with 10 handcrafted SVG icons (Projects, Designs, QuickTasks, Sessions, Documents, TestingArena, Inbox, Automations, Stats, Settings). Each icon has bespoke `@keyframes` animations triggered on parent hover — cards bounce and breathe, dots pulse and scatter, gears spin, bubbles rise, etc. Icons scale from 16px to 19px, and the entire SVG gains a 1.2x hover scale on top of the inner animations via a springy easing curve. Animations layer via CSS `group-hover:` selectors on sub-shape classes (`.nav-icon-card`, `.nav-icon-bubble`, etc.), enabling clean choreography without JS.
- **Reason**: Animated icons draw the eye, provide hover feedback, and reinforce interaction without cluttering the layout. SVG-native animations (strokeDasharray, transforms, keyframes) scale to any viewport and remain crisp at any size.

## Manual PR creation for projects - 2026-05-07

- **Why**: Project PR creation may fail due to transient issues (GitHub API downtime, network failures). Users had no recovery path and had to re-run the entire build workflow to retry.
- **Change**: Added `createProjectPr` action that rebuilds the PR from project metadata (title, description, list of completed tasks). Moved View Preview button in project header to a More dropdown alongside a new "Create PR" item, enabled when no PR URL exists, the project is in active phase, and no build is running. PR creation is idempotent: returns the existing PR if already tracked, or creates and persists it.
- **Reason**: PR creation is the publishing step for completed projects, so users should be able to retry on failure without re-executing the build. Mirrors the task Create PR pattern introduced earlier.

## Manual PR creation for tasks - 2026-05-07

- **Why**: When a task workflow's auto PR creation step failed (e.g., GitHub API downtime), users had no way to recover and create the PR later without re-running the entire task.
- **Change**: Added `createTaskPr` public action that rebuilds the PR body using the same `buildTaskPrSections` helper (Task / Change Requests / Proof sections, idempotent label set) and produces identical output to the workflow's auto-generation. Extracted shared PR section-building logic into `buildTaskPrSections()` in `prBody.ts`. New "Create PR" item in the More dropdown on task footer, enabled when a run exists but no PR URL is stored yet. Action is idempotent: returns the existing PR if one is already tracked, or creates a new one and persists it on the latest run.
- **Reason**: PR creation is a publishing step for successful tasks, so recovering from transient failures should be user-facing and not require re-execution. Shared helper ensures consistency between auto and manual PR generation paths.

## Fix snapshot config files for sub-apps - 2026-05-07

- **Why**: Sandbox config files uploaded against sub-apps (e.g., `carepulse-staging-backup.zip` on `apps/web`) were not baked into the snapshot and were wiped at sandbox runtime. Quick tasks failed with `Path <file> does not exist` because only the root repo's (empty) config file list was queried.
- **Change**: `getConfigFilesForSnapshot` now aggregates config files across all sibling repos sharing `(owner, name)` — mirrors the existing snapshot-lookup pattern where one snapshot serves the root repo plus all sub-apps. Files are downloaded to `/home/eva/sandbox-config/` during build instead of `/tmp/repo/`, so they survive the `git clean -fd` cleanup at sandbox startup. The existing runtime helper `copySandboxConfigFilesToWorkspace` picks them back up and copies them into the working directory.
- **Reason**: Snapshot files are scoped per `(owner, name)`, not per individual `repoId`. Without aggregation, sub-app uploads never made it into the snapshot. Without the persistent staging directory, the snapshot bake was wasted because runtime cleanup wiped the files before the startup commands could use them.

## Retry failed startup commands on quick tasks - 2026-05-07

- **Why**: When startup commands failed during sandbox setup, the marker file `/.startup-commands-done` was still created, preventing users from retrying the commands. Users had no way to recover without starting a fresh sandbox.
- **Change**: Added `force?: boolean` param to `runStartupCommands` action to bypass the marker-file check. New `retryStartupCommands` authenticated mutation kicks off the task sandbox workflow with `forceStartupCommands: true`. Added "Run Startup Commands" button (`IconRefresh`) to TaskDetailInline, visible when sandbox is active or closed. Button auto-starts sandbox if needed and re-executes startup commands.
- **Reason**: Startup command failures are recoverable within the same sandbox. Users can now click a button to retry without losing their sandbox state or manually recreating it.

## Fall back to git clone when snapshot is broken - 2026-05-07

- **Why**: Quick tasks and other sandbox flows failed completely when a repo's snapshot was in error or build_failed state, with no recovery path and no way to proceed without manually rebuilding the snapshot.
- **Change**: `createSandboxAndPrepareRepo()` now catches `Snapshot <id> is error` and `is build_failed` errors from Daytona. On such errors, the function falls back: it creates the sandbox using the default snapshot (no custom pre-baked dependencies) and clones the repo from git, then proceeds normally. The fallback is transparent — callers don't change, and `usedSnapshot: false` correctly indicates the snapshot wasn't used.
- **Reason**: Broken snapshots should not block task execution. Users get a slower first sandbox setup (git clone + install vs pre-baked), but the task proceeds without manual intervention. The fallback applies to all sandbox flows (quick tasks, sessions, audits, ephemeral) and affects only the new-sandbox path; resume of an existing sandbox is unaffected.

## Retry and preserve quick-task PR URLs - 2026-05-07

- **Why**: Successful quick-task runs could finish without a stored PR URL when GitHub PR creation failed or when a later run refreshed an existing PR body without returning the PR URL.
- **Change**: Quick-task PR creation and refresh now run as explicitly retried workflow action steps. PR creation reuses an existing open PR on the same branch, PR refresh returns the existing PR URL, and both paths fail the workflow instead of silently returning `null` when no PR can be created or found.
- **Reason**: PR creation is a required publishing step for successful quick tasks, so missing PRs should be retried and surfaced as workflow failures rather than hidden behind a successful run.

## Keep persistent sandboxes alive for one hour - 2026-05-07

- **Why**: Reviewers need more time to inspect sandbox previews before Daytona auto-stops persistent sandboxes.
- **Change**: Changed the shared Daytona session lifecycle auto-stop interval from 15 minutes to 60 minutes.
- **Reason**: Quick tasks use the persistent session lifecycle, so updating the lifecycle constant is the smallest effective change.

## Mention documents in session and design prompt input - 2026-05-07

- **Why**: Users had no way to reference repo docs from a session or design prompt — they had to copy-paste content manually for the AI to have the doc as context.
- **Change**: Typing `@` in a session or design prompt opens a filter-as-you-type popup of the current repo's docs, sorted alphabetically. Selected docs render as bold, atomic, lightly-highlighted pills inside the input (`contenteditable=false` with zero-width-space anchors so the cursor can't enter and adjacent typing stays plain). Stored as `@[Title](docId)` tokens in `messages.content`. On send, a backend resolver (`_mentions/resolveDocMentions.ts`) extracts unique doc IDs, validates each against the session's `repoId` (drops cross-repo or deleted docs), prepends a `## Referenced documents` block with full doc content to the AI prompt, and replaces inline tokens with plain `@Title`. In chat history, mentions render as clickable links that navigate to `/{owner}/{repo}/docs/{id}` via TanStack Router. Design history strips tokens to plain `@Title` for the trailing context window.
- **Reason**: Single-string token in `messages.content` (no schema change) keeps storage simple. The Convex id charset (`[a-z0-9_]`) makes the regex unambiguous against ordinary markdown links, and the repo-scoped resolver prevents cross-repo content leaks.

## Linear-style priority field for quick tasks and projects - 2026-05-06

- **Why**: Quick tasks and projects had no way to express urgency, so users couldn't sort or scan their work by what mattered most.
- **Change**: Added an optional priority field (Urgent / High / Medium / Low) on `agentTasks` and `projects` schemas, with a shared inline-SVG `PriorityIcon` (Linear-accurate visuals: orange-red square with `!` for urgent, ascending bars with N filled for the rest, three muted dashes for unset) and a `PriorityPicker` popover. Wired pickers into the quick-task creation modal + detail panel, the project creation modal + metadata bar + inline-editable table cell. Read-only icons appear on the quick-task table column, kanban/list card corners, and project table. Priority is sortable via the existing Options dropdown on both views. Mutations accept `null` to clear the field.
- **Reason**: Single source of truth — `undefined` means "no priority" everywhere — keeps the schema and downstream code (icon, picker, sort comparator) on one type union of four values rather than introducing a synthetic fifth literal.

## Keep Daytona sandbox preview on the resolved dev port - 2026-05-06

- **Why**: The preview pane could display port 3000 while hidden state still defaulted to 3001, and the navigation-sync proxy generated Daytona preview URLs for port 33000, outside Daytona's supported preview range.
- **Change**: Removed the 3001 preview-port default, resolved preview ports as `URL override -> saved devPort -> 3000`, synchronized the port input from the resolved port prop, moved the navigation-sync proxy to available ports in the 9000-9999 range, stopped caching signed preview URLs in sessionStorage, and kept only per-pane preview paths cached.
- **Reason**: Preview URL generation, the visible port control, and Daytona's supported preview-port contract now agree on the same target port. Signed preview URLs are time-bound capability URLs and should be resolved fresh, while simple app paths are safe to restore after refresh.

## Project-level sandbox preview - 2026-05-06

- **Why**: Projects lacked the sandbox preview feature available on quick tasks. Reviewers need to test the entire project codebase in a sandbox environment without selecting individual tasks.
- **Change**: Extended sandbox lifecycle (start/stop/ready/error mutations + workflow + Daytona action) to projects table. Added `reviewProjectSandboxStatus`, `devPort`, `devCommand` fields to `projects` schema. Extended PTY layer (`pty.ts`, `TerminalPanel.tsx`, `TerminalHistoryOwner`) to support `{ kind: "project"; projectId }` owner discriminant. Created `useProjectSandbox` hook and `ProjectSandboxPanel` component (mirrors task sandbox panel). Wired `ProjectDetailClient` header with Start/View/Stop Sandbox buttons and conditional sandbox view that replaces the task list when active. Sandbox only starts when project phase is `active` and uses the project's branch directly.
- **Reason**: Full feature parity between task and project sandboxes. Users can now run the entire project repo in a Daytona sandbox and inspect the generated code before merging.

## Show startup and background command progress in all sandbox flows - 2026-05-06

- **Why**: Quick-task runs silently executed startup/background commands without UI feedback, while quick-task view-changes showed progress steps. Sessions only showed startup progress, not background.
- **Change**: Added progress-step emissions around all `runStartupCommands` and `runBackgroundCommands` calls in `prepareSandboxSteps.ts` (used by quick-task runs, evals, automations) and both session reuse/new paths. Startup commands only show complete on resumed sandboxes if commands actually ran (marker file skips re-execution).
- **Reason**: Users now see consistent "Running startup commands… / Launching background commands…" feedback across all sandbox startup paths, matching the UX they already see in quick-task view-changes.

## Auto-start dev server without opening terminal tab - 2026-05-06

- **Why**: The first terminal pane was only created when the user opened the Terminal tab, so the dev command didn't run until then. The preview iframe would sit waiting for a server that hadn't started yet.
- **Change**: Switched terminal pane creation from lazy (on tab open) to eager (on sandbox active). The pane is mounted in the background before the user opens the tab, so the PTY connects immediately and the dev command auto-runs. Unrelated preview tab kept its lazy-create behavior.
- **Reason**: Dev servers should start on sandbox init, not on UI interaction. Output continues streaming in the background while the user is on the preview tab.

## Lock page interaction while following another user - 2026-05-06

- **Why**: The follow-user feature crashed inside the repo layout because `Sidebar`'s `TeamMembers` calls `useFollow()` but only the `_global` route was wrapped in `FollowProvider`. Even when it worked, the follower could click around and navigate themselves, defeating the "redirect me to their screen" intent.
- **Change**: Added `FollowProvider` and rendered `FollowOverlay` inside `_repo/$owner/$repo.tsx` mirroring the `_global.tsx` layout. The follow overlay's fullscreen ring now captures pointer events with `cursor-not-allowed`, and the "Following X" badge sits on a higher z-index so the close button (and Escape key) remain the only ways to exit follow mode.
- **Reason**: Both global and repo routes share the sidebar, so they need the same follow context. Blocking page interactions enforces the contract that following means strictly mirroring the other user's navigation.

## Recover MCP OAuth flow when prod Clerk handshake bounces popup to /home - 2026-05-05

- **Why**: On prod (Clerk live keys), the popup Claude opens at `/mcp/oauth/authorize` could land on `/home` — the global `signInFallbackRedirectUrl` — before our route ever ran. Staging (Clerk test keys) didn't reproduce this because dev instances skip the cross-domain session handshake. End result: Claude's "Connect" flow failed silently in production.
- **Change**: Persist the OAuth search params to `sessionStorage` as early as possible — once from `main.tsx` before the Clerk provider mounts, and again in the route's `beforeLoad`. `/home` now has a `beforeLoad` that consumes any pending params and redirects back into the OAuth route. A 2-attempt counter (keyed on the OAuth `state` nonce) prevents a redirect loop and lets a fresh flow start cleanly. New helper module `lib/mcpOauthStorage.ts` owns the schema and storage logic.

## Preserve MCP OAuth route through SPA history rewrite - 2026-05-05

- **Why**: The custom TanStack history adapter treated `/mcp/oauth/authorize` as an owner/repo/app path and rewrote it internally to `/mcp/oauth--authorize`. That made the MCP OAuth URL miss its real route and fall into normal app navigation, which redirected signed-in users back to `/home` instead of completing Claude's connector callback.
- **Change**: Added `mcp` to the non-repo route prefixes so `/mcp/oauth/authorize` stays intact and the OAuth route can mint the authorization code.

## Move MCP OAuth sign-in to main app domain to fix Clerk production key restriction - 2026-05-05

- **Why**: Clerk production keys are pinned to a single domain (e.g., `eva.carepulse.co.uk`). The MCP OAuth sign-in UI was on a Convex HTTP page hosted at `*.convex.site`, causing Clerk to reject production keys with "Production Keys are only allowed for domain 'eva.carepulse.co.uk'".
- **Change**: Created a new TanStack route `/mcp/oauth/authorize` on the main web app that handles Clerk sign-in and OAuth code minting. Convex `authorizeGet` now 302-redirects to this route instead of rendering HTML directly. Added a public `authorize` mutation in `mcp/oauth.ts` that requires Clerk auth, validates the OAuth request, and mints the auth code. Deleted the old `authorizePost` handler and related dead code.
- **Requires**: `WEB_APP_URL` env var in Convex (e.g., `https://eva.carepulse.co.uk` for prod) so the OAuth flow can redirect to the correct domain.

## Drive GitHub install URL from Convex env instead of hardcoded slug - 2026-05-05

- **Why**: `ReposClient.tsx` had a hardcoded `GITHUB_APP_NAME = "vb-eva-dev"` for building the GitHub App install URL. The dev slug was shipped to every environment, so production users would have been sent to the wrong install page. Backend already reads the slug from `process.env.GITHUB_APP_SLUG` (used in `snapshotActions.ts` and `_daytona/git.ts`), so the value belonged on the same source of truth.
- **Change**: Added `getAppSlug` `authQuery` in `_githubRepos/queries.ts` that returns `process.env.GITHUB_APP_SLUG` (throws if missing). `ReposClient` now fetches the slug via `useQuery(api.githubRepos.getAppSlug)` and constructs the install URL with a `buildConnectUrl` helper. Loading state waits for both `repos` and `appSlug` before rendering the body; the header connect button renders disabled while the slug is loading.
- **Reason**: One env var per deployment now drives both backend cloning and the frontend install link, so dev/staging/prod each get the correct app slug without separate frontend config.

## Open public sign-ups and drop bespoke env-mode flag - 2026-05-05

- **Why**: The `ENVIRONMENT=production` backend flag and parallel `VITE_ENV === "production"` frontend flag existed to lock down a "public hosted Eva" deployment to existing users only. We no longer need that gating, and the custom `VITE_ENV` env var duplicated information Vite already exposes natively.
- **Change**: Removed the `ensureUserExists` sign-up throw in `auth.ts`, the disabled-buttons + self-host fallback message on the landing route, the `ENVIRONMENT` doc row, and `VITE_ENV` from the t3-env schema and env files. Remaining dev-only UI (the "Sign in as Eva" button and dev-only sidebar nav) now reads `import.meta.env.DEV` directly.
- **Why `import.meta.env.DEV`**: Vite-native typed boolean, statically replaced at build time, mode-aware (`vite build --mode staging` evaluates to `false`), and removes the need for a custom env var in `.env.local` / Convex.

## Drop MCP_BASE_URL and skip self-referential token-mint HTTP roundtrip - 2026-05-05

- **Why**: `MCP_BASE_URL` pointed at a Railway MCP deployment that has since been deleted; the MCP server now lives on the same Convex deployment, so the token-mint flow was making Convex call back into its own HTTP API for no reason.
- **Change**: `mintSandboxMcpToken` now calls `internal.mcp.nodeActions.mintInternalToken` directly via `ctx.runAction` instead of fetching `${MCP_BASE_URL}/api/internal/mint-token`. The sandbox MCP config in `_daytona/helpers.ts` reads `CONVEX_SITE_URL` instead of `MCP_BASE_URL`. Removed the now-orphaned `mintInternalToken` httpAction in `mcp/native.ts`, the `/api/internal/mint-token` route in `http.ts`, and the redundant `bootstrapSecret` arg from the internal action (no longer crossing a trust boundary).
- **Action required**: `MCP_BASE_URL` has been removed from both dev and prod Convex deployments; no further action needed.

## Keep quick-task sandbox stop spinner visible - 2026-05-05

- **Why**: Quick-task detail controls could return to the start/view state immediately after requesting a sandbox stop, even though Daytona can take roughly 30 seconds to finish stopping the sandbox.
- **Change**: The quick-task sandbox UI now treats `stopping` as an active lifecycle state, keeps the sandbox panel in its stopping view, and shows a disabled spinner control until the backend marks the sandbox closed.

## Prevent quick-task sandbox resume from silently creating replacements - 2026-05-05

- **Why**: Quick-task sandbox startup could spend time restoring a saved Daytona sandbox, hit a resume/setup error, then silently abandon that filesystem and create a new sandbox.
- **Change**: The task preview resume path now only falls through to sandbox creation when the saved sandbox ID is genuinely missing or deleted. Preparation failures on a found sandbox now fail the start attempt and preserve the existing `task.sandboxId`.
- **Reason**: Reviewer sandboxes are stateful; silently replacing them can discard the database/filesystem state the user expected to resume.

## Add MCP connector icon metadata - 2026-05-02

- **Why**: Claude custom connectors were showing a blank connector icon because the backend MCP implementation did not advertise a visual identifier.
- **Change**: Reused the existing `apps/web/public/icon.png` asset as a data URI in the backend MCP server metadata.
- **Reason**: The MCP spec permits `data:` icon URIs, which avoids adding a public image route or depending on a separate web-app origin for connector rendering.

## Persist sandbox terminal history across refresh - 2026-05-02

- **Why**: Daytona PTY sessions survive a browser refresh, but xterm's screen buffer lives only in the mounted React component. Refreshing the session page reconnected to the same PTY with an empty browser-side buffer.
- **Change**: Terminal panes now keep a bounded raw-output transcript in tab-scoped `sessionStorage` via `useSessionStorage`, keyed by owner, sandbox ID, and pane ID. On remount, the panel replays that transcript before reconnecting to the live PTY and flushes pending output on page hide/unload.
- **Reason**: This preserves the user's refresh workflow without persisting terminal output to Convex or changing PTY lifecycle semantics.

## Sync sandbox preview address bar from iframe navigation - 2026-05-02

- **Why**: Web Preview route entry only updated the iframe from the address bar. Once the user clicked through a cross-origin Daytona preview, Eva could not read the iframe URL directly, so the address bar stayed stale.
- **Change**: Added an in-sandbox navigation-sync proxy for web previews. It forwards the dev server, injects a tiny history/location sync script into HTML, preserves WebSocket upgrades for dev-server HMR, and posts route changes back to the existing preview nav bar listener.
- **Reason**: Browser same-origin rules intentionally block the parent app from reading a cross-origin iframe URL. Keeping the cooperation layer inside the sandbox avoids a larger same-origin platform proxy and leaves Editor/Desktop iframe URLs untouched.

## Harden quick-task heartbeats and stuck tool detection - 2026-05-01

- **Why**: A quick task sat on `Searching code...` and was eventually killed by the external watchdog after `no heartbeat for 900s`. The active-tool threshold only delayed the kill; it did not remove the fragile JWT-authenticated heartbeat path or bound short internal tools like Grep/Glob/Read.
- **Change**: Restored a scoped HMAC streaming heartbeat route (`/api/streaming/heartbeat`) and pass per-entity `STREAMING_HMAC`/`CONVEX_SITE_URL` into sandbox runners, so heartbeat refreshes no longer depend on Convex user auth for every 10s ping. The callback still falls back to `streaming:set` when HMAC env is unavailable.
- **Hardening**: Liveness probes now refresh the streaming timestamp after proving the runner is alive, reject completed/zombie callback PIDs, and the sandbox callback terminates stuck non-shell tools after 5 minutes instead of letting `Searching code...` linger until a watchdog kill.
- **Reason**: Heartbeat transport, liveness verification, and tool stall detection are separate failure boundaries. Keeping each one explicit prevents a single stale UI step from being mistaken for healthy long-running work.

## Quick-task sidebar visual refinement - 2026-04-30

- Swapped quick-task icons in the sidebar badge: active sandboxes now display a green pulsing dot (matches sessions), running tasks show a spinner.
- Restructured the hover card into two sections (`Running` and `Sandbox active`) so users can distinguish task execution state from sandbox state at a glance.
- Refined the hover card design with tonal surface trays (`bg-muted/40`), eyebrow-style section labels (`uppercase text-[10px] tracking-[0.12em]`), and subtle row hover lift (`translate-x-0.5`) — all within the project's tonal-surface rules (no shadows, no borders on inline elements).

## Sandbox ID audit recovery - 2026-04-30

- Audit now saves `sandboxId` if it discovers a task/session record missing the sandbox ID field, recovering orphaned sandbox references during the audit process.

## Remove legacy MCP and MCP-v2 apps - 2026-04-30

- Deleted `apps/mcp` and `apps/mcp-v2` — legacy MCP server implementations no longer in use.

## Adjust sandbox auto-archive interval - 2026-04-30

- Modified the auto-archive interval in `_daytona/git.ts` to better balance storage cleanup vs. sandbox availability.

## Environment-aware Convex MCP credentials (staging/prod) - 2026-04-29

- The Convex MCP tools (`list_tables`, `query_table`, `get_document`, `run_query`, `count_table`) now accept an `environment: "staging" | "prod"` argument so a single repo can expose both deployments to MCP clients while the sandbox still only sees staging.
- Staging credentials continue to use the canonical `NEXT_PUBLIC_CONVEX_URL` / `VITE_CONVEX_URL` / `CONVEX_URL` + `CONVEX_DEPLOY_KEY` / `CONVEX_ADMIN_KEY` keys; prod adds `PROD_CONVEX_URL` + `PROD_CONVEX_DEPLOY_KEY` / `PROD_CONVEX_ADMIN_KEY`, intended to be stored with `sandboxExclude: true` so they never reach the sandbox.
- `getRepoConvexCredentials` now takes the environment, looks up the matching key set, and caches per-environment to avoid cross-deployment collisions. Default remains `staging`, so existing MCP usage is unaffected.

## Set VNC desktop resolution via env var at sandbox creation - 2026-04-29

- Desktop sandboxes now set `VNC_RESOLUTION=1920x1080` as an env var at creation time, passed to Daytona's ComputerUse plugin — Xvfb starts at the correct resolution natively, overriding the snapshot's 1280x720 default.
- Removed the post-startup `xrandr` resize workaround (`setDisplayResolution` function) from `desktop.ts` since it's now redundant. The display comes up at 1920x1080 directly, simplifying the startup flow and reducing shell exec calls.
- **Why**: Using Daytona's standard `VNC_RESOLUTION` env var is cleaner and more aligned with the ComputerUse plugin's design than post-startup resolution tweaking.

## Scope sandbox preview/editor/desktop URL caches by sandboxId - 2026-04-28

- The Web Preview, Editor (code-server), and Desktop (NoVNC) panels cached their resolved Daytona signed URLs in sessionStorage keyed only by session/task ID and port. Since Daytona signed URLs embed the sandbox ID in the subdomain, destroying and recreating a sandbox for the same task/session reused a stale URL pointing at the dead sandbox — the iframe would render `400 "Sandbox with ID … not found"` while the terminal (which connects fresh by current `sandboxId`) worked fine.
- Added `sandboxId` to all three cache keys so a recreated sandbox produces a fresh entry and the panel auto-refetches a live signed URL.
- Refactored `SandboxIframeService` to use `useSessionStorage` from `usehooks-ts` instead of the bespoke `createSessionCache` helper, matching the pattern already used in `useSandboxPreview`. Deleted `apps/web/src/lib/utils/sessionCache.ts` (no remaining consumers).

## Sync quick-task PR draft state with task review status - 2026-04-28

- Quick-task workflows now open their PRs as **draft** (matching the initial `business_review` task state) and add a `draft` label, instead of opening a non-draft PR straight into the review queue.
- Moving a quick task into `code_review` automatically marks the PR ready for review on GitHub; moving it back out (to `todo`, `in_progress`, or `business_review`) converts the PR back to draft. `done` deliberately leaves the PR ready since the user is merging.
- Switched both `markPrReadyForReview` and the new `convertPrToDraft` actions to GitHub's GraphQL API — REST `pulls.update` silently ignores the `draft` field, so the previous flow couldn't actually flip state.
- **Why**: the PR's draft state is the signal reviewers see in GitHub's notifications and review queues. Keeping it in lockstep with the Eva task status means reviewers only get pinged when the work is genuinely ready, and bouncing a task back to business review automatically un-queues the PR — no manual draft toggling needed.

## Make quick-task first-run sandboxes non-ephemeral - 2026-04-28

- `taskExecutionWorkflow` now passes `ephemeral: false` for every quick task — previously the first run set `ephemeral: !args.projectId && !data.taskSandboxId`, which resolved to `true` because no `taskSandboxId` existed yet, causing Daytona to delete the sandbox on the post-run auto-stop.
- This was the root cause of `Sandbox with ID ... not found` errors hitting the preview URL: `task.sandboxId` was persisted at the end of the run but pointed at a sandbox Daytona had already torn down.
- **Why**: contradicted the intent of "Persistent Quick-Task Sandboxes" (2026-04-27), which moved quick-task sandboxes to stop/pause-on-completion so reviewers could resume the same paused filesystem during code/business review and change-request flows.

## Bake dockerd startup into snapshot entrypoint - 2026-04-28

- Added a sandbox entrypoint script (`/usr/local/bin/eva-entrypoint.sh`) that cleans stale dockerd pidfiles/sockets and starts `dockerd` before `sleep infinity`, and registered it via `Image.entrypoint(...)` in the snapshot build.
- Daytona re-launches the snapshot entrypoint on every resume from auto-stop, so dockerd now survives stop/resume cycles regardless of how the sandbox is resumed (Eva backend, direct SSH, preview URL hit). Previously dockerd only restarted on Eva-triggered resume because `ensureDockerDaemon` only fires inside `ensureSandboxRunning`.
- `ensureDockerDaemon` remains as a defensive fallback for sandboxes built from older snapshots and any cold-start race.
- **Why**: a direct SSH (or any non-Eva entry path) auto-resumes the sandbox without invoking Eva's backend, leaving dockerd dead and breaking `pnpm start-db` / Supabase / any docker-dependent flow until the user manually restarted it.

## Close stop/start race window for sandbox toggles - 2026-04-28

- Added a transient `"stopping"` status to sessions, design sessions, and review-task sandboxes; `stopSandbox` now patches that state synchronously and schedules a `finalizeStop*` internalAction that awaits the real Daytona stop (~10s) before flipping to `"closed"`.
- UI (Session, Design, and Task detail views) now treats `"stopping"` like `"starting"` — keeps the spinner up and the Start button disabled across the full Daytona stop window, preventing a quick re-click from racing `getOrCreateSandbox` and silently spawning an orphan sandbox.
- Hardened `getOrCreateSandbox`'s resume path with a `tryResumeSandbox` helper that retries transient Daytona errors (2s/4s/8s backoff) and only short-circuits to creating a fresh sandbox when the existing ID is genuinely missing — so a flaky `daytona.get` no longer leaks a duplicate sandbox.
- **Why**: previously the UI flipped to "stopped" instantly while Daytona was mid-stop, so a user clicking Start during that ~10s window would create a new sandbox while the old one was still being torn down — leaking sandboxes and breaking the resume guarantee.

## Track session PR state with webhook sync + colored PR indicator - 2026-04-28

- Added `prState` field (`draft | open | merged | closed`) to sessions plus a `by_pr_url` index, so the UI can distinguish a freshly auto-created draft PR from one that's been promoted, merged, or closed.
- `createDraftSessionPr` now writes `prState: "draft"`; `createSessionPr` writes `"open"` and additionally archives the sandbox + closes the session (same path as the manual archive button) once the PR is marked ready for review, so "Send for Review" cleans up automatically.
- Extended the GitHub `pull_request` webhook to forward `opened`, `reopened`, `ready_for_review`, `converted_to_draft`, and `closed` actions to a new `handleSessionPrEvent` mutation that patches `prState` by `prUrl`, keeping Convex in sync with GitHub when users toggle draft state or merge/close from outside Eva.
- Reworked the "Send for Review" button visibility: shows whenever the PR is missing or in draft (instead of disappearing the moment the auto-draft is created), so users can actually click through to promote it.
- Colored the "View PR" icon by state — grey (draft), green (open), purple/`status-code-review` (merged), red (closed) — giving an at-a-glance signal of where the PR sits without leaving the session.
- **Why**: the previous gating hid the button as soon as `prUrl` was set, which meant the auto-draft PR could never actually be promoted from the UI; users also had no visible signal of PR state, and merging on GitHub left Eva's view stale.

## Auto-recover Docker daemon on sandbox resume - 2026-04-28

- Extracted `ensureDockerDaemon` helper and called it from `ensureSandboxRunning`, so dockerd is now restarted whenever a sandbox is resumed (session reuse) — not only on initial create. Quick tasks already pass through `createSandbox`, which uses the same helper.
- Cleanup before restart now removes the stale `/var/run/docker.pid` and `/run/docker/containerd/*` pidfiles + sockets that survive Daytona auto-stop, which were blocking dockerd/containerd from starting after resume.
- Switched dockerd launch to `setsid ... </dev/null` so the daemon detaches cleanly from the exec session and survives after the helper returns.
- **Why**: dockerd runs as a backgrounded process inside the sandbox, not a system service, so it dies on auto-stop. Resuming a session would silently leave Docker down, breaking `pnpm start-db` and any other Docker-in-Docker workflow (Supabase local, etc.) until manual recovery.

## Granular task sandbox startup progress steps - 2026-04-28

- Backend: added `emitTaskProgress` / `completeTaskProgress` helpers (mirroring sessions) that emit per-step progress to streaming entity `task-sandbox-startup-${taskId}` throughout `prepareTaskPreviewSandboxInternal` (reuse path: Resuming → Downloading config → Starting dev server → Launching background; new path: Loading repo config → Resolving context → Checking existing → Setting up volumes → Creating sandbox → Syncing refs → Checking out branch → Downloading config → Starting dev server → Running startup → Launching background).
- Removed misleading "Running startup commands..." step from task reuse path — marker file check makes `runStartupCommands` a no-op on resume, so showing the step was confusing.
- Frontend: added `sandboxStartupActivity` query in `useTaskDetail` and wired it through `TaskDetailInline` to replace the generic "Preparing sandbox..." spinner with `<StreamingActivityDisplay>` showing actual steps as they arrive; fallback label is "Starting sandbox..." while steps stream in.
- **Why**: Mirrors the existing session sandbox startup UX (which users rely on for visibility into long multi-minute boots); quick-task reviewers now see real progress instead of static spinners, improving confidence during sandbox startup and making failures easier to diagnose.

## Per-repo background commands for long-running daemons - 2026-04-28

- Added `backgroundCommands` field to `githubRepos` schema: users can configure long-running daemons (e.g. `npx convex dev`) that launch detached (`nohup ... &`) alongside the dev server on every sandbox start and resume.
- New `runBackgroundCommands` internalAction detaches each command with a short exec timeout (10s) — we only wait for the shell to fork, not the daemon to finish. No marker file, so daemons respawn automatically when a stopped sandbox is resumed (processes die when sandbox stops).
- UI: new "Background Commands" textarea in App settings tab, mirrors startup-commands UX; placeholder shows `npx convex dev`; helper text explains log paths (`/tmp/bg-<index>.log`) and respawn behavior.
- Called at all 6 sandbox startup paths (session reuse/new, task reuse/new, design session reuse/new) and in `prepareSandboxSteps` after startup commands, ensuring daemons run consistently across all preview types.
- **Why**: Startup commands block (10-min timeout per command); daemons like `npx convex dev` hang forever, making them unsuitable for sequential execution. Background commands solve this by forking immediately and auto-respawning on resume, enabling Convex codegen to pick up changes during session previews without manual redeploy.

## Persist resolved devPort/devCommand on task & session docs - 2026-04-28

- Wired `task.devPort` / `task.devCommand` (already populated by `taskSandboxReady`) through `TaskDetailInline` → `TaskSandboxPanel` so the preview iframe + terminal auto-run hit the actual running dev server instead of falling back to the URL default of 3001.
- **Architectural note**: `githubRepos.devPort/devCommand` = per-app _config / intent_. `agentTasks.devPort/devCommand` and `designSessions.devPort/devCommand` = _snapshot of the resolved value at sandbox spawn time_. We persist the resolved value (override → detect → default) because (a) the dev server is a long-lived process pinned to whatever port it bound at spawn — editing repo config later doesn't migrate it, (b) `detectDevPort` requires reading the live sandbox FS so we can't re-resolve client-side, and (c) the frontend shouldn't replicate detection logic just to render a preview URL. Per-app config is the input; per-task/per-session is the output.

## Custom snapshot build commands - 2026-04-28

- Added `buildCommands` field to `repoSnapshots` schema: users can now define custom commands (e.g. `pnpm convex codegen`, `pnpm build`) that run during snapshot build, after `pnpm install`, and are baked permanently into the Docker image as separate cached layers.
- UI: new "Build Commands" card in Snapshots > Configuration tab, newline-delimited textarea that saves on blur; shows shared "Rebuild Required" warning banner alongside config files section.
- Shared the rebuild-warning banner and command parser across AppClient (startup commands) and SnapshotsClient to reduce duplication.
- **Why**: Solves the build-time vs runtime distinction — startup commands re-run on every sandbox boot, but build commands execute once during snapshot creation, ideal for codegen, precompiled artifacts, and pre-warmed caches that should not re-run per boot.

## Unify sandbox status styles & Editor/Desktop panels - 2026-04-28

- Extracted the sandbox status dot styles (active/starting/closed) into `sandboxStatusStyles.ts` so the session sidebar item and the quick-task card render from a single source of truth.
- Collapsed `EditorPanel` and `DesktopPanel` (~260 LOC each, ~90% duplicated) into thin wrappers over a new generic `SandboxIframeService` component that owns the start/stop/poll state machine, sessionStorage cache, fullscreen toggle, and header buttons — the panels now just supply port, action callbacks, icon, and copy.

## Extract shared sandbox panel logic - 2026-04-28

- Pulled the duplicated multi-pane / preview-fetch / PTY-disconnect orchestration out of `SandboxPanel.tsx` and `TaskSandboxPanel.tsx` into shared `useSandboxPreview`, `useSandboxPanes`, and `<SandboxPaneSlots>` under `apps/web/src/lib/components/sandbox/` — both panels are now ~100-line thin orchestrators with a single source of truth for any future pane behavior changes.
- localStorage / sessionStorage key layouts preserved, so existing client caches keep working through the refactor.

## Editor + Desktop tabs on quick-task sandbox - 2026-04-27

- Quick-task sandbox panel now exposes Editor (in-browser VS Code via code-server) and Desktop (NoVNC + auto-launched Chrome) tabs alongside Preview and Terminal — reviewers get the full session toolkit when debugging a task sandbox.
- Renamed the `sessionId` prop on `EditorPanel`/`DesktopPanel` to `cacheKey` since it was only ever used as a sessionStorage namespace; this lets tasks reuse those panels without lying about identity.

## Per-app dev server configuration (port, command, startup) - 2026-04-27

- **Why**: Auto-detected dev server ports (5173 for vite, 3000 for next) don't work for all projects; startup commands lived on snapshots despite being per-app runtime config, creating confusion between snapshot and app lifecycle.
- **Changes**: Added `devPort` and `devCommand` fields to `githubRepos`; extended `updateConfig` mutation to handle all three (devPort, devCommand, startupCommands); moved startup commands UI from Snapshots tab to new dedicated "App" settings tab; `startSessionServices` now accepts overrides and uses user-defined values if set, else auto-detects; all 6 sandbox startup sites (session reuse/new, task reuse/new, design session reuse/new) thread overrides through.
- **Reason**: Enables config-first approach where users can override default ports and commands per app without touching source; consolidates app configuration in one place; null/empty clears overrides so detection falls back, preserving existing behavior.

## Sandbox status indicator on quick task cards - 2026-04-27

- Quick task cards now show a colored dot (green/amber/grey) reflecting the sandbox status (active/starting/closed), mirroring the session sidebar pattern so reviewers can spot live sandboxes at a glance from any list, kanban, or project view.

## Multi-tab sandbox panel for quick tasks - 2026-04-27

- Task sandbox now exposes Preview + Terminal tabs (mirroring session sandbox), enabling reviewers to debug dev server startup and in-sandbox runtime issues via live terminal access.
- Generalized PTY system to support both sessions and tasks via discriminated `owner: { kind, id }` prop; TerminalPanel now works for both and reuses the same multi-pane infrastructure.
- Preview and terminal pane state persists in localStorage (separate keys per task) so navigating away and back restores the same set of panes.
- Multi-pane previews and terminals with "New Preview/Terminal" button (up to 8 of each) — useful for running multiple dev servers or tailing different logs in parallel.

## Persistent Quick-Task Sandboxes - 2026-04-27

- Quick-task sandboxes now persist across runs, using stop (pause) semantics instead of delete on completion, enabling seamless sandbox reuse during code review, business review, and change-request flows.
- Reviewers can start a sandbox, stop it, and resume later with all in-sandbox state (Convex data, Supabase rows, fixtures) intact; Daytona auto-archives after 7 days idle.
- Renamed `agentTasks` fields from `previewSandboxId`/`previewSandboxStatus` to `sandboxId`/`reviewTaskSandboxStatus` (canonical, shared across all task execution modes).
- Workflow now reuses `task.sandboxId` on subsequent runs for non-project tasks, and reuses `project.sandboxId` for project tasks, avoiding redundant checkouts and bootstrap for change-requests and conflict resolution.
- Stale-run recovery still deletes suspect sandboxes (workflow died mid-execution) and clears task.sandboxId to force fresh provisioning on next run.

## Chunked sandbox config file uploads - 2026-04-27

- **Why**: Convex storage upload URLs enforce a 2-minute server-side POST timeout, so single-blob uploads of files larger than ~500MB reliably stall once the TCP receive buffer fills, blocking large database backups and assets from being baked into snapshots.
- **Changes**: `sandboxConfigFiles` now stores an ordered `chunks` array of storage IDs alongside the legacy `storageId` for backwards compatibility; client splits files into 100MB chunks and uploads each with its own fresh upload URL; snapshot Dockerfile builder and runtime sandbox prep download all chunks and concatenate them with `cat` into the original file (single-chunk files use a direct `curl -o`); shared download logic extracted into `_daytona/helpers.ts` and reused across all four download sites; bumped snapshot memory from 8GB to 12GB.
- **Reason**: Per-chunk POSTs comfortably fit inside Convex's 2-minute window even on slow connections, the legacy `storageId` field stays readable so existing uploads keep working, and joining each file's curl/cat/rm into a single Dockerfile RUN keeps the snapshot image from ballooning with intermediate `/tmp` chunk layers.

## Clarify large config file upload limits - 2026-04-27

- **Why**: Convex storage upload URLs require the file POST to finish within 2 minutes, so very large config files can stall or fail after long waits.
- **Changes**: Snapshot config uploads now use Convex's documented fetch-based upload path, use a timeout aligned with Convex's upload window, and remove noisy upload debug logging.
- **Reason**: Avoids the cross-origin XHR upload path that can stall on large files while preserving the existing storage ID mutation contract.

## Quick Task Sandbox Preview - 2026-04-27

- **Why**: Users need to test database migrations and app changes locally before merging; running migrations programmatically during task execution can't cover all edge cases, so local testing with actual startup commands (supabase start, seed) is essential.
- **Changes**: Added `previewSandboxId` and `previewSandboxStatus` fields to agentTasks to track sandbox state; created `startTaskSandbox` and `stopTaskSandbox` mutations with durable workflow; integrated Daytona to reuse existing sandboxes or create new ones; added TaskSandboxPanel component for dev server preview with port configuration and sessionStorage caching; added "Start Sandbox" button to task detail (code_review/business_review only) with toggle between Details and Sandbox views.
- **Reason**: Enables local iteration on migrations and schema changes without GitHub workflow friction; support for per-app startup commands aligns with existing infrastructure.

## Move startup commands to per-app configuration - 2026-04-27

- **Why**: Monorepos with multiple apps need independent startup command configuration; a single shared snapshot config doesn't support per-app services (e.g., app A runs `supabase start`, app B runs `postgres`).
- **Changes**: Moved `startupCommands` field from `repoSnapshots` table to `githubRepos` table; updated `getStartupCommands` query to read from repos instead of snapshots; added `updateStartupCommands` mutation for per-app updates.
- **Reason**: Apps are already represented as repos with `parentRepoId` set; storing startup commands on the repo itself aligns configuration with app identity.

## Auto-create draft PRs on session execution + archive sandboxes on session archive - 2026-04-24

- **Draft PR workflow**: Session now creates a draft PR immediately after first successful execution; "Send for Review" button marks it ready instead of creating a new PR.
- **Sandbox archival**: Archiving a session now stops and archives its Daytona sandbox to cold storage, preserving state while optimizing cost.

## Improve code-server reliability and error reporting - 2026-04-25

- **Why**: code-server failures were opaque—users saw generic errors with no logs or actionable info.
- **Changes**: `toggleCodeServer` now returns success/failure status with startup logs; EditorPanel displays detailed errors when code-server fails; PTY resize silently handles "not found" during startup race.
- **Reason**: Surfacing logs helps diagnose why code-server won't start (port conflicts, missing deps) without SSH-ing into the sandbox.

## Stream sandbox startup progress to UI - 2026-04-25

- **Why**: Users saw a static "Starting sandbox..." message with no indication of what the platform was doing during the multi-second startup sequence.
- **Changes**: Backend now emits step-by-step progress events (repo loading, context resolution, volume setup, sandbox creation, ref syncing, branch checkout, dev server startup) via streaming; ChatPanel displays each step with animations.
- **Reason**: Real-time feedback reduces perceived wait time and helps diagnose where startup stalls.

## Place sandbox config files in workspace root - 2026-04-24

- **Why**: Quick tasks and sessions need uploaded config files at the codebase root, not only in the sandbox-level `/home/eva/sandbox-config` directory.
- **Changes**: Snapshot-backed sandbox preparation and session startup now download/copy baked config files into `/tmp/repo` after git cleanup and repo sync complete.
- **Reason**: Copying after `git clean` preserves the uploaded files while keeping the snapshot worktree reset behavior intact.

## Create PR on retry if first run failed to create one - 2026-04-24

- **Why**: If the first task run succeeded but PR creation failed, subsequent change-request runs would not attempt to create a PR because the "first task" check only looked for successful runs.
- **Changes**: `isFirstTaskOnBranch` now checks if any run for the task has a `prUrl` set, not just whether a successful run exists.
- **Reason**: PR creation should happen if no PR exists yet, regardless of how many successful runs preceded it.

## Publish quick-task branches from backend - 2026-04-24

- **Why**: Long-running quick tasks could commit successfully inside an ephemeral sandbox, then fail `git push` with an expired GitHub App token; sandbox cleanup deleted the only local copy of the commit.
- **Changes**: Quick-task agents now commit only. The workflow publishes the branch afterward through a Daytona action that mints a fresh installation token for each push attempt, and failed publish attempts preserve the sandbox for recovery instead of deleting it.
- **Reason**: Branch publication is deterministic platform infrastructure, not model work; keeping it in the backend removes token TTL races and protects local commits when GitHub auth fails.

## Filter Supabase MCP tools to read-only allowlist - 2026-04-24

- **Why**: Supabase's remote MCP already receives `read_only=true`, but Eva should not depend solely on upstream visibility guarantees for mutating platform tools.
- **Changes**: Added a local Supabase tool allowlist across all MCP proxy paths so branch, project, migration, edge-function, and cost-confirmation tools are hidden from clients.
- **Reason**: Failing closed keeps newly introduced Supabase tools invisible until they are reviewed and explicitly approved.

## Polish sandbox pane tab strips - 2026-04-23

- **Why**: Preview and terminal pane tabs worked, but the flat row made multiple panes feel bolted on rather than part of the right-panel navigation.
- **Changes**: Added provider-specific icons, stable tab sizing, horizontal overflow handling, integrated close buttons, and consistent press/hover states for preview and terminal pane tabs.
- **Reason**: Makes multi-pane previews and terminals scan faster while preserving the existing tonal surface hierarchy.

## Add multiple web preview panes per session - 2026-04-23

- **Why**: Users need to inspect different routes on the same running preview server without losing each iframe's current URL.
- **Changes**: The sandbox plus menu can now create new preview panes, each with its own mounted iframe/navigation state; preview pane IDs persist per session in localStorage.
- **Reason**: Reuses the same preview server while separating browser state at the panel level, matching terminal pane behavior without adding server/process complexity.

## Store session terminal panes outside the URL - 2026-04-23

- **Why**: Terminal pane IDs are local UI state, but keeping `termIds` and `termActive` in query params made session URLs noisy and hard to share.
- **Changes**: Session terminal pane IDs and active pane now persist in per-session localStorage via `usehooks-ts`; `termIds`/`termActive` are no longer read from or written to the address bar.
- **Reason**: Keeps meaningful navigation state like `tab=terminal` shareable while moving ephemeral terminal instance state out of the URL.

## Move session prompt mode into settings row - 2026-04-23

- **Why**: The Edit/PRD mode tabs floated above the prompt textarea, taking vertical space and separating mode choice from the other send settings.
- **Changes**: Replaced the prompt mode tabs on the session detail chat input with a single-select dropdown in the same footer row as model and response length.
- **Reason**: Keeps all per-message controls together and avoids a special positioned control over the input surface.

## Callback script hardening: durable logging, zombie detection, structured completion - 2026-04-23

- **Event parsing refactor**: Split `parseStreamEvent` into `parseToCanonical` (provider→canonical events) and `applyCanonicalEvents` (state mutations) for clarity and testability.
- **Durable raw logs**: New `RAW_LOG_FILE` (/tmp/run-design.raw.jsonl) captures every stdout/stderr chunk in append mode, survives OOM, enables post-run debugging even when in-memory buffer is capped.
- **Zombie detection**: New `isChildZombie()` detects when CLI process enters zombie state (held open by grandchild stdio). Fires early in no-output timer loop to avoid 60s timeout when process is already dead.
- **Completion tracking**: New `DONE_FILE` (/tmp/run-design.done) written idempotently on all terminal paths (success/error/preflight-failed/fatal-error) with durationMs, status, step counts, raw log bytes. Structured for post-mortem queries.
- **Stderr mirroring**: Stderr appended to raw log with `[stderr]` prefix to preserve ordering across dual pipes.
- **Scope**: `packages/backend/convex/_daytona/callbackScript.ts` only (the template string). No schema changes, no breaking changes, degrades gracefully if /tmp write access unavailable.

## Extend watchdog threshold during active agent tool steps + prune MCP success-path logs - 2026-04-23

- **Why (threshold)**: Even with the pre-kill liveness probe re-probing every cycle, a quick task kept getting killed during long silent shell commands (`pnpm build 2>&1 | tail -50`). While the agent is inside a bash tool step, stream-json emits nothing new for minutes — the only thing bumping `streamingActivity.lastUpdatedAt` is the 10s heartbeat, and if heartbeat transport blips for ~5 min the run is killed even though the build is healthy. The probe verified the PID was alive but could only buy one 30s grace cycle at a time.
- **Fix (threshold)**: New constant `STALE_TOOL_ACTIVE_THRESHOLD_MS = 900_000` in `_taskWorkflow/recovery.ts`. New helper `hasActiveAgentToolStep()` in `_taskWorkflow/watchdog.ts` returns true when streamingActivity has at least one active step whose label is NOT a sandbox-startup label and NOT `"Finalizing response..."` (i.e. real agent tool work: Bash, tool use, etc.). `checkStaleRuns` priority is now: `startup → tool-active → finishing → default` (15min / 15min / 10min / 5min). Combined with the per-cycle liveness probe this gives up to 15 minutes of silent tolerance before even the first probe fires — exactly the scenario that broke (long build with stdout redirected away from the terminal).
- **Structured log**: `[watchdog][kill]` log line gains `toolActive=…` alongside `startup`/`finishing` so post-mortems show which branch of the threshold picker fired.
- **Why (logs)**: MCP endpoints were emitting chatty `console.log` breadcrumbs on every request (OAuth discovery, registration, token exchange, request body preview, tool-registration counts). None of this was relevant to the watchdog kill that triggered the investigation and the volume was cluttering the dashboard.
- **Fix (logs)**: Deleted success-path `console.log` calls from `mcp/native.ts` (`oauthMetadata`, `protectedResourceMetadata`, `register`, `authorizePost`, `token`, `mcpHandler`) and `mcp/nodeActions.ts` (`verifyAccessToken`, `handleMcpRequest`). Kept `console.error` for genuine failures (missing env config, verification failures, tool registration errors).
- **Scope**: `_taskWorkflow/recovery.ts` (new constant), `_taskWorkflow/watchdog.ts` (helper + threshold wiring + log field), `mcp/native.ts` + `mcp/nodeActions.ts` (log pruning). No schema changes, no UI changes, no prompt changes. The 2-hour `handleStaleRun` hard timeout remains the ultimate backstop.

## Re-probe stale runs before every watchdog kill attempt - 2026-04-23

- **Why**: A run could pass the liveness probe (`alive=true`) and still be killed 30 seconds later because the next stale check forced `skipLivenessProbe=true`, bypassing re-validation and doing a blind kill.
- **Changes**: `_taskWorkflow/livenessProbe.ts` now reschedules `checkStaleRuns` without `skipLivenessProbe` when the sandbox callback is alive, so each stale cycle re-runs the liveness probe before any kill. The probe-confirmed-dead path still sets `skipLivenessProbe=true` for immediate cleanup.
- **Reason**: Prevent false watchdog kills when heartbeats are stale but the sandbox process is actively running.

## Pre-kill liveness probe for the watchdog + structured kill logs - 2026-04-23

- **Why**: The watchdog kills a run as soon as `streamingActivity.lastUpdatedAt` is older than the stale threshold. A transient heartbeat transport failure (Convex auth flap, brief network blip, event loop starved by heavy stdio during a long `pnpm build`) was enough to kill a demonstrably-healthy run — the sandbox was still executing, the CLI was still running, only the heartbeat couldn't reach Convex for ~5 minutes. Also, when the watchdog did kill, the kill reason logs were thin and hard to correlate with the run's actual state.
- **Liveness gate**: New internal action `daytona.verifySandboxLiveness` asks Daytona whether the sandbox is in the `started` state and, if so, checks that the callback runner PID (`/tmp/run-design.pid`) is still alive via `kill -0`. New internal action `taskWorkflow.probeStaleRunLiveness` wraps the probe: if both sandbox + PID are alive it grants exactly ONE grace cycle (reschedules `checkStaleRuns` after `STALE_RECHECK_MS` with `skipLivenessProbe: true`); if the probe confirms dead, `checkStaleRuns` is re-entered immediately with the probe suppressed so the kill path runs without another round-trip.
- **One grace cycle only**: `checkStaleRuns` gained a `skipLivenessProbe` optional arg set by the probe after it has already granted a cycle — prevents alive-but-zombie runs from looping forever. The hard 2-hour `handleStaleRun` is the backstop. Startup-phase staleness (callback PID not guaranteed to exist yet) skips the probe and kills directly, same as before.
- **Conservative on probe failure**: If the Daytona API is unreachable (`getSandbox` / `refreshData` throws), the probe returns `alive: true` with `reason: "probe_unreachable_*"` so the watchdog does not kill on its own inability to verify. 2-hour timeout still applies.
- **Structured kill logs**: Every `cleanUpStaleRun` call in `checkStaleRuns` now emits a `[watchdog][kill] runId=… reason=… streamingAgeMs=… thresholdMs=… skipProbe=… startup=… finishing=… activity=…` log line; the probe emits `[watchdog][probe] runId=… alive=… reason=… sandboxState=… pidAlive=… probeDurationMs=…`. Makes it trivial to post-mortem a kill from logs alone.
- **Scope**: `_daytona/lifecycle.ts` (+ `daytona.ts` export) for `verifySandboxLiveness`; new `_taskWorkflow/livenessProbe.ts` (+ `taskWorkflow.ts` export) for `probeStaleRunLiveness`; `_taskWorkflow/watchdog.ts` for the gate + logs. No schema changes, no UI changes, no prompt changes.

## Attribute sandbox commits to GitHub App bot user - 2026-04-22

- **Why**: Commits from sandboxes showed the repo owner's avatar on GitHub because the hardcoded git author email was `48868398+vedantb2@users.noreply.github.com` — GitHub attributes commits by author email, not pusher, so every commit looked like the owner wrote it (even though push auth was already the App installation token).
- **Fix**: Replaced hardcoded `"Eva"` identity with env-driven `${GITHUB_APP_SLUG}[bot]` + `${GITHUB_BOT_USER_ID}+${GITHUB_APP_SLUG}[bot]@users.noreply.github.com`. Two new Convex env vars — `GITHUB_APP_SLUG` and `GITHUB_BOT_USER_ID` — store the App slug and its bot user's numeric ID (different namespace from App ID; resolved via `GET https://api.github.com/users/<slug>[bot]`).
- **Scope**: `_daytona/git.ts` (runtime — set on every sandbox create) and `snapshotActions.ts` (snapshot build-time default). Legacy `.github/workflows/rebuild-snapshot.yml` left untouched (marked not used). No schema changes.
- **Effect**: New sandboxes attribute commits to the GitHub App bot on GitHub — correct avatar, "committed by {app}[bot]". Already-running sandboxes keep the old identity until recreated. Switching to a different App requires only updating the two env vars, no code change.

## Fixed Convex bundling error: URL builders pulling Node.js modules into V8 runtime - 2026-04-22

- **Why**: `npx convex dev` was failing with "Could not resolve node:crypto" in `encryption.ts`. Root cause: `workflowDefinition.ts` (no `"use node"`) imported `buildEvaTaskUrl` from `taskWorkflowActions.ts`, which imported `envVarResolver.ts` → `encryption.ts` → `node:crypto`. Bundler included the entire chain in the V8 runtime bundle.
- **Fix**: Extracted `buildEvaTaskUrl()` and `buildEvaSessionUrl()` into new module `_taskWorkflow/urls.ts` with zero dependencies. Updated consumers (`workflowDefinition.ts`, `github.ts`) to import from new location. `taskWorkflowActions.ts` re-exports for backwards compatibility.
- **Result**: Bundler no longer pulls Node.js modules into V8 bundle. `npx convex dev` passes cleanly.

## Focus "Make changes" runs on new comments only - 2026-04-21

- **Why**: When a quick task accumulated multiple comments and the user clicked "Make changes" multiple times, the agent was asked to address every comment from the entire task history again, not just the new feedback — wasting tokens and confusing users who'd already seen the first comment fixed.
- **How it works**: `getTaskData` query now filters `taskComments` to only those created after the most recent successful `agentRun` on the task started. Failed/errored runs don't act as cutoffs (so comments carry over to retries), and first-time tasks get all comments. The prompt already contained the right instruction ("Focus ONLY on addressing the change requests above"); it was just being fed stale data.
- **Scope**: Backend only (`_taskWorkflow/queries.ts`). No schema changes, no prompt wording changes, no UI changes.

## Fixed Convex bundling error with Node.js built-in modules - 2026-04-21

- **Why**: `npx convex codegen --typecheck enable` was failing with "Could not resolve node:crypto" even though `encryption.ts` correctly used the `"use node"` directive. Root cause: non-"use node" files (`workflowDefinition.ts`, `automationWorkflow.ts`, `testGenWorkflow.ts`, `evaluationWorkflow.ts`) imported `buildPrBody` from `taskWorkflowActions.ts` (which has `"use node"`), creating a transitive import chain that pulled `node:crypto` into the V8 runtime bundle where it can't be resolved.
- **Fix**: Extracted `buildPrBody` (a pure string builder with no Node APIs) into its own neutral module `prBody.ts`. Updated all consumers (5 files) to import from the new location. Bundler no longer tries to include Node.js modules in the V8 bundle.
- **Result**: `npx convex codegen` and typecheck now pass cleanly. No behavioral changes.

## Persistent per-PR preview URLs - 2026-04-21

- **Why**: Preview URLs stored on runs, sessions, and projects came from GitHub Deployment Status and were scoped per-commit (`{project}-{hash}.vercel.app`), so every new push made the stored URL go stale. Users want the stable branch alias Vercel auto-creates per PR (`{project}-git-{branch}-{team}.vercel.app`), which persists across commits and always points at the latest build. Constructing the alias client-side fails when the subdomain exceeds the 63-char DNS limit (Vercel truncates + appends a non-deterministic hash), so the only reliable source is Vercel's API.
- **Approach**: After the existing GitHub Deployment poll resolves a per-commit URL, call `GET https://api.vercel.com/v13/deployments/{hostname}`, read the response's `alias[]`, pick the entry matching `/-git-[^.]+\.vercel\.app$/`, and store that as `deploymentUrl`. Never construct the alias locally — Vercel returns the final resolvable form including any truncation hash.
- **Changes (backend)**: New `_deployment/vercel.ts` with `fetchStableBranchAlias()` — a thin REST wrapper that returns null on any failure (missing token, HTTP error, malformed payload, no matching alias). New local helper `resolveStableDeploymentUrl()` in `taskWorkflowActions.ts` shared by `pollDeploymentStatus` and `pollSessionDeploymentStatus`; both pollers gained a `repoId` arg, which is now plumbed through `scheduleDeploymentTracking` (runLifecycle.ts) and `scheduleSessionDeploymentTracking` (sessionWorkflow.ts) from the run/session record.
- **Anti-flip semantics**: During polling without an alias, the helper returns `undefined` for the URL so the mutation skips the `deploymentUrl` patch (the existing `...(args.deploymentUrl !== undefined && { deploymentUrl })` spread makes this a no-op). The stored URL never flips from per-commit to stable mid-deployment — it either starts empty and becomes the stable alias, or (only after 20 polling attempts with no alias) falls back to the per-commit URL as a safety net.
- **Graceful degrade**: If `VERCEL_TOKEN` isn't configured on team/repo env vars, the helper returns the per-commit URL immediately — identical to pre-change behaviour, no wasted API calls.
- **Projects inherit for free**: Project task runs already push to the project branch (`eva/project-<id>`), so run-level polling converges on the project's stable alias; `getLatestDeploymentByProject` returns the stable URL with no query change.
- **Operational**: Users create a Vercel token (Account Settings → Tokens, scoped to team) and paste `VERCEL_TOKEN` + `VERCEL_TEAM_ID` into the platform's team env vars UI at `/{owner}/{repo}/settings/env-variables?tab=team` with `sandboxExclude: true` so the token is never injected into user sandboxes. No schema changes, no UI changes — `deploymentUrl` is an opaque string everywhere it's read.

## Sandbox config files and startup commands - 2026-04-20

- **Why**: Users need to seed databases with sensitive files (e.g., `seed.sql`) that cannot be committed to the repo, and run setup commands like `supabase start` once per sandbox. Two new features address this: config files baked into snapshots, and startup commands that run when sandboxes first start.

### Config Files (baked into snapshots)

- **Storage**: New `sandboxConfigFiles` table stores per-repo file metadata. File content lives in Convex file storage; URLs fetched fresh at snapshot build time.
- **Snapshot integration**: `buildSnapshotImage()` generates `curl` commands to download files into `/tmp/sandbox-config/` before the repo clone.
- **UI**: New "Config Files" tab in Snapshots settings with upload interface, file table, and warning banner about rebuild requirement.
- **Filename validation**: Restricted to `[a-zA-Z0-9._-]+` for shell safety.

### Startup Commands (run on sandbox start)

- **Why**: Commands like `supabase start` need a running Docker daemon (unavailable during image build). Startup commands run once when a sandbox first starts from a snapshot.
- **Schema**: Added `startupCommands` field to `repoSnapshots` table (array of shell commands).
- **Execution**: `runStartupCommands` action runs commands in sequence with 10-minute timeout each. Creates `/tmp/.startup-commands-done` marker to skip on sandbox resume.
- **Integration**: Added to `prepareSandboxSteps` workflow after branch setup. Non-fatal on failure (logs errors, continues).
- **UI**: New "Startup Commands" section in Snapshots Configuration tab with textarea (one command per line) and helper text.

## Comprehensive interface design refinements across web and UI components - 2026-04-19

- **Why**: Interfaces feel polished through accumulated small details: consistent tactile feedback on buttons, smooth non-jarring animations, proper text spacing, extended touch targets, and subtle visual depth. These changes compound into a more intentional and refined experience across the entire platform.
- **Scale on press**: Standardized all `active:scale-*` to `0.96` across 40+ button components (was `0.97`, `0.985`, `0.99`, or missing). A consistent `0.96` provides reliable tactile feedback without feeling exaggerated.
- **Transition specificity**: Replaced 30+ instances of `transition-all` with specific properties (`transition-colors`, `transition-[width]`, `transition-[transform,background-color]`, etc.). Eliminates unnecessary animations on properties that aren't changing, improving perceived performance and reducing visual noise.
- **Tabular numbers**: Added `font-variant-numeric: tabular-nums` to 15+ dynamic number displays (percentages, counts, durations, tokens). Fixed width prevents layout shift when values update, critical for progress bars and real-time stats.
- **Text balance**: Applied `text-wrap: balance` to 20+ headings to prevent awkward line breaks and orphaned words. Text flows naturally at any viewport size.
- **Hit area extensions**: Added 40×40px minimum hit areas to 8 small interactive elements (close buttons, toggles) using `after:absolute after:inset-[-Xpx]` pseudo-elements. Improves accessibility on mobile and reduces frustration on small targets.
- **Image outlines**: Added subtle `1px` outlines (`outline outline-1 outline-black/10 dark:outline-white/10`) to 4 images (icons, avatars). Creates consistent depth and separates images from their backgrounds.
- **AnimatePresence safeguards**: Added `initial={false}` to 6 `AnimatePresence` components to prevent animations during first render, keeping page load feeling instant.
- **Concentric border radius**: Fixed nested element border radius in InputGroup and QuickTaskCard to use proper concentric calculations (outer = inner + padding). Prevents visual misalignment on nested surfaces.
- **Scope**: 50+ files across `apps/web/src` and `packages/ui/src` touched; no behavioral changes, purely aesthetic/UX polish.

## Add Cursor CLI as fourth AI provider - 2026-04-17

- **Why**: Platform supported Claude Code, Codex, and opencode. Adding Cursor unlocks Cursor's hosted model routing (Claude 4 Sonnet/Opus variants, GPT-5.4, Gemini 3 Pro) under the same per-task model selector with full session resume parity. Users auth with a single `CURSOR_API_KEY` env var — simpler than opencode's dual OAuth/config paths.
- **Changes (runtime)**: `cursor-agent` baked into the Daytona snapshot via curl installer (`curl -fsS https://cursor.com/install | bash`) running as the eva user after `USER eva`; `/home/eva/.local/bin` added to `PATH`. `validators.ts` gains `"cursor"` provider + 6 hardcoded model literals (`cursor:claude-4-sonnet`, `claude-4.6-sonnet`, `claude-4.5-opus`, `gpt-5.4`, `gpt-5.4-mini`, `gemini-3-pro`); `getAIProviderAvailability` flips `cursor: true` when `CURSOR_API_KEY` is set. `_daytona/launch.ts` dispatches cursor provider to `ensureCursorCliAvailable` and threads `CURSOR_RUNTIME_HOME_DIR` / `CURSOR_PERSIST_DIR` / `CURSOR_BIN_PATH` into the runner.
- **Changes (callback)**: `callbackScript.ts` adds a full cursor branch. Because Cursor's CLI takes the prompt as a positional argument (not stdin like Claude/Codex/opencode), the command is built with inline shell expansion: `cursor-agent -p "$(cat /tmp/design-prompt.txt)" --force --trust --workspace ... --model ... --output-format stream-json --approve-mcps`. Stream parser maps Cursor's `system.init` / `assistant` / `tool_call` (started/completed) / `result` events to the existing UI step model; `session_id` is captured from `system.init` and passed on resume via `--resume <id>`. MCP config is translated from Eva's `/tmp/eva-mcp.json` into Cursor's workspace-relative `${WORK_DIR}/.cursor/mcp.json` (keeping only url + headers per remote entry).
- **Changes (persistence)**: New `CURSOR_PERSIST_VOLUME_MOUNT_PATH` mount joins the Claude/Codex/opencode subpaths under the shared session volume. `PersistedProvider` widened to a 4-way union; `ensureSessionPersistenceVolumes` provisions the 4th mount; `hydratePersistedCursorState` / `syncCursorStateToPersist` manage only the `session_id` file (no OAuth rotation, since auth is a static API key).
- **Changes (UI)**: `ProviderIcon` gains a `CursorMark` component rendering Cursor's signature 3D hexagonal brand (three faceted triangles at opacities 0.5/0.7/0.9, single `currentColor` fill). `getProviderLabel` returns `"Cursor"`. Model selectors in QuickTaskModal, ChatPanel, ProjectChatArea, StatusFieldsSection, AutomationClient, DesignChatPanel, and ConfigClient auto-render the Cursor provider submenu with the new logo. `TaskCardMenuItems` context menu gains a 4th provider branch. `SetupBanner`, `TeamEnvVarsTab`, `EnvVariablesClient`, and `TeamEnvVarsClient` document `CURSOR_API_KEY`. `_githubRepos/queries.ts` extends `getProviderAvailability` return validator to 4-way.
- **Changes (lifecycle)**: `_daytona/execution.ts` and `lifecycle.ts` pkill cleanup extended with `cursor-agent` (and the previously-missing `opencode`) so sandbox resets terminate stray processes across all providers.
- **Snapshot correction**: `opencode-ai` was added to `.github/workflows/rebuild-snapshot.yml` at the time of the opencode launch but never ported to `snapshotActions.ts` when the build pipeline moved into Convex. Both `opencode-ai` (npm) and `cursor-agent` (curl) now bake into snapshots via `snapshotActions.ts`; the legacy workflow file is marked as dead code.
- **Operational**: Users paste `CURSOR_API_KEY` as a team or repo env var (generate from cursor.com/dashboard → Integrations → API Keys). Rebuilding the Daytona snapshot is required to ship the CLI; existing snapshots still work via the `ensureCursorCliAvailable` curl fallback.

## Add opencode CLI as third AI provider - 2026-04-16

- **Why**: Platform supported only Claude Code and Codex. Adding opencode unlocks a wider model catalog (OpenAI + Groq/OpenRouter/Gemini via API-key config, or ChatGPT Plus/Pro/Team via OAuth) under the same per-task model selector, with full session resume parity.
- **Changes (runtime)**: `opencode-ai` baked into the Daytona snapshot with a `/tmp/opencode-cli` fallback install path. `validators.ts` gains `"opencode"` provider + `opencode:openai/gpt-5-codex` model literal; `getAIProviderAvailability` flips `opencode: true` when any `OPENCODE_*` env var is set. `_daytona/launch.ts` dispatches opencode provider to `ensureOpencodeCliAvailable` and threads `OPENCODE_RUNTIME_HOME_DIR` / `OPENCODE_PERSIST_DIR` / `OPENCODE_BIN_PATH` into the runner.
- **Changes (callback)**: `callbackScript.ts` adds a full opencode branch: hydrates `OPENCODE_CONFIG_JSON` into `process.env.OPENCODE_CONFIG_CONTENT` for API-key providers, writes `OPENCODE_AUTH_JSON` to `/home/eva/.local/share/opencode/auth.json` for ChatGPT OAuth; constructs `opencode run --format json --model ...` with `-s <id>` resume; parses the `step_start` / `text` / `tool_use` / `step_finish` event envelope; persists session state + (refreshed) auth.json to the volume on completion so rotated OAuth tokens survive sandbox tear-down.
- **Changes (persistence)**: New `OPENCODE_PERSIST_VOLUME_MOUNT_PATH` mount joins the existing Claude and Codex subpaths under the shared session volume, so resume works symmetrically with the other providers.
- **Changes (UI)**: `ProviderIcon` + `getProviderLabel` gain a dedicated "Opencode" case with the real opencode brand mark (from models.dev). Model selectors in ChatPanel, ProjectChatArea, ConfigClient, StatusFieldsSection, and TaskCardMenuItems render the opencode logo + label automatically. `SetupBanner` and `TeamEnvVarsTab` document the two auth paths.
- **Operational**: Users paste either `OPENCODE_CONFIG_JSON` (inline provider config with `{env:OPENAI_API_KEY}` substitutions) or `OPENCODE_AUTH_JSON` (contents of `~/.local/share/opencode/auth.json` after running `opencode auth login` locally) as a team env var. Rebuilding the Daytona snapshot is required to ship the CLI.

## Claude session persistence for project interviews - 2026-04-16

- **Why**: Project interviews were re-injecting previous Q&A pairs as text each time Claude asked a question, forcing manual context management. Sessions already had true Claude session persistence via volume mounts and `--resume` flags; projects now use the same infrastructure for full conversational context.
- **Changes**: Extended session persistence to support projects (`"projects"` added to `PersistableSessionKind`). `prepareSandbox` and `launchOnExistingSandbox` now accept `sessionPersistenceId` + `sessionPersistenceKind` (sessions/projects). Interview prompts no longer include "Already Decided" section—Claude has full transcript via `--resume`. Added `startSpec` mutation to trigger spec generation when interview returns `{"ready": true}`. Frontend detects `ready` and calls `startSpec` with same session context. Simplified frontend: removed `previousAnswers` tracking from `ProjectChatTab`, simplified mutation signatures.

## Remove shallow clone option from git fetch functions - 2026-04-15

- **Why**: Shallow clones (`--depth 1`) cause issues with rebasing, blame, and merges in user repos. Full history is always needed for reliable git operations.
- **Changes**: Removed `shallow` option from `fetchOrigin` and `fetchBranchRefs` in `git.ts`. All callers now fetch full history by default. Plugin marketplace clones in snapshot images still use `--depth 1` (they're static dependencies, not user repos).

## Session PRD edit without active sandbox - 2026-04-14

- **Why**: `planContent` is stored in Convex and does not depend on Daytona; tying the Edit affordance to `session.status === "active"` blocked edits while the sandbox was stopped or starting.
- **Changes**: `SessionPrdPlanView` no longer takes `canEdit`; Edit shows whenever the session is not archived (save still uses `updatePlanContent` + `hasRepoAccess`).

## Editable session PRD (Markdown via Tiptap) - 2026-04-14

- **Why**: Product requirements needed in-place editing without a custom HTML↔Markdown bridge; storage stays Markdown in `sessions.planContent` for consistency with agents and Streamdown rendering.
- **Changes**: `apps/web` uses `@tiptap/markdown` with StarterKit + GFM; `SessionPrdPlanEditor` loads/saves via `contentType: "markdown"` and `getMarkdown()`; `SessionPrdPlanView` toggles view/edit with Cancel/Save when not archived. `updatePlanContent` enforces `hasRepoAccess` and bumps `updatedAt`.

## PRD tab on expanded session sandbox panel - 2026-04-14

- **Why**: With the right column open, the PRD plan duplicated space above the chat input; moving it to a dedicated tab keeps one source of truth and frees the composer.
- **Changes**: `sandboxTab` adds `prd`; `SandboxTabBar` shows PRD when `planContent` exists and session mode is plan; `SessionPrdPlanView` shares compact (collapsed panel) and panel layouts; `ChatPanel` shows inline PRD only when `sandboxCollapsed !== false`; `useSessionSettings` in `SandboxPanel` syncs Approve Plan with chat.

## Multi-terminal sandbox PTY panes (session right panel) - 2026-04-14

- **Why**: One PTY per session forced a single shell; agents and users need several concurrent shells without leaving the session.
- **Changes**: Convex `connectPty` / `resizePty` / `disconnectPty` accept optional `ptyInstanceId` so Daytona PTYs are keyed per pane without colliding on `sessions.ptySessionId`. Web: nuqs `termIds` + `termActive`, Chrome-style `+` menu (New Terminal), sub-row for extra shells with close on 2+, stacked `TerminalPanel`s with foreground fit/resize, dev autostart only on the first pane.
- **Reason**: Multiple independent PTY sessions per sandbox with URL-persisted layout.

## Harden task streaming heartbeats and completion delivery - 2026-04-14

- **Why**: Transient Convex/network errors caused streaming heartbeats to fail without retries, the callback aborted the CLI after only three failures, and `workflow.sendEvent` failures after `finalizingAt` left runs stuck until the watchdog fired.
- **Changes**: `streaming:set` now uses the same mutation retry path as other callback HTTP calls; heartbeat termination uses burst/slow-window/absolute caps with longer default HTTP timeout; `handleCompletion` clears `finalizingAt` when `sendEvent` throws and logs a structured error; audit completion logs send failures; `prepareSandboxSteps` retries branch checkout/setup with backoff; finishing watchdog window doubled to 10 minutes.
- **Reason**: Reliability of long-running sandboxes and completion handoff without spurious kills or stuck finalizing state.

## Optimize Daytona sandbox reuse with stop/resume lifecycle instead of delete/create - 2026-04-14

- **Why**: Session sandbox startup took 30+ seconds because each session close deleted the sandbox and next open created a fresh one. Daytona supports stop/resume which resumes in ~14s instead of creating from scratch in 20-26s.
- **Changes**:
  - Removed `autoDeleteInterval` from `SESSION_LIFECYCLE` to let Daytona auto-stop after 15 min idle and auto-archive after 7 days instead of immediate deletion.
  - Keep `sandboxId` on session close (don't clear it) so `startSandbox` can detect and reuse the existing stopped sandbox.
  - Added `stopSandbox` internal action for manual stop (called by external cleanup flows, not auto-triggered on session close).
  - Updated `validateSandbox` to use `ensureSandboxRunning()` which auto-resumes stopped sandboxes via `sandbox.start()`.
  - Skip git checkout in `checkoutSessionBranch` if already on target branch to avoid unnecessary Daytona API calls.
  - Added detailed logging to diagnose sandbox startup timing and lifecycle transitions.
- **User experience**: Users returning within 15 min get instant resume (sandbox still running). After idle, resume takes ~14s. After 7 days stopped, Daytona archives it and next open requires fresh create (~20-26s).
- **Reason**: Reusing stopped sandboxes cuts session resume time 2-3x and eliminates the waste of throwing away a working sandbox on every close.

## Replace shell git commands with Daytona SDK and simplify git operations - 2026-04-12

- Replaced shell `git clone` with `sandbox.git.clone()` via new `execSdkGitOperation` wrapper (timeout, logging, stale-process cleanup)
- Replaced shell `git checkout` with `sandbox.git.checkoutBranch()` in local-branch paths (`checkoutFetchedBaseBranch`, `checkoutSessionBranch`)
- Replaced shell `git branch` listing with `sandbox.git.branches()` in `resolveBaseTarget`, `resolveBranchStartTarget`, and `checkoutSessionBranch`
- Deleted dead code: `remoteBranchExists` (zero callers), `downloadRepoArchive` (replaced by `cloneAndSetupRepo`), `configureGitHubOrigin` (folded into publish flow)
- Simplified `setupBranch` — removed stash/merge/verify choreography, replaced with single `git checkout -B` from best resolved ref
- Made both fetch steps (base branch + task branch) non-fatal in `prepareSandboxSteps` so tasks proceed with local snapshot refs when sandbox networking is broken
- Fixed snapshot DNS resolution: xfce4 desktop packages pull in `libnss-mdns` which inserts `mdns4_minimal [NOTFOUND=return]` before `dns` in `/etc/nsswitch.conf`, causing `getaddrinfo()` to fail for external hosts — added `sed` fix to `buildSnapshotImage`

## Make base-branch fetch failures explicit and stop pointless auto-retry loops - 2026-04-12

- **Why**: When sandbox-to-GitHub transport hangs, `fetchBaseBranch` can fail repeatedly with the same timeout and quick-task auto-retry can relaunch the same failure path, burning extra minutes without recovering.
- **Changes**:
  - Wrapped quick-task base-branch fetch with an explicit error message that names the failing stage and branch.
  - Excluded `fetchBaseBranch` transport failures from quick-task auto-retry classification.
  - Added `GIT_TERMINAL_PROMPT=0` to git fetch/ls-remote paths so blocked credential prompts fail immediately instead of appearing as transport hangs.
- **Reason**: These failures need a clear operator signal, not a second identical run attempt.

## Bound base-branch fetch stalls to ~50s instead of multi-minute retries - 2026-04-12

- **Why**: Quick-task startup could spend 3+ minutes stuck on `Fetching base branch...` when Daytona `executeCommand` calls timed out at 60s and retry logic stacked at multiple layers.
- **Changes**:
  - Reduced per-attempt base-branch fetch timeout from 60s to 25s.
  - Capped git fetch retries inside `fetchBaseBranch` to 2 attempts.
  - Disabled extra workflow-step retries for the fetch steps so we don’t run nested retry towers.
- **Reason**: Startup should fail fast on transport stalls and retry in one place only.

## Fetch latest base/task refs before quick-task branch setup - 2026-04-12

- **Why**: Quick-task sandbox prep was intentionally local-first, but that also meant snapshot-backed runs could start from stale refs and miss newly pushed commits on the selected base branch.
- **Changes**:
  - Added an explicit `fetchBaseBranch` step in quick-task sandbox prep before branch checkout/setup.
  - Added a best-effort fetch for the task branch ref so reruns can start from the latest remote task branch when it exists.
  - Updated branch start-target resolution to prefer `origin/<task-branch>` over stale local branch refs.
- **Reason**: Quick tasks must start from the latest remote branch state, then create/switch the working branch deterministically.

## Collapse quick-task git flow to one local checkout + one backend push - 2026-04-12

- **Why**: Quick tasks were still spending minutes in git even after startup became local-first. Branch setup was doing extra stash/merge choreography, backend push was mutating `origin` and retrying long timed-out pushes, and quick tasks still waited for post-run audit even when the actual code change was already complete.
- **Changes**:
  - Simplified quick-task branch setup to a single local `git checkout -B` from the best already-available ref: local branch, local remote-tracking branch, or base ref.
  - Replaced sandbox `git push` publication with backend branch publishing through the GitHub Git Data API, using the sandbox's committed diff instead of relying on flaky sandbox-to-GitHub git transport.
  - Removed retry wrapping from local branch checkout/base checkout workflow steps because those steps no longer depend on network transport.
  - Stopped quick tasks from waiting on the post-run audit path; synchronous audit remains for project-style runs only.
  - Fixed the implementation prompt wording so proof capture happens after commit, not after push, matching the platform-owned push model.
- **Reason**: The quick-task critical path should be: local checkout, one agent run, one backend branch publish, done. Every extra git step and synchronous post-processing stage multiplies failure modes and makes simple tasks feel broken.

## Merge session modes (ask+execute → edit) and fix markRunFinalizing - 2026-04-11

- **Why**: Users kept forgetting to switch from "ask" to "execute" mode and expected edits to work in ask mode. Meanwhile, the separate `markRunFinalizing` HTTP call from the sandbox callback was failing with a 404 because Convex couldn't resolve the function at runtime.
- **Changes**:
  - Merged "ask" and "execute" session modes into a single "edit" mode with full tool access. The prompt distinguishes intent — questions get answered without changes, requests get implemented. "Plan" (PRD) mode is unchanged.
  - Frontend shows 2 tabs (Edit + PRD) instead of 3. Keyboard shortcut toggles between them.
  - Added batch migration function to convert legacy `ask`/`execute` message modes to `edit`.
  - Frontend `useSessionSettings` normalizes old localStorage values (`ask`/`execute` → `edit`).
  - Folded `finalizingAt` timestamp into the existing `handleCompletion` mutation instead of calling it separately from the sandbox. Removed `markRunFinalizing` function and its callback script call site.
- **Reason**: Fewer modes = less confusion, less code, fewer bugs. Folding finalizingAt into handleCompletion eliminates a fragile separate HTTP call.

## Show live quick-task reply text while runs are in progress - 2026-04-11

- **Why**: Quick-task runs already stream both structured activity steps and the assistant's incremental reply text, but the task timeline only rendered the activity steps. Once a run reached `Streaming response... / Receiving reply...`, the UI looked frozen even when the callback was actively streaming text into `currentContent`.
- **Changes**:
  - Rendered `streaming.currentContent` in the task run timeline while a run is active, matching the behavior already used in session chat.
- **Reason**: This is an observability fix. Users need to see the live reply content so they can distinguish real stalls from a run that is still actively streaming.

## Move quick-task branch push out of the model path - 2026-04-11

- **Why**: Quick tasks were still wasting large amounts of wall-clock time after the actual code change was finished because the prompt required the model to `git push`. When GitHub transport from the sandbox was flaky, Claude started debugging git config and refspecs instead of finishing the workflow. That work is deterministic infrastructure, not model reasoning.
- **Changes**:
  - Added a backend `pushSandboxBranch` action that pushes the prepared branch from the sandbox with bounded retry/logging.
  - Updated the quick-task workflow to push the branch itself after a successful agent completion and before deployment tracking or PR creation.
  - Updated implementation/conflict/audit-fix prompts so the model commits changes but explicitly does not push or debug git transport.
  - Added a platform note documenting that quick-task push ownership belongs to the workflow, not the model.
- **Reason**: Git transport is better handled as a short, explicit infrastructure step. Removing push from the prompt cuts wasted model time and keeps task failures tied to the real failing step.

## Ignore stale sandbox completions after watchdog cleanup - 2026-04-11

- **Why**: Quick-task runners can still finish or report late after the watchdog has already killed the run, cleared the active workflow, and possibly scheduled a retry. The previous completion mutations treated those late callbacks as invariant violations, which surfaced noisy `Completion callback run did not match active run` errors even though the system had already moved on correctly.
- **Changes**:
  - Tightened task completion handling so task callbacks now require a live `runId`, an active workflow, and the current running run before forwarding events into the workflow.
  - Applied the same stale-callback guard to audit completions so late audit runners are ignored instead of throwing after cleanup/retry.
  - Added an explicit platform note documenting that stale sandbox completions are expected and must be treated as no-ops.
- **Reason**: Watchdog cleanup and auto-retry are only robust if late callbacks from the old sandbox become harmless. Ignoring stale completions removes false failures without changing the active run’s behavior.

## Tighten quick-task runner startup and remove wasted retries - 2026-04-11

- **Why**: Quick tasks were still spending time in the wrong places even after sandbox bootstrap was fixed. The task runner was paying an MCP startup tax it did not need, Claude was allowed to sit for 90 seconds before first output, auto-retry was re-running non-transient failures, and finalizing-state handling had drifted across separate callback paths.
- **Changes**:
  - Folded finalizing-state handling into the main completion path instead of relying on a separate public `markRunFinalizing` callback.
  - Added an `enableMcp` flag to sandbox runner launch and disabled MCP/token minting for quick-task and audit runs, keeping those paths local-first.
  - Added tighter runner budgets for quick tasks and audits so they fail much sooner when the provider never starts producing useful output.
  - Restricted quick-task auto-retry to transient Daytona-style infrastructure failures instead of retrying generic model or task failures.
- **Reason**: Quick tasks should fail fast on bad runner/provider states and should not silently pay for features they are not using.

## Simplify callback runner heartbeat and attempt flow - 2026-04-11

- **Why**: The detached Daytona callback runner had become too stateful and too forgiving in the wrong places. A malformed completion block had already proven the generated-script path was fragile, heartbeat delivery used overlapping retry layers, and the runner could silently launch a second provider attempt without making that retry explicit at the workflow layer. Those behaviors made failures hard to reason about and allowed transient callback transport issues to turn into multi-minute stalls.
- **Changes**:
  - Fixed the generated callback completion block so the emitted `/tmp/run-design.mjs` stays syntactically valid.
  - Collapsed heartbeat success/failure bookkeeping into one shared helper instead of duplicating the same state updates across flush, ping, startup, and finalization paths.
  - Reduced callback heartbeat tolerance to a shorter bounded fail-fast path, so the runner terminates itself well before the external 300-second watchdog.
  - Removed the hidden "retry without saved session" second attempt from inside the callback runner. Session fallback is now an explicit outer-workflow concern instead of an opaque in-script branch.
- **Reason**: The callback should be a small, predictable bridge between the CLI process and Convex. One provider attempt and one heartbeat path make failures surface faster and keep the runtime easier to maintain.

## Move snapshot builds from GitHub Actions to Daytona SDK - 2026-04-11

- **Why**: Snapshot builds depended on GitHub Actions — requiring `rebuild-snapshot.yml` in every target repo, GitHub App `actions:write` permissions, and a dispatch→poll→complete round-trip through the GitHub API. This was fragile (workflow file missing, permission errors, branch mismatch) and added an external dependency that the platform shouldn't need.
- **Changes**:
  - Created `snapshotWorkflow.ts` using the `@convex-dev/workflow` component to orchestrate builds as durable multi-step workflows. Each step (kick-off, poll, complete) is a separate action with its own timeout, so builds that take 15–20 minutes don't hit Convex action limits.
  - Rewrote `snapshotActions.ts`: `kickOffSnapshotBuild` builds images via the Daytona SDK's `Image` builder and POSTs directly to the Daytona API (non-blocking). `pollSnapshotProgress` checks state and streams build logs on each poll.
  - Replaced `COPY . /tmp/repo` with `git clone` using a short-lived GitHub installation token, so the Convex action can build the image without local filesystem access.
  - Added a double-completion guard in `completeBuild` to prevent race conditions between concurrent workflow steps.
  - Removed `setWorkflowRunId` mutation and the "View GitHub Actions Run" link from the UI.
  - Relabeled "Workflow Branch" → "Clone Branch" in the snapshot settings UI.
- **Reason**: The platform should own its own build infrastructure. Using the Daytona SDK directly is simpler, more reliable, and removes the need for users to set up GitHub Actions workflows.

## Silent reload on stale Vercel deployments - 2026-04-10

- **Why**: When Vercel deploys a new version while a user is on the site, old JS chunks become unavailable. This caused two problems: (1) an error page flashed before auto-refresh, and (2) stale JS broke Clerk's internals causing a burst of "Not authenticated" Convex query errors as every active subscription was re-evaluated without auth.
- **Changes**:
  - Added `DeploymentErrorFallback` as the TanStack Router `defaultErrorComponent` — detects chunk load errors and silently reloads with loop protection instead of showing an error page.
  - Added global `error` and `unhandledrejection` handlers alongside `vite:preloadError` to catch chunk failures from all sources, closing the Convex WebSocket before reload to prevent subscription re-evaluation.
  - Added `useStableAuth` wrapper around Clerk's `useAuth` for `ConvexProviderWithClerk` — debounces unexpected auth loss for 2s so the page reloads (stale deployment) or routes unmount (real logout) before Convex ever sees the token cleared.
- **Reason**: The error page flash was a bad UX during deployments, and the Convex log noise made real errors harder to spot. Debouncing auth loss at the provider boundary is the narrowest intervention that prevents the cascade without changing the backend auth contract.

## Retry branch fetches instead of burning full sandbox-prep timeout - 2026-04-11

- **Why**: Quick-task starts were still failing before the agent launched when the sandbox hit a transient stall talking to GitHub during the base-branch fetch. The old behavior let a single `git fetch` sit for the full command timeout, so one bad network hop could waste four minutes and fail the run with `command execution timeout`.
- **Changes**:
  - Added short retry/backoff handling around branch-oriented git fetch helpers so transient Daytona/GitHub transport stalls get another chance before the workflow gives up.
  - Added `--no-tags` to sandbox prep fetches, keeping quick-task branch sync focused on the refs it actually needs instead of downloading tag metadata too.
  - Reduced the dedicated `fetchBaseBranch` action timeout from 240s to 60s because shallow single-branch fetches should fail fast and retry, not consume the whole startup budget in one shot.
- **Reason**: Quick-task startup is more reliable when branch sync behaves like the other hardened sandbox steps: cheap retries for flaky transport, narrower fetch scope, and less willingness to wait several minutes on one stuck command.

## Simplify sandbox startup to local-first branch setup - 2026-04-11

- **Why**: Sandbox startup had drifted back into doing network branch sync during `createOrResumeSandbox`, so a snapshot-backed run could spend minutes stuck in `Syncing repository...` before the agent even launched. That is the wrong dependency order for a task flow that already starts from a prepared snapshot checkout.
- **Changes**:
  - `prepareSandboxSteps` now uses `createOrResumeSandbox` only for sandbox acquisition, then performs branch checkout/setup as separate local steps instead of bundling branch sync into sandbox creation.
  - The shared `prepareSandbox` action now follows the same local-first flow instead of fetching the base branch before every branch checkout or desktop launch.
  - `createOrResumeSandbox` now always prepares sandboxes with `syncStrategy=none`, restoring the simpler responsibility boundary: create/resume the sandbox, do not fetch refs.
  - `setupBranch` no longer does a proactive `git push -u origin` during startup. The agent can push when it actually has work to publish, which removes an unnecessary pre-launch network dependency.
  - `checkoutFetchedBaseBranch` now falls back to local snapshot refs or `HEAD` when no remote base ref has been fetched, so local branch setup still succeeds without mandatory network access.
- **Reason**: Snapshot-backed task startup should be local-first and fail-fast. Sandboxes should come up quickly from existing repo state, and remote sync should not be a hard prerequisite just to begin work.

## Make Codex task runs local-first instead of MCP-first - 2026-04-11

- **Why**: Codex task runs were spending early turns browsing GitHub through MCP (`github_search`, `github_fetch_file`) instead of reading the checked-out repo directly. That made implementation runs slower, noisier, and confusing in the activity UI even though the files were already present locally in the sandbox.
- **Changes**:
  - Stopped hydrating arbitrary persisted `CODEX_HOME` contents into task runs. The callback now restores only Codex session state and auth, which avoids silently carrying forward stale MCP-heavy runtime config from earlier sessions.
  - Strengthened implementation/conflict/audit-fix prompts to explicitly require local repo reads/searches before any GitHub or MCP lookup.
  - Mapped Codex `mcp_tool_call` events like `github_fetch_file` and `github_search` into the normal read/search activity labels so the UI reflects what Codex is actually doing.
- **Reason**: A sandbox-backed coding run should treat the local checkout as the source of truth. MCP should be an optional escape hatch, not the default way Codex inspects code that is already on disk.

## Remove nested Codex sandboxing and collapse provider session volumes - 2026-04-11

- **Why**: After sandbox startup was simplified, Codex task reruns were still failing on local shell access with `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. The deeper issue was architectural: Codex was trying to start its own inner workspace sandbox inside Daytona, and session persistence was still conceptually split by provider even though both providers belong to the same repo-scoped runtime.
- **Changes**:
  - Forced the Codex runtime config written inside Daytona to strip any persisted `sandbox_mode` / `approval_policy` overrides and replace them with a single outer-sandbox model (`approval_policy = "never"`, `sandbox_mode = "danger-full-access"`).
  - Kept Codex persistence narrow by syncing only resumable state and auth, instead of copying arbitrary `CODEX_HOME` contents back and forth between runs.
  - Collapsed session persistence onto one shared repo-scoped Daytona volume and mounted Claude/Codex into separate subpaths, preserving provider isolation without managing two independent volumes per repo.
- **Reason**: Daytona is already the sandbox boundary. Removing the nested Codex sandbox makes local shell access work reliably, and a single shared session volume is simpler to reason about and cheaper to maintain than parallel provider-specific volumes.

## Remove nested session-restore fetch retries from sandbox startup - 2026-04-11

- **Why**: Session sandbox startup still had a hidden multi-minute slow path even after quick-task startup was simplified. The session restore flow wrapped `fetchBranchRefs(...)` in its own retry loop even though the git helper already retried internally, so one flaky or missing remote session branch could burn roughly nine 30-second fetch attempts before falling back to local snapshot refs anyway.
- **Changes**:
  - Removed the extra session-level retry wrapper around branch-ref fetching and let the shared git helper own retry policy in one place.
  - Made session-branch restore fetches fail fast with a single short best-effort attempt before continuing with local snapshot/base refs.
  - Stopped reused session sandboxes from doing remote ref sync on the hot path; they now rely on their existing local checkout and jump straight to branch checkout and service startup.
- **Reason**: Session startup should be local-first and bounded. If remote branch sync is needed, it should be cheap and optional, not a multiplicative retry tower on the critical path.

## Fail fast when callback heartbeats stop reaching Convex - 2026-04-11

- **Why**: Some task runs were not actually stuck in sandbox startup or model execution. The detached callback process had lost the ability to update `streamingActivity`, so the UI looked frozen until the watchdog killed the run after 300 seconds with `no heartbeat for 300s`. That made failures slow, opaque, and expensive to auto-retry.
- **Changes**:
  - Added explicit tracking of consecutive callback heartbeat failures inside the sandbox runner.
  - When heartbeat updates fail repeatedly, the runner now aborts the active CLI attempt and surfaces a concrete error message instead of waiting silently for the external watchdog.
  - Preserved the existing watchdog as a backstop, but moved the primary failure detection closer to the actual heartbeat transport problem.
- **Reason**: If the runner cannot talk back to Convex, that is already a terminal condition for a streamed task run. Failing fast is better than burning five minutes and only learning about it from the watchdog.

## Remove pre-clone network polling for fresh sandboxes - 2026-04-10

- **Why**: New repos without snapshots were still taking over a minute to start quick tasks because sandbox prep waited for a synthetic `curl github.com` network check before attempting the real `git clone`. The check was both slow and misleading: even after timing out, the code still tried the clone anyway.
- **Changes**:
  - Removed the pre-clone network readiness gate from the non-snapshot sandbox bootstrap path.
  - Added direct clone retries with short backoff for transient sandbox/GitHub transport failures so the first real git operation happens immediately.
  - Added clearer retry/recovery logs around clone attempts to make bootstrap failures easier to pinpoint.
  - Added a dedicated archive-download bootstrap path for fresh ephemeral sandboxes with no branch sync requirements, so they no longer depend on a long-lived `git clone` call just to materialize the working tree.
  - Broadened outer sandbox setup retry classification to treat 502/503/504-style upstream failures as transient bootstrap errors.
- **Reason**: Retrying the real git operation is simpler and more accurate than polling a separate connectivity heuristic, and it avoids burning most of the startup budget before any useful work begins.

## Add Codex as an env-var-backed sandbox provider - 2026-04-09

- **Why**: Claude was the only first-class sandbox provider, which meant teams could not bring their existing ChatGPT-backed Codex access into Conductor. The goal was to add Codex without introducing a new OAuth product flow or more setup friction, so the implementation needed to stay simple: choose a provider in the same UI surfaces and enable Codex by adding env vars only.
- **Changes**:
  - Replaced the Claude-only sandbox model contract with shared provider-qualified model ids and a backend model catalog reused by the web app, extension, and shared UI controls.
  - Added Codex availability gating based on repo/team env vars, so Codex only appears when `CODEX_AUTH_JSON` or its compatible fallback env vars are configured.
  - Extended the Daytona sandbox runner and persisted session storage to support Codex CLI launches, hydrated `CODEX_HOME` from env vars, and kept Codex session state across sandbox restarts alongside the existing Claude path.
  - Added a Codex CLI availability check at launch time so older snapshots and plain non-snapshot sandboxes can install Codex on demand the first time a Codex model is used.
  - Increased the default snapshot create timeout when persistence volumes are mounted, because session/design sandboxes were timing out during Daytona startup before any repo prep could run.
  - Removed the separate remote branch existence probe from session/design sandbox restore so newly created sandboxes go straight to ref fetching instead of timing out on repeated `ls-remote` checks.
  - Moved session and design sandbox startup onto workflow-backed steps instead of scheduling the Daytona start actions directly, and added more detailed git/session logs so sandbox restore failures are easier to localize.
  - Made session branch restore prefer local snapshot refs or snapshot `HEAD` before failing on a base-branch fetch, so flaky network fetches are less likely to block opening an otherwise healthy session sandbox.
  - Stopped session restore from doing a second network fetch for the base branch when the session branch is missing, and made remote session-branch fetch failure fall back to local snapshot restore after a short timeout instead of blocking startup.
  - Extracted shared `resolveBaseTarget` helper in `git.ts` so the remote→local→HEAD base-ref fallback chain is defined once and reused by `checkoutSessionBranch`, `setupBranch`, and session restore. Renamed misleading `fetchSessionBaseFallbackBranch` to `resolveSessionBaseRef` since it no longer does network I/O. Bumped session branch fetch timeout from 15s to 30s to avoid premature fallback on slow-but-healthy networks.
  - Made `fetchBaseBranch` (quick task sandbox prep) use `--depth 1` shallow fetch so large repos don't time out fetching full history when only the branch tip is needed.
  - Stopped fresh ephemeral sandboxes from blocking on dependency installation before a quick task can start, while still leaving the longer install path available for non-ephemeral sandboxes that benefit from a prepared environment.
  - Increased fresh sandbox clone and runner startup timeouts so newly synced repos without snapshots are less likely to fail during initial bootstrap or callback readiness on slower sandboxes.
  - Updated setup and env-var UX to explain the simplest Codex setup path: sign in locally once, then paste the saved auth JSON into an env var.
- **Reason**: Treating providers as first-class runtime choices keeps the architecture easier to extend than sprinkling Codex support through Claude-specific code paths, while the env-var-only setup keeps the product change low-friction for users.

## Move Daytona workspace to /tmp for non-snapshot repo runs - 2026-04-09

- **Why**: Freshly synced repos without a built snapshot were using the plain Daytona sandbox path, and quick-task execution failed before cloning because `/workspace/repo` was not writable in that environment. The snapshot and non-snapshot paths were assuming the same workspace location without guaranteeing the same filesystem permissions.
- **Changes**:
  - Switched the shared Daytona workspace path from `/workspace/repo` to `/tmp/repo` in backend sandbox helpers, workflow prompts, session workflow reads, and the callback runtime script.
  - Added legacy fallback handling so existing snapshot-backed sandboxes can still resolve `/workspace/repo` until they are rebuilt onto the new path.
  - Updated snapshot/template workflow Dockerfiles to copy the repo into `/tmp/repo` too, so future snapshots match the runtime workspace path used by fresh sandboxes.
- **Effect**: New repos can run quick tasks before a snapshot exists, and snapshot-backed sandboxes keep using the same repo path as non-snapshot sandboxes.

## Fix queued messages sent as session owner instead of sender — 2026-04-01

- **Why**: When a user queued messages in a shared session, the messages appeared as the session owner (coworker) instead of the person who actually queued them. The `queuedMessages` table had no `userId` field, so processing fell back to `session.userId`.
- **Changes**:
  - Added `userId` field to `queuedMessageFields` in validators.ts (optional for backward compat with existing rows)
  - Both `enqueueMessage` mutations (sessionWorkflow.ts, designSessions.ts) now store `ctx.userId`
  - Queue processing in `_queues/helpers.ts` uses `nextMessage.userId ?? session.userId` fallback
- **Files**: validators.ts, sessionWorkflow.ts, designSessions.ts, \_queues/helpers.ts

## AskUserQuestion renders as interactive multiple choice in session chat — 2026-04-01

- **Why**: When Claude Code uses AskUserQuestion during a session, the question and options were buried in activity logs ("Using AskUserQuestion...") and invisible to the user. Users had no way to see or respond to questions.
- **Changes**:
  - Added `pendingQuestion` field to `streamingActivity` table (real-time) and `messages` table (persisted after completion)
  - Callback script now detects AskUserQuestion tool_use events, extracts the question JSON, and threads it through streaming heartbeats and completion args
  - Session workflow threads `pendingQuestion` through handleCompletion → event → saveResult → message patch
  - ChatPanel renders `MultipleChoiceQuestion` component when a pending question is detected (both during streaming and after completion)
  - Prompt input is hidden when a question is active, forcing user to select an option
  - MultipleChoiceQuestion component extended to support multiple questions (1-4), multiSelect, and header badges
  - Added `question` step type to ActivityStep with MessageSquare icon
- **Files**: schema.ts, validators.ts, streaming.ts, callbackScript.ts, sessionWorkflow.ts, SessionDetailClient.tsx, ChatPanel.tsx, MultipleChoiceQuestion.tsx, activity-steps.tsx

## Kanban board query and animation optimization — 2026-04-01

- **Why**: Kanban board with 40+ task cards made 80+ sequential database reads in a single query (getTaskIdsWithLatestRunError looped through taskIds, doing ctx.db.get + hasTaskAccess + index query per task). View switching also had stacked animations (200ms exit + 200ms enter + 300ms board fade-in) creating 500ms+ delay.
- **Changes**:
  - Optimized `getTaskIdsWithLatestRunError` backend query: accept `repoId` arg, do single `hasRepoAccess()` check upfront, then use `Promise.all` to parallelize 40 taskId queries instead of looping sequentially. Reduces from ~160 index range reads to ~42 parallel reads + 1 repo access check.
  - Updated 3 frontend call sites to pass `repoId`: QuickTasksKanbanBoard, QuickTasksListView, ProjectTaskListPanel.
  - Wrapped kanban task sort in `useMemo` to prevent re-sorting on every render and stabilize downstream memo dependencies.
  - Changed `AnimatePresence mode="wait"` to `mode="popLayout"` for simultaneous exit/enter animation (halves view-switch delay).
  - Removed duplicate `animate-in fade-in duration-300` CSS classes from KanbanBoard (framer-motion parent animation is sufficient).
- **Effect**: Kanban board loads faster (fewer DB reads, parallel instead of sequential), view transitions feel snappier, re-subscription invalidation surface area smaller (task docs no longer in read set).
- **Files**: packages/backend/convex/agentRuns.ts, QuickTasksKanbanBoard.tsx, QuickTasksListView.tsx, ProjectTaskListPanel.tsx, QuickTasksClient.tsx, KanbanBoard.tsx

## Quick tasks performance optimization — 2026-04-01

- **Why**: Quick tasks page with 160+ tasks loaded slowly due to N+1 queries (320 Convex subscriptions from per-card UserInitials and listByTask queries), eagerly-rendered menu trees (320 context/dropdown menus in React tree), and no virtualization (all 160+ cards in DOM simultaneously).
- **Changes**:
  - Eliminated N+1 `users.get` queries: parents now look up users from the already-fetched `users.listAll` and pass the `user` object to `UserInitials` instead of `userId`. Applies to QuickTaskCard, table view's assignedTo column. Removes 160 subscriptions.
  - Deduplicated context + dropdown menu items: extracted `TaskCardMenuItems` component that takes a `variant` prop and aliases Radix primitives, eliminating ~190 lines of duplicated JSX.
  - Deferred menu rendering: menu content is now a child component (`TaskCardMenuItems`) instead of inline JSX, so React only calls it when the portal mounts (i.e., when menu opens). Eliminates hundreds of React elements per card per render.
  - Added `@tanstack/react-virtual` for virtualization: table view renders only visible rows with spacer `<tr>` elements; kanban columns render only visible cards with absolute positioning. Both use `measureElement` for dynamic sizing.
  - Moved mutations (`updateStatus`, `updateTask`, `startExecution`) from QuickTaskCard into TaskCardMenuItems, since they're only used by menu actions.
- **Files**: QuickTaskCard.tsx, TaskCardMenuItems.tsx (new), QuickTasksKanbanBoard.tsx, QuickTasksListView.tsx, QuickTasksTableView.tsx, KanbanBoard.tsx, KanbanColumn.tsx

## Bundle optimization — reduce initial load by 80% - 2026-03-31

- **Why**: Main bundle was 1,355KB and TaskDetailInline was 1,048KB — both over 1MB. Users downloaded and parsed megabytes of JS before seeing any content, including libraries they'd never use on most pages (tiptap, react-syntax-highlighter, streamdown).
- **Changes**:
  - Added `sideEffects: false` to `@conductor/ui` — enables tree-shaking of the 180+ component barrel export.
  - Added `./ai` sub-path export to `@conductor/ui` for ai-elements.
  - Lazy-loaded FormattedText (tiptap ~300KB), LazyCodeBlock (syntax highlighting), and RunTimelineItem (streamdown + plugins) via `React.lazy()` with `Suspense`.
  - Replaced `react-syntax-highlighter` (624KB lazy chunk) with `shiki` (76KB lazy chunk) — shiki was already in the dep tree via @streamdown/code, so react-syntax-highlighter was redundant.
  - Added vendor chunk splitting in Vite 8 via `codeSplitting.groups` for Radix, Convex, and Clerk — stable vendor libs now cache independently.
  - Broke cyclic workspace dependency between `packages/shared` ↔ `packages/ui` by giving the UI package its own local dayjs setup instead of importing from `@conductor/shared/dates`.
- **Result**: index 1,355KB → 273KB (-80%), TaskDetailInline 1,048KB → 84KB (-92%), LazyCodeBlock 624KB → 76KB (-88%). Cyclic dependency warning eliminated.

## Lift repo context to the shared repo layout - 2026-03-31

- **Why**: Repo pages could briefly lose `RepoProvider` during TanStack Router transitions, which surfaced intermittent `useRepo must be used within a RepoProvider` crashes when repo-scoped UI stayed mounted across a tab change.
- **Change**: Moved `RepoProvider` from the `/_repo/$owner/$repo` child layout up into the shared `/_repo` layout so the whole repo route subtree keeps repo context for the full lifetime of the repo shell.
- **Effect**: Repo-scoped components like the spotlight search and setup banner now keep access to repo context while nested repo tabs swap, instead of crashing on a one-frame provider gap.

## Add live collaborative cursors - 2026-03-31

- **Why**: Make the platform feel more collaborative by showing team members' cursor positions in real-time (Figma-style). Leverages existing `@convex-dev/presence` infrastructure — cursor rooms are scoped per page so users only see teammates on the same route.
- **Changes**:
  - **New `packages/ui/src/kibo/cursor.tsx`**: Cursor SVG + body/name components adapted from kibo-ui. Composition-based (`Cursor > CursorPointer + CursorBody > CursorName`).
  - **`packages/backend/convex/presence.ts`**: Added `updateCursor` mutation — stores `{x, y, firstName, accentColor}` via `presence.updateRoomUser`. User info is fetched server-side to keep the client API simple (just sends x/y).
  - **New `apps/web/src/lib/hooks/useLiveCursors.ts`**: Hook that manages cursor room presence (heartbeat via `usePresence`), throttled mousemove tracking (50ms), and parsing remote cursor data from the presence state.
  - **New `apps/web/src/lib/components/LiveCursors.tsx`**: Fixed fullscreen overlay (`z-[60]`, `pointer-events-none`) rendering remote cursors with CSS transition smoothing. Each cursor colored by the user's accent color.
  - **`apps/web/src/routes/_repo/$owner/$repo.tsx`**: Mounted `<LiveCursors />` in repo layout. Only active on repo pages.
- **Architecture**: Room ID = `cursor:{pathname}`. Percentage-based coordinates for cross-resolution support. Presence data includes denormalized user info to avoid N+1 queries.

## Add online teammates indicator to sidebar - 2026-03-31

- **Why**: No visibility into who's currently active on the platform. Adding an avatar stack at the bottom of the sidebar gives passive awareness of online teammates.
- **Changes**:
  - **New `users.listOnlineTeammates` query**: Collects all teammates across user's teams, filters to those with `lastSeenAt` within 2 minutes. Uses existing `by_user` and `by_team` indexes.
  - **New `packages/ui/src/kibo/avatar-stack.tsx`**: Adapted from kibo-ui. Overlapping circular avatars with radial-gradient mask.
  - **`Sidebar.tsx`**: Added `OnlineTeammates` component above user profile. Shows avatar stack + count when expanded, vertical avatars when collapsed.

## Replace VideoPreview with kibo-ui video player - 2026-03-31

- **Why**: The existing VideoPreview used a raw `<video>` element with browser-native controls and custom speed buttons below it. Replacing with the kibo-ui video player (powered by `media-chrome`) gives a consistent, themed control bar with play/pause, seek, time display, volume, and playback rate — all inline within the video chrome.
- **Changes**:
  - **New `packages/ui/src/kibo/video-player.tsx`**: Adapted from kibo-ui source. Wraps `media-chrome/react` components with shadcn-themed CSS variables. Added `VideoPlayerPlaybackRateButton` for speed controls (1x, 3x, 5x, 8x).
  - **Rewrote `VideoPreview` in `MediaPreview.tsx`**: From manual `useRef`/`useState` speed management to composable kibo video player components. Removed `VIDEO_SPEEDS` constant and all manual `playbackRate` logic.
  - **New dependency**: `media-chrome` in apps/web and packages/ui peerDeps.

## Add table view to Quick Tasks and Projects - 2026-03-31

- **Why**: Users wanted a dense, sortable view for tasks and projects. Table view shows all key fields as columns with sortable headers.
- **Changes**:
  - **New dep `@tanstack/react-table`**: Powers column definitions, sorting, and row model.
  - **New `packages/ui/src/ui/table.tsx`**: Shadcn table primitive (Table, TableHeader, TableBody, TableRow, TableHead, TableCell).
  - **New `packages/ui/src/kibo/data-table.tsx`**: Forked kibo table, replaced jotai with props-based sorting (`sorting`/`onSortingChange`). Compound components: `DataTableProvider`, `DataTableHeader`, `DataTableHeaderGroup`, `DataTableHead`, `DataTableColumnHeader`, `DataTableBody`, `DataTableRow`, `DataTableCell`.
  - **New `QuickTasksTableView.tsx`**: Columns: Title, Status, Project, Tags, Assigned, Model, Created. Click-to-open + selection mode support.
  - **New `ProjectsTableView.tsx`**: Columns: Title, Phase, Description, Lead, Members, Branch, Created. Click-to-open.
  - **Updated search-params**: Added "table" to `quickTaskViews` and `projectViews` parsers.
  - **Updated QuickTasksClient/Toolbar + ProjectsClient**: Added table view toggle button (IconTable) and rendering branch.

## Migrate QuickTasks list view to Kibo List with drag-and-drop - 2026-03-31

- **Why**: QuickTasks list view was a static collapsible list with no DnD. Now uses kibo's `ListProvider`/`ListGroup`/`ListItem` primitives, adding drag-and-drop between status groups. Externalizes DnD wiring to maintained kibo components.
- **Changes**:
  - **Restyled `packages/ui/src/kibo/list.tsx`**: Stripped `bg-secondary`, `bg-background`, `rounded-md`, `p-2` defaults to match design system (tonal hierarchy, no shadows/borders on cards). Added `PointerSensor` with `distance: 8` activation constraint to disambiguate clicks from drags. Added `opacity-50` on dragging items.
  - **Rewrote `QuickTasksListView.tsx`**: Composes `ListProvider` → `Collapsible` → `ListGroup` → `ListHeader`/`ListItems`/`ListItem`. Dragging a task between status sections calls `updateStatus` mutation. Keeps Fix All button, selection mode, nuqs search/filter.

## Replace custom kanban with Kibo UI primitives - 2026-03-31

- **Why**: Standardizing on Kibo UI composable primitives across the codebase (already used for Gantt and ContributionGraph). Replaces hand-rolled DndContext/SortableContext/useDroppable wiring with reusable Kibo components. Adds screen reader accessibility announcements during drag operations.
- **Changes**:
  - **New `packages/ui/src/kibo/kanban.tsx`**: Forked Kibo UI Kanban source. Composable primitives: `KanbanProvider` (DnD context + a11y), `KanbanBoard` (droppable zone), `KanbanCards` (SortableContext + auto-filter by column), `KanbanCard` (sortable item), `KanbanHeader`. Removed `tunnel-rat` dependency (overlay via prop). Stripped borders/shadows for design system. Consumer provides drag handlers instead of built-in data management.
  - **Rewrote `apps/web/.../kanban/KanbanBoard.tsx`**: Now composes `KanbanProvider` (DnD context, sensors, a11y), `KanbanCards` (SortableContext per column), and `KanbanCard` (sortable items) from Kibo. Maps task data to Kibo's `KanbanItem` format. Keeps custom nuqs filtering, motion animations, and overlay rendering.
  - **Rewrote `apps/web/.../kanban/KanbanColumn.tsx`**: Now uses `KanbanBoard` from Kibo as droppable wrapper instead of raw `useDroppable`. Keeps custom header with Badge, empty state, headerExtra slot.
  - **`packages/ui/package.json`**: Added `@dnd-kit/sortable` and `@dnd-kit/utilities` as peer dependencies.

## Replace ActivityHeatmap with kibo-ui ContributionGraph - 2026-03-31

- **Why**: The custom ActivityHeatmap was a 310-line monolithic component with its own grid layout logic. Kibo UI's ContributionGraph provides a composable, SVG-based architecture that's more maintainable and consistent with the existing kibo Gantt pattern.
- **Changes**:
  - **New `packages/ui/src/kibo/contribution-graph.tsx`**: Forked kibo-ui ContributionGraph source. Converted all date-fns calls to dayjs (matching the gantt component pattern). Exports composable primitives: `ContributionGraph`, `ContributionGraphBlock`, `ContributionGraphCalendar`, `ContributionGraphFooter`, `ContributionGraphTotalCount`, `ContributionGraphLegend`.
  - **Rewrote `ActivityHeatmap.tsx`**: From custom grid renderer to thin wrapper. Transforms backend data (`{ date, count }[]`) to Kibo's `Activity` format (adding computed `level`). Keeps streak calculation and stats header. Delegates grid rendering to Kibo composable components.
  - **Color scheme**: Switched from emerald intensity shades to Kibo's muted-foreground opacity levels (0/20/40/60/80%).

## Replace ProjectsTimeline with kibo-ui Gantt component - 2026-03-31

- **Why**: The existing custom timeline view was read-only with no interactive editing. Replacing with the kibo-ui Gantt component adds drag-to-resize and drag-to-move project bars, daily/monthly/quarterly range modes, a fixed sidebar with project labels, and a today marker — all features that improve project planning UX.
- **Changes**:
  - **New `packages/ui/src/kibo/` module**: Forked kibo-ui Gantt source into 5 files (`gantt-provider`, `gantt-header`, `gantt-timeline`, `gantt-sidebar`, `gantt-features`). Converted all date-fns calls to dayjs, replaced jotai atoms with React context, inlined lodash.throttle, removed @uidotdev/usehooks dependency. Restyled for design system compliance (no shadows, no borders, tonal surface hierarchy).
  - **Rewrote `ProjectsTimeline.tsx`**: From 612-line custom implementation to ~150-line thin wrapper composing Gantt components. Maps Convex project data to GanttFeature format, handles drag-to-move via `projects.update` mutation.
  - **New dependency**: `@dnd-kit/modifiers` in apps/web for horizontal-axis drag constraint.

## Retry transient git TLS/bootstrap failures during sandbox setup - 2026-03-31

- **Why**: Some sandbox starts fail during repo bootstrap with transient GitHub transport errors like `GnuTLS recv error (-110)` or abruptly terminated TLS sessions. A manual retry usually succeeds, which means these should be treated as flaky setup errors rather than hard failures.
- **Change**: Sandbox setup retry classification now includes transient git/TLS transport markers in both quick-task sandbox creation and session sandbox git retry paths.
- **Effect**: More sandbox startup failures are absorbed automatically by the existing retry loop instead of surfacing to the user on the first flaky network hop.

## Compress session prompts, simplify response length to default/detailed - 2026-03-31

- **Why**: System prompts were verbose, wasting tokens on every request. Three response length options (concise/default/detailed) were unnecessary — default should already be concise-leaning, making "concise" redundant.
- **Changes**:
  - **Ask/Plan/Execute prompts** (`sessionWorkflow.ts`): Compressed all three by ~40%, removing redundant phrasing while preserving all behavioral rules. Mermaid diagram instruction moved from ask prompt base into the response length system.
  - **`getResponseLengthInstruction`** (`prompts/shared.ts`): Now takes a `mode` parameter. Per-mode instructions: Ask mode controls diagram usage; Execute mode controls summary depth; Plan mode always returns empty (plan is always terse). Default is concise-leaning.
  - **Removed "concise" option**: Type narrowed to `"default" | "detailed"`. UI dropdown, validation arrays, and settings hook updated. Old "concise" values in DB are harmless — they fall through to the default branch which is already concise-leaning.

## Backend performance audit — eliminate full table scans, N+1 queries, and missing indexes - 2026-03-31

- **Why**: Multiple reactive queries scanned entire tables then post-filtered in JS, causing read amplification that grows linearly with data. `githubRepos.list` and `agentTasks.getActiveTasks` both scanned ALL repos with per-repo access checks. `recomputeProjectPhase` collected all project tasks on every status change. `agentRuns.listAll` was dead code doing a triple full-scan.
- **Changes**:
  - **`githubRepos/queries.list`**: Replaced full-table scan with indexed fan-out: team memberships → `by_team` per team + new `by_connected_by` index for directly-connected repos. Read set now scoped to user's repos only.
  - **`agentTasks/queries.getActiveTasks`**: Same team-scoped approach replaces full `githubRepos` scan + N+1 `hasRepoAccess` checks.
  - **`agentRuns.listAll`**: Removed — dead code, no client or internal callers.
  - **`recomputeProjectPhase`**: Replaced `.collect()` of all project tasks with parallel `.first()` calls using `by_project_and_status` index. Reads at most 7 index probes instead of N full documents.
  - **Session queries**: `listArchived` now uses new `by_repo_and_archived` index; `list` and `countActive` use Convex `.filter()` in query chain instead of JS post-filter.
  - **`auditCategories`**: `hasEnabledCategories` and `listEnabledForContext` now use new `by_repo_and_enabled` index.
  - **`_agentTasks/mutations.updateStatus`**: Consolidated double-patch into single write.
  - **`_taskWorkflow/runLifecycle.completeRun`**: Eliminated duplicate `ctx.db.get(projectId)` read.
- **New indexes**: `githubRepos.by_connected_by`, `sessions.by_repo_and_archived`, `auditCategories.by_repo_and_enabled`.
- **Effect**: Reactive query read sets are now proportional to the user's data, not the entire database. Subscription invalidation is narrower since queries no longer touch unrelated documents.

## Refresh watchdog heartbeats even when streaming payloads stay unchanged - 2026-03-31

- **Why**: Long-running proof capture and other tool phases can sit on the same visible activity step for minutes. The callback was still sending heartbeats, but the `streamingActivity` row only updated `lastUpdatedAt` when the activity payload changed, so the watchdog could incorrectly kill a live run as "no heartbeat for 300s".
- **Change**: Streaming heartbeat writes now always refresh `lastUpdatedAt`, even when `currentActivity` and `currentContent` are unchanged. The shared task-workflow helper now follows the same rule for internal streaming updates.
- **Effect**: Quick-task runs stay alive during long but legitimate tool phases like `agent-browser` proof capture, instead of being treated as dead just because the visible step text did not change.

## Add repo-level Screenshots and Videos toggle for quick-task proof capture - 2026-03-29

- **Why**: Quick-task proof capture was always on, even for repos where agent-browser walkthroughs were unnecessary or undesirable, and the Proof tab had no way to explain that proof was intentionally disabled.
- **Change**: Repo config now includes a per-app `Screenshots and Videos` toggle. Quick-task implementation prompts only include agent-browser proof instructions when that toggle is enabled, the sandbox callback stops writing fallback proof messages when proof capture is off, and the quick-task Proof tab shows a direct link back to Settings → Config when screenshots/videos are disabled and no proof exists.
- **Effect**: Repos can opt out of visual proof capture without affecting sibling apps, quick tasks stop asking Eva to record walkthroughs when the feature is off, and the Proof tab now explains the disabled state instead of implying proof is still pending.

## Polish queued chat controls and compact queue rows - 2026-03-29

- **Why**: The initial queue rollout left design chats one step behind regular sessions, kept the in-composer stop control visually mismatched in some views, and let secondary queue metadata expand the queue into a noisier multi-line block.
- **Change**: Design chats now use the same queued-message edit/delete mutations as regular sessions, their stop control matches the send button size, and queued metadata is tucked into an info tooltip so each queued prompt stays on a single compact row.
- **Effect**: Both session types now share the same queue management affordances and the composer/queue area reads as a cleaner single-line control surface.

## Decouple Claude session persistence from live config storage - 2026-03-29

- **Why**: Mounting the Daytona S3/FUSE volume directly into Claude Code's live `~/.claude/projects` path made session shutdown unreliable and left `--session-id` runs stuck on "already in use" after sandbox restarts. The mount also could not replace `~/.claude` safely because the image bakes in settings and plugins there.
- **Change**: Session sandboxes now mount one shared Daytona Claude volume per repo at a separate persistence path, then isolate regular sessions vs design sessions vs individual conversations with typed `subpath`s under that repo volume. Claude still runs with a local `CLAUDE_CONFIG_DIR`, hydrates persisted transcripts before each run, prefers `--resume` only for the exact saved session, and syncs session state back out explicitly with bounded copy operations.
- **Startup polish**: The callback now invokes the preinstalled `claude` binary directly instead of `npx @anthropic-ai/claude-code`, and the startup UI now keeps a single "Starting Claude..." step whose detail explains whether Claude is launching, restoring saved context, or waiting for first output instead of showing multiple static startup labels.
- **Phase clarity**: The callback now reports explicit lifecycle steps for prepare session, start Claude CLI, restore saved context, think, stream response text, and finalize completion so the UI reflects where latency is actually happening instead of collapsing everything into generic startup/writing states.
- **Timing visibility**: Added detailed launch timing logs for sandbox-side prompt/script upload and runner readiness, plus callback-side hydrate, initial heartbeat, ready-file, spawn, init, first assistant event, first text block, and completion-path timings so slow session turns can be attributed to the correct layer.
- **Launch path parallelism**: Sandbox token + MCP token minting now happen concurrently, and sandbox prompt/script/MCP-config uploads now happen concurrently before the runner starts, so repeat turns spend less time in avoidable serialized setup.
- **Targeted session file copies**: Hydrate/sync now copy only the exact Claude transcript(s) referenced by the configured or active session plus `session-state.json`, instead of scanning and copying every transcript file in the persisted project directory on each turn.
- **Faster completion handoff**: Successful runs now skip the redundant pre-completion `post-attempt` session sync when Claude has already emitted a `result` event and triggered the earlier sync, so the completion callback is no longer blocked on an extra FUSE-backed write before the UI can finish the turn.
- **Live assistant text streaming**: The shared `streamingActivity` record now carries partial assistant text as `currentContent`, the callback streams Claude text chunks into that field during execution, and the sessions chat renders that partial text directly inside the pending assistant bubble instead of only showing activity steps until completion.
- **Cancel preserves progress context**: User-cancelled session runs now keep the generic cancellation message but snapshot the latest live activity step into the saved assistant message before the transient streaming row is cleared, so stopping a run still shows where it got up to.
- **Queued follow-up prompts**: Sessions and design chats now keep the prompt input active while a reply is running, store follow-up prompts in a shared backend queue table, and automatically dequeue the next prompt when the current run finishes, is cancelled, or times out. The chat footer now uses a dedicated queued-items panel built from shared AI Elements queue primitives, while stop remains a separate control from send.
- **Effect**: Claude session context can survive sandbox recreation without clobbering baked-in config, transcript persistence no longer depends on Claude writing directly to the FUSE mount during process exit, and the design scales across many repos without a single global volume or per-session volume explosion.

## Enable Convex query subscription caching - 2026-03-28

- **Why**: `ConvexQueryCacheProvider` was already in the provider tree but all `useQuery` calls imported from `"convex/react"`, bypassing the cache entirely. Subscriptions were dropped and re-fetched on every navigation/unmount.
- **Change**: Replaced all `useQuery` imports across both apps — from `"convex/react"` to `"convex-helpers/react/cache"` (web) / `"convex-helpers/react/cache/hooks"` (web-v2). Files that import other hooks (`useMutation`, `useAction`, etc.) keep those from `"convex/react"`.
- **Effect**: Query subscriptions now persist for 5 minutes after unmount (default), giving instant data on back-navigation and view switches.

## Replace task detail modal with route-based inline view - 2026-03-28

- **Why**: Clicking a task in kanban view opened a modal dialog while list view showed an inline panel — inconsistent UX. Users wanted consistent navigation behavior.
- **Change**: Clicking a task in ANY view (kanban or list) now navigates to `/quick-tasks/{taskId}` as a dedicated route, rendering `TaskDetailInline` as a full page with breadcrumb and prev/next navigation.
- **Removed**: `TaskDetailModal` component (deleted from both apps), `taskIdParser` query param (replaced by path segment).
- **New files**: `QuickTaskDetailClient` + route wrappers in both `apps/web` (Next.js `[taskId]/page.tsx`) and `apps/web-v2` (TanStack `$taskId.tsx`).
- **Scope**: Both apps/web and apps/web-v2.

## Rich right-click context menus for project & task cards - 2026-03-28

- **Why**: Context menus were bare-bones (2-3 options). Users needed Linear-style quick access to change fields without opening detail views.
- **QuickTaskCard menu**: Status (radio submenu), Assignee (radio submenu with "Assign to me"), Model (radio submenu, locked after execution), Project (radio submenu), Move to app, Copy title, Copy task link, Delete.
- **ProjectCard menu**: Phase (radio submenu), Project Lead (radio submenu with "Set myself"), View Branch, Edit Details, Copy title, Copy branch name, Delete. Phase/Lead disabled for non-owners.
- **Uses**: `ContextMenuRadioGroup`/`ContextMenuRadioItem` primitives that existed in the UI package but were never used.
- **Parent updates**: All card parents now pass new props (assignedTo, model, projectId, repoId for tasks; phase for projects).
- **Scope**: Both apps/web and apps/web-v2 — QuickTaskCard, ProjectCard, and their parent components.

## User-driven audit fixes with severity badges - 2026-03-28

- **Why**: Audit fixes were fully automatic — the workflow detected failures, applied fixes, and re-audited without user input. For quick tasks this removed control over what gets changed. Users should review audit results and choose which failures to fix.
- **Workflow change**: Removed auto-fix and re-audit logic from `taskExecutionWorkflow`. Audit still runs automatically; failures are displayed but not acted on.
- **New mutation**: `audits.runSelectedFixes` — accepts an audit ID and array of selected failures with severity. Sets `fixStatus=fixing`, spins up or reuses sandbox, launches fix agent with only the selected items.
- **New action**: `daytona.launchSelectedAuditFixes` — validates/creates sandbox, builds fix prompt from selected failures, launches sonnet with write tools.
- **Completion handler**: `handleAuditFixCompletion` now directly updates the audit record instead of sending a workflow event (since the workflow has already finished).
- **Severity levels**: Audit results now include severity (critical/high/medium/low). Prompts instruct the auditor to classify findings. Parser defaults to "medium" for old data. UI shows color-coded severity badges (matching automation findings style) and sorts failures/results by severity (critical first).
- **UI**: `AuditSection` shows checkboxes next to each failed requirement with severity badge, "Select all" toggle, and "Run Fixes (N)" button. Results sorted: failures before passes, then by severity within each group.
- **Scope**: Backend validators + workflow + mutations + actions + parser, both frontends (web-v2 + web).

## Remove installationId from client-facing API surface - 2026-03-23

- **Why**: Two deployments (work + personal) share the same GitHub App credentials. Public mutations/actions accepted `installationId` directly from the client without DB validation, allowing any authenticated user to request GitHub tokens for arbitrary installations — cross-deployment leakage.
- **Fix**: All public functions now derive `installationId` server-side from the entity's `repoId` → `repo.installationId`. Removed `installationId` from args of 14 public mutations/actions. Setup-flow functions (`listRepos`, `listBranches`, `detectMonorepoApps`, `createRepo`) keep `installationId` since no repo record exists yet.
- **Sandbox callback**: Updated callback script to use `REPO_ID` env var (now injected via `resolveSandboxContext`) instead of `INSTALLATION_ID` for token refresh.
- **Scope**: Backend (`packages/backend/convex/`), both frontends (`apps/web-v2/`, `apps/web/`).

## Consolidate session startup and simplify branch-aware sandbox prep - 2026-03-20

- **Why**: Sandbox startup logic had drifted across multiple overlapping paths. Sessions could start through both the dedicated session action and the generic `prepareSandbox` flow, branch-aware task prep was still checking out base before branch setup even though branch setup already handles base creation/merge, and timed-out git commands could leave stale git state behind for the next retry.
- **One session prep path**: `_daytona/sessions.ts` now owns a reusable session sandbox preparation helper, and `sessionWorkflow.ts` uses that same path instead of the generic `prepareSandbox` action. That keeps session restore semantics, branch checkout behavior, and desktop startup aligned.
- **Less duplicate branch work**: `_daytona/prepareSandboxSteps.ts` and `_daytona/execution.ts` now skip the explicit `checkout base branch` step when a branch setup step is going to run immediately afterward, which trims redundant git work from quick tasks, automations, and eval fix flows.
- **Git timeout cleanup**: `_daytona/git.ts` now routes git commands through a shared helper that performs best-effort git process/lock cleanup after sandbox exec timeouts, so one bad timeout is less likely to contaminate the next retry in the same sandbox.

## Normalize fresh snapshot repos before sandbox git operations - 2026-03-20

- **Why**: Session startup was still timing out in `checkoutSessionBranch` even after the fetch-related fixes. The failing step was local git work after a successful fetch, which pointed to fresh snapshot sandboxes starting from a dirty worktree rather than a remote sync issue.
- **Clean startup worktree**: `_daytona/git.ts` now hard-resets tracked files and removes non-ignored untracked files once for every newly created snapshot-backed sandbox before any sync, checkout, or branch-setup work runs. That keeps reuse behavior unchanged while preventing startup git commands from trying to stash snapshot dirt first.

## Retry session branch checkout after transient sandbox exec stalls - 2026-03-20

- **Why**: Session startup was still occasionally failing after the earlier fetch/probe fixes because the final `checkoutSessionBranch` step could hang in one sandbox attempt even when the ref sync had already succeeded. Retrying the whole session would usually work, which pointed to transient sandbox exec stalls rather than bad git state.
- **Session checkout retries**: `_daytona/sessions.ts` now wraps `checkoutSessionBranch` in the same short-backoff retry policy already used for session branch probes and base fallback fetches, so first-run session startup is less likely to fail on a single bad checkout exec.

## Remove Playwright browser bootstrap from snapshots - 2026-03-20

- **Why**: The current `agent-browser` runtime is now a native Rust CLI and no longer needs a Playwright-managed Chromium download in our snapshot image. Keeping the old Playwright browser bootstrap adds image weight and rebuild time without helping the backend runtime path.
- **Snapshot simplification**: `rebuild-snapshot.yml` now removes the Playwright Chromium install step and leaves the Playwright Linux dependency step commented out as a rollback lever while we validate that the native `agent-browser` + system Chrome path is sufficient.

## Bake core git and shell tooling into Daytona snapshots - 2026-03-20

- **Why**: Snapshot sandboxes are the normal execution path, so missing core CLI tools inside the image still show up as runtime flakiness or slower fallback behavior even when sandbox startup itself is healthy.
- **Tooling parity**: `rebuild-snapshot.yml` now installs `jq`, `ripgrep`, `fd`, `git-lfs`, and `gh` in the base image so agent prompts and sandbox debugging tools are available immediately without ad hoc installs.
- **More deterministic dependency layer**: Snapshot builds now use `pnpm install --frozen-lockfile`, which keeps the baked dependency state aligned with the committed lockfile and avoids silently drifting snapshot contents.

## Restore full git history for snapshot-backed automation reviews - 2026-03-20

- **Why**: Read-only automations that run from Daytona snapshots started misreporting repo history after the sandbox-prep simplification removed an accidental extra sync. The snapshots themselves were also being built from shallow GitHub Actions checkouts, so review/report automations could end up seeing only the tip commit.
- **Snapshot source history**: `rebuild-snapshot.yml` now checks out the repo with full git history before copying it into the snapshot image, so newly built snapshots preserve the real commit graph instead of a depth-1 checkout.

## Automation findings → task creation - 2026-03-20

- **Why**: Read-only automations produced free-form markdown reports with no way to act on individual findings. Users had no control over which issues got fixed — they either ran in implementation mode (fixes everything) or report mode (fixes nothing).
- **Structured findings**: When `actionsEnabled` is toggled on for a read-only automation, the prompt instructs Claude to output a JSON array of findings (title, description, severity, file paths, suggested fix). The workflow parses this and stores it on the `automationRuns` record.
- **Finding → task conversion**: New `createTasksFromFindings` mutation lets users select specific findings via checkboxes and create quick tasks from them, with optional auto-execution. Each finding tracks whether a task was created from it.
- **Settings UI**: New "Actions" toggle in automation settings (only visible when Report Only is enabled). Run history shows findings with checkboxes instead of raw markdown when findings are present, with fallback + warning banner if parsing fails.

## Retry split sandbox git steps and design snapshot installs - 2026-03-19

- **Why**: Even after removing redundant startup sync, quick-task sandbox prep still depended on separate `fetch base`, `checkout base`, and `setup branch` workflow actions with no local retry policy, and design sandboxes still had a single-shot snapshot install step that could be slow or flaky.
- **Split git step retries**: `_daytona/prepareSandboxSteps.ts` now gives `fetchBaseBranch`, `checkoutBaseBranch`, and `setupSandboxBranch` explicit workflow retries so transient git/setup failures do not immediately fail the whole run.
- **Design install retries**: `_daytona/sessions.ts` now detects the package manager for snapshot-backed design sandboxes and retries dependency installation a few times on timeout/network-style failures instead of assuming one `pnpm install` attempt will always succeed.
- **Proof failure visibility**: `_daytona/callbackScript.ts` now records a task-proof message when proof persistence fails after completion, so those issues stay visible without blocking a successful run from finishing.

## Complete runs before proof upload and make finalization explicit - 2026-03-19

- **Why**: Tasks could finish real work, then stall in the post-response callback path long enough for the watchdog to kill them. The completion event, proof upload, and finalization heartbeat were too tightly coupled, and the watchdog had to infer finalization from streaming text.
- **Completion first, proof second**: `_daytona/callbackScript.ts` now marks task runs as finalizing, sends the completion mutation first, and only then performs best-effort proof/media persistence. That prevents screenshot/video upload delays from blocking workflow completion.
- **Explicit finalizing run state**: `agentRuns` now tracks `finalizingAt`, `_taskWorkflow/publicMutations.ts` exposes `markRunFinalizing`, and `_taskWorkflow/watchdog.ts` uses that timestamp directly when deciding whether a run is in finalization.
- **Design sandbox prep simplified safely**: `_daytona/sessions.ts` now gives design sandboxes the same “create with no upfront sync, then fetch only needed refs before setup” treatment, while keeping full-history fetches for the merge-based design branch setup path.

## Harden finalization heartbeats and completion callbacks - 2026-03-19

- **Why**: Some tasks were visibly finishing work and even pushing branches, then getting killed by the watchdog during `Finalizing response...`. That points to failures in the post-response callback path rather than the agent work itself.
- **Single heartbeat path**: `_daytona/callbackScript.ts` now sends streaming heartbeats directly through the regular `streaming:set` mutation instead of a separate `/api/streaming/heartbeat` endpoint, and the old HMAC heartbeat route/env plumbing has been removed from `_daytona/helpers.ts` and `http.ts`.
- **No more silent completion no-ops**: `_taskWorkflow/publicMutations.ts` now throws when task/audit completion callbacks cannot actually target the active workflow or active run, instead of silently returning `null`. That lets the callback script retry instead of incorrectly treating a dropped completion event as success.

## Remove redundant branch sync from quick-task sandbox creation - 2026-03-19

- **Why**: Concurrent quick tasks were still failing even after the session-specific fixes because the workflow fetched `staging + task branch` during `createOrResumeSandbox`, then immediately fetched/check out base and set up the branch again in later steps. That duplicated the most contention-prone git work right at sandbox creation.
- **Workflow-level simplification**: `_daytona/prepareSandboxSteps.ts` now creates or resumes the sandbox without passing branch/base refs into `createOrResumeSandbox`, so snapshot sandbox acquisition skips the redundant upfront branch sync.
- **Shared prepare path simplified too**: `_daytona/execution.ts` now makes the generic `prepareSandbox` action acquire sandboxes with `syncStrategy=none`, then relies on its existing explicit fetch/check out/setup steps afterward. That removes the same duplicated sync from other branch-aware sandbox starters that use `prepareSandbox`.
- **Preserves task setup semantics**: Quick tasks and other `prepareSandbox` callers still fetch the base branch, check it out, and run branch setup exactly as before; they just stop doing the same ref sync twice.

## Retry session-branch existence probes quickly - 2026-03-18

- **Why**: Concurrent session starts could still fail with `Sandbox exec (30s) timed out after 45000ms` before reaching checkout or the base-branch fallback. The remaining 30s session-path probe was `git ls-remote` for the remote session branch, which can also stall transiently under concurrency.
- **Fail-fast probe timeout**: `_daytona/sessions.ts` now checks for the remote session branch with a 10s timeout per attempt instead of waiting a full 30s on one bad `ls-remote`.
- **Targeted retries**: Session-only remote-branch existence checks now retry a few times with short backoff when the sandbox exec times out, matching the resilience already added to the shallow base-branch fallback fetch.

## Retry shallow session base fallback fetches quickly - 2026-03-18

- **Why**: After switching regular sessions to a shallow base-branch fallback, one sandbox could fetch `staging` in about a second while another still sat on the same command for 45 seconds before retrying. That points to transient sandbox fetch stalls, not consistently expensive work.
- **More aggressive fail-fast fallback fetches**: `_daytona/sessions.ts` now gives the shallow fallback base fetch a 15s timeout instead of waiting 45s on a single bad attempt.
- **Targeted retries**: Regular session fallback fetches now retry a few times with short backoff when they fail with sandbox exec timeouts, so transient stalls no longer tank the whole session start as easily.

## Use ls-remote before fetching session branch - 2026-03-18

- **Why**: Concurrent first-run session starts were still timing out while trying to fetch remote session branches that did not exist yet. We were paying full `git fetch` cost just to learn the branch was missing.
- **Cheap existence probe**: `_daytona/git.ts` now exposes `remoteBranchExists`, which uses `git ls-remote --heads` to check for a remote session branch without downloading pack data.
- **Session restore path updated**: `_daytona/sessions.ts` now checks whether the remote session branch exists first. Existing remote session branches are fetched shallowly for checkout; missing ones skip straight to the shallow base-branch fallback.

## Make session fallback base fetch shallow - 2026-03-18

- **Why**: Concurrent regular session starts were still getting stuck on the fallback base-branch fetch after the session-branch probe succeeded. That fallback only exists to give `checkoutSessionBranch` a base ref when the remote session branch does not exist yet, so it does not need full branch history.
- **Session-only shallow fallback**: `_daytona/sessions.ts` now requests a shallow base-branch fetch for the regular session restore fallback path, while `_daytona/git.ts` keeps full-history branch fetches as the default for merge-sensitive task and design flows.
- **Preserves restore behavior**: Sessions still restore from the remote session branch when it exists and still fall back to base when it does not, but the expensive fallback `staging` fetch now transfers less history.

## Fetch session branch first on restore - 2026-03-18

- **Why**: Regular session sandboxes were still spending too long in `fetchBranchRefs` because startup always fetched both the remote session branch and base branch up front, even though the base branch is only needed when the session branch does not exist remotely.
- **Session-specific sync path**: `_daytona/sessions.ts` now fetches the session branch first for restore. If that remote branch exists, startup skips the base branch fetch entirely and goes straight to checkout. Only missing remote session branches fall back to fetching the base branch.
- **Preserves restore semantics**: Recreated sessions still restore from `origin/<session-branch>` when available and still fall back to base for first-run sessions, but the common restore path now does less network work.

## Add step-level session sandbox timing logs - 2026-03-18

- **Why**: Session sandbox starts were still taking long enough that we were reasoning from timeouts instead of knowing the exact slow step. We need visibility into whether a delay is sandbox create, snapshot sync, branch checkout, or session-ready mutation.
- **Session action timing**: `_daytona/sessions.ts` now logs start, completion, and failure timings for repo lookup, sandbox context resolution, sandbox reuse, volume attach, sandbox creation/prep, branch checkout, service detection, and ready/error mutations.
- **Git helper timing**: `_daytona/git.ts` now logs timings for sandbox create, origin configuration, fetches, syncs, checkout, and branch setup so snapshot-backed session starts can be traced end-to-end from server logs.

## Increase startup headroom for branch sync and snapshot install - 2026-03-18

- **Why**: Sandbox startup was still failing with `Sandbox exec (120s) timed out after 135000ms` on valid long-running setup work. The remaining 120s caps were too aggressive for branch-scoped fetches on larger repos and snapshot-backed design-session reinstalls.
- **Branch sync timeout 120s → 240s**: `_daytona/git.ts` now gives branch-targeted `syncRepo` the same larger timeout budget as other fetch-heavy startup paths.
- **Snapshot design install timeout 120s → 240s**: `_daytona/sessions.ts` now gives the post-snapshot `pnpm install` step more room so design sandboxes do not fail purely because dependency relinking takes longer than two minutes.

## Remove redundant origin reconfigure before local base checkout - 2026-03-18

- **Why**: The split sandbox prep flow already reconfigured `origin` during `fetchBaseBranch`, then paid for another `configureGitHubOrigin` call in `checkoutBaseBranch` even though the checkout step only does a local fast-forward merge against `origin/<baseBranch>`.
- **One less sandbox round trip**: `checkoutBaseBranch` now goes straight to the local checkout/merge step, shaving an extra `exec()` from workflows that use the granular base-branch path without changing git behavior.

## Restore remote session branch on sandbox recreate - 2026-03-18

- **Why**: Session startup must restore prior work when a sandbox is recreated. Fetching only the base branch made fresh sandboxes recreate the session branch from base, which could make an existing remote session branch appear blank.
- **Restore branch-first sync**: `_daytona/sessions.ts` now syncs the session branch and base branch again so checkout can recover `origin/<session-branch>` when it exists and still fall back to base when it does not.
- **Revert global shallow branch fetch**: `_daytona/git.ts` no longer forces `--depth=1` for all branch-targeted fetches. That keeps merge-based paths like design/task branch setup on the safer full-history behavior.

## Optimize sandbox git operations for faster startup - 2026-03-18

- **Why**: Session sandbox startup was slow and timing out. Each `exec()` is a Daytona API round trip, and git commands were split across too many sequential calls.
- **Eliminate redundant `configureGitHubOrigin` exec from fetches**: `fetchOrigin` and `fetchBranchRefs` were doing a separate exec call to set the remote URL before every fetch, but the fetch already passes auth via `-c http.extraheader`. Removed the extra round trip.
- **Batch refspecs into single fetch**: Multiple branches fetched in one `git fetch` call instead of sequential per-branch fetches.
- **Combine `checkoutSessionBranch`**: Stash + checkout collapsed from 2 exec calls → 1.
- **Combine `setupBranch`**: Stash+checkout combined, both merges combined. 6 exec calls → 4.
- **Combine `installDependencies` for pnpm**: `npm install -g pnpm` + `pnpm install` combined into 1 exec call.
- **Shallow clone for fresh repos**: `git clone --depth 1` for non-snapshot sandboxes. Full history isn't needed for coding sessions.

## Reduce false watchdog kills - 2026-03-18

- **Why**: Watchdog was killing healthy runs that hit transient network blips. The 180s threshold combined with only 1 heartbeat retry meant brief connectivity issues could cascade into a kill.
- **Threshold 180s → 300s**: Gives more room for transient issues without meaningfully delaying detection of truly dead runs.
- **Heartbeat retry 1 → 3 with backoff**: `heartbeatPing` now retries 3 times with exponential backoff (1s, 2s + jitter) before giving up, matching the resilience of other callback functions.

## Persist activity log on watchdog kill - 2026-03-18

- **Why**: When the watchdog killed a run (no heartbeat for 180s), the streaming activity was deleted without saving it to `agentRunActivityLogs`. This meant there was no way to trace what steps the agent completed before it died.
- **Snapshot before clear**: `cleanUpStaleRun` and `handleStaleRun` now call `snapshotStreamingActivityToLog` to persist the current streaming activity into `agentRunActivityLogs` before deleting it. The UI already renders `RunActivityLog` for errored runs — it just had no data until now.

## Harden branch sync to avoid startup timeouts - 2026-03-18

- **Why**: Runs were still freezing on `Syncing repository...` because branch-scoped sync could block on expensive prune behavior and failed hard when a task branch did not yet exist remotely.
- **Missing-branch tolerance**: Branch ref sync now fetches refs one-by-one and ignores missing remote refs, so first-run branches can still proceed to branch creation instead of failing setup.
- **Lower-latency sync**: Branch sync no longer prunes and now uses a shorter timeout window, reducing long fetch calls that were exceeding the sandbox action budget.
- **Better branch targeting**: Sandbox prep now syncs base branch (or `main` fallback) before task branch to prioritize refs that are guaranteed to exist.
- **Retry hardening**: Sandbox setup now treats timed-out sandbox exec calls as retryable setup failures, so transient sync stalls can self-recover instead of immediately failing the run.
- **Branch setup resilience**: `setupBranch` no longer hard-fails sandbox startup when the initial upstream `git push -u` call times out; upstream push is now best-effort during setup so the run can proceed.

## Scope sandbox git sync to required refs - 2026-03-18

- **Why**: Task runs were timing out in the `Syncing repository...` phase because snapshot sandboxes still did a full `git fetch --prune origin` before branch prep. On larger repos that meant paying for every remote ref even when the workflow only needed one feature branch or was going to fetch the base branch in a later step anyway.
- **Ref-scoped sync**: `_daytona/git.ts` now supports explicit sync strategies (`none`, `branches`, `all`). Branch-targeted sync fetches only the required remote refs into `origin/*` instead of every branch and tag.
- **Workflow prep**: `_daytona/execution.ts` now skips the initial sync entirely when sandbox prep does not need remote refs yet, and only prefetches the feature branch when later setup may need `origin/<branch>`.
- **Session/design sandboxes**: `_daytona/sessions.ts` now requests only the active feature branch + base branch refs, and no longer does an extra full fetch on fresh session sandbox creation.

## Make MCP token minting non-fatal for task launches - 2026-03-18

- **Why**: Runs could fail before Claude even started when the MCP service returned transient errors like HTTP 502 during sandbox token minting. That turned an optional integration dependency into a hard blocker for quick tasks and project builds.
- **Retry + degrade gracefully**: `mcpTokenMinter.ts` now retries transient mint failures a few times, and `_daytona/helpers.ts` now continues launching the sandbox without MCP config if minting still fails. This keeps task execution alive while preserving MCP when the service is healthy.

## Convex performance audit — quick wins - 2026-03-18

- **streaming.set/internalSet**: Skip patch when `currentActivity` unchanged. During AI streaming this fires constantly — every no-op write invalidated all `streaming.get` subscribers for no reason.
- **Analytics → one-shot reads**: All analytics queries (`getImpactStats`, `getActivityTimeline`, `getActivityHeatmap`, `getLeaderboard`, `getActiveUsers`) switched from reactive `useQuery` to one-shot `ConvexHttpClient` via new `useOneShotQuery` hook. These queries do full table scans across sessions/tasks/runs — maintaining persistent subscriptions meant every write to any of those tables re-ran the entire scan. Stats pages don't need live-second freshness.
- **notifications.list**: Capped at 100 results (was unbounded `.collect()`).
- **notifications.countUnread**: Capped at 100 (was `.collect()` just to return `.length`).
- **notifications.markAsRead**: Skip patch when already `read: true`.
- **logs.listByRepo**: Push `startTime` filter into `by_repo_and_created` index range (`.gte("createdAt", startTime)`) instead of scanning all logs then JS-filtering.

## Harden sandbox startup, heartbeats, and base-branch sync - 2026-03-18

- **Why**: Scheduled project builds and task runs were failing from multiple adjacent weaknesses instead of one bug: long base-branch prep could outlive the normal watchdog window, checkout was redundantly hitting GitHub a second time after fetch, unchanged activity did not actually refresh heartbeats, and Claude startup could sit on `Starting Claude...` if stdout never became parseable stream-json.
- **Startup/watchdog hardening**: `checkStaleRuns` now treats the full sandbox-prep label set as startup work, not just the literal `Starting sandbox...` marker. This keeps long repo prep on the intended startup threshold across the workflow-step path instead of killing runs mid-fetch or mid-checkout.
- **Base branch sync fix**: Replaced `git pull --ff-only origin <branch>` with a local fast-forward merge against the already-fetched `origin/<branch>` in both sandbox prep codepaths. This removes duplicate network work and turns checkout into a short local operation after fetch succeeds.
- **Heartbeat fix**: Callback heartbeats now refresh `streamingActivity.lastUpdatedAt` even when the visible activity payload has not changed, so long-running tool calls no longer look stale to the watchdog.
- **Claude startup robustness**: Removed `--verbose` from the background Claude CLI stream-json path, added an explicit first-parseable-event timeout, and now include stdout/stderr tails in callback failures so stuck starts fail fast with actionable diagnostics instead of hanging on `Starting Claude...`.

## Fix automations stuck on running + add manual run, stop, read-only mode - 2026-03-17

- **Root cause fix:** `handleCompletion` was missing `runId` in its args validator. The sandbox callback sends `runId` as an extra field, which Convex rejects — causing the completion event to never fire and the workflow to hang at `awaitEvent` forever.
- **Run Now button:** Users can manually trigger automation runs without waiting for the cron schedule.
- **Stop button:** Users can cancel running automations (cancels workflow, cleans up streaming activity).
- **Live streaming activity:** Run history now shows real-time steps during execution via `streaming.get`, and completed activity logs after runs finish.
- **Read-only / Report Only mode:** New toggle in automation settings. When enabled, Claude analyzes the codebase and returns a report without making code changes, creating branches, or PRs. Uses restricted tool set (no Write/Edit) and a dedicated read-only prompt.

## Granular Sandbox Preparation Steps - 2026-03-17

Split the monolithic `prepareSandbox` action into 4 granular actions (`createOrResumeSandbox`, `fetchBaseBranch`, `checkoutBaseBranch`, `setupSandboxBranch`) for workflow callers that use `baseBranch`. Each operation now runs as its own workflow step with an independent 10-minute action budget. Also bumped all git fetch timeouts to 240s.

**Why:** `git fetch` on repos like vmem was exceeding the 120s exec timeout within the monolithic action, causing the entire sandbox preparation to fail. Breaking into separate steps gives each operation its own timeout budget and enables per-step retries via the workflow component.

## Fix quick tasks → project → build workflow - 2026-03-14

- `createFromTasks` now sets `baseBranch` from repo defaults — previously omitted, causing builds to silently target wrong base branch
- `startBuild` now checks `hasRepoAccess` — previously any user with a project ID could trigger a build
- `assignToProject` now throws on deleted tasks instead of silently skipping, skips tasks already in the project (idempotency), and validates non-empty input
- Build workflow now tracks failure: stores `lastBuildError` on project when a task fails mid-build, clears it on next build start
- `startTaskForBuild` reads `project.branchName` instead of hardcoding `eva/project-{id}` — respects stored branch name with fallback
- Frontend `GroupTasksModal` validates non-empty task list before submission
- `QuickTasksClient` prunes stale IDs from selection set when tasks are deleted externally

## Decompose useTaskDetail hook - 2026-03-14

- Broke the 1,774-line `useTaskDetail` hook into ~13 focused child components + a slim 200-line data-only hook
- The hook was a component masquerading as a hook — it constructed all JSX internally and returned opaque blobs. Now it returns data + handlers, and consumers compose child components with explicit props
- Extracted: TaskHeader, TaskDescription, ActivityTimeline, AuditTimelineItem, RunTimelineItem, ProofSection, AuditSection, CommentsSection, StatusFieldsSection, TaskFooter, StopConfirmDialog, ResolveConfirmDialog
- Pushed 10 useState calls down into the child components that actually own them (title editing → TaskHeader, comment text → CommentsSection, tags → StatusFieldsSection, etc.)
- Fixed `as` type assertion violations: removed unnecessary `status as TaskStatus` (Convex type already narrows), replaced `val as Id<"projects">` with safe `.find()` lookup, replaced `v as TabType` with `isTaskDetailTab` type guard
- Shared utilities extracted to `task-detail-constants.ts`: `capitalize`, `getUserDisplayName`, `DEPLOYMENT_STATUS_CONFIG`, `GHOST_TRIGGER_CLASS`

## Session sidebar status indicators and deduplication - 2026-03-13

- Added colored status dots to sidebar session items: green (active), amber pulse (starting), gray (closed) — users can now see at a glance which sessions have live sandboxes
- Extracted shared `SessionListSidebar` generic component from `SessionsSidebar` and `DesignSessionsSidebar` — both were 95% identical, now they're thin wrappers (~50 lines each) over the shared component (~280 lines)
- Generic `<T extends SessionItem>` design preserves full Convex ID types through callbacks without `as` casts

## Chrome extension bug fixes: branding, URL, session persistence, sidebar tabs - 2026-03-12

- Renamed "Open in Conductor" → "Open in Eva" and updated production URL from `conductor-lake.vercel.app` to `eva-git-staging-vedantb.vercel.app`
- Opening the extension now restores the last viewed session **per repo** (persisted as `lastSessionByRepo` map in `chrome.storage.local`) instead of showing an empty screen — switching repos also restores that repo's last session
- Added home button to sidebar sheet header so users can navigate back to the empty/home screen
- Replaced custom tab buttons in sidebar with the shared `Tabs`/`TabsList`/`TabsTrigger` UI components for consistency

## Repo switch nudge banner for Chrome extension - 2026-03-12

- Instead of silently auto-switching repos when navigating to a different domain, the extension now shows a nudge banner: "This page matches owner/repo-name" with Switch/dismiss buttons
- Added `chrome.tabs.onActivated` listener so the extension detects tab switches (previously only detected URL changes within the same tab via `onUpdated`)
- User controls when to switch repos — prevents disorienting context switches mid-conversation
- Fixed `handleRepoChange` to accept `Id<"githubRepos">` instead of untyped `string`, removing an `as` cast

## Swap code review and business review stage order - 2026-03-12

- Pipeline now flows: in_progress → code_review → business_review → done (previously business_review came first)
- After a successful agent run, tasks now land in code_review (first review stage) instead of business_review
- Simplified runLifecycle.ts — resolve_conflicts and normal runs both go to code_review now (no conditional needed)
- Updated project phase recomputation to treat business_review (now the final review stage) as "active"
- Swapped column/section ordering across all frontend views (kanban, list, project tasks, bulk status modal)

## Remove flag mode from chrome extension and sessions page - 2026-03-12

- Removed "flag" tab mode from chrome extension chat UI — extension now only supports "ask" mode (read-only Q&A with MCP access)
- Removed flag message filtering from session detail page and summarize workflow since flag messages will no longer be created
- Added migration function (`migrateFlagMessages`) to convert existing flag messages to ask mode — run before removing `v.literal("flag")` from validators
- Kept `v.literal("flag")` in `sessionModeValidator` temporarily until migration runs (chicken-egg pattern)

## Domain-based repo auto-select for Chrome extension - 2026-03-12

- Added `domains` field to `githubRepos` schema — each app/repo can have associated hostnames (e.g. `myapp.com`, `staging.myapp.com`)
- New "Domains" section on the config page (`/settings/config`) to manage hostnames per app, with input normalization (strips protocols/paths, stores only hostnames)
- Chrome extension now auto-selects the correct repo when browsing a configured domain, replacing the need to manually switch repos
- Replaced hardcoded `ALLOWED_HOSTS` with a merge of static localhost defaults + DB-configured domains + `.vercel.app` wildcard
- Uses longest-match domain resolution so `eprocurement.carepulse.co.uk` correctly selects its own app over the parent `carepulse.co.uk` app
- Auto-select fires on both initial load and tab navigation; user can still manually override via the repo dropdown

## Fix MCP create_task/start_execution auth - 2026-03-11

- **Why**: MCP `create_task` and `create_and_run_task` tools were failing with "Not authenticated". The MCP server was using deploy key auth (`Authorization: Convex ${deployKey}`) for mutations, but `authMutation` requires user identity from `ctx.auth.getUserIdentity()` which only works with JWT/Clerk auth. Deploy key auth bypasses identity entirely.
- **Fix**: MCP server now signs user JWTs using the sandbox private key (`SANDBOX_JWT_PRIVATE_KEY`) with the user's clerkUserId as the subject. Mutations are called with `Authorization: Bearer ${jwt}` so Convex recognizes the user natively. Added `jose` dependency for ES256 JWT signing.
- **Files**: `apps/mcp/src/convex-api.ts` (added `signUserJwt`, `runMutationAsUser`), `apps/mcp/src/tools.ts` (switched to `runMutationAsUser`)
- **Design decision**: Tasks created via MCP are attributed to whoever authenticated the MCP OAuth flow (the real user), not the Eva service account. This keeps the audit trail accurate — Eva user should only be the creator when Eva itself creates tasks autonomously (e.g. sandbox execution).

## Chrome Extension — Full Feature Parity Update - 2026-03-11

- **Why**: Extension was broken after backend changes (theme system not working, messages not loading, repo selector missing monorepo support, execution flow using removed two-step `triggerExecution` + `getInstallationToken` pattern). Additionally, extension lacked many web app features (plan mode, cancel execution, session archiving, notification badge).
- **Changes (Phase 1 — Fix Broken Things)**:
  1. Ported full custom theme system from web app (`useTheme` hook) — applies accent colors, radius, fonts, letter-spacing via CSS variables from Convex-synced preferences.
  2. Rewrote `RepoSelector` with monorepo support — groups by owner, shows `name/subdirectory` for monorepo sub-apps, uses `Doc<"githubRepos">` type.
  3. Fixed messages not loading — separated `useQuery` from `?? []` default so `isLoadingRepos` correctly detects undefined, added loading spinner while `sessionMessages` is undefined.
  4. Removed dead `triggerExecution` + `getInstallationToken` two-step flow, simplified to single `startExecution({ id })` call.
  5. Added `"draft"` and `"cancelled"` to `TaskStatus` type, updated pin status colors in `AnnotationOverlay`.
  6. Changed all state to typed `Id<> | null` instead of `string | null` with `as` casts. Added type guards for message payloads instead of `as unknown as` casts.
  7. Removed dead message types (`CREATE_TASK`, `GET_REPOS`, `GET_SESSION`, `ASK_QUESTION`) and their interfaces.
  8. Cleaned up unused types from `types.ts` (`UserInfo`, `RepoInfo`, `AuthState`, `ExtensionSettings`, `SessionInfo`, `SessionMessage`).
- **Changes (Phase 2 — Missing Chat Features)**:
  1. Added cancel execution — stop button when execution in progress, calls `sessionWorkflow.cancelExecution`.
  2. Added all 4 execution modes: Execute, Ask, Plan, Flag (tabs in input area).
  3. Added plan content display — collapsible panel shows `session.planContent` with "Approve & Execute Plan" button.
  4. Added session summary display with streaming support.
  5. Added session archiving — archive button per session, separate "Archived" section in sidebar.
  6. Added system alert message styling (amber/orange for `isSystemAlert` messages).
  7. Added image/video display in assistant messages (`imageUrl`, `videoUrl` fields).
- **Changes (Phase 3 — Polish)**:
  1. Added notification badge on sidebar menu button (queries `notifications.countUnread`).
  2. Added "Open in Conductor" deep link button in header — opens current repo/session in web app.

## Sandbox MCP auth and env var scoping - 2026-03-11

- **Why**: Raw `CONVEX_DEPLOY_KEY` was being injected into sandboxes, giving untrusted code direct admin access to the database. Sandboxes should access Convex through scoped MCP tokens instead.
- **Changes**:
  1. Added `sandboxExclude` flag on env var entries — excluded vars are available server-side but never injected into sandboxes.
  2. Added internal JWT auth to MCP: Eva backend mints short-lived (8h) tokens scoped to a single repo. MCP enforces `scopedRepoId` on all tool calls.
  3. Sandbox launch now writes `/home/daytona/.claude.json` with a Bearer-authenticated MCP server config, so Claude Code in the sandbox gets MCP tools automatically.
  4. Split env vars UI into two sections: sandbox-injected vars on top, excluded vars below with a lock icon. Toggle button to move vars between sections.
  5. Added `resolveAllEnvVars` for server-side code that needs unfiltered access (MCP routes, Linear, snapshots), kept `resolveEnvVars` for sandbox injection.
- **Action required**: Set `MCP_BASE_URL` and `MCP_BOOTSTRAP_SECRET` in Convex env vars, `MCP_INTERNAL_SECRET` on the MCP server.

## MCP security: separate bootstrap secret and client registration validation - 2026-03-11

- **Why**: `MCP_JWT_SECRET` was reused for both JWT signing and bootstrap endpoint auth — if one leaked, both were compromised. Also, OAuth accepted any redirect URI from any unregistered client, enabling potential auth code interception.
- **Changes**:
  1. Separated bootstrap auth into its own `MCP_BOOTSTRAP_SECRET` env var in both `http.ts` (Convex) and `convex-api.ts` (MCP app). JWT signing still uses `MCP_JWT_SECRET`.
  2. Client registrations are now persisted in-memory with their `redirect_uris`. Auto-expire after 24h.
  3. `/oauth/authorize` and token exchange now reject unknown `client_id`s.
  4. `redirect_uri` is validated against the URIs registered for that client during both authorize and auth callback.
- **Action required**: Set `MCP_BOOTSTRAP_SECRET` env var in both Railway (MCP app) and Convex dashboard. Generate a new random secret — do not reuse `MCP_JWT_SECRET`.

## MCP security: constant-time comparisons and error sanitization - 2026-03-11

- **Why**: Security review found timing-attack-vulnerable string comparisons for HMAC/token verification and error messages leaking internal details to clients.
- **Changes**:
  1. Added `timingSafeEqual()` helper in `http.ts` — used for bootstrap token, deploy key, webhook HMAC, and streaming heartbeat HMAC verification.
  2. Sanitized all error responses in MCP `index.ts` — generic messages to clients, detailed errors logged server-side only.

## Add explicit "Make changes" toggle in comments - 2026-03-11

- **Why**: The Comments tab had hidden rerun behavior tied to internal state, which made it unclear whether sending a message would only save a comment or actually re-run Eva. Making that choice visible above the input removes ambiguity and matches the Request Changes entry point.
- **Changes**:
  1. Added a visible `Make changes` toggle above the task comments input for post-run task states.
  2. Clicking `Request Changes` now opens the Comments tab and enables that toggle automatically.
  3. The send button continues to use the current toggle state to decide whether to create only a comment or create a comment and start a new run.
- **Reason for change**: This keeps the workflow explicit for users while preserving the existing rerun path and minimizing code churn.

## MCP security hardening - 2026-03-11

- **Why**: Security review identified injection risk in code interpolation, excessively long JWT tokens with no revocation, and env-vars endpoint lacking server-side access checks.
- **Changes**:
  1. Use `JSON.stringify()` for all code interpolation in `get_document` and `count_table` tools — defense-in-depth against injection.
  2. Reduced JWT access token lifetime from 30 days to 1 hour. Refresh tokens (30 day) with `refresh_token` grant type support added.
  3. Added user-existence re-validation on every MCP request via Clerk Backend SDK — revoked/deleted users are immediately blocked.
  4. Moved repo access check into the `/api/mcp/env-vars` Convex HTTP endpoint (new `mcpQueries.ts`) — defense-in-depth so even if MCP app layer is bypassed, env vars are protected.
  5. User-scoped credential cache (keyed by `userId:repoId` instead of just `repoId`).

## Add per-user data scoping to MCP server - 2026-03-11

- **Why**: The MCP server authenticated users via OAuth but used a single shared deploy key for all queries — any authenticated user could access every repo's data, every table, and create tasks on any repo. This was a security hole.
- **Changes**:
  1. Added `resolveUserByClerkId()`, `listUserRepos()`, and `checkRepoAccess()` to `convex-api.ts` — maps Clerk user ID to Convex user ID and checks repo ownership/team membership.
  2. All tools now resolve the authenticated user and verify repo access before executing.
  3. `list_repos` only returns repos the user owns or has team membership for.
  4. `repoId` is now required (not optional) on all data query tools (`list_tables`, `query_table`, `get_document`, `run_query`, `count_table`) — querying Eva's own internal database via MCP is no longer possible.
  5. `create_and_run_task` searches only the user's accessible repos.
  6. Also fixed Clerk handshake redirect breaking MCP OAuth flow for users with existing sessions.

## Cleanup audit categories: remove system defaults, add per-app support - 2026-03-09

- **Why**: System-seeded audit categories were inflexible and forced a specific set on users. Moving to fully user-defined categories gives more control. Per-app audit support lets monorepo users configure different audits for different apps.
- **Changes**:
  1. Removed `SYSTEM_DEFAULTS` and `seedDefaults` mutation — no more system-level categories.
  2. Removed `isSystem` enforcement (edit/delete guards). All categories are now user-owned and fully editable/deletable.
  3. Added `appId` field to `auditCategories` — `undefined` = repo-level, set = app-specific category.
  4. Added `disabledForAppIds` field — repo-level categories can be disabled per-app without deleting them.
  5. New `listEnabledForContext(repoId, appId?)` query replaces `listEnabledByRepo` — merges repo-level (minus disabled) + app-specific categories.
  6. New `toggleDisabledForApp` mutation for per-app inheritance overrides.
  7. UI: Two sections on audit settings page — "Repo-level Audits" and "Per-app Audits" (shown when monorepo has child apps). Removed "Get defaults" button and "System" badges.
  8. Migration function `clearIsSystemFromAuditCategories` to clean up `isSystem` field from existing documents.
- **Migration needed**: Run `clearIsSystemFromAuditCategories`, then remove `isSystem` from schema.

## Auto-generate fix PRs from testing arena evaluation failures - 2026-03-06

- **Why**: When the testing arena evaluation found failing requirements, users had to manually create tasks to fix them. Now the system automatically spins up a sandbox, fixes the issues, and creates a PR — closing the feedback loop without leaving the testing arena.
- **Changes**:
  1. Added `fixStatus`, `fixBranchName`, and `prUrl` fields to the `evaluationReports` schema and validators.
  2. Extended `evaluationWorkflow` to continue after evaluation completes with failures: spins up a write-enabled sandbox, gives Claude the failing requirements to fix, creates a branch and PR via `createPullRequest`, stores the PR URL on the report.
  3. Added `fixCompleteEvent`, `handleFixCompletion`, `getFixData`, `setFixing`, `saveFixResult`, `saveFixError` functions to support the fix workflow lifecycle.
  4. Updated the frontend testing arena page to display fix status (fixing indicator, streaming activity during fix), and a "View Fix PR" link button on the report card header.
- **Reason for change (architectural)**: Evaluation and fix are a natural continuation — keeping them in the same workflow simplifies state management and avoids orphaned fix attempts.

## Dynamic audit categories — 2026-03-09

Replaced hardcoded audit toggle fields (`accessibilityAuditEnabled`, `codeTestingAuditEnabled`, `codeReviewAuditEnabled`, `postAuditEnabled`) on `githubRepos` with a dedicated `auditCategories` table. Categories are per-repo, user-manageable, and the prompt builder reads enabled categories dynamically.

- New `auditCategories` table: `repoId`, `name`, `description`, `enabled`, `isSystem`, `createdAt`
- CRUD mutations: `listByRepo`, `listEnabledByRepo`, `seedDefaults`, `create`, `update`, `toggleEnabled`, `remove`
- System defaults (Accessibility, Testing, Code Review) are seeded via "Get defaults" button, marked `isSystem: true`, non-deletable
- Users can add custom audit categories with name + description (sent as AI instructions)
- `buildAuditPrompt` and `buildSessionAuditPrompt` now accept `categories[]` instead of `AuditFlags`
- `getTaskData` returns `auditCategories` instead of 4 boolean flags
- Session audit (`_daytona/audit.ts`) queries enabled categories before running
- New `/settings/audits` page with category list, enable/disable toggles, and add form
- Added "Audits" nav item to `SettingsSidebar`
- Removed old fields from schema, helpers, mutations, and ConfigClient
- Migration: `removeOldAuditFieldsFromRepos` strips old fields via `ctx.db.replace()`

## Unified audits table + flexible sections — 2026-03-09

Merged `taskAudits` and `sessionAudits` into a single `audits` table with `entityId: v.union(v.id("agentTasks"), v.id("sessions"))`. Reduces table sprawl — audit data is identical regardless of context, only the foreign key differs.

Also replaced hardcoded 3-field audit schema (`accessibility`, `testing`, `codeReview`) with flexible `sections: Array<{ name, results }>` format. New audit categories can be added without schema/frontend changes.

- New `audits` table with polymorphic `entityId` and `by_entity` index
- `auditSectionValidator` for dynamic sections
- Shared audit JSON parser in `_taskWorkflow/auditParser.ts` (eliminates duplication, no `as` casts)
- Frontend dynamically maps `sections` array
- Prompt builders output `sections` format
- `/audit` skill system: router + `/audit-accessibility`, `/audit-code-review`, `/audit-testing`
- Migration: `migrations/mergeAuditTables.ts` moves data from old tables to unified table

## Proof of completion carousel — 2026-03-08

Added an Embla-based carousel (shadcn pattern) to the task detail proof section. When a task has multiple screenshots/videos, they are now shown in a swipeable carousel with prev/next buttons and dot indicators, instead of a vertical stack. Single media items render normally without carousel chrome.

- New `Carousel` component in `packages/ui` (Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots)
- Updated `useTaskDetail.tsx` proof section to separate media vs message proofs and wrap media in the carousel

## Move active tasks indicator from sidebar bottom to Quick Tasks tab badge — 2026-03-08

- **Why**: The active tasks component at the bottom of the sidebar was disconnected from where tasks live. Moving it inline as a badge on the Quick Tasks nav item provides better context and discoverability.
- **Changes**: Replaced the standalone `ActiveTasksPopover` at sidebar bottom with an `ActiveTasksBadge` that renders inline on the Quick Tasks nav item — shows a glowing green dot + "{count} live" text, with the same hover popover for task details.

## Fix git checkout failures due to dirty working tree — 2026-03-08

- **Why**: `git checkout` was aborting when auto-generated files (e.g. `next-env.d.ts`) existed as local changes in the sandbox, causing tasks and sessions to fail during branch setup.
- **Changes**: Added `git stash --include-untracked` before checkout in `checkoutSessionBranch` and `prepareSandbox` base-branch checkout. The `setupBranch` function already had this — now all checkout paths are consistent.
- **Reason**: Sandboxes that are reused across runs can accumulate untracked/modified files from previous executions. Stashing ensures branch switches always succeed.

## Fix Build Project button disabled state & branch sync — 2026-03-08

- **Why**: Build Project button stayed clickable after starting a build, and project branches fell behind their base branch (e.g. 80 commits behind main).
- **Changes**:
  - Build Project button now also disables when `activeBuildWorkflowId` is set (active build running), not just when a build is scheduled. Dialog button disables during mutation.
  - `setupBranch` in git.ts now fast-forwards from `origin/{branch}` and merges `origin/{baseBranch}` after checkout. This ensures project branches incorporate latest base branch commits before each task execution — matching how quick tasks always branch from the latest base.
- **Reason**: Button disabled condition was incomplete — only checked `scheduledBuildAt`, missing `activeBuildWorkflowId`. Branch sync only did `git fetch` + `git checkout` without merging base, so existing project branches never picked up new base commits.

## Eva config: richer ask-mode responses + LSP tool enabled — 2026-03-08

### Summary

Two improvements to Eva's session configuration:

1. **Ask mode now supports rich markdown and mermaid diagrams** — previously ask mode was restricted to plain text. Non-technical users benefit more from visual diagrams (flow charts, architecture diagrams) than prose, so the system prompt now encourages mermaid blocks for architecture/data flow explanations while keeping language jargon-free.

2. **`ENABLE_LSP_TOOL=true` added to all sandbox launches** — Claude Code defaults to text-grep for code navigation. Setting this flag connects it to language servers (LSP), enabling "jump to definition"-style lookups that are significantly faster and more accurate for finding functions and symbols across the codebase.

## Per-context sandbox lifecycle management — 2026-03-08

Behavior per context:

┌──────────────────┬───────────┬─────────────────────┬───────────┐
│ Context │ autoStop │ autoDelete │ ephemeral │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Quick tasks │ 0 (never) │ 0 (instant on stop) │ true │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Snapshot warming │ 0 (never) │ 0 (instant on stop) │ true │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Sessions │ 30 min │ 30 min │ false │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Design sessions │ 30 min │ 30 min │ false │
├──────────────────┼───────────┼─────────────────────┼───────────┤
│ Project tasks │ 30 min │ 30 min │ false │
└──────────────────┴───────────┴─────────────────────┴───────────┘

- **Why**: Tasks running >15 minutes were killed by the watchdog ("no heartbeat for 180s"). Root cause: a single `autoStopInterval: 15` on all sandbox creation meant Daytona auto-stopped sandboxes after 15 min of no SDK API calls. Background scripts (`nohup`) don't count as activity per Daytona docs, so sandboxes appeared idle immediately after launch.
- **Changes**: Introduced `SandboxLifecycle` type with two presets — `EPHEMERAL_LIFECYCLE` (autoStop=0, ephemeral=true for tasks/warming) and `SESSION_LIFECYCLE` (autoStop=30, autoDelete=30 for sessions/projects/design). Threaded lifecycle config through `createSandbox` → `createSandboxAndPrepareRepo` → `getOrCreateSandbox`. Also consolidated retry logic (90s per-call timeout on `daytona.create()`, 3 attempts/12min budget).
- **Reason**: Different sandbox contexts have conflicting needs. Ephemeral tasks need no auto-stop (background script, cleaned up by our code). Sessions benefit from 30-min auto-stop since preview URL access resets the timer. Using Daytona's `ephemeral: true` flag auto-deletes ephemeral sandboxes on stop as a safety net.

## Quick Tasks UI revamp (follow-up polish) — 2026-03-08

- **Why**: Reviewer feedback on the tab-based task detail UI needed addressing.
- **Changes**:
  - Removed section titles inside each tab (Activity, Proof of Completion, etc.) — redundant with tab labels
  - Added icons to tab triggers (Terminal, Photo, Shield, Message) reusing existing tabler icons
  - Modal hides tabs column for "todo" status tasks unless content exists in any tab
  - Comments textarea no longer sends on Enter — only the send button submits
  - Reverted task card list width back to original 20%/30% split
- **Reason**: Polish pass based on reviewer feedback to reduce redundancy and fix UX issues.

## Quick Tasks UI revamp — 2026-03-08

- **Why**: Task detail views stacked all content vertically (activity, proof, audit) making it hard to find specific sections. Request changes opened a 4th column in the modal which was awkward. Task cards showed redundant description text.
- **Changes**:
  - Removed description from task list cards (QuickTaskCard) — title is sufficient for scanning
  - Added 4-tab system (Activity, Proof, Audit, Comments) to both inline and modal detail views — Activity is default tab
  - In the modal, tabs appear in the 2nd column; in the inline view, tabs appear under the description/subtasks
  - Request Changes button now switches to Comments tab instead of opening a separate panel/column
  - Comments tab shows existing comments with delete option and a form that auto-runs Eva on submit when changes are requestable
  - Bumped task card list width from 20%/30% to 28%/35% for better readability
- **Reason**: Consolidating content into tabs reduces visual clutter and makes it easier to navigate between sections. Moving request changes into comments is more natural UX.

## Extract shared ScheduleDateTimePicker component — 2026-03-08

- **Why**: The schedule time input crashed with `TypeError: .second is not a function` when typing partial time values (e.g. "0"). The `SchedulePopover` had a fix for this (validating `parts.length` and `NaN`), but `ScheduleTasksModal` and `ScheduleBuildPopover` didn't, causing the error in the quick-tasks bulk schedule flow.
- **Changes**:
  - Created `ScheduleDateTimePicker` component with `useScheduleDateTime` hook and `ScheduleDateTimeActions` — shared calendar + time input with proper input validation
  - Refactored `SchedulePopover`, `ScheduleBuildPopover`, and `ScheduleTasksModal` to use the shared component
- **Reason**: Three components duplicated the same date-time picking logic. Extracting it ensures the validation fix is applied everywhere and prevents future drift.

## Convex rules audit: index naming & filter cleanup — 2026-03-08

- **Why**: Convex rules require index names to include all field names (with "and" for multi-field), and `.filter()` on queries should be replaced with `.withIndex()` for indexed lookups.
- **Changes**:
  - Renamed `by_owner_name` → `by_owner_and_name` on `githubRepos` (multi-field index missing "and")
  - Renamed `by_repoId` → `by_repo` on `repoSnapshots` (consistency with codebase convention)
  - Renamed `by_repoSnapshotId` → `by_repo_snapshot` on `snapshotBuilds` (consistency)
  - Added composite index `by_repo_snapshot_and_status` on `snapshotBuilds` — eliminates `.filter()` in `getRepoSnapshotName`
  - Added composite index `by_task_and_depends_on` on `taskDependencies` — eliminates `.filter()` in `add` and `removeByTasks`
  - Added composite index `by_team_and_role` on `teamMembers` — eliminates `.filter()` in `remove` (last-owner check)
  - Updated all 10 call sites referencing renamed indexes
- **Reason**: Enforcing Convex best practices — indexed queries over `.filter()` for performance, consistent naming conventions.

## Database bandwidth optimization — 2026-03-08

- **Why**: Top Convex functions by bandwidth were consuming excessive reads due to full table scans, missing indexes, JS filtering after collect, and heavy documents returned to clients unnecessarily.
- **Changes**:
  - Added `by_repo_and_status` and `by_repo_and_updatedAt` indexes to `agentTasks` — eliminates full table scans in `getActiveTasks` and JS status filtering in `getAllTasks`
  - `getActiveTasks` now queries per-repo per-status via compound index instead of scanning entire `agentTasks` table
  - `getAllTasks` queries 6 non-draft statuses individually via compound index instead of collecting all and filtering
  - `analytics.getImpactStats` uses `by_repo_and_updatedAt` range query for time-filtered tasks instead of JS filtering after full collect
  - Removed `projects.get` subscription from `ProjectCard` — each card was fetching the full project doc (including heavy `conversationHistory`) just for participant avatars. Now uses `members`/`projectLead` from the lightweight list data
  - Moved `conversationHistory` and `generatedSpec` from `projects` table to new `projectDetails` table — `projects.list` no longer reads these heavy fields from the DB. `projects.get` joins them back for detail views.
- **Reason**: Convex rule "Do NOT use filter in queries — use withIndex instead" was violated in multiple high-traffic functions. The `projects` table carried unbounded conversation data that was read on every list query even though it was stripped before returning.

## Mobile responsiveness audit (deep pass) — 2026-03-07

- **Why**: Many pages and components had fixed widths, missing responsive breakpoints, and overflow issues that made the platform difficult to use on phones and tablets.
- **Changes**:
  - Quick Tasks: Split view now uses sm breakpoint instead of md for earlier stacking, filter button max-width tightened, card padding reduced on mobile, kanban columns use 75vw snap width
  - Sessions: Added useMediaQuery hook; mobile devices now get vertical stack layout instead of resizable horizontal panels; summary accordion and plan content padding responsive; prompt input area tighter on mobile
  - Designs: Chat panel gets max-h-50vh on mobile to share space with preview, min-width reduced for medium screens, preview panel header wraps on small screens, footer gap/padding responsive, persona dialogs width-capped to viewport
  - Testing Arena: Test run list max-height tuned for mobile, test detail padding responsive (px-4 → sm:px-10), header padding tighter, branch select narrower on small screens
  - Settings: Config card padding responsive, snapshots table min-width reduced on mobile (360px), table cell padding tighter (px-2 → sm:px-4), logs summary grid gap responsive
  - Shared: Main sidebar width capped to prevent overflow on very small screens (min of 16rem, 100vw-3rem), mobile header padding responsive, SidebarLayoutWrapper mobile drawer capped to 100vw-2rem, ChatPageWrapper header gap and wrap improved, KanbanBoard columns use 75vw for better mobile snapping, TaskDetailInline gap responsive, TaskDetailModal gets w-full for mobile constraint
  - Added `useMediaQuery` hook for responsive layout switching
- **Reason for change**: Mobile-first accessibility audit across quick tasks, sessions, designs, documents, testing arena, inbox, stats, and settings pages.

## Replace JWT auth with HMAC for sandbox streaming heartbeats — 2026-03-07

- **Why**: All task runs were being killed by the watchdog ("no heartbeat for 180s"). Root cause: the callback script's `streaming:set` calls used `authMutation` which requires JWT validation + user DB lookup on every call. Convex's auth layer intermittently fails (confirmed by `presence:disconnect` throwing "Not authenticated" every ~10s). Since heartbeat errors were silently swallowed, heartbeats died for 180s and the watchdog killed the run.
- **Changes**:
  1. Added `POST /api/streaming/heartbeat` HTTP endpoint in `http.ts` that validates via HMAC instead of JWT.
  2. HMAC is computed server-side (`signAndLaunchScript`) as `HMAC-SHA256(ENCRYPTION_KEY, entityId)` — scoped to one streaming entity, unforgeable without the secret.
  3. Callback script now calls the HMAC endpoint for all streaming writes (heartbeats, flush, finalization).
  4. Falls back to old `streaming:set` authMutation if HMAC env vars aren't set.
  5. Added retry + error logging to heartbeat/flush paths.
  6. Fixed missing `customTheme` field in `getUserByClerkId` return validator.
- **Reason for change**: JWT auth is inherently fragile for high-frequency calls from sandboxes. HMAC eliminates the entire auth chain (JWT parsing, signature verification, user DB lookup) from the heartbeat path.

## Add Ctrl+Enter hotkey to Quick Task modal — 2026-03-07

- **Why**: Creating a quick task required clicking the button. Power users expect keyboard shortcuts for common actions.
- **Changes**: Added `@tanstack/react-hotkeys` and wired `Mod+Enter` (Ctrl+Enter / Cmd+Enter) to submit the quick task form. Added a `⌘↵` hint on the Create Task button.

## Split post-execution audit into 3 individual toggles — 2026-03-07

- **Why**: The single `postAuditEnabled` toggle was all-or-nothing. Users couldn't disable expensive/irrelevant audit sections (e.g. accessibility for backend-only repos) and there was no extensibility path for adding more audit types.
- **Changes**:
  1. Added `accessibilityAuditEnabled`, `codeTestingAuditEnabled`, `codeReviewAuditEnabled` fields to `githubRepos` schema (all default to true via `!== false`).
  2. Updated `updateConfig` mutation, `getTaskData` query, and workflow definition to pass individual flags.
  3. `buildAuditPrompt` now dynamically builds the prompt based on which audits are enabled.
  4. UI replaced single checkbox with 3 granular checkboxes under a "Post-execution Audits" heading.
  5. Task detail audit display filters out empty sections (disabled audits won't render).
- **Reason for change**: Granular control over audit types, extensibility for future audit additions.

## Hide/show repositories and monorepo apps — 2026-03-07

- **Why**: Some monorepo apps (e.g. MCP, Chrome extension) and codebases clutter the repo selector and home page but shouldn't be deleted. Users need a way to hide them from the UI without removing them from Eva.
- **Changes**:
  1. Added `hidden` optional boolean field to `githubRepos` schema and validator.
  2. `list` query now accepts optional `includeHidden` arg — defaults to filtering out hidden repos. Management pages (monorepo settings, team detail) pass `includeHidden: true`.
  3. Added `toggleHidden` mutation for setting visibility.
  4. RepoCard dropdown now has a "Hide" option.
  5. New `HiddenReposSheet` dialog on the home page header shows count of hidden repos and lets users unhide them.
  6. Hidden repos are automatically filtered from the sidebar RepoSelect.
  7. Monorepo settings page (`/settings/monorepo`) now shows a "Connected Apps" section with per-app visibility toggles (Visible/Hidden) so users can manage which monorepo apps appear in the sidebar and home page from one place.

## Change session collapse to hide sandbox panel instead of chat — 2026-03-07

- **Why**: The collapse button previously collapsed the chat panel (left side), which was counterintuitive — users want to expand the chat to focus on conversation, not hide it. Collapsing the sandbox panel (right side) makes more sense as users may want a full-width chat view.
- **Changes**: Made the sandbox (right) panel collapsible instead of the chat panel. Moved the collapse/expand button from the SandboxPanel tab switcher header to the ChatPanel header actions area. Uses right-sidebar collapse/expand icons to match the panel direction.

## Dismiss Daytona preview warning for all iframes — 2026-03-07

- **Why**: Every iframe (web preview, VS Code, VNC desktop, design preview) showed a Daytona security warning page on first load, requiring manual dismissal.
- **Changes**: Created `dismissDaytonaWarning` utility that sends a `HEAD` request with `X-Daytona-Skip-Preview-Warning: true` header before loading each iframe. Applied to all 4 preview surfaces: SandboxPanel (web), EditorPanel (VS Code), DesktopPanel (VNC), and DesignDetailClient (design). Uses an in-memory Set to avoid redundant requests per origin.

## Fix: new sessions no longer auto-appear as sandbox running — 2026-03-07

- **Why**: Creating a new session or design session set `status: "active"`, which the frontend interpreted as "sandbox is running". This caused the UI to show sandbox-active state (spinners, no "Start" button) even though no sandbox had been started.
- **Changes**: Changed initial status from `"active"` to `"closed"` in both `_sessions/mutations.ts` (sessions) and `designSessions.ts` (design sessions) create mutations. Status only becomes `"active"` when `sandboxReady` is called after a real sandbox starts.

## Instant sandbox start feedback + unified design/session button — 2026-03-07

- **Why**: Clicking "Start" on a session or design sandbox gave no feedback for ~30 seconds until the sandbox was fully ready. The design page also used a different button pattern from sessions.
- **Changes**:
  1. Added `"starting"` to `sessionStatusValidator` — used by both `sessions` and `designSessions` tables.
  2. `startSandbox` mutations (sessions + design) now set `status: "starting"` immediately before scheduling the background action, so the UI reflects the state change instantly.
  3. Session UI derives `isSandboxStarting` from `session.status === "starting"` instead of local `useState` — the spinner is now driven by the database, surviving page refreshes.
  4. Design page button replaced with the same icon-button pattern as sessions (play/stop icon, destructive variant when active, spinner when toggling).
- **Reason for change**: Immediate visual feedback on start. Consistent button UX across sessions and design pages.

## Show all tasks on Quick Tasks page with project filter — 2026-03-07

- **Why**: Quick Tasks page only showed orphan tasks (no project). Tasks assigned to projects were hidden, making it impossible to see all tasks in one place or filter by project.
- **Changes**:
  1. Removed `!t.projectId` filter from QuickTasksClient, QuickTasksListView, and QuickTasksKanbanBoard — all tasks now show by default.
  2. Added `projectFilterParser` nuqs param with values: "all" (default), "none" (orphan tasks only), or a specific project ID.
  3. Added project filter dropdown to QuickTasksToolbar showing all repo projects.
  4. Added `projectName` badge on QuickTaskCard for tasks belonging to a project.
  5. Centralized task filtering in QuickTasksClient — child views now receive pre-filtered tasks as props instead of re-querying.
- **Reason for change**: Visibility. Users need to see all tasks regardless of project membership, with the ability to filter by project.

## Add granular streaming progress during sandbox setup — 2026-03-07

## Streaming progress: setup steps + callback script continuity — 2026-03-07

- **Why**: Three problems: (1) Users saw "Starting sandbox..." for up to 5 minutes with no feedback during `prepareSandbox`. (2) The progress format was `{steps:[{label}]}` which `parseActivitySteps` didn't recognize, so it rendered as raw JSON. (3) When the callback script started, it overwrote all setup progress with a fresh `["Starting Claude..."]`, losing the history.
- **Changes**:
  1. **Setup progress** — Added `streamingEntityId` arg to `prepareSandbox`. Emits progress via `internalSet` mutation at each milestone: "Creating sandbox...", "Cloning repository...", "Installing dependencies...", "Syncing repository...", "Resuming sandbox...", "Fetching base branch...", "Setting up branch...", "Starting desktop...", "Retrying sandbox setup...".
  2. **Correct format** — `emitProgress` now emits the `ActivityStep[]` format (`[{type, label, status}]`) that the frontend parser expects, with accumulated completed steps + one active step. On retry, the step history resets.
  3. **Continuity with callback script** — `launchOnExistingSandbox` reads the current streaming activity via `internalGet` query and passes it as `PRIOR_STEPS` env var. The callback script reads `PRIOR_STEPS` on startup and initializes `accumulatedSteps` from it, so setup steps appear as completed before "Starting Claude..." begins.
  4. **Supporting infrastructure** — Added `internalGet` query and `internalSet` mutation to `streaming.ts`. Updated all 12 workflow callers across 10 files to pass `streamingEntityId`.
  5. **`onProgress` callbacks** — Added to `cloneAndSetupRepo`, `createSandboxAndPrepareRepo`, and `getOrCreateSandbox` in `git.ts`.
- **Reason for change**: Users now see one continuous chain of steps from sandbox creation through Claude execution, all rendered by the same `ActivitySteps` component.

## Split (main) into (global) + (repo) route groups — 2026-03-07

- **Why**: All pages (global home/teams/inbox/theme and repo-scoped pages) lived under a single `(main)` route group with a conditional `showTopNavBar` hack in the layout. This caused: inbox broke sidebar when clicked (navigated away from repo context), theme link in SettingsSidebar was dead (no page existed at repo-relative path), and no clear boundary between global and repo-scoped routes.
- **Changes**:
  1. Renamed `app/(main)/` to `app/(repo)/` — keeps repo layout (Sidebar + RepoProvider).
  2. Created `app/(global)/` with a new layout — TopNavBar + max-w-7xl container, no conditional logic.
  3. Moved global pages (`home/`, `teams/`, `setup/`, `settings/theme/`, `inbox/`) to `(global)/`.
  4. Extracted `InboxClient` and `ThemeSettingsClient` + `_components/` to `lib/components/` so both route groups can import them.
  5. Created thin repo-scoped pages at `(repo)/[owner]/[repo]/inbox/` and `(repo)/[owner]/[repo]/settings/theme/` that render the shared client components inside the repo layout with sidebar visible.
  6. Updated Sidebar inbox href from `/inbox` to `${repoBasePath}/inbox` so it stays in repo context.
  7. Added Inbox + Theme tabs to TopNavBar alongside Repositories and Teams.
- **Reason for change**: Architectural. Clean separation between global pages (TopNavBar, no sidebar) and repo pages (Sidebar, RepoProvider) eliminates the conditional layout hack and fixes broken navigation paths.

## Split setupAndExecute into prepareSandbox + launchOnExistingSandbox — 2026-03-07

- **Why**: The `setupAndExecute` Convex action bundled sandbox creation (with up to 5 internal retries), repo cloning, branch setup, AND script launch into a single action. For repos without snapshots, this could exceed Convex's 10-minute action timeout — especially when retries compounded cold clone + npm install times.
- **Changes**:
  1. Split `setupAndExecute` into `prepareSandbox` (sandbox creation + repo setup) and reuse `launchOnExistingSandbox` (script upload + launch). Each gets its own 10-minute budget as separate workflow steps.
  2. Reduced `maxSetupAttempts` from 5 to 2 and added a 7-minute elapsed time guard to prevent retry loops from exceeding action limits.
  3. Updated all 12 workflow callers across 10 files to use the two-step pattern.
  4. Converted callback script from template-interpolated function to static constant — `completionMutation` and `entityIdField` are now passed as environment variables instead of string interpolation.
- **Reason for change**: Architectural. A single action doing too much work risked Convex function timeouts. Splitting into workflow steps gives each operation its own timeout budget and makes failures more granular.

## Decompose monolithic client components into \_components/ + \_utils convention - 2026-03-07

- **Why**: 10 route-level `*Client.tsx` files (300-568 lines each) mixed data fetching, state management, handlers, helper functions, and all JSX in a single file. This made them hard to read, maintain, and modify without risk of side effects.
- **Changes**:
  1. Established `_components/` + `_utils.ts` convention per route for co-located decomposition.
  2. Refactored 10 files: RepoHomeClient (317→154), ThemeSettingsClient (349→95), LogsClient (383→150), RepoSetupClient (326→195), ReposClient (495→141), TeamDetailClient (422→79), ProjectsClient (435→250), QueryDetailClient (522→48), DesignDetailClient (500→137), QuickTasksClient (568→259).
  3. Created ~30 extracted components across `_components/` folders and 3 `_utils.ts` files.
  4. Added "Component Structure" rules to CLAUDE.md (~250 line max, orchestrator pattern, \_components/ convention).
- **Reason for change**: Architectural. Monolithic client components violate single-responsibility and make it hard to reason about changes. The orchestrator + child component pattern keeps data flow clear and components maintainable.

## Decompose DesignDetailClient into smaller components - 2026-03-07

- **Why**: `DesignDetailClient.tsx` was 500 lines handling chat, preview, sandbox control, and tab state all in one component. This made it hard to reason about responsibilities and would only grow worse as features are added.
- **Changes**:
  1. Extracted `DesignChatPanel` — owns conversation rendering, message sending/cancelling, persona selection, and streaming display.
  2. Extracted `DesignPreviewPanel` — owns iframe preview, variation tabs, desktop/mobile toggle (nuqs state), and variation selection UI.
  3. Slimmed `DesignDetailClient` to an orchestrator: session query, sandbox lifecycle, preview URL fetching, and composing the two panels.
- **Reason for change**: Single-responsibility decomposition. Each component now has a clear concern boundary, making future changes (e.g., swapping preview tech, adding chat features) isolated.

## Backend simplification round 2: dead code removal and dedup - 2026-03-07

- **Why**: Audit of 80+ Convex files found dead code paths, unused exports, and repeated patterns that added maintenance burden without providing value.
- **Changes**:
  1. Deleted dead PR creation chain in `testGenWorkflow.ts` — `createPr` → `createPrAction` was a no-op chain (empty handler). Removed scheduler call in `saveResult` too. (~45 lines)
  2. Deleted 4 unused CRUD mutations from `evaluationReports.ts` (`updateEvalStatus`, `completeEval`, `failEval`, `updateEvalSummary`) — workflow handles all status transitions directly via `ctx.db.patch()`. (~79 lines)
  3. Extracted `timeoutLastMessage` helper in `workflowWatchdog.ts` to deduplicate the "find last assistant message → patch content" pattern across 3 handlers. (~20 lines saved)
  4. Extracted `updateLastHistoryEntry` in `docInterviewWorkflow.ts` and `updateLastConversationEntry` in `projectInterviewWorkflow.ts` to deduplicate the "clone history → update last entry → return" pattern (5 instances each). (~30 lines saved)
- **Reason for change**: Dead code creates confusion about what's active. Duplicated patterns mean bugs fixed in one spot get missed in others.

## Simplify chat panel, design page, analyse page - 2026-03-07

- **Why**: ChatPanel, DesignDetailClient, and QueryDetailClient had significant code duplication — `ensureHttps()` copied in 2 files, session cache helpers copied in 2 files, IIFE+parseActivitySteps rendering pattern copy-pasted 6 times across 3 files, `evaIcon` JSX duplicated, user avatar block duplicated in 3 files. Also had `as` type assertions and a `!` non-null assertion violating project rules.
- **Changes**:
  1. Extracted `ensureHttps` to `lib/utils/ensureHttps.ts`, `createSessionCache` factory to `lib/utils/sessionCache.ts`
  2. Created `EvaIcon`, `UserMessageAvatar`, `StreamingActivityDisplay`, and `ActivityLogDisplay` shared components
  3. Fixed `as Id<>` cast in QueryDetailClient by typing page params correctly
  4. Fixed `as "execute" | "ask" | "plan"` cast in ChatPanel with type guard
  5. Fixed `sandboxId!` non-null assertion in DesktopPanel
  6. Added `useMemo` for `filteredMessages`, `latestVariations`, and `personaMap` to avoid unnecessary recomputation
  7. Replaced O(n\*m) persona `.find()` lookup with O(1) Map lookup in DesignDetailClient
- **Reason for change**: Code duplication across chat-like pages made changes error-prone and increased maintenance burden. Type safety violations needed fixing.

## Settings pages code structure cleanup - 2026-03-07

- **Why**: Settings pages had duplicated `formatDuration` implementations (SnapshotsClient and LogsClient), `as` type assertion violations in ThemeSettingsClient and ThemeContext, and repeated button styling across 4 theme sections.
- **Changes**:
  1. Added `formatDurationMs` and `formatDurationMsShort` to shared `lib/utils/formatDuration.ts`. Removed local copies from SnapshotsClient and LogsClient.
  2. Added `resolveCustomTheme` helper to ThemeContext to eliminate 4 `as` casts in ThemeSettingsClient. Fixed `as HTMLStyleElement` cast in ThemeContext with `instanceof` check.
  3. Extracted `OptionButton` component in ThemeSettingsClient to deduplicate active/inactive button styling across Accent Color, Border Radius, Font, and Letter Spacing sections.
  4. Deleted empty `[owner]/[repo]/settings/layout.tsx` (was just `<>{children}</>`).
- **Reason for change**: Reduce duplication and fix rule violations found during code structure audit.

## Deduplicate shared utilities across backend workflows - 2026-03-07

- **Why**: 80+ Convex files had copy-pasted `extractJsonBlock` (3 copies), `new LlmJson(...)` (7 copies), and identical workflow completion event validators (10 copies). This duplication made changes error-prone — fixing a bug in one copy meant hunting down all others.
- **Changes**:
  1. Centralized `extractJsonBlock` and `llmJson` exports in `_taskWorkflow/helpers.ts`. Deleted local copies from `sessionAudits.ts` and `taskWorkflowActions.ts`.
  2. Added `workflowCompleteValidator` to `validators.ts`. All 10 workflow files now import it instead of defining identical inline validators.
  3. Extracted `resolveMessageUrls` helper in `messages.ts` to deduplicate `listByParent` and `listByParentInternal` handlers.
  4. Removed `as const` assertions from `sessionAudits.ts` and `projectInterviewWorkflow.ts` (violates codebase rule against `as`).
- **Reason for change**: Reduce duplication without adding abstraction layers. Only literal copy-paste was extracted.

## Multi-select type filter on logs page - 2026-03-06

- **Why**: The logs page type filter only allowed selecting one entity type at a time (radio buttons). Users needed to view multiple types simultaneously, matching the multi-select pattern already used on the quick tasks page.
- **Changes**:
  1. Replaced `logEntityTypeParser` (single string) with `logEntityTypesParser` (typed array) in search-params.
  2. Switched `LogsClient.tsx` from `DropdownMenuRadioGroup` to `DropdownMenuCheckboxItem` for multi-select.
  3. Updated backend `logs.listByRepo` to accept `entityTypes` (string array) instead of `entityType` (single string).
- **Reason for change**: Consistency with quick tasks filter UX; multi-select is more practical for log analysis.

## Change date filter from tabs to dropdown - 2026-03-06

- **Why**: Tabs took up more horizontal space and didn't match the adjacent entity type filter's dropdown pattern. A dropdown is more consistent and compact.
- **Changes**: Replaced `Tabs`/`TabsList`/`TabsTrigger` with `DropdownMenu`/`DropdownMenuRadioGroup` in `TimeRangeFilter`. Labels now show full text ("Last 7 days" etc.) instead of abbreviations. Affects both Logs and Stats pages.

## Improve task detail modal activity UX - 2026-03-06

- **Why**: Stop button was buried in the footer far from the activity it controls. User change request messages cluttered the request changes panel when they belong contextually next to the run they triggered.
- **Changes**:
  1. Moved the stop button from the modal footer to the right end of the Activity section header for proximity to what it controls.
  2. Added `IconEdit` indicator on agent runs triggered by user change requests (all runs after the first) to visually distinguish edits from initial runs.
  3. Added `IconMessageCircle` button in accordion triggers that opens a modal showing the user message that triggered that run.
  4. Removed user comment history from the request changes panel — messages are now accessible via the icon on each run.

## Mobile responsiveness audit for Quick Tasks page - 2026-03-06

- **Why**: Quick Tasks page components were not optimized for mobile viewports, leading to cramped layouts, poor touch targets, and usability issues on small screens.
- **Changes**:
  1. KanbanBoard: Added snap scrolling on mobile for smooth horizontal column navigation, increased min column width from 240px to 280px for better readability.
  2. QuickTasksClient: Added safe-area-inset-bottom padding to floating selection bar, improved padding and backdrop blur for mobile touch comfort.
  3. QuickTaskModal: Reduced textarea from 12 rows to 6 with responsive min-height, made dialog footer stack vertically on mobile.
  4. QuickTaskCard: Increased vertical padding on mobile for better touch targets.
  5. QuickTasksListView: Added bottom padding for scroll comfort and improved sticky header spacing.
  6. GroupTasksModal: Added responsive max-width to prevent overflow on very small screens.

## Mobile responsiveness audit for settings, stats, and inbox pages - 2026-03-06

- **Why**: Several pages had layouts that broke or overflowed on mobile viewports - horizontal flex rows with no wrapping, tables without scroll containers, and text/buttons that squeezed together.
- **Changes**:
  1. **LogsClient**: Converted 4 stat cards from `flex` to `grid grid-cols-2 lg:grid-cols-4`. Made log entry rows stack vertically on mobile with `flex-wrap`.
  2. **SnapshotsClient**: Made status grid responsive (`grid-cols-1 sm:grid-cols-2`), added horizontal scroll to builds table, made cron guide stack vertically on mobile, made config header and save row wrap properly.
  3. **EnvVarsTable**: Added horizontal scroll wrapper to table, made header description + buttons stack on mobile.
  4. **ThemeSettingsClient**: Tightened appearance mode grid spacing on small screens, made preview text smaller on mobile.
  5. **TimeRangeFilter**: Shortened tab labels and reduced padding for mobile fit.
  6. **InboxClient**: Collapsed "Mark all read" to icon-only on mobile, tightened notification item padding and gap.

## Watchdog consolidation + shared streaming cleanup - 2026-03-06

- **Why**: `workflowWatchdog.ts` had 8 handlers with identical cancel-workflow + clear-streaming preambles (6 of 8 repeated the same 5-line inline streaming cleanup). Separately, 15+ workflow files inlined the same 4-line `query("streamingActivity").withIndex(...).first(); if (streaming) delete` pattern instead of using the existing `clearStreamingActivity` helper.
- **Changes**:
  1. Extracted `cancelStaleWorkflow(ctx, workflowId, streamingEntityIds)` helper in `workflowWatchdog.ts` that cancels the workflow + clears streaming for a list of entity IDs. All 6 handlers that had both operations now call this single function.
  2. Replaced 15 inline streaming cleanup patterns across 10 workflow files (`sessionWorkflow`, `designWorkflow`, `designSessions`, `docInterviewWorkflow`, `docPrdWorkflow`, `evaluationWorkflow`, `projectInterviewWorkflow`, `researchQueryWorkflow`, `summarizeWorkflow`, `testGenWorkflow`) with `clearStreamingActivity()` imported from `_taskWorkflow/helpers.ts`.
- **Reason for change (architectural)**: Single source of truth for streaming cleanup logic. Bug fixes to the cleanup pattern now propagate everywhere.

## Simplify backend/convex: dedup error classification, consolidate sandbox reuse, fix N+1 queries - 2026-03-06

- **Why**: Codebase had grown organically with duplicated error classification logic (inline in execution.ts vs function in recovery.ts), near-identical sandbox startup try-reuse blocks in sessions.ts, and sequential db.get/query loops (N+1) in analytics and agentTasks queries that hurt both readability and performance.
- **Changes**:
  1. Moved `isDaytonaNetworkIssue()` from `_taskWorkflow/recovery.ts` to `_daytona/helpers.ts` (canonical location). Replaced 30-line inline error marker logic in `execution.ts` with a single function call. Re-exported from recovery.ts to preserve existing imports.
  2. Extracted `tryReuseSandbox()` helper in `_daytona/sessions.ts` to consolidate the duplicated "get existing sandbox → prepare → return or fall through" pattern shared by `startSessionSandbox` and `startDesignSandbox`.
  3. Converted sequential `for` loops with `ctx.db.get()` / `ctx.db.query()` to `Promise.all` in `analytics.ts` (5 N+1 patterns across getImpactStats, getActiveUsers, getActivityTimeline, getLeaderboard) and `_agentTasks/queries.ts` (getDependentTasks, getStatusesByIds).
- **Reason for change (architectural)**: Error classification is Daytona-specific and should live in the Daytona module. Sandbox reuse is a shared lifecycle pattern. N+1 queries cause unnecessary sequential round-trips in Convex queries.

## Consolidate duplicated Daytona operational logic - 2026-03-06

- **Why**: The "sign JWT token + launch script on sandbox" pattern was duplicated across 4 call sites (`execution.ts` 2x, `audit.ts` 2x). A bug fix or enhancement to this flow required changes in 4 places. Additionally, `getDaytona()` and `WORKSPACE_DIR` were redefined in `pty.ts` and `snapshotActions.ts` instead of importing from the canonical `_daytona/helpers.ts`.
- **Changes**:
  1. Added `signAndLaunchScript()` helper in `_daytona/helpers.ts` that composes token signing + script launch into a single call.
  2. Updated `_daytona/execution.ts` (`setupAndExecute`, `launchOnExistingSandbox`) and `_daytona/audit.ts` (`launchAudit`, `runSessionAudit`) to use the new helper.
  3. Removed local `getDaytona()` and `WORKSPACE_DIR` from `pty.ts` and `snapshotActions.ts`, importing from `_daytona/helpers.ts` instead.
- **Reason for change (architectural)**: Service layer consolidation — reusable operational mechanics should live in one place so bug fixes propagate to all callers.

## Harden quick-task watchdog resilience during callback finalization - 2026-03-06

- **Why**: Runs could emit `watchdog` heartbeat kills near the end of execution when callback finalization (media upload/completion mutation) outlived the previous heartbeat window, especially while Convex dev was reloading.
- **Changes**:
  1. `_daytona/callbackScript.ts` now keeps heartbeat/flush loops alive through finalization, adds an explicit `Finalizing response...` phase, and stops loops only after completion callback handling finishes.
  2. `_taskWorkflow/recovery.ts` increases heartbeat stale threshold from 90s to 180s and startup stale threshold from 10m to 15m to better tolerate transient backend reload/control-plane jitter.
  3. `_taskWorkflow/watchdog.ts` now formats heartbeat-kill error text from the configured threshold value so diagnostics stay accurate.
  4. `_daytona/execution.ts` increases transient Daytona setup retry budget (5 attempts) with longer exponential backoff to reduce surfaced 408 setup failures.
  5. `_taskWorkflow/watchdog.ts` now recognizes a streamed `"Finalizing response..."` phase and applies a longer stale threshold so completion/upload tail work is not killed prematurely.
  6. `_taskWorkflow/recovery.ts` adds a dedicated finalization stale threshold used by the watchdog for clearer phase-aware behavior without adding new run-state fields.
- **Reason for change (architectural)**: Finalization is a distinct lifecycle phase from active tool streaming; watchdogs should be strict enough to catch true hangs but tolerant of bounded callback/network jitter during shutdown paths.

## Add Geist font to theme settings - 2026-03-06

- **Why**: Users wanted Geist (Vercel's font) as an option in the theme font picker alongside the existing Google Fonts.
- **Changes**:
  1. Installed `geist` npm package for Next.js-compatible local font loading.
  2. Added `GeistSans` import and CSS variable (`--font-geist-sans`) to `apps/web/app/layout.tsx`.
  3. Extended `FontFamily` type and `FONT_FAMILIES` map in `ThemeContext.tsx` with the `"geist"` entry.
  4. Added `v.literal("geist")` to `fontFamilyValidator` in `packages/backend/convex/validators.ts`.

## Add font spacing (letter-spacing) to theme settings - 2026-03-06

- **Why**: Users had control over font family, accent color, border radius, and appearance mode but could not customize letter spacing, which significantly affects readability and visual feel.
- **Changes**:
  1. Added `letterSpacingValidator` and included it in `customThemeValidator` in Convex validators.
  2. Added `LetterSpacing` type and `LETTER_SPACING_VALUES` config to `ThemeContext.tsx`, applying the value to the `--tracking-normal` CSS variable.
  3. Added a "Font Spacing" section to the theme settings UI with five options: Tighter, Tight, Normal, Wide, Wider.

## Correlate quick-task callbacks and streaming by run id - 2026-03-05

- **Why**: Quick-task callbacks and streaming were keyed by `taskId`, so a stale sandbox from an older run could write activity or completion data into a newer retry. That made watchdog diagnosis noisy and created a path for cross-run interference.
- **Changes**:
  1. Task execution and task audit callback paths now pass `runId` through the sandbox environment and back into the completion mutations.
  2. Quick-task streaming is now written and read from run-scoped entity ids (`task-run-*` and `task-audit-run-*`) instead of a task-wide key.
  3. Task completion, audit completion, cancellation, stale-run cleanup, and task detail UI now all resolve activity against the active run id, while still clearing the legacy task-wide keys for compatibility cleanup.
- **Reason for change (architectural)**: A task can have multiple historical runs but only one active run. Runtime orchestration needs run-scoped correlation so retries and stale sandboxes cannot race through the same logical channel.

## Finalize evaluation workflow failures immediately - 2026-03-05

- **Why**: Evaluation reports could stay in `running` until the 2-hour watchdog when workflow startup failed before the sandbox callback path ever fired.
- **Changes**:
  1. `convex/evaluationWorkflow.ts` now catches early workflow failures, writes the report into its error state immediately through a guarded failure mutation, and then rethrows so the workflow component still records a failed run.
  2. `startEvaluation` now only attaches `activeWorkflowId` when the report has not already been finalized as an error.
- **Reason for change (architectural)**: Callback-driven workflows still need a direct failure path for pre-callback setup errors, otherwise app state lags far behind workflow state.

## Attach quick-task sandboxes earlier without startup watchdog regressions - 2026-03-05

- **Why**: Quick tasks still only persisted sandboxId after full sandbox preparation and callback launch readiness, so pre-launch stalls could surface as "sandbox was never attached" even when Daytona had already created the sandbox. Simply attaching earlier would have moved those runs onto the 90s heartbeat watchdog too soon, causing a different false positive during legitimate setup work.
- **Changes**:
  1. \_daytona/git.ts now exposes a sandbox-acquired callback during ephemeral sandbox creation, and \_daytona/execution.ts uses it to persist the run sandboxId as soon as Daytona returns the sandbox.
  2. \_taskWorkflow/workflowDefinition.ts now passes the run id into setupAndExecute so quick-task startup can attach the sandbox before repo prep and launch readiness finish.
  3. \_taskWorkflow/watchdog.ts now keeps runs on the longer startup watchdog window while streaming still shows Starting sandbox..., then switches to the 90s heartbeat watchdog only after callback activity replaces that startup state.
- **Reason for change (architectural)**: Sandbox acquisition and Claude heartbeat are different lifecycle phases. The watchdog needs phase-aware thresholds so earlier sandbox visibility does not create a new class of startup false positives.

## Improve quick-task startup visibility and Daytona timeout resilience - 2026-03-05

- **Why**: Quick tasks could sit in `running` with no visible activity during sandbox setup contention, and Daytona control-plane timeouts (`status code 408`) were not classified consistently in retry policy decisions.
- **Changes**:
  1. `convex/_taskWorkflow/runLifecycle.ts` now seeds `streamingActivity` as soon as a run transitions to `running` (`Starting sandbox...`) so the UI never shows an empty running state.
  2. `convex/_taskWorkflow/audit.ts` now seeds audit streaming state (`Starting audit...`) at audit creation time for the same reason.
  3. `convex/_daytona/execution.ts` now retries transient Daytona setup failures (including timeout/status-code patterns) with bounded exponential backoff before failing setup.
  4. `convex/_taskWorkflow/recovery.ts` now classifies Daytona HTTP timeout/server-status patterns (including 408) as Daytona-network issues.
- **Reason for change (architectural)**: Startup observability and transient-control-plane resilience should be first-class in orchestration, so operators see immediate progress while setup retries happen deterministically and bounded.

## Harden quick-task callback startup and JWT issuer consistency - 2026-03-05

- **Why**: Quick-task runs could appear as `running` with no Claude activity when the sandbox callback process started but could not authenticate back to Convex, or when JWT issuer config drifted between token signing and auth provider validation.
- **Changes**:
  1. Added callback readiness handshake in `_daytona/callbackScript.ts`: the script now writes `/tmp/run-design.ready` only after an authenticated `streaming:set` preflight succeeds.
  2. Strengthened `_daytona/launch.ts` startup verification: launch now waits for the readiness file, fails fast with tailed logs if readiness is never reached, and kills the orphaned process.
  3. Added `sandboxAuthConfig.ts` and centralized sandbox JWT issuer/JWKS constants; wired `auth.config.ts`, `sandboxJwt.ts`, and `http.ts` to the shared values so signing and validation cannot silently diverge.
- **Reason for change (architectural)**: Runtime orchestration should only mark a callback as started after callback-to-Convex authentication is proven, and auth-critical issuer configuration must come from one source of truth.
- **Follow-up fix**: corrected launcher env scoping so callback env vars (`CONVEX_URL`, `CONVEX_TOKEN`, etc.) are applied to `nohup node /tmp/run-design.mjs` (not only to the pre-cleanup command). This prevents `Failed to parse URL from undefined/api/mutation` startup failures.

## Break down agentTasks.ts into smaller modules - 2026-03-05

- **Why**: `agentTasks.ts` was 780 lines mixing queries, CRUD mutations, execution logic, draft management, and shared helpers in a single file. Finding and modifying specific functions required scrolling through unrelated concerns.
- **Changes**:
  1. Created `convex/agentTasks/helpers.ts` — `normalizeTaskTags`, `buildTaskNotificationMessage`, `agentTaskValidator`.
  2. Created `convex/agentTasks/queries.ts` — `listByProject`, `get`, `getActiveTasks`, `getAllTasks`, `getDependentTasks`, `getStatusesByIds`.
  3. Created `convex/agentTasks/mutations.ts` — `update`, `updateStatus`, `remove`, `createQuickTask`, `createQuickTasksBatch`, `assignToProject`, `deleteCascade`.
  4. Created `convex/agentTasks/execution.ts` — `startExecution`, `scheduleExecution`, `cancelScheduledExecution`, `updateScheduledExecution`.
  5. Created `convex/agentTasks/drafts.ts` — `listDrafts`, `saveDraft`, `activateDraft`.
  6. `agentTasks.ts` is now a barrel file that re-exports everything, preserving the `api.agentTasks.*` namespace for all frontend consumers.
- **Reason for change (architectural)**: Follows the same pattern established by `taskWorkflow/` — sub-modules own the logic, the top-level file owns the API surface. Convex re-exports are resolved at bundle time so all `api.agentTasks.*` paths remain intact.

## Break down taskWorkflow.ts into smaller modules - 2026-03-05

- **Why**: `taskWorkflow.ts` was 1550 lines with Convex function registrations, prompt builders, stale-run recovery logic, and shared DB helpers all in one file. This made navigation and maintenance difficult.
- **Changes**:
  1. Created `convex/taskWorkflow/prompts.ts` — `buildImplementationPrompt`, `buildAuditPrompt`, `buildWorkflowRunNotificationMessage`, `WORKSPACE_DIR`.
  2. Created `convex/taskWorkflow/recovery.ts` — `cleanUpStaleRun`, `isDaytonaNetworkIssue`, `buildQuickTaskRetryDelayMs`, stale-run timing constants.
  3. Created `convex/taskWorkflow/helpers.ts` — `clearStreamingActivity`, `upsertActivityLog`, `finalizeRunStatus`, `buildRunResultSummary`, `extractJsonBlock`.
  4. `taskWorkflow.ts` now imports from these modules. All Convex function registrations remain in place so API paths are unchanged.
- **Reason for change (architectural)**: Convex function definitions must stay in the original file (API path = filename), but pure helper logic can live in sub-modules. This keeps the orchestration layer slim while co-locating related helpers.

## Fix quick-task no-sandbox watchdog false positives - 2026-03-05

- **Why**: Quick tasks could be killed with `Run killed by watchdog: sandbox was never attached` while sandbox setup was still legitimately in progress, causing empty logs and unnecessary auto-retries.
- **Changes**:
  1. `taskWorkflow.updateRunToRunning` now resets `agentRuns.startedAt` when the run actually enters `running` instead of relying on the earlier queued timestamp.
  2. Increased `STALE_NO_SANDBOX_THRESHOLD_MS` from 3 minutes to 10 minutes to tolerate slower sandbox provisioning windows.
- **Reason for change (architectural)**: Watchdog deadlines should be measured from active execution start, not queue creation time, and pre-launch detection must be conservative enough to avoid killing valid in-flight provisioning.

## Simplify agentTasks, projects, taskWorkflow with shared helpers - 2026-03-05

- **Why**: Three backend files accumulated duplicated task-deletion logic, missing authorization checks on project mutations (security gap), and inconsistent cleanup in stale-run handling.
- **Changes**:
  1. Added 4 shared helpers to `functions.ts`: `getProjectWithAccess` (auth + fetch), `hasActiveRun` (index-based active run check), `isFirstTaskOnBranch` (handles both project and quick-task cases via `by_task_and_status` index), `deleteTaskRelatedData` (cancels scheduled function, deletes runs/deps/dependents/subtasks/task).
  2. `agentTasks.ts`: removed redundant dependency check in `updateStatus` (already covered by `workStatuses` block), replaced inline queries in `startExecution` with `hasActiveRun`/`isFirstTaskOnBranch`, replaced manual deletion in `remove`/`deleteCascade` with `deleteTaskRelatedData` (fixes missing subtask + scheduled cancellation).
  3. `projects.ts`: added authorization checks to 9 mutations that only checked existence (`update`, `addMessage`, `remove`, `clearMessages`, `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage`), replaced manual deletion in `deleteCascade` with `deleteTaskRelatedData` (fixes missing scheduled cancellation).
  4. `taskWorkflow.ts`: extracted `cleanUpStaleRun` local helper (workflow cancel → sandbox kill/delete → run patch → task patch → retry schedule → streaming cleanup), refactored `checkStaleRuns` and `handleStaleRun` to use it, replaced inline queries in `executeScheduledTask` with `hasActiveRun`/`isFirstTaskOnBranch`.
- **Benefit**: Fixes auth gaps on project mutations, ensures consistent cleanup (subtasks, scheduled functions) across all deletion paths, and reduces ~200 lines of duplicated code.

## Make quick-task execution atomic + pre-launch watchdog recovery - 2026-03-05

- **Why**: Quick tasks could get stuck as active with no real worker when the old two-step launch only partially succeeded, or when a run was marked `running` before sandbox attachment and never advanced.
- **Changes**:
  1. `agentTasks.startExecution` now starts `taskExecutionWorkflow` in the same mutation and sets `activeWorkflowId` server-side; if workflow start fails, it marks the run error and restores task state to `todo`.
  2. `taskWorkflow.checkStaleRuns` now treats `running` runs with missing `activeWorkflowId` as watchdog failures instead of returning early.
  3. `taskWorkflow.checkStaleRuns` now fails runs that never attach a `sandboxId` within a bounded window, cancels workflow state, resets task status, and schedules quick-task retry.
  4. Quick-task and task-detail frontend launch flows now call only `agentTasks.startExecution` (removed the second `triggerExecution` call).
  5. `taskWorkflow.triggerExecution` is now an idempotent fallback that no-ops when the run is no longer queued or the task already has an active workflow.
  6. `migrations.cleanupStaleRuns` now includes `in_progress` tasks even when `activeWorkflowId` is missing, so existing orphaned tasks can be repaired in one backfill run.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Benefit**: Removes the main orphan-state path and tightens watchdog recovery for pre-launch hangs, so "running with no Claude process" self-heals instead of lingering.

## Split agentRuns activity log into dedicated table - 2026-03-05

- **Why**: `agentRuns.listByTask` still read the full `activityLog` field from each run document at DB level, so high-frequency list queries were paying for the heaviest payload even when UI loaded run logs lazily.
- **Changes**:
  1. Removed `activityLog` from `agentRuns` schema.
  2. Added `agentRunActivityLogs` table keyed by `runId`.
  3. Updated `agentRuns.complete` to upsert into `agentRunActivityLogs` when activity log is provided.
  4. Updated `agentRuns.getActivityLog` to read from `agentRunActivityLogs`.
  5. Simplified `agentRuns` list/get responses to return run docs directly (no activityLog stripping required).
- **Benefit**: `agentRuns.listByTask` no longer pulls activity log payloads from DB, reducing read bandwidth for task cards and task detail subscriptions.

## Project build branch now uses project/<projectId> - 2026-03-05

- **Why**: Project builds need all task commits and PR activity to stay on one deterministic branch tied to the project, not a mutable title slug.
- **Changes**:
  1. projects.startDevelopment now sets project branch to project/<projectId>.
  2. projects.createFromTasks now creates the project first, then sets branch to project/<projectId>.
- **Benefit**: Branch naming is stable, predictable, and consistent with the single-branch-per-project workflow.

## Real-time notification toasts + deep-link details - 2026-03-05

- **Why**: Users had to manually check notifications and couldn�t always tell what happened or jump directly to the right task/project context.
- **Changes**:
  1. Added `NotificationToastStream` to the main layout so new notifications surface immediately with an in-app toast.
  2. Updated notification popover item clicks to navigate directly to notification `href`, and added message previews so each item is actionable without opening a modal.
  3. Enriched backend notification messages for task assignment/completion, run completion, PR webhook events, and task comments.
  4. Quick-task notifications now always append `Quick task ID: <id>` automatically, and webhook notifications now pass `taskId`/`projectId` for exact deep links.
- **Benefit**: Notification UX is now real-time, clearer, and faster to act on, with direct navigation to exact destinations.

## Remove redundant `order` field + fix branch naming — 2026-03-05

- **Why**: `order` (0-based) and `taskNumber` (1-based) were redundant — both tracked task position. Quick task branches used `Date.now()` fallback producing unreadable names like `eva/task-1741209600000`.
- **Changes**:
  1. Branch naming changed from `eva/task-${taskNumber || Date.now()}` to `eva/task-${taskId}` — deterministic, unique, and tied to the actual task.
  2. Removed `order` field from `agentTasks` schema, all insert calls, and the validator.
  3. `getAllTasks` sort changed from `order` to `createdAt` (frontend was already re-sorting by `updatedAt` anyway).
  4. Ran migration to strip `order` from 100 existing documents.

## Harden quick-task retry orchestration + Daytona failure cleanup - 2026-03-05

- **Why**: Quick-task reliability still had three gaps after the first pass: retry scheduling only happened on workflow exceptions (not all error exits), sandbox creation failures could leak capacity before `sandboxId` was persisted, and callback HTTP calls could hang long enough to create false "stuck" runs.
- **Changes**:
  1. `taskWorkflow.ts` — replaced narrow retry path with centralized `maybeScheduleQuickTaskRetry` mutation (single retry chain, jittered backoff, latest-run guard, active-run guard), and wired it into all quick-task failure exits: normal callback failure, workflow catch, watchdog stale kill, and 2-hour timeout.
  2. `taskWorkflow.ts` — retry skip policy now lives in one place and explicitly skips auto-retry when error text matches Daytona network/connectivity issues.
  3. `daytona.ts` — `setupAndExecute` now deletes newly created sandboxes when setup/launch fails before successful handoff, preventing pre-run capacity leaks.
  4. `daytona/git.ts` — `createSandboxAndPrepareRepo` now deletes failed sandboxes on both first-attempt and retry-attempt prep failures.
  5. `daytona/callbackScript.ts` — added request timeouts and retry backoff for callback HTTP paths (Convex mutation/action calls and media upload URL flow), plus reduced default `CLAUDE_MAX_TOTAL_RUNTIME_MS` from 90m to 50m.
  6. `daytona/devServer.ts` — package manager detection now respects `rootDir` for session/design service startup in subdirectory repos.
- **Benefit**: Fewer leaked sandboxes, fewer long-hanging callback failures, and more consistent self-healing of quick-task failures without retrying Daytona network outages.

## Refactor daytona.ts into focused modules - 2026-03-05

- **Why**: At ~1800 lines, `daytona.ts` mixed sandbox lifecycle, git operations, callback script generation, desktop management, and dev server detection in a single file, making it difficult to navigate, understand, and maintain.
- **Changes**:
  1. Extracted helper functions into `convex/daytona/` folder with 7 focused modules: `helpers.ts` (core utilities), `volumes.ts` (session volume management), `git.ts` (repo clone/sync/branch), `callbackScript.ts` (sandbox callback template), `launch.ts` (script upload/fire), `desktop.ts` (xrandr/Chrome), `devServer.ts` (package manager/port detection).
  2. Eliminated 3 `as` type assertions in `detectDevPort` by introducing an `isRecord` type guard.
  3. Replaced deeply nested ternary in callback script's error field with a `buildErrorMessage` helper function.
  4. Consolidated duplicated lock file detection (`cloneAndSetupRepo` now reuses `detectPackageManager`).
  5. Extracted duplicated xrandr resolution setup into `setDisplayResolution`.
  6. Extracted repeated resolve-api-key/get-sandbox pattern into `getSandbox` helper.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
  8. Extracted duplicated media upload logic into `uploadMediaFile` within the callback script.
  9. Replaced `hasToolActivity` long `||` chain with a `Set` lookup.
- **Reason**: Main `daytona.ts` is now ~700 lines (actions only), each helper module is under 260 lines, and no circular dependencies exist. All external API references (`internal.daytona.*`, `api.daytona.*`) are unchanged.
- **Benefit**: Each concern is isolated and independently readable. TypeScript compiles with zero errors.

## Improve quick-task run robustness and batch start behavior - 2026-03-05

- **Why**: Some quick-task runs stayed on "Generating response..." until the 2-hour watchdog because failures before callback completion were not finalized immediately. Batch run actions also stopped on the first failing task, so only part of a selected set started.
- **Changes**:
  1. `taskWorkflow.ts` — wrapped `taskExecutionWorkflow` in fail-fast recovery: exceptions now finalize and complete the run immediately, always clear `activeWorkflowId`, and attempt ephemeral sandbox cleanup.
  2. `taskWorkflow.ts` — timeout/watchdog paths now also clean quick-task sandboxes (`checkStaleRuns` and `handleStaleRun`) to avoid leaked capacity.
  3. `daytona.ts` — callback script now enforces a max total runtime (`CLAUDE_MAX_TOTAL_RUNTIME_MS`, default 90 minutes) in addition to no-output timeout.
  4. `daytona.ts` — `launchScript` now verifies the callback process stays alive after launch (`/tmp/run-design.pid` + `kill -0`) and fails early with log tail if it exits immediately.
  5. `RunTasksModal.tsx`, `QuickTasksKanbanBoard.tsx`, `QuickTasksListView.tsx` — per-task error handling now continues launching remaining tasks instead of aborting the entire batch.
- **Benefit**: Failures surface quickly instead of aging into generic 2-hour timeouts, leaked quick-task sandboxes are cleaned up, and batch execution starts as many tasks as possible.

## Fix cost logging: correct field name + always log - 2026-03-05

- **Why**: Cost logs were always $0.00 because we read `cost_usd` from the stream-json result event, but the actual field is `total_cost_usd`. Also, the `> 0` guard silently skipped entries when cost was 0 or missing, making it impossible to diagnose.
- **Changes**:
  1. `daytona.ts` — `parsed.cost_usd` → `parsed.total_cost_usd` in `extractResultEvent()`.
  2. All 14 completion handlers — removed `costUsd > 0` guard so every invocation is logged (zero-cost entries still useful as audit trail).
  3. `schema.ts` / `validators.ts` — `entityType` changed from hardcoded validator to `v.string()` for resilience when adding/renaming workflows.
  4. Frontend — filter dropdown derives options from actual data instead of hardcoded list.
- **Benefit**: Actual dollar costs now flow through. New workflows auto-appear in the logs page without code changes.

## Optimize agentRuns.listByTask and projects.list database bandwidth - 2026-03-05

- **Why**: Both are live queries that transferred full documents on every mutation. `listByTask` sent the heavy `activityLog` string (full agent execution trace) for every run. `projects.list` sent `conversationHistory` (unbounded message array) and `generatedSpec` (large JSON) per project, plus ran N+1 queries to compute project phase from tasks on every read.
- **Changes**:
  1. `agentRuns.ts` — strip `activityLog` from `listByTask`, `listAll`, `get`, `getWithDetails` return types. New `getActivityLog` query for on-demand loading per run.
  2. `projects.ts` — strip `conversationHistory` and `generatedSpec` from `list` return. Removed on-read phase computation from `list` and `get`.
  3. `functions.ts` — new `recomputeProjectPhase` helper that persists phase transitions on write. Wired into `agentTasks.updateStatus`, `agentRuns.complete`, `agentRuns.updateStatus`, `agentTasks.activateDraft`.
  4. Frontend — new `RunActivityLog` component lazy-loads activity log per run via `getActivityLog` when accordion is expanded.
- **Benefit**: Eliminates N+1 queries from projects.list, removes heavy field transfer from list queries, phase is now computed on write instead of every read.

## CDP mode: agent-browser connects to VNC Chrome in sessions - 2026-03-04

- **Why**: agent-browser used its own headless Chromium, invisible to users. The VNC Desktop tab showed a separate Chrome. No way to watch agent-browser actions live.
- **Changes**:
  1. `daytona.ts` — new `startDesktopWithChrome` helper that starts VNC + Chrome with `--remote-debugging-port=9222`. Added `startDesktop` flag to `setupAndExecute`. Updated `launchChromeInDesktop` with CDP flag and `pgrep` idempotency guard.
  2. `sessionWorkflow.ts` — passes `startDesktop: true` so desktop auto-starts for sessions. Updated prompt with CDP detection: agent checks port 9222, uses `--cdp 9222` if available, falls back to headless otherwise.
- **Benefit**: Users can watch agent-browser actions in real-time through the Desktop tab during sessions. When CDP is unavailable, agent falls back to headless browser seamlessly.

## Cost logging for all Claude invocations - 2026-03-04

- **Why**: No visibility into how much each Claude run costs. Needed per-invocation cost tracking across all entity types (tasks, sessions, design sessions, research, docs, audits, etc.) and a UI to view/filter them.
- **Changes**:
  1. `daytona.ts` — extract `cost_usd` from stream-json `result` event, pass `costUsd` and `model` through completionArgs to all completion mutations.
  2. New `costLogs` table in schema with indexes for repo-scoped queries.
  3. New `costLogs.ts` backend with `log` internalMutation and `listByRepo` authQuery.
  4. All 14 completion handlers across 10 workflow files now insert into `costLogs` when `costUsd > 0`.
  5. New settings/logs page with TimeRangeFilter, entity type dropdown, total cost card, and collapsible groups by entity type.
- **Benefit**: Full cost visibility per repo — see what each task/session/audit costs, filter by date and type, view totals.

## Fix `scheduledFunctionId` type: `v.string()` → `v.id("_scheduled_functions")` - 2026-03-04

- **Why**: The field stored Convex scheduled function IDs but was typed as `v.string()`, forcing 6 `as Id<"_scheduled_functions">` casts and 2 unnecessary `String()` wraps across the codebase — violating the no-`as` rule.
- **Changes**: Used chicken-egg migration pattern (intermediate union type → clear stale data → final type). Removed all 6 `as` casts in `agentTasks.ts` and `githubWebhook.ts`, removed 2 `String(functionId)` wraps in write sites.
- **Benefit**: Convex schema is now the single source of truth for the type. No more manual type assertions.

## Task card UI redesign + unified Activity timeline - 2026-03-04

- **Why**: Task cards showed deployment dots, branch links, and dropdowns that cluttered the kanban board. Task activity (runs + webhook events) lived in separate sections. Needed cleaner card design and unified activity view.
- **Changes**:
  1. `QuickTaskCard.tsx` — removed deployment status dot, branch icon, and dropdown menu. Added footer showing task creator avatar + relative creation time (e.g. "3 days ago").
  2. `useTaskDetail.tsx` — merged Agent Runs and system comments into single **Activity** section sorted by date (newest first). System comments render as blue info cards.
  3. `taskComments.ts` — made `authorId` optional to support system-generated comments (no user context).
  4. `githubWebhook.ts` — creates system comment when PR is merged/closed via `createSystemComment` internalMutation.
  5. `QuickTasksKanbanBoard.tsx` + `QuickTasksListView.tsx` — pass `createdBy` and `createdAt` to card component.
- **Benefit**: Cleaner kanban board with less visual noise. Unified Activity timeline shows all events in chronological order. System events (PR lifecycle changes) visible without leaving the task detail.

## GitHub webhook: PR lifecycle → task status - 2026-03-04

- **Why**: When Eva opens a PR for a task, the task stays in `business_review`/`code_review` even after the PR is merged or closed on GitHub. Users had to manually move tasks to done/cancelled.
- **Changes**:
  1. `validators.ts` — new `webhookEventStatusValidator` (pending, completed, skipped)
  2. `schema.ts` — new `githubWebhookEvents` table for audit trail + `by_pr_url` index on `agentRuns` + `authorId` optional on `taskComments`
  3. `http.ts` — `POST /api/github/webhook` endpoint with HMAC-SHA256 verification via Web Crypto API
  4. `githubWebhook.ts` — **NEW** — `handlePrClosed` internalMutation: matches PR URL → agentRun → task, updates status to `done` (merged) or `cancelled` (closed), sends notifications, creates system comment, auto-completes project phase if all tasks done
  5. `taskComments.ts` — added `createSystemComment` internalMutation for webhook-triggered comments (no user context)
  6. `QuickTaskCard.tsx` — badge showing "PR Merged" (green) or "PR Closed" (red) when task status is done/cancelled with PR
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Prerequisite**: Set `GITHUB_WEBHOOK_SECRET` env var in Convex. Configure webhook URL in GitHub App settings, subscribe to `pull_request` events.

## Vercel deployment status tracking - 2026-03-04

- **Why**: After Eva pushes code, Vercel builds a preview deployment but there's no visibility into the build status or preview URL. Users had to check Vercel manually.
- **Changes**:
  1. `validators.ts` — new `deploymentStatusValidator` (queued, building, deployed, error)
  2. `schema.ts` — added `deploymentStatus` + `deploymentUrl` fields to `agentRuns` table
  3. `agentRuns.ts` — updated return validator + added `updateDeploymentStatus` internal mutation
  4. `taskWorkflowActions.ts` — new `pollDeploymentStatus` self-scheduling action that polls GitHub Deployments API (60s intervals, max 20 attempts / ~20 min)
  5. `taskWorkflow.ts` — new `scheduleDeploymentTracking` mutation called after successful sandbox completion, sets initial "queued" status and schedules first poll
  6. `QuickTaskCard.tsx` — inline colored deployment status dot on card + "View Preview" dropdown item
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
- **Approach**: Uses GitHub Deployments API (not Vercel API directly). Vercel auto-creates GitHub Deployment records when building. Reuses existing GitHub App tokens — no new env vars. Provider-agnostic.
- **Prerequisite**: GitHub App needs `deployments:read` permission.

## Open-source Eva with MIT license - 2026-03-04

- **Why**: Make Eva publicly available under an open-source license while maintaining ownership of the codebase. MIT allows anyone to use, modify, and distribute freely without restrictions.
- **Changes**:
  1. `LICENSE` — MIT license with copyright holder (Vedant Bhopatrao)
  2. `CONTRIBUTING.md` — contributor guide with setup instructions, code style rules (no `any`/`unknown`/`as`), and PR guidelines
  3. `SECURITY.md` — responsible disclosure policy for vulnerability reports
- **Note**: Anyone can fork/modify privately or commercially, but must keep the MIT license. Contributes back to the original repo to avoid fragmentation.

## Fix agent-login redirect behind reverse proxy - 2026-03-04

- **Why**: When navigating to `/?agent` in the sandbox preview iframe (behind Daytona's reverse proxy), the auth redirect was pointing to `localhost:3000` instead of the external proxy domain, causing `net::ERR_CONNECTION_REFUSED`.
- **Changes**: `apps/web/app/api/auth/agent-login/route.ts` — use `X-Forwarded-Host` and `X-Forwarded-Proto` headers from reverse proxy to construct redirect URL instead of `request.nextUrl.origin` (which resolves to internal `localhost:3000`). This matches how Next.js middleware already handles forwarded headers automatically.

## VNC resolution + quality upgrade to 1920x1080 - 2026-03-04

- **Why**: VNC desktop rendered at 1024x768 (4:3) — looks wrong on modern 16:9 displays. noVNC quality=4 made text blurry. Agent-browser screenshots in quick tasks lacked proper viewport sizing.
- **Changes**:
  1. `rebuild-snapshot.yml` — added `x11-utils` to apt-get install (provides `xrandr` binary)
  2. `daytona.ts` `toggleDesktopServer` — after `computerUse.start()`, runs `xrandr --fb 1920x1080` with fallback to `--newmode`/`--addmode`/`--output`. Non-fatal if xrandr unavailable.
  3. `daytona.ts` `launchChromeInDesktop` — added `--start-maximized --window-size=1920,1080` to Chrome flags
  4. `DesktopPanel.tsx` — bumped noVNC quality from 4 to 6
  5. `taskWorkflow.ts` — added `agent-browser set viewport 1920 1080` step in proof-of-completion
  6. `sessionWorkflow.ts` — added viewport instruction to browser interaction rules
- **Note**: Snapshot rebuild required before xrandr takes effect. Desktop gracefully falls back to 1024x768 until then.

## Split TaskDetailModal into 3 files + inline 2-column layout - 2026-03-04

- **Why**: `TaskDetailModal.tsx` was ~1400 lines handling both modal and inline views. The inline (list view) panel also stacked everything vertically which wasted horizontal space.
- **Changes**:
  1. `useTaskDetail.tsx` — custom hook with all queries, mutations, state, handlers, and JSX section blocks
  2. `TaskDetailModal.tsx` — slim modal wrapper (~80 lines)
  3. `TaskDetailInline.tsx` — inline 2-column layout with 60:40 split (left: description/subtasks/runs, right: status fields + action buttons)
  4. Delete confirmation dialog extracted into hook return to avoid duplication
  5. Removed unused `formatDuration` function and `inline` prop from `TaskDetailModal`
- **Files**: `useTaskDetail.tsx`, `TaskDetailModal.tsx`, `TaskDetailInline.tsx`, `QuickTasksClient.tsx`

## Fix resultSummary for quick task re-runs - 2026-03-04

- **Why**: When requesting changes on a quick task, the run completed with "Pushed commit to project branch" even though quick tasks have no project branch.
- **Change**: `resultSummary` now shows "Pushed commit to project branch" only for project tasks; quick tasks show "Pushed commit to branch".
- **Files**: `taskWorkflow.ts` — `finalizeRunStreamingPhase` and `completeRun` now take project context into account.

## Replace taskDrafts table with draft status on agentTasks - 2026-03-04

- **Why**: Drafts are just tasks that haven't been submitted yet. A separate table duplicated the task schema and required separate CRUD functions. Using a status field keeps drafts as first-class agentTasks and eliminates the extra table.
- **Changes**:
  - Added `"draft"` to `taskStatusValidator`
  - Added `saveDraft`, `listDrafts`, `activateDraft` functions to `agentTasks.ts`
  - `getAllTasks` now excludes draft-status tasks so they don't appear on kanban/list views
  - `startExecution` guards against accidentally running a draft
  - `QuickTaskModal` rewired to use `agentTasks` draft functions instead of `taskDrafts` API
  - `taskDrafts.ts` deleted; `taskDrafts` table kept temporarily in schema for migration
  - Added `clearTaskDraftsTable` migration to `migrations.ts`

## Tighten all system/user prompts for concision - 2026-03-04

- **Why**: Prompts run on every sandbox invocation — redundant/verbose instructions waste tokens and dilute model attention. Repeated rules (e.g. "never push to main" appearing 3 times in one prompt) actually hurt compliance because the model wastes context parsing whether they're subtly different.
- **Changes across 7 files**:
  - `doc.ts`: Extracted shared `PRD_OUTPUT` template for `PARSE_PROMPT`/`GENERATE_PROMPT` (were near-identical). Merged overlapping "Your Role"/"Rules" sections in `INTERVIEW_PROMPT`.
  - `project.ts`: Removed duplicate "ground in real code" instructions, merged "Do NOT" rules into role section.
  - `sessionWorkflow.ts`: Collapsed 3 branch rules into 1 in `buildExecutePrompt`, tightened `buildAskPrompt` and `buildPlanPrompt`.
  - `design.ts` + `designWorkflow.ts`: Replaced full token listing with "use semantic tokens from globals.css", collapsed 6 setup steps into 2, removed overlap between system and user prompts.
  - `taskWorkflow.ts`: Condensed proof-of-completion section, merged overlapping "Do NOT" rules.
  - `evaluationWorkflow.ts`: Removed duplicate requirements listing between Phase 1 and Phase 2.
  - `researchQueryWorkflow.ts`: Removed duplicate "return ONLY raw query code", condensed analysis guidelines.

## Extract static prompts to prompts folder - 2026-03-04

- **Why**: Prompts were scattered across workflow files; harder to audit, tune, or share common patterns.
- **Change**: Added `packages/backend/convex/prompts/` folder with domain-split files: `shared.ts` (buildRootDirectoryInstruction, getResponseLengthInstruction), `doc.ts` (PARSE_PROMPT, INTERVIEW_PROMPT, GENERATE_PROMPT), `project.ts` (PROJECT_INTERVIEW_SYSTEM_PROMPT, TASK_PHILOSOPHY, SPEC_SYSTEM_PROMPT), `design.ts` (DESIGN_SYSTEM_PROMPT), `index.ts` (barrel export). Workflow-specific builders remain in their workflow files.
- **Reason for change (architectural)**: Partial extraction keeps dynamic builders co-located with workflow logic. Folder structure makes prompts easier to parse and navigate per domain.

## Task execution freeze protection: guardrails + heartbeat watchdog - 2026-03-04

- **Why**: Quick tasks froze at "Running command..." when Claude CLI ran blocking commands (e.g. `sleep 30`, hanging `gh api` calls). The 3-minute no-output timeout was too slow, and there was no server-side protection if the callback script itself died.
- **Phase 1 — Command guardrails + reduced timeout**:
  - `taskWorkflow.ts`: Added prompt rules requiring `timeout` prefix on all Bash commands, `GH_PROMPT_DISABLED=1` for `gh` commands, forbidding `sleep` and silent `2>/dev/null`
  - `daytona.ts`: Reduced `NO_OUTPUT_TIMEOUT_MS` default from 180s to 60s
  - `taskWorkflow.ts`: Made `handleCompletion` idempotent — ignores late/duplicate callbacks when run already finished
  - `schema.ts` + completion mutations: Added `exitReason` field to `agentRuns` for observability (`completed`, `error`, `run_timeout`, `watchdog_killed`)
- **Phase 2 — Heartbeat + stale run watchdog**:
  - `daytona.ts`: Added 10s heartbeat ping in callback script that force-sends `streaming:set` even during long-running Bash commands
  - `streaming.ts` + `schema.ts`: Added `lastUpdatedAt` timestamp to `streamingActivity` docs
  - `taskWorkflow.ts`: Added `checkStaleRuns` self-rescheduling mutation (every 30s) that kills runs with no heartbeat for 90s — cancels workflow, kills sandbox process, marks run as error
  - `schema.ts`: Added `sandboxId` and `repoId` on `agentRuns` so watchdog can call `killSandboxProcess`
- **Reason for change (architectural)**: Fire-and-forget sandbox execution needs layered timeout protection: prompt-level (prevent bad commands), process-level (60s no-output kill), server-level (90s heartbeat watchdog), and global safety net (2h run timeout).

## Prevent sandbox runs from hanging on blocked CLI commands - 2026-03-04

- **Why**: Some quick tasks appeared frozen at "Running command..." when a Bash step blocked on non-interactive CLI behavior or produced no stream output for a long time.
- **Fix** (`daytona.ts` callback script): Force GitHub CLI non-interactive defaults (`GH_PROMPT_DISABLED=1`, `GH_NO_UPDATE_NOTIFIER=1`) and normalize token env (`GH_TOKEN` from `GH_TOKEN`/`GITHUB_TOKEN`) before spawning Claude.
- **Fix** (`daytona.ts` callback script): Added a no-stdout watchdog for Claude attempts (`CLAUDE_NO_OUTPUT_TIMEOUT_MS`, default 180000ms). If no stdout arrives past the threshold, the child process is terminated and completion returns an explicit timeout error instead of hanging indefinitely.
- **Reason for change (architectural)**: Fire-and-forget sandbox jobs still need bounded execution semantics at the process level to avoid indefinite workflow stalls when tool subprocesses block.

## Fix "Not authenticated" on manual reload - 2026-03-04

- **Why**: On full page reload (e.g. staging URL), auth-dependent Convex queries ran before Clerk rehydrated the session from cookies, causing "Not authenticated" errors.
- **Fix**: Centralize auth gating in ClientProvider using Convex `AuthLoading` + `Authenticated`. Show spinner while auth is loading; only render ThemeProvider and children when authenticated. ThemeContext, PresenceHeartbeat, and RepoContext no longer need per-component skip logic.

## Cleanup legacy migrations - 2026-03-04

- Removed one-time migrations from `migrations.ts`: `assignOrphanRepos`, `createPersonalTeamsAndMigrate`, `removeTeamSlugs`, `migrateBoardsAndCommentsToUserIds`, `renameMcpServerToMcp`. Kept `cleanupStaleRuns` (operational — fixes stuck task runs when run manually).

## Remove boards/columns tables — status-based tasks - 2026-03-04

- **Why**: Boards and columns added indirection between repos and tasks. Tasks now use `status` directly; board/column was redundant.
- **Schema**: Removed `boards` and `columns` tables. Removed `boardId`/`columnId` and indexes `by_board`, `by_column`, `by_board_and_status` from `agentTasks`.
- **Migration** (`migrations.removeBoardsAndColumns`): Already run. Patches all agentTasks to clear `boardId`/`columnId`, deletes all columns, deletes all boards.
- **Backend**: `agentTasks` uses `by_repo` index; `hasTaskAccess` replaces `hasBoardAccess` everywhere. `projects.startDevelopment` creates tasks with `repoId`, `status`, `order` only. `taskWorkflow.executeScheduledTask` uses `task.createdBy` instead of `board.ownerId`. `analytics` queries tasks by `by_repo`. Removed `getAccessibleBoards` and `hasBoardAccess` from `functions.ts`. `repoUtils.hasRepoReferences` no longer checks boards.
- **Reason for change (architectural)**: Tasks belong to repos (and optionally projects). Status-driven workflow replaces column-based layout.

## Remove unused Convex functions - 2026-03-04

- **auth.createOrMigrateUser**: Deleted. Web app uses `ensureUserExists` (ClientProvider) for user creation on sign-in.
- **githubRepos.remove**: Deleted. No delete/disconnect flow in the app; team unassignment uses `removeFromTeam` instead.
- **auth.isCurrentUserAdmin**: Deleted. No admin UI in the app.
- **boards.ts**: Deleted entirely. Board/column data created by `agentTasks.createQuickTask`, `agentTasks.createQuickTasksBatch`, `projects.createFromTasks`. Access via `functions.getAccessibleBoards` and `agentTasks.getAllTasks`.
- **columns.ts**: Deleted entirely. Columns created inline with boards by agentTasks and projects.
- **routines.ts**: Deleted entirely. Routines feature not implemented.
- **analytics**: Removed `getTaskStats`, `getRunStats`, `getSessionStats`, `getProjectStats`. App uses `getImpactStats`, `getActiveUsers`, `getActivityTimeline`, `getLeaderboard`.
- **extensionReleases.getLatest**: Removed. HTTP routes use `getLatestInternal`.
- **taskDependencies**: Removed `getForTask`, `getDependents`, `getDependencies`, `add`, `remove`, `removeByTasks`. App uses `isBlocked` only.
- **projectInterviewWorkflow.startSpec**: Removed. App uses `startInterview` for the main flow.

## Query optimization — eliminate full table scans - 2026-03-03

- **Why**: `boards.list`, `agentRuns.listAll`, and `agentTasks.getActiveTasks` scanned ENTIRE tables (`boards`, `agentTasks`, `agentRuns`, `githubRepos`) then post-filtered in JS. This doesn't scale as data grows.
- **New indexes** (`schema.ts`): `agentTasks.by_board_and_status` and `agentRuns.by_task_and_status` enable targeted queries instead of full collects.
- **Shared helper** (`functions.ts`): `getAccessibleBoards(db, userId)` replaces the repeated pattern of "collect all boards → check access per board". Queries `boards.by_owner` + `teamMembers.by_user` → `githubRepos.by_team` → `boards.by_repo` — all indexed.
- **`boards.list`**: Replaced `ctx.db.query("githubRepos").collect()` (full repo scan) with the shared helper.
- **`agentRuns.listAll`**: Replaced 3 full table scans (boards, agentTasks, agentRuns) with shared helper → indexed fan-out through boards → tasks → runs.
- **`agentTasks.getActiveTasks`**: Replaced `ctx.db.query("boards").collect()` with shared helper.
- **`agentTasks.startExecution`**: Replaced loading ALL runs per project task (twice) with `by_task_and_status` index queries that short-circuit on first match.
- **`sessions.getOrCreateExtensionSession`**: Replaced Convex `.filter()` (post-index scan) with `by_repo_and_status` index + JS `.find()`.

## Fix handleStaleDoc branching + add sessionAudits watchdog - 2026-03-03

- **handleStaleDoc bug** (`workflowWatchdog.ts`): The if/else-if chain checked `interviewHistory` before `testGenStatus`, so docs with interview history AND `testGenStatus === "running"` would skip the test-gen error cleanup. Fixed by checking both conditions independently and applying a single patch.
- **sessionAudits watchdog** (`sessionAudits.ts`, `workflowWatchdog.ts`): `sessionAudits` uses a fire-and-forget callback pattern (not `awaitEvent`), so it was missed in the initial watchdog sweep. Added `handleStaleSessionAudit` handler and scheduled it from `startAudit` with `RUN_TIMEOUT_MS`. If the audit is still `"running"` after 2 hours, it's marked as `"error"`.

## Add watchdog timeouts to all workflows - 2026-03-03

- **Why**: Only `taskExecutionWorkflow` had a watchdog. All other workflows (session, design, research query, evaluation, doc interview, doc PRD, test gen, project interview, build) could hang forever if the sandbox callback failed after retries exhausted.
- **New file** (`workflowWatchdog.ts`): Centralized timeout constant (`RUN_TIMEOUT_MS = 2h`) and 7 entity-type handlers: `handleStaleSession`, `handleStaleDesignSession`, `handleStaleResearchQuery`, `handleStaleEvaluation`, `handleStaleDoc`, `handleStaleProject`, `handleStaleBuild`. Each cancels the workflow, clears streaming, clears `activeWorkflowId`, and does entity-specific cleanup (error messages, status updates).
- **Start mutations modified**: All 13 `start*` mutations now schedule the appropriate watchdog via `ctx.scheduler.runAfter(RUN_TIMEOUT_MS, ...)`. Each watchdog guards against stale timers by comparing `workflowId`.
- **Build integration** (`taskWorkflow.ts`): `handleStaleRun` now sends `buildTaskDoneEvent` when the timed-out task is part of an active build, so the build workflow unsticks too.
- **Shared constant**: `RUN_TIMEOUT_MS` moved from `taskWorkflow.ts` to `workflowWatchdog.ts`. Both `taskWorkflow.ts` and `migrations.ts` import from the shared location.

## Increase quick-task watchdog timeout to 2 hours - 2026-03-03

- **Why**: Some valid quick-task runs can exceed 45 minutes; the previous watchdog acted as a hard cap and timed out long-running executions.
- **Change** (`taskWorkflow.ts`): Updated `RUN_TIMEOUT_MS` from 45 minutes to 2 hours and aligned the stale-run error text to "Run timed out after 2 hours".
- **Reason for change (architectural)**: Keep watchdog protection for genuinely stuck runs while allowing realistic long-running agent tasks to complete.

## Fix quick task hanging at "Generating response" - 2026-03-03

- **Why**: When `convex dev` reloads mid-execution, the sandbox's HTTP POST to Convex fails. The script exits without retrying, so the workflow's `awaitEvent` hangs forever — the UI shows "Generating response..." indefinitely.
- **Fix 1 — Retry** (`daytona.ts`): Added `callMutationWithRetry` with exponential backoff (1s→16s, 5 retries) to the sandbox callback script. Applied at both completion call sites (success + error). Non-critical calls (streaming, screenshots) left as-is.
- **Fix 2 — Watchdog** (`taskWorkflow.ts`): Added `handleStaleRun` internalMutation + 45-minute timeout scheduled from `updateRunToRunning`. If the run is still active after 45 min, cancels the workflow, marks run as error, resets task to `todo`. If main run succeeded but audit hung, moves task to `business_review`. Guards against killing newer runs via run ID check.
- **Fix 3 — Backfill** (`migrations.ts`): Added `cleanupStaleRuns` one-time migration to fix already-stuck tasks. Only touches runs older than 45 min cutoff. Cancels workflows, marks stale runs/audits as error, clears streaming.

## GitHub repo/app rename resilience - 2026-03-03

- **Why**: When a GitHub repo is renamed (conductor → eva) or a monorepo app directory is renamed (apps/mcp-server → apps/mcp), `upsert` matched by `(owner, name, rootDirectory)` and created duplicate rows. Old rows lingered as stale cards on the home page with broken API calls.
- **Schema**: Added `githubId` (GitHub's numeric repo ID) to `githubRepos` with `by_github_id` index. Added `by_repo` indexes to `agentTasks` and `notifications` for efficient reference checking.
- **Upsert/Create**: Now match by `githubId` + `rootDirectory` first, falling back to `owner/name`. When a match is found with different `owner`/`name`, the row is patched (rename detected) instead of creating a duplicate. Existing rows without `githubId` get it backfilled.
- **Sync**: Removed `connectedParents` cascade from `syncConnectedStatus` — sub-app rows are only `connected: true` if explicitly in `connectedIds`. Added `cleanupStaleSubApps` to delete stale sub-app rows that are disconnected, sync-created (no `connectedBy`), not in detected paths, and have no data references.
- **Migration**: Added `renameMcpServerToMcp` to rename existing `apps/mcp-server` rows to `apps/mcp`, re-pointing references if a target row already exists.
- **Shared utility**: Created `repoUtils.ts` with `hasRepoReferences` (checks all 14 tables with `repoId`) and `normalizePath` (strips leading/trailing slashes, converts empty to `undefined`).
- **Reason for change (architectural)**: GitHub's numeric repo ID is immutable across renames and is the correct primary key for matching. The previous `(owner, name)` matching was fragile to renames, a known GitHub operation.

## Split task run streaming from audit streaming - 2026-03-03

- **Why**: Quick task execution UI could appear stuck at "Generating response..." because the run stayed `running` until audit finished. Users could not clearly see the main run had ended and audit had begun.
- **Workflow change** (`taskWorkflow.ts`):
  1. Added `finalizeRunStreamingPhase` internal mutation.
  2. `taskExecutionWorkflow` now calls it immediately after the main Claude callback (and PR creation), before launching audit.
  3. This mutation marks the run complete (`success`/`error`), persists `activityLog`, and clears the task streaming entity so run streaming closes promptly.
- **Completion safety** (`taskWorkflow.ts`):
  1. `completeRun` now only patches run status/details when the run is still `queued`/`running`.
  2. This prevents the final task-completion step from overwriting an already-finalized run while still handling task status updates, notifications, subtasks, and project updates.
- **Reason for change (architectural)**: Split lifecycle phases explicitly:
  1. Phase A: agent run execution + stream finalization.
  2. Phase B: post-execution audit streaming in its own section.
     This keeps realtime UX accurate without coupling task completion state to audit runtime.

## Remove deploy key from sandbox callback script - 2026-03-03

- **Why**: With self-signed 24h JWTs working, the deploy key auth path in the sandbox callback script is redundant. The JWT path (`callMutation`) handles everything: streaming, task proof, completion. The deploy key was originally needed because Clerk JWTs expired mid-execution.
- **Removed from callback script**: `DEPLOY_KEY`/`COMPLETION_HTTP_PATH` env vars, `callHttpEndpoint()` function, all deploy key branching logic.
- **Removed from `launchScript`**: `deployKey` option and env var injection.
- **Removed HTTP endpoints**: `/api/sandbox/task-completion` and `/api/sandbox/task-proof` from `http.ts` — only called by the callback script.
- **Removed internal mutations**: `taskWorkflow:handleScheduledCompletion`, `taskProof:saveInternal`, `taskProof:saveMessageInternal` — only called by those HTTP endpoints.
- **Note**: `EVA_DEPLOY_KEY` env var and `verifyDeployKey` in `http.ts` remain — still used by MCP routes.

## Fix self-signed JWT validation via customJwt provider - 2026-03-03

- **Why**: The `{ domain, applicationID }` auth config format uses OIDC discovery, which requires Convex to fetch `/.well-known/openid-configuration` from its own HTTP endpoint — a self-referential request that fails silently. Sandboxes could not authenticate JWT-based calls (`streaming:set`, etc.), causing zero streaming activity in the frontend.
- **Fix**: Switched to `{ type: "customJwt", issuer, jwks, algorithm }` format with the JWKS embedded as a base64 data URI. This provides the public key directly in the config — no HTTP fetching needed.
- **Key learning**: Convex `{ domain }` auth providers use OIDC discovery. Convex `{ type: "customJwt" }` providers accept `issuer` + `jwks` (URL or data URI) + `algorithm` directly. Use `customJwt` when you control the JWT signing and don't need full OIDC. The `jwks` field supports `data:application/json;base64,...` to avoid external HTTP calls entirely.
- **Also added**: `/.well-known/openid-configuration` HTTP endpoint (still useful for debugging, not required for auth).

## Self-signed sandbox JWTs (Phase 2) - 2026-03-02

- **Why**: Frontend-generated Clerk JWTs (1h expiry) were threaded through workflows to sandbox env vars. Long sandbox tasks could fail when the JWT expired. Scheduled tasks had no JWT at all (`convexToken: ""`).
- **Solution**: Backend now generates its own 24h JWTs signed with an EC P-256 key pair. Convex validates them via a `customJwt` auth provider with the public key embedded as a data URI.
- **New file**: `sandboxJwt.ts` — `signSandboxToken` internalAction that mints a JWT with the user's `clerkId` as `sub`, our `CONVEX_SITE_URL` as issuer, and `"convex"` as audience.
- **auth.config.ts**: Added `customJwt` provider with base64-encoded JWKS data URI so Convex validates both Clerk JWTs (frontend) and our self-signed JWTs (sandbox).
- **http.ts**: Added `GET /.well-known/jwks.json` and `GET /.well-known/openid-configuration` routes (JWKS endpoint still useful, OIDC endpoint for debugging).
- **daytona.ts**: All 4 sandbox-launching actions (`setupAndExecute`, `launchOnExistingSandbox`, `launchAudit`, `runSessionAudit`) now take `userId` instead of `convexToken`, and generate the JWT internally.
- **All workflow files**: Changed `convexToken: v.string()` → `userId: v.id("users")` in workflow args. Public mutations no longer accept `convexToken` — they pass `ctx.userId` from the auth context.
- **Frontend**: Deleted `useConvexToken.ts` hook. Removed `convexToken` from all 14 web mutation calls and 2 chrome extension mutation calls.
- **Env vars required**: `SANDBOX_JWT_PRIVATE_KEY`, `SANDBOX_JWT_JWKS` (set on Convex dashboard before deploying).

## Lock down public Convex functions (Phase 1) - 2026-03-02

- **Why**: Many backend functions were plain `query`/`mutation`/`action` with no auth — anyone with the Convex URL could call them. This converts all public functions to `authQuery`/`authMutation`/`authAction` so the auth gate rejects unauthenticated requests.
- **Converted to auth wrappers**:
  - `streaming.ts`: `get` → authQuery, `set`/`clear` → authMutation
  - `screenshots.ts`: `generateUploadUrl` → authMutation, `attachMedia` → authAction
  - `githubRepos.ts`: `list`/`get`/`getByOwnerAndName`/`listByTeam` → authQuery, `assignToTeam`/`removeFromTeam` → authMutation. Removed manual `getCurrentUserId` calls in favor of `ctx.userId`.
  - `users.ts`: `get` → authQuery
  - `taskAudits.ts`: `getByTask` → authQuery
  - `taskWorkflow.ts`: `handleAuditCompletion` → authMutation
  - `presence.ts`: `list` → authQuery, `disconnect` → authMutation
  - `sessions.ts`: `getOrCreateExtensionSession` → authMutation, removed `clerkId` arg (uses `ctx.userId`)
- **Dead code deleted**: `taskAudits.create`/`complete`/`fail`, `notifications.create`, `researchQueries.getSchemaInfo`
- **Intentionally kept public**: `extensionReleases` (extension auto-update + admin key), `auth` (bootstrapping)

## Fix session/sandbox UX issues + rootDirectory in all prompts - 2026-03-02

- **Summary streaming fix**: Summary and message execution shared the same streaming entity ID, causing the summary section to show message streaming data. Split into separate entity IDs (`summary:${sessionId}` vs `sessionId`) with independent queries.
- **Activity steps capped at 100**: Callback script was slicing accumulated steps to last 100 before streaming. Removed the cap.
- **VNC tab showing directory listing**: `appendNoVncParams` now injects `/vnc_lite.html` into the URL path.
- **rootDirectory in all prompts**: Added `rootDirectory` instruction to session (ask/plan/execute), task, design, and evaluation prompts so monorepo sessions work in the correct app.

## Always use deploy key for sandbox callbacks - 2026-03-02

- **Why**: Clerk JWTs expire in ~60s but sandbox tasks run for minutes. Three auth-required calls (`taskProof:save`, `taskProof:saveMessage`, `taskWorkflow:handleCompletion`) fail after JWT expiry. Previously only scheduled tasks used deploy key; now ALL sandboxes do.
- **Changes**:
  1. **`taskProof.ts`**: Added `saveInternal` and `saveMessageInternal` internalMutations — same logic as auth versions but without user ownership check (no user context in deploy key path).
  2. **`http.ts`**: New `POST /api/sandbox/task-proof` route — dispatches to `saveInternal` or `saveMessageInternal` based on request body shape. Verified via `verifyDeployKey`.
  3. **`taskWorkflow.ts`**: Fixed `handleScheduledCompletion` — changed `taskId` arg from `v.string()` to `v.id("agentTasks")` to remove `as Id<"agentTasks">` cast.
  4. **`daytona.ts`**: Always passes deploy key (removed `convexToken === ""` condition). Replaced `callHttpCompletion` with generic `callHttpEndpoint(path, args)`. Proof save/message calls now route through `/api/sandbox/task-proof` when deploy key available, fall back to `callMutation` when not.

## Task scheduling - 2026-03-02

- **Why**: Users need to schedule tasks to run at a future date/time instead of only running immediately via "Run Eva". Scheduled tasks require auth-free sandbox callbacks since the Clerk token expires before the task fires.
- **Changes**:
  1. **Schema**: Added `scheduledAt` and `scheduledFunctionId` fields to `agentTasks`.
  2. **`agentTasks.ts`**: Added `scheduleExecution`, `cancelScheduledExecution`, `updateScheduledExecution` mutations. Updated `startExecution`, `updateStatus`, `deleteCascade` to cancel schedules when appropriate.
  3. **`taskWorkflow.ts`**: Added `executeScheduledTask` (internalMutation, triggered by scheduler) and `handleScheduledCompletion` (internalMutation, called by HTTP endpoint).
  4. **`http.ts`**: New `POST /api/sandbox/task-completion` route — verifies deploy key and forwards to `handleScheduledCompletion`, bypassing Clerk auth.
  5. **`daytona.ts`**: Callback script conditionally omits auth header and uses HTTP completion endpoint when deploy key is present. `setupAndExecute` auto-detects deploy key mode when `convexToken` is empty.
  6. **Frontend**: New `SchedulePopover` component with calendar + time picker. Integrated into `TaskDetailModal` footer. Clock indicators on `QuickTaskCard` and `ProjectTaskCard`.

## Remove custom setup commands and env vars from snapshots - 2026-03-02

- **Why**: This platform only manages one repo's snapshots. Custom commands and env vars were designed for a multi-repo generic system. For a single repo, these belong directly in the workflow file, not managed dynamically from the platform. Runtime env vars are already handled by `resolveSandboxContext`.
- **Changes**:
  1. **Schema**: `customSetupCommands` and `customEnvVars` made optional (migration clears them).
  2. **`repoSnapshots.ts`**: Removed from `saveRepoSnapshot` args, `getRepoSnapshot` return, `getRepoSnapshotInternal` return. Migration clears fields from existing docs.
  3. **`snapshotActions.ts`**: Removed `custom_commands`/`custom_env_vars` from workflow dispatch inputs.
  4. **`rebuild-snapshot.yml`**: Removed dynamic Dockerfile injection, merged into single heredoc.
  5. **`SnapshotsClient.tsx`**: Removed custom commands textarea, env vars UI, and related state.
  6. **Added AI prompt** at `internal/prompts/update-rebuild-snapshot-workflow.md` for updating the workflow in the target repo.

## Replace fixed snapshot schedule with cron input - 2026-03-02

- **Why**: Fixed schedule presets (daily/every 3 days/weekly) were inflexible. Users should be able to specify any cron expression for snapshot rebuilds.
- **Changes**:
  1. **`validators.ts`**: `snapshotScheduleValidator` changed from union of literals to `v.string()` — accepts cron expressions or `"manual"`.
  2. **`repoSnapshots.ts`**: Replaced interval-based cron registration with `{ kind: "cron", cronspec }`. Added `resolveCronspec()` helper that handles both new cron strings and legacy preset values. Added `migrateScheduleToCron` for existing data.
  3. **`SnapshotsClient.tsx`**: Replaced Select dropdown with cron input field + preset buttons (Daily 6am, Every 3 days, Weekly Mon, Manual). Uses `cronstrue` to show human-readable translation below the input.

## Warm snapshot cache after rebuild - 2026-03-02

- **Why**: Sandbox creation from a snapshot has a cold start (~30s). After a daily snapshot rebuild at 6am, the first sandbox creation at 9am hits this cold start. By warming Daytona's cache immediately after rebuild, subsequent creations are fast.
- **Changes**:
  1. **`repoSnapshots.ts`**: `completeBuild` now schedules `warmSnapshotCache` when a build succeeds.
  2. **`daytona.ts`**: Added `warmSnapshotCache` internalAction — creates a sandbox from the snapshot then immediately deletes it. Best-effort, logs errors but never fails.

## Migrate Next.js API routes to Convex - 2026-03-02

- **Why**: Extension update and terminal PTY routes were unnecessary Next.js middlemen — they just authenticated and forwarded to Convex. Moving them to Convex eliminates the hop, reduces latency, and removes the dependency on Next.js server for these flows.
- **Changes**:
  1. **Extension updates → Convex HTTP routes**: Added `GET /api/updates/extension/updates.xml` and `GET /api/updates/extension/conductor.crx` to `http.ts`. Added `getLatestInternal` query to `extensionReleases.ts`. Deleted `apps/web/app/api/updates/extension/route.ts`.
  2. **Terminal PTY → Convex actions**: Created `packages/backend/convex/pty.ts` with `connectPty`, `resizePty`, `disconnectPty` actions. Added `updatePtySessionInternal` mutation to `sessions.ts`. Updated `TerminalPanel.tsx` to use `useAction` instead of `fetch`. Deleted `apps/web/app/api/sessions/terminal/route.ts`.
  3. **Cleanup**: Deleted `apps/web/lib/sandbox.ts` and `apps/web/lib/convex-auth.ts` (no other consumers). Updated Intune README, PowerShell script, and release script URL references.
  4. **Agent login**: Kept in Next.js — dev-only, Clerk-coupled, no benefit from moving.

## Proof of completion for quick tasks - 2026-03-02

- **Why**: Quick tasks execute via the same sandbox callback as sessions, but media proof never gets saved. The callback calls `screenshots:attachMedia` which only accepts session-type IDs — for tasks it fails silently. The `taskProof` table and `TaskDetailModal` display already exist but nothing populates them.
- **Changes**:
  1. **`daytona.ts`**: Callback script branches media attachment by entity type. Tasks call `taskProof:save` with fileName; sessions keep existing `screenshots:attachMedia`. When no media found for tasks, saves a "No UI changes" message via `taskProof:saveMessage`.
  2. **`taskWorkflow.ts`**: Added REQUIRED proof capture instructions to implementation prompt — agent must use agent-browser skill to screenshot/record after committing. Updated `git add` to exclude media files.
  3. **`schema.ts` + `taskProof.ts`**: Made `storageId`/`fileName` optional, added `message` field for text-only proofs. Removed `fileType` — now inferred from `_storage` metadata via `ctx.db.system.get`. Added `saveMessage` mutation.
  4. **`sessionWorkflow.ts`**: Added rule for sessions to use agent-browser when user asks for visual proof/screenshots.
  5. **`MediaPreview.tsx`**: Extracted `ScreenshotPreview` and `VideoPreview` from ChatPanel into shared component. Both TaskDetailModal and ChatPanel now import from the same source.
  6. **`TaskDetailModal.tsx`**: Proof section now single-column layout with proper preview components (click-to-expand screenshots, video with speed controls), supports text-only message proofs.

## Add GitHub labels to agent-created PRs - 2026-03-02

- **Why**: No way to distinguish agent-created PRs from human PRs, or to tell which part of the platform (project, quick-task, session) created them.
- **Changes**:
  1. **`taskWorkflowActions.ts`**: Added `labels` arg to `createPullRequest`, calls `octokit.rest.issues.addLabels()` after PR creation.
  2. **`taskWorkflow.ts`**: Passes `["eva", "project"]` or `["eva", "quick-task"]` based on whether task has a `projectId`.
  3. **`github.ts`**: Added `["eva", "session"]` labels to `createSessionPr` after PR creation.
- Labels auto-create in the repo if they don't exist yet.

## Team access control for all resources - 2026-03-02

- **Why**: When a user was added to a team, they could only see repos but not any of the repo's resources (boards, tasks, runs, sessions, projects, docs, etc). Board access was gated by `board.ownerId === userId`, and many resources had no repo access verification at all — any authenticated user could theoretically query them.
- **Changes**:
  1. **`functions.ts`**: Added `hasRepoAccess(db, repoId, userId)` — checks `connectedBy` OR team membership. Added `hasBoardAccess(db, board, userId)` — checks `ownerId` OR repo access.
  2. **Board-gated files** (`boards.ts`, `agentTasks.ts`, `columns.ts`, `subtasks.ts`, `agentRuns.ts`, `taskComments.ts`): Replaced all `board.ownerId !== ctx.userId` checks with `hasBoardAccess`. `boards.list` now returns owned + team repo boards. `boards.listByRepo` and `agentTasks.getAllTasks` now return ALL boards for accessible repos.
  3. **Owner-only mutations** (`sessions.archive`, `projects.deleteCascade`, `designSessions.archive`, `designPersonas.update/remove`, `researchQueries.remove`, `savedQueries.update/remove`, `routines.update/remove`): Replaced `resource.userId !== ctx.userId` with `hasRepoAccess` check.
  4. **Repo access verification** added to all `list`/`get` queries and `create` mutations across `sessions`, `projects`, `docs`, `designSessions`, `designPersonas`, `researchQueries`, `savedQueries`, `routines`, `evaluationReports`, and `analytics`.

## RepoSelect: hierarchical monorepo display + fixed spacing - 2026-03-02

- **Why**: RepoSelect had flat monorepo app listings with radio button padding wasting space. Multiple apps under the same repo were harder to visually group.
- **Changes**:
  1. **Removed radio buttons**: Switched from `DropdownMenuRadioItem` (has `pl-9` padding) to `DropdownMenuItem` for cleaner left alignment.
  2. **Hierarchical grouping**: Now groups by owner → repo → apps. Standalone repos show directly; monorepos show with the repo name as a sub-label and each app as a selectable item.
  3. **Selected value display**: Shows `name/appName` for monorepo entries (e.g. `carepulse-ts/eprocurement`), just `name` for standalone.

## Route restructure: `[repo]` → `[owner]/[repo]` - 2026-03-02

- **Why**: URLs like `/evalucom-carepulse-ts~apps~eprocurement` were ugly and unreadable. Clean URLs like `/evalucom/carepulse-ts/eprocurement` are more intuitive and shareable.
- **Solution**: Middleware rewrites 3-segment monorepo URLs (`/owner/repo/app/subpage`) to internal `--` encoding (`/owner/repo--app/subpage`), while `usePathname()` returns the clean original URL.
- **Changes**:
  1. **`middleware.ts`**: Added rewrite logic — if 3rd path segment is not a known sub-page (projects, sessions, etc.), rewrite URL with `--` separator.
  2. **`repoUrl.ts`**: Replaced `encodeRepoSlug`/`decodeRepoSlug`/`buildRepoPath` with `repoHref(owner, name, rootDirectory?)` and `decodeRepoParam(repoParam)`.
  3. **Route directory**: Moved `app/(main)/[repo]/` → `app/(main)/[owner]/[repo]/`. Layout now accepts `{ owner, repo }` params.
  4. **`RepoContext.tsx`**: Now takes `owner` + `repoParam` props, exposes `basePath`, `owner`, `name` instead of `repoSlug`/`fullName`.
  5. **`githubRepos.ts` (`getByOwnerAndName`)**: Changed `rootDirectory` arg to `appName` — matches by `rootDirectory.split("/").pop()`.
  6. **`Sidebar.tsx`**: Extracts `repoBasePath` from pathname instead of decoding a single slug segment. Passes `basePath` to all child sidebars.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.

## Monorepo Auto-Detection in Sync + Data Migration - 2026-03-02

- **Why**: Monorepo sub-apps required manual addition from the admin page. Existing root repo entries had sessions, tasks, etc. that needed migrating to their sub-app entries. Going forward, `syncRepos` should automatically detect and create monorepo sub-app entries.
- **Changes**:
  1. **Data migration**: Ran temporary mutations to move all data (14 tables) from root entries to sub-app entries for `evalucom/carepulse-ts` → `apps/eprocurement`, `vedantb2/vmem` → `apps/web`, and `vedantb2/conductor` → `apps/web`.
  2. **`github.ts` — `syncRepos`**: Now auto-detects monorepo apps for every repo on sync. Filters to `apps/` paths only, upserts sub-app entries with `rootDirectory`. Root entries are kept (not deleted) to avoid data loss.
  3. **`github.ts` — `detectAppsForRepo` helper**: Extracted from `detectMonorepoApps` action so both the action (manual use) and `syncRepos` (automatic) share the same logic.
  4. **`githubRepos.ts` — `syncConnectedStatus`**: Updated to mark sub-apps as connected when their ID is directly in `connectedIds` (not just via parent lookup).
  5. **`githubRepos.ts` — `deleteInternal`**: New internal mutation available for manual cleanup of root entries when safe.
- **Reason**: Eliminates manual monorepo setup. Sync now auto-creates sub-app entries under `apps/` while preserving root entries to prevent data orphaning.

## Monorepo App Picker — Settings Page + Home Page Quick Action - 2026-03-01

- **Why**: The monorepo detection backend (`detectMonorepoApps`) only worked from the setup page during initial GitHub App install, which auto-syncs and redirects before anyone can use it. Users needed a way to manage monorepo sub-apps after initial setup.
- **Changes**:
  1. **New admin page** (`/[repo]/admin/monorepo`): Server component + `MonorepoClient` — auto-detects workspace apps on mount via `detectMonorepoApps`, shows existing connected sub-apps, allows adding detected apps or custom root directories.
  2. **AdminSidebar**: Added "Monorepo" nav item with `IconFolders`.
  3. **ReposClient (home page)**: Added `...` dropdown menu on each repo card with "Manage apps" action that navigates to the monorepo admin page.
- **Reason**: Exposes monorepo management from two accessible locations — the repo settings page (full management) and the home page (quick access) — instead of only during the one-time setup flow.

## Monorepo Support — Root Directory per Repo Entry - 2026-03-01

- **Why**: Monorepos (e.g. `apps/web` + `apps/eprocurement`) had no way to specify which sub-app to start, inject per-app env vars, or run independent sessions. Each sub-app needs its own sandbox/dev server/environment.
- **Changes**:
  1. **Schema** (`schema.ts`): Added `rootDirectory` to `githubRepos`, `devPort` to `sessions` and `designSessions`.
  2. **githubRepos.ts**: Updated `create`, `getByOwnerAndName`, `upsert` to support `rootDirectory` — uniqueness is now `owner + name + rootDirectory`.
  3. **github.ts**: New `detectMonorepoApps` action — uses GitHub Contents API to detect workspace globs (npm/pnpm), list sub-apps, check for dev scripts.
  4. **daytona.ts**: Extracted `detectPackageManager` helper, added `detectDevPort` (parses dev script for port flags, falls back to framework defaults), implemented `startSessionServices` to start dev server in the correct root directory, returns detected port. Both `startSessionSandbox` and `startDesignSandbox` now fetch `rootDirectory` from repo and pass `devPort` to `sandboxReady`.
  5. **sessions.ts / designSessions.ts**: `sandboxReady` mutations accept and persist `devPort`.
  6. **repoUrl.ts**: Slug encoding now appends `~apps~web` for root directories (`/` → `~`). `decodeRepoSlug` returns `{ fullName, rootDirectory }`.
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.
  8. **RepoSelect.tsx**: Uses encoded slug as value, shows `rootDirectory` below repo name.
  9. **RepoSetupClient.tsx**: On "Add", calls `detectMonorepoApps` and shows expandable sub-app picker with checkboxes + custom path input.
  10. **ReposClient.tsx**: Card shows app name from root dir path, subtitle shows `owner/repo → apps/web`.
  11. **SandboxPanel.tsx / DesignDetailClient.tsx**: Uses `session.devPort` for preview port instead of hardcoded values.
- **Reason**: Enables connecting the same GitHub repo multiple times with different root directories, each with independent env vars, sessions, and sandbox configs — similar to Vercel's "Root Directory" project setting.

## Session Chat UX Fixes - 2026-03-01

- **Why**: Video recordings played at 1x (too slow to review), the stop button in the prompt input appeared teal instead of red, agent responses included unwanted meta-commentary (file paths, commit status), and streaming activity steps were capped at 30 making it look like steps were missing.
- **Changes**:
  1. **Video playback speed** (`ChatPanel.tsx`): `VideoPreview` now defaults to 3x playback via `useRef` + `onLoadedMetadata`. Speed selector buttons (1x/2x/3x/5x) below the video.
  2. **Stop button colour** (`ChatPanel.tsx`): `PromptInputSubmit` now passes `variant="destructive"` when executing, making the stop button red.
  3. **Cleaner agent response** (`sessionWorkflow.ts`): Execute prompt instruction updated to only describe actions/outcomes. Added rule to suppress recording/screenshot file paths, commit status, and process meta-commentary.
  4. **Streaming step cap** (`daytona.ts`): Increased `.slice(-30)` to `.slice(-100)` in both `flushStreaming` and retry path so streaming UI shows up to 100 steps instead of 30.

## Agent Screenshot & Video Upload to Convex Storage - 2026-03-01

- **Why**: The Claude CLI running inside the Daytona sandbox takes screenshots and records videos (via `agent-browser`) but had no way to persist or display them. Media needs to be stored in Convex file storage and rendered inline in the session chat so users can see agent activity. Additionally, media files were being accidentally committed to git because the prompt always forced commits. Intermediate screenshots during video recording should be discarded, not uploaded.
- **Changes**:
  1. **Schema** (`schema.ts`): Added optional `imageStorageId` and `videoStorageId` fields to messages table.
  2. **Messages** (`messages.ts`): Added `imageStorageId`, `imageUrl`, `videoStorageId`, `videoUrl` to validator. `listByParent`/`listByParentInternal` resolve storage IDs → URLs. `addInternal` accepts optional image/video IDs.
  3. **Screenshots action** (`screenshots.ts`): New public `upload` action for base64 images, `generateUploadUrl` mutation, and `saveVideoMessage` mutation for video metadata (supports large files via upload URL flow instead of base64).
  4. **Callback script** (`daytona.ts`): Post-execution directory scan of `screenshots/` and `recordings/` folders after Claude finishes. Uploads all videos, then skips uploading screenshots if any video exists (prevents intermediate frames from polluting chat). Auto-deletes media files after upload.
  5. **Execute prompt** (`sessionWorkflow.ts`): Changed `git add` to use pathspec exclusions (`:!*.png/:!*.webm/:!recordings/:!screenshots/`), and made commit conditional (`git diff --cached --quiet || git commit`) — prevents commits when no code changes exist and prevents media files from being tracked.
  6. **ChatPanel** (`ChatPanel.tsx`): New `ScreenshotPreview` and `VideoPreview` components with dialog lightbox — click to maximize, "Open in new tab" button, fullscreen display.

## Agent Browser Auth via Clerk Sign-In Tokens - 2026-03-01

- **Why**: Browser automation agents need to authenticate as a real user but can't navigate Clerk's interactive sign-in UI. A secret-protected API endpoint generates a one-time Clerk sign-in token and redirects to a callback page that establishes a real session programmatically.
- **Changes**:
  1. **Env vars** (`env/server.ts`): Added optional `AGENT_AUTH_SECRET` and `AGENT_CLERK_USER_ID`.
  2. **API route** (`app/api/auth/agent-login/route.ts`): Dev-only GET endpoint that validates a shared secret, creates a Clerk sign-in token, and 302 redirects to the callback.
  3. **Callback page** (`app/agent-callback/page.tsx`): Client component that consumes the ticket via `signIn.create({ strategy: "ticket" })`, establishes the session, and redirects to `/home`.
  4. **Middleware** (`middleware.ts`): Added `/agent-callback(.*)` to public routes.

## Add VNC Desktop Tab to Sessions - 2026-03-01

- **Why**: Users need to interact with a graphical desktop environment (and Chrome browser) running inside the Daytona sandbox for visual testing and UI automation. Daytona's SDK provides built-in VNC support via `computerUse.start()` which starts Xvfb + xfce4 + x11vnc + noVNC.
- **Changes**:
  1. **Backend action** (`daytona.ts`): New `toggleDesktopServer` action using Daytona SDK's `sandbox.computerUse.start()`/`stop()`.
  2. **Search params** (`search-params.ts`): Added `"desktop"` to `sandboxTabs` union.
  3. **DesktopPanel component** (new file): Follows `EditorPanel` pattern — on-demand VNC start, polls port 6080 for noVNC readiness, sessionStorage caching, fullscreen + open-in-new-tab buttons. Max 40 poll attempts (2 min) since VNC startup can be slower. Uses `appendNoVncParams` helper to safely append query params to signed URLs.
  4. **SandboxPanel wiring**: New desktop tab trigger with `IconDeviceDesktop`, conditionally rendered `DesktopPanel`.
  5. **Snapshot workflow** (`rebuild-snapshot.yml`): Added VNC packages (xvfb, xfce4, x11vnc, novnc, dbus-x11, X11 libs) and Google Chrome to the Dockerfile so new snapshots include desktop environment support.

## Persist preview & editor state across page refresh - 2026-03-01

- **Why**: Page refresh caused 9-30s loading delays as preview/editor URLs were re-polled, and code-server was restarted, killing previous terminal sessions and dev servers. Users had to manually restart dev servers on different ports.
- **Changes**:
  1. **Preview URL caching** (`SandboxPanel.tsx`): sessionStorage cache keyed by `{sessionId}:{port}`. On mount, use cached URL if present, skip polling entirely. Clear on sandbox inactive.
  2. **Editor URL caching & reuse** (`EditorPanel.tsx`): sessionStorage cache keyed by `{sessionId}`. `startEditor` checks if port 8080 is already responding before calling `toggleCodeServer`, avoiding unnecessary restarts.
  3. **Idempotent code-server start** (`daytona.ts`): Backend `toggleCodeServer` now guards start with `pgrep -f 'code-server.*8080'` — only starts if not already running. Existing terminals and dev servers survive.
  4. **Preview port persistence** (`search-params.ts`, `SandboxPanel.tsx`): Port stored in URL via nuqs (`?port=3000`) instead of useState, so custom ports survive refresh.
  5. **Extended signed URL expiry** (`daytona.ts`): Bumped from 3600s (1 hour) to 2592000s (30 days). Cache invalidated only when sandbox inactive (the only scenario where URLs stop working anyway).
- **Reason for change**: Improve UX by eliminating unnecessary loading/restart cycles on page refresh while maintaining clean session lifecycle.

## Extract messages into dedicated table - 2026-02-28

- **Why**: Messages were embedded as arrays inside `sessions`, `designSessions`, and `researchQueries` documents. Every read/write of a session fetched/rewrote the entire message array. As conversations grew, this caused large document sizes approaching the 1MB Convex limit, full array rewrites on every single message, and listing sessions in sidebars loaded all messages for all sessions wastefully.

- **Changes**:
  1. **New `messages` table** (`schema.ts`): Dedicated table with `parentId` (union of session/designSession/researchQuery IDs) and `by_parent` index. All message-specific fields (`mode`, `variations`, `queryCode`, `status`, etc.) live here.
  2. **New `messages.ts`**: Central CRUD hub with `listByParent`, `add`, `addInternal`, `updateLast`, `updateLastInternal`, `patchMessage`, `clearByParent`, `clearByParentInternal`.
  3. **Backend migration**: All mutation/query/workflow files (`sessions.ts`, `designSessions.ts`, `researchQueries.ts`, `sessionWorkflow.ts`, `designWorkflow.ts`, `summarizeWorkflow.ts`, `researchQueryWorkflow.ts`, `analytics.ts`) now read/write via the `messages` table.
  4. **Frontend migration**: All detail pages (`SessionDetailClient`, `DesignDetailClient`, `QueryDetailClient`, chrome extension `ChatPanel`) use separate `useQuery(api.messages.listByParent)` calls. Sidebars no longer load messages.
  5. **Data migration**: Ran paginated migration to copy all embedded messages into the new table, then cleanup migration to unset the old `messages` field from all documents, then removed the field from the schema.
  6. **Research queries**: `updateMessageStatus` now takes `messageId: Id<"messages">` instead of an array index, enabling direct patching.

## Hold task in in_progress until audit completes - 2026-02-27

- **Why**: Tasks were moving to `business_review` immediately after Claude CLI succeeded, before the post-execution audit finished. This meant reviewers could start reviewing code that hadn't been audited yet.

- **Changes**:
  1. **Workflow reorder** (`taskWorkflow.ts`): Swapped Steps 7 and 8 — audit now runs before `completeRun`. Task stays in `in_progress` while the audit runs, and only moves to `business_review` (or back to `todo` on failure) after the audit finishes. Audit remains non-fatal (wrapped in try/catch), so if it fails the task still completes normally.

## Fix Claude CLI prompt piping causing exit code 1 - 2026-02-27

- **Why**: Quick tasks (and all sandbox-based Claude executions) were failing with "Claude CLI exited with code 1" because the prompt was piped via `echo` + `JSON.stringify`, which: (1) turned real newlines into literal `\n` characters so Claude received an unreadable single-line prompt, (2) left `$` and backticks unescaped so bash shell expansion could mangle or break the command.

- **Changes**:
  1. **Prompt piping** (`daytona.ts`): Replaced `echo <JSON.stringify(prompt)> | npx ...` with `cat /tmp/design-prompt.txt | npx ...` — the prompt file is already uploaded with correct formatting, so just pipe it directly
  2. **Error diagnostics** (`daytona.ts`): Appended `stderrOutput` (last 500 chars) to the error message on CLI failure — previously stderr was captured but silently discarded, making failures impossible to diagnose

## Fix PR base branch + sandbox git repo fallback - 2026-02-27

- **Why**: PRs were always opened against `main` regardless of the base branch selected in the task modal. Additionally, sandboxes created from snapshots that lacked a git repo would crash instead of recovering.

- **Changes**:
  1. **PR base branch** (`taskWorkflowActions.ts`): `createPullRequest` now accepts a `baseBranch` arg and uses it instead of hardcoded `"main"`
  2. **Workflow passthrough** (`taskWorkflow.ts`): Passes `args.baseBranch` to `createPullRequest`
  3. **Sandbox git fallback** (`daytona.ts`): When `syncRepo` fails with "not a git repository" (snapshot missing `.git`), uses new `initGitInPlace` to `git init && fetch && reset --hard && clean -fd` — preserves snapshot's pre-installed `node_modules` instead of nuking everything with a full clone
  4. **Ephemeral sandbox cleanup** (`taskWorkflow.ts`): Standalone (non-project) tasks now pass `ephemeral: true` and explicitly delete their sandbox after workflow completion instead of relying on Daytona auto-delete
  5. **Session sandbox deletion** (`sessions.ts`): Stopping a session now fully deletes the sandbox via `deleteSandbox` instead of just stopping it (matching design sessions and projects behavior)

## Full Walkthrough Evidence Capture (Screenshots + Video) - 2026-02-27

- **Why**: Static screenshots alone don't show the full context of UI state before/after a fix. Video recordings provide a richer walkthrough that makes it easier for reviewers to verify the fix actually works, especially for interactive flows (animations, transitions, hover states).

- **Changes**:
  1. **Dockerfile**: Added `agent-browser install` to ensure Chromium binary is available (previously only Playwright's Chromium was installed, agent-browser might not find it)
  2. **Task prompt** (`taskWorkflow.ts`): Rewrote evidence section to capture both full-page screenshots (`--full`) and WebM video recordings (`record start/stop`) for before/after walkthroughs
  3. **Evidence collection** (`daytona.ts`): Added video (.webm) targets alongside screenshot (.png) targets. Each stage (before_fix/after_fix) now collects both formats
  4. **Proof dedup** (`taskProof.ts`): Updated deduplication to also check `fileType`, so a screenshot and video for the same stage coexist without one deleting the other
  5. **UI labels** (`TaskDetailModal.tsx`): Video proofs now show "Before Walkthrough" / "After Walkthrough" labels distinct from screenshot labels

- **Impact**: Task evidence now includes video walkthroughs alongside screenshots, giving reviewers a complete picture of before/after state

## Improve Screenshot Evidence Diagnostics - 2026-02-27

- **Why**: When screenshots weren't captured, users had no visible explanation why. Warnings were buried in run logs that users rarely expanded, making it frustrating when proof of completion was missing.

- **Changes**:
  1. **Enhanced evidence collection diagnostics** (`packages/backend/convex/daytona.ts:830-898`):
     - After checking for missing screenshot files, parse the activity log to detect if agent-browser commands were attempted
     - Provide contextual diagnostic messages:
       - No agent-browser commands found → "Agent did not attempt to capture screenshots (likely backend-only changes or could not infer the route to test)"
       - Agent-browser commands found but files missing → "Agent attempted to capture screenshots but files were not created (check run logs for dev server or agent-browser errors)"
       - Activity log unavailable → "Could not determine why screenshots are missing (activity log unavailable)"
  2. **Prominent warning display in UI** (`apps/web/lib/components/tasks/TaskDetailModal.tsx:155-165, 698-717`):
     - Extract evidence warnings from latest successful run's logs
     - Display warnings prominently in Proof of Completion section with warning icon and styled box
     - Users no longer need to dig through run logs to understand why screenshots are missing

- **Impact**:
  - Users immediately see why screenshots weren't captured without expanding logs
  - Clear distinction between "agent chose not to capture" vs "agent tried but failed"
  - Better debugging experience for screenshot capture issues

## Fix Task Evidence Streaming Break and Screenshot Prompt - 2026-02-27

- **Why**: Adding `Skill` to `allowedTools` broke Claude CLI streaming (no stdout/activity logs), and the prompt incorrectly instructed Claude to use the `Skill` tool for screenshots instead of direct Bash commands to invoke `agent-browser`, which doesn't exist in the target repo's sandbox. Additionally, the prompt said "Do NOT run dev commands" but screenshots require starting a dev server.

- **Changes**:
  1. **Removed `Skill` from `allowedTools`** (`packages/backend/convex/taskWorkflow.ts:177`):
     - `Skill` is not a valid CLI tool argument and was causing streaming to fail
     - `agent-browser` is installed globally in Docker image and can be invoked directly via Bash
  2. **Rewrote screenshot section in task prompt** (`packages/backend/convex/taskWorkflow.ts:61-107`):
     - Replaced `Skill` tool references with direct Bash command instructions: `agent-browser open/screenshot/close`
     - Added detailed before/after workflow with dev server lifecycle (start in background, wait, capture, kill)
     - Changed contradictory rule from "Do NOT run dev commands" to "You MAY run the dev server ONLY for screenshot capture (kill it after)"
     - Made screenshots truly optional with clear skip conditions (backend-only changes, route inference failure, dev server failure)

- **Impact**:
  - Task execution streaming will now work correctly in real-time
  - Screenshots can actually be captured when UI changes are made
  - Claude agent won't get confused by contradictory instructions

## Automated Before/After Task Evidence Capture - 2026-02-27

- **Why**: Task outcomes lacked consistent visual proof tied to the specific run, which made business/code review slower and less trustworthy when validating UI bug fixes.

- **Changes**:
  1. **Task workflow evidence contract**:
     - Updated task implementation prompt to require `agent-browser` before/after screenshots with deterministic run-scoped paths.
     - Enabled `Skill` in allowed tools for task execution runs.
  2. **Non-blocking evidence collection**:
     - Added a Daytona internal action that reads expected screenshot files from sandbox, stores them in Convex Storage, and records warnings/missing stages without failing execution.
     - Wired this into task execution workflow so evidence capture runs before completion and writes warning logs on partial/missing capture.
  3. **Proof metadata + dedupe**:
     - Extended `taskProof` schema with optional `runId`, `evidenceStage`, and `source` fields.
     - Added internal automated-proof mutation with dedupe per `taskId + runId + evidenceStage`.
     - Kept manual proof uploads intact and explicitly tagged as manual.
  4. **Task detail evidence UX**:
     - Updated proof rendering in `TaskDetailModal` to show stage badges (`Before Fix`, `After Fix`, `Manual`) and run timestamp labels while preserving full history.

## Archived Sessions Visible in Sidebar - 2026-02-26

- **Why**: Archived sessions disappeared completely from the UI with no way to view their history. Users need to reference past work without accidentally modifying it.

- **Changes**:
  1. **Backend**: Added `listArchived` queries to both `sessions.ts` and `designSessions.ts` to return only archived sessions for a repo.
  2. **Sidebars**: Added collapsible "Archived" section to `SessionsSidebar` and `DesignSessionsSidebar` with a chevron toggle. Archived items show as dimmed links with no action dropdown. Search filters both active and archived sessions.
  3. **Read-only mode**: When viewing an archived session, all action buttons (sandbox toggle, clear chat, send for review, summary, prompt input) are hidden. An "Archived" banner replaces the action bar. Design sessions also hide the "Use this design" button and sandbox start button.

## Faster Sandbox Start for Existing Sandboxes - 2026-02-26

- **Why**: Clicking "Start" on a session showed the sandbox as started ~5 seconds late. Daytona had the sandbox running almost immediately, but the UI waited for git sync, branch checkout, and service startup to complete before updating the session status to "active".

- **Changes**:
  1. **Early `sandboxReady` for existing sandboxes** (`packages/backend/convex/daytona.ts`):
     - For reused sandboxes, `sandboxReady` is called right after health check passes, before git sync/checkout
     - Git sync and branch checkout still happen, just after the UI is already updated
  2. **Race condition guards** (`packages/backend/convex/sessions.ts`, `packages/backend/convex/designSessions.ts`):
     - `sandboxReady` now skips if session was stopped (`"closed"`) while start was in flight
     - `sandboxError` now resets status back to `"closed"` on failure

- **Impact**:
  - Existing sandbox restarts appear active in UI as soon as health check passes (~1s) vs previous 5s+ wait

## Reuse Stopped Session Sandboxes on Restart - 2026-02-26

- **Why**: Stopping a session sandbox always led to creation of a new sandbox on next start, which broke expected stop/resume behavior and made lifecycle feel unreliable.

- **Changes**:
  1. **Reconnect behavior now starts stopped sandboxes** (`packages/backend/convex/daytona.ts`):
     - Added `ensureSandboxRunning(...)` that first probes sandbox health and starts the sandbox when needed
     - Applied this to session reconnect paths so stopped sandboxes are resumed instead of treated as dead
  2. **Session stop now stops instead of deletes** (`packages/backend/convex/sessions.ts`, `packages/backend/convex/daytona.ts`):
     - Session `stopSandbox` now schedules a sandbox stop action and preserves `sandboxId` on the session record
     - `ptySessionId` is cleared on stop to avoid stale terminal handles
  3. **Race guard for quick stop/start toggles** (`packages/backend/convex/daytona.ts`):
     - Added session-status and sandbox-id validation in `internal.daytona.stopSandbox` so delayed stop jobs no-op if the session has already restarted

- **Impact**:
  - Stopping and restarting a session now reuses the same sandbox when available
  - Session restarts are faster and do not unnecessarily create fresh sandboxes

## Add Clear Chat Button to Sessions and Design Pages - 2026-02-26

- **Why**: Users needed a way to reset conversation history and remove generated designs to start fresh within a session without archiving it.

- **Changes**:
  1. **Session chat clearing** (`packages/backend/convex/sessions.ts`):
     - Added `clearMessages` mutation to clear all messages, plan content, and summary from a session
  2. **Design session clearing** (`packages/backend/convex/designSessions.ts`):
     - Added `clearMessages` mutation to clear all messages and reset selected variation index for design sessions
  3. **UI implementation**:
     - Added clear chat button with trash icon in `ChatPanel.tsx` header (sessions page)
     - Added clear chat button with trash icon in `DesignDetailClient.tsx` header (design page)
     - Both include confirmation dialogs that warn about the action being irreversible

- **Impact**:
  - Users can now clear chat history mid-session without archiving
  - Buttons are disabled when no messages exist
  - Works consistently across both session and design workflows

## Persist Session Claude Context Across Recreated Sandboxes - 2026-02-26

- **Why**: Session conversations lost Claude’s local thread state whenever a sandbox was recreated, forcing fresh context and reducing continuity even when the app session itself was unchanged.

- **Changes**:
  1. **Deterministic session persistence identity** (`packages/backend/convex/daytona.ts`):
     - Added deterministic session hashing helpers to derive a stable Daytona volume name and Claude `--session-id` per app session
  2. **Daytona volume mount for Claude state** (`packages/backend/convex/daytona.ts`):
     - Added session-scoped volume provisioning and mounted it at `/home/daytona/.claude`
     - Threaded optional volume mounts through sandbox creation helpers and into `setupAndExecute`
     - Applied the same session volume mount when `startSessionSandbox` creates a replacement sandbox
  3. **Claude resume wiring + safe fallback** (`packages/backend/convex/daytona.ts`):
     - Passed deterministic `CLAUDE_SESSION_ID` into callback runs so Claude resumes the same thread across sandbox lifecycles
     - Added one retry without saved session ID when an attempt fails before any tool activity
  4. **Session-only workflow integration**:
     - `packages/backend/convex/sessionWorkflow.ts`: pass `sessionPersistenceId` into `setupAndExecute`
     - `packages/backend/convex/summarizeWorkflow.ts`: pass `sessionPersistenceId` into `setupAndExecute`
     - `packages/backend/convex/daytona.ts` (`runSessionAudit`): audits now use the same deterministic Claude session ID

- **Impact**:
  - `sessions/[id]` flows now preserve Claude conversational continuity across recreated sandboxes
  - Ask/Plan/Execute/Summary/Audit runs within a session share the same persisted Claude thread identity
  - Other workflow families remain unchanged

## Refine Quick Task Selection Action Bar Layout - 2026-02-25

- **Why**: Selection controls were split between header and bottom action area, which made the flow feel disjointed while selecting tasks.

- **Changes**:
  1. **Unified bottom action controls** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Moved `Cancel` into the bottom action bar next to `Actions`
     - Wrapped both buttons in a shared bordered/background container
  2. **Dialog footer simplification** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Removed `Exit Selection` from the actions dialog footer

- **Impact**:
  - Selection actions are now grouped in one place at the bottom of the page
  - The actions dialog focuses only on task actions, not selection-mode controls

## Add Bottom Actions Dialog for Quick Task Selection - 2026-02-25

- **Why**: Selection actions in Quick Tasks lived only in the top header, which is less ergonomic when users are actively selecting items in long lists/boards.

- **Changes**:
  1. **Bottom selection action trigger** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added a bottom, floating `Actions` button that appears during select mode
     - Button is disabled until at least one task is selected and shows selected count
  2. **Dialog-based actions menu** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added an actions dialog opened by the bottom button
     - Moved grouping action into the dialog (`Group into Project`)
     - Added explicit `Close` and `Exit Selection` actions

- **Impact**:
  - Selection workflows now have an action entrypoint near the bottom interaction area
  - Grouping selected quick tasks is available from a dedicated actions menu dialog

## Refresh Git Auth on Reused Session Sandboxes - 2026-02-25

- **Why**: Session sandboxes that were reused from `existingSandboxId` skipped repo sync and credential refresh, so `origin` could still contain an expired GitHub App installation token and `git push` from the VS Code panel failed with authentication errors.

- **Changes**:
  1. **Session reconnect git refresh** (`packages/backend/convex/daytona.ts`):
     - Reused-session path in `startSessionSandbox` now calls `syncRepo(...)` before starting services, which refreshes `origin` auth using a fresh installation token
  2. **Branch consistency on reconnect** (`packages/backend/convex/daytona.ts`):
     - Added `checkoutSessionBranch(...)` and invoked it in the reused-session path so the sandbox is on the expected session branch after reconnect

- **Impact**:
  - Reopening an existing session sandbox now refreshes GitHub auth before terminal/editor usage
  - `git push` from the session IDE/terminal no longer depends on stale token state from older sandbox runs

## Auto-scroll Activity Steps to Latest Entry - 2026-02-25

- **Why**: The activity timeline could open at the top and force manual scrolling to see the newest events, which slows down monitoring during and after agent execution.

- **Changes**:
  1. **Bottom-on-open behavior** (`packages/ui/src/ai-elements/activity-steps.tsx`):
     - Added a scroll container ref and effect that jumps to the latest step whenever the activity panel is opened
  2. **Continuous follow behavior** (`packages/ui/src/ai-elements/activity-steps.tsx`):
     - Reused the same effect to keep the viewport pinned to the bottom as step count increases

- **Impact**:
  - Opening Activity Steps now starts at the newest entries
  - Live step updates stay visible without manual scroll intervention

## Use users.lastSeenAt for Active User Metrics - 2026-02-25

- **Why**: Active user counting was based on session message/activity timestamps, which can misrepresent online presence and diverge from the platform's explicit presence heartbeat model.

- **Changes**:
  1. **Active users source of truth** (`packages/backend/convex/analytics.ts`):
     - Updated `getActiveUsers` to read `users.lastSeenAt` instead of session messages
     - Scoped to users who currently have active sessions for the repo
  2. **Timeline consistency** (`packages/backend/convex/analytics.ts`):
     - Updated timeline `activeUsers` buckets to derive from `users.lastSeenAt` for users with active repo sessions

- **Impact**:
  - "Cookers Now" now reflects heartbeat-based online presence from the users table
  - Repo card sparkline and headline metric use the same active-user definition

## Fix Active Users Metric to Use Session Activity - 2026-02-25

- **Why**: "Cookers Now" could show `0` even while users had open active sessions because the metric only counted user-authored chat messages within the last 5 minutes.

- **Changes**:
  1. **Active user calculation update** (`packages/backend/convex/analytics.ts`):
     - `getActiveUsers` now uses last session activity timestamp (`updatedAt` with message-time fallback) instead of requiring a recent user-role message
     - Keeps the 5-minute recency window while better matching real active usage

- **Impact**:
  - The metric now reflects users with recently active sessions, not just users who typed a message in that window

## Add Sparkline Trends to Repo Home Stat Cards - 2026-02-25

- **Why**: Point-in-time values on the repo home cards lacked context, making it hard to quickly see whether each metric was improving or flattening within the selected filter window.

- **Changes**:
  1. **Extended activity timeline payload** (`packages/backend/convex/analytics.ts`):
     - Added per-bucket `tasksCompleted`, `sessionsWithPr`, and `activeUsers`
     - Preserved existing fields while enriching timeline buckets for card-level trend rendering
  2. **Repo home chart wiring** (`apps/web/app/(main)/[repo]/RepoHomeClient.tsx`):
     - Added compact sparkline renderer and placed it on the right side of each stat card
     - Added range-aware timeline window + bucket sizing from `statsRange`
     - Mapped card trends to meaningful series:
       - PRs Shipped -> `prsShipped`
       - Cook Rate -> `sessionsWithPr / sessions`
       - Cookers Now -> `activeUsers`
       - Tasks Done -> `tasksCompleted`

- **Impact**:
  - Each card now shows quick visual momentum instead of only a static number
  - Trend lines stay synchronized with the same dropdown filter used by the headline stats

## Add Upload PRD Modal with Paste + File Options - 2026-02-25

- **Why**: Uploading PRDs forced users straight into file picker flow, which blocked quick copy-paste workflows when requirements already exist as text.

- **Changes**:
  1. **Upload entrypoint changed** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - "Upload PRD" now opens a dialog instead of immediately triggering file selection
  2. **Dual-input modal flow** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - Added file upload action inside the dialog (still supports `.md` and `.txt`)
     - Added paste textarea with an explicit "Upload from paste" action
  3. **Shared creation pipeline** (`apps/web/lib/components/sidebar/DocsSidebar.tsx`):
     - Consolidated file and paste flows into one helper that creates the doc and starts PRD parsing

- **Impact**:
  - Users can upload via file or paste without leaving the same modal
  - Existing backend PRD parse behavior remains consistent across both input paths

## Add Time-Range Filters to Repo Home Stats - 2026-02-25

- **Why**: Repo home stats were fixed to all-time numbers, which made it hard to inspect short-term performance changes or compare recent execution windows.

- **Changes**:
  1. **URL-backed filter state** (apps/web/lib/search-params.ts):
     - Added repoStatsRangeParser with values: 1d, 3d, 1w, 1m, 3m, 6m, 1y, all
     - Uses nuqs replace-history behavior to keep range changes shareable via URL
  2. **Repo home filter UI + query wiring** (apps/web/app/(main)/[repo]/RepoHomeClient.tsx):
     - Added top-right dropdown range control inside the Eva stats card header
     - Added range-to-timestamp mapping using dayjs
     - Passed computed startTime into api.analytics.getImpactStats

- **Impact**:
  - Users can now switch Eva metrics between short and long windows without leaving /[repo]
  - Selected range persists in the URL (statsRange) for refresh/share consistency

## Stop Button + Inline Edit in TaskDetailModal - 2026-02-25

- **Why**: Quick tasks had no way to stop execution once started (users had to wait for completion or failure), and title/description were read-only despite the update mutation already supporting both fields. This created frustration when tasks needed cancellation or quick edits during execution.

- **Changes**:
  1. **Backend** (`packages/backend/convex/taskWorkflow.ts`):
     - Added `cancelExecution` authMutation following the design sessions pattern
     - Verifies ownership via `board.ownerId === ctx.userId`
     - Cancels active workflow with try/catch (workflow may already be done)
     - Finds active run via `by_task` index, patches to error status with "Cancelled by user"
     - Clears streaming activity for the task entity
     - Resets task to `{ status: "todo", activeWorkflowId: undefined }`
  2. **Frontend** (`apps/web/lib/components/tasks/TaskDetailModal.tsx`):
     - Added `IconPlayerStop` import and `cancelExecution` mutation
     - Added state: `isStopping`, `isEditingTitle`, `editTitle`, `isEditingDescription`, `editDescription`
     - **Stop button**: Replaces "Run Eva" when `hasActiveRun` is true, red destructive variant, disabled when not owner or stopping
     - **Title inline edit**: Click to edit (disabled when `hasActiveRun`), save on blur/Enter, cancel on Escape, any team member can edit
     - **Description inline edit**: Click to edit (disabled when `hasActiveRun`), save on blur/Ctrl+Enter, cancel on Escape, includes "Click to add description..." placeholder when empty, any team member can edit, preserves full description including element details separator

- **Impact**:
  - Users can now immediately stop tasks that are stuck or running incorrectly without waiting
  - Quick edits to title/description no longer require navigating away from the detail modal
  - Both features respect task execution state (disabled when running) to prevent conflicts

## Simplify daytona.ts — 2026-02-25

- **Why**: The 1137-line file had repeated patterns - verbose `executeCommand` calls used 20+ times, identical sandbox context resolution in 3 places, duplicated service-start commands. Reduced by 181 lines while improving readability and maintainability.

- **Changes**:
  1. **Added `exec` helper** (line 19) - Wraps `sandbox.process.executeCommand` with simpler signature, returns result string directly instead of response object
  2. **Added `resolveSandboxContext` helper** (line 47) - Combines API key resolution, Daytona client creation, infra env vars, and snapshot lookup. Replaced identical 12-line blocks in `setupAndExecute`, `startSessionSandbox`, and `startDesignSandbox`
  3. **Added `startSessionServices` helper** (line 808) - Starts pnpm dev + code-server in one call. Deduplicates service-start commands in `startSessionSandbox` (reuse path + new sandbox path)
  4. **Replaced all `executeCommand` calls with `exec`** - 20+ call sites simplified from 5-line verbose calls to 1-line `exec` calls
  5. **Collapsed `setupAndExecute` ephemeral/non-ephemeral branches** - Both paths called similar functions with different args. Unified to conditional expression using `?:` operator
  6. **Simplified `startDesignSandbox` if/else** - Pulled common `setupBranch` call outside the conditional, eliminated duplication
  7. `taskWorkflow.clearActiveWorkflow` no longer clears blindly in `finally`; it now preserves `activeWorkflowId` when a queued/running run exists to prevent old runs from orphaning newer retries.

- **Result**: File reduced from 1137 to 956 lines (181 lines removed). No exported signatures changed. All type checks pass.

## Import from Linear to Quick Tasks — 2026-02-25

- **Why**: Quick tasks could only be created one-at-a-time through manual UI input. Teams managing backlogs in Linear needed a way to bulk-import issues as quick tasks without copy-pasting each title/description individually. Bulk import enables fast bootstrapping of conductor task boards from existing Linear workflows.

- **Changes**:
  1. **New Convex Node.js action** (`packages/backend/convex/linearActions.ts`):
     - `fetchIssues` action accepts repo ID and array of Linear identifiers (e.g., `TEAM-123`)
     - Resolves `LINEAR_API_KEY` from team/repo env vars via `resolveEnvVars()`
     - Batches all issue fetches into single Linear GraphQL request using aliased queries (`issue0: issue(id: "TEAM-1") { ... }`)
     - Returns array of `{ identifier, title, description }` with runtime type checks (no `as` casts)
     - Silently skips not-found issues (Linear API returns `null` for inaccessible/deleted issues)
     - Uses manual `ctx.auth.getUserIdentity()` auth (authAction doesn't work with `"use node"` directive)
  2. **Batch mutation** (`packages/backend/convex/agentTasks.ts`):
     - Added `createQuickTasksBatch` mutation accepting `{ repoId, tasks: Array<{ title, description? }>, baseBranch }`
     - Reuses board/column auto-creation logic from `createQuickTask`
     - Creates all tasks in single transaction with atomic ordering (single mutation = no N round-trips)
     - Returns array of task IDs
  3. **Import modal** (`apps/web/lib/components/quick-tasks/ImportLinearModal.tsx`):
     - Textarea accepts Linear URLs (`https://linear.app/team/issue/TEAM-123/...`) or raw identifiers (`TEAM-123`)
     - `parseLinearIdentifiers()` helper extracts identifiers via regex, deduplicates via Set
     - Live count shown below textarea: "3 issues detected: TEAM-1, TEAM-2, TEAM-3"
     - BranchSelect for shared base branch (single branch for all imports)
     - Task titles prefixed with identifier for traceability: `"TEAM-123: Issue Title"`
     - Error handling: inline red box with descriptive message (missing API key, no issues found, Linear API failure)
     - Submit button dynamically shows count: "Import 3 Issues"
  4. **UI wiring** (`apps/web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`):
     - Added "Import from Linear" button (secondary variant, `IconFileImport` icon) before "New Task" button
     - Added `isImporting` state and `<ImportLinearModal>` render

- **Impact**:
  - **UX**: Teams can paste 10+ Linear URLs and bulk-create tasks in seconds vs. manual entry
  - **Traceability**: Task titles include Linear identifier for easy cross-reference
  - **Performance**: Single GraphQL request + single Convex mutation (not N\*2 round-trips)
  - **Error tolerance**: Silently skips not-found/inaccessible issues instead of failing entire import
  - **Security**: LINEAR_API_KEY stored in team/repo env vars (not hardcoded)

## Move GitHub Token Generation Server-Side — 2026-02-25

- **Why**: GitHub App installation tokens have a 1-hour TTL. Previously, tokens were generated in the frontend via `getWorkflowTokens()`, passed through Convex mutations, workflow args, and into daytona sandbox as env vars. By the time Claude CLI tried to `git push`, tokens could be expired (especially for long-running tasks). Additionally, tokens passed through the frontend created unnecessary security exposure. Moving token generation server-side eliminates TTL races and improves security by keeping tokens internal to backend infrastructure.

- **Changes**:
  1. **New centralized auth module**: Created `packages/backend/convex/githubAuth.ts` with shared functions: `normalizePemKey()`, `getGitHubCredentials()`, `getInstallationToken()`, `getInstallationOctokit()`
  2. **Backend auth consolidation**: Updated `github.ts` and `snapshotActions.ts` to import shared auth functions, eliminating ~150 lines of duplicated key normalization and credential management code
  3. **Fresh token generation at use time**: Modified internal helpers in `daytona.ts` to accept `installationId` instead of `githubToken`:
     - `createSandbox()` now generates fresh token internally and sets `INSTALLATION_ID` env var for callback refresh
     - `syncRepo()`, `cloneAndSetupRepo()` generate fresh tokens for git operations
  4. **Callback script token refresh**: Updated `buildCallbackScript()` to refresh `GITHUB_TOKEN` env var before spawning Claude CLI by calling `github:getInstallationTokenAction` via Convex HTTP API
  5. **Workflow migrations**: Updated all 11 workflow files (task, session, design, build, research query, test gen, summarize, project interview, evaluation, doc PRD, doc interview) to accept `installationId` instead of `githubToken` in workflow args
  6. **Frontend simplification**: Renamed `getWorkflowTokens()` → `getConvexToken()` in server action; removed GitHub token generation entirely. Updated 15 components across pages and lib to pass `installationId` from repo data instead of requesting tokens

- **Impact**:
  - **Eliminates TTL races**: Tokens are generated immediately before use, preventing expiration during long task execution
  - **Security**: Tokens no longer pass through frontend; kept internal to backend infrastructure
  - **Audit trail**: `INSTALLATION_ID` env var in sandbox enables callback script to refresh tokens autonomously
  - **Code consolidation**: Removed 150+ lines of duplicated auth code; single source of truth in `githubAuth.ts`
  - **No breaking changes**: All mutations and workflows still work end-to-end; token management is now transparent to callers

## Persist Agent Run Activity Logs — 2026-02-25

- **Why**: During task execution, detailed streaming activity (file reads, edits, bash commands, thinking steps) was shown via `streamingActivity` table. On completion, the streaming row was deleted and the `activityLog` string (passed through the workflow event) was silently dropped — never saved. Result: after success/error, users only saw a status badge + PR link. All step-by-step detail was lost, making it impossible to audit what the agent did after the run completed.

- **Changes**:
  1. **Schema**: Added `activityLog: v.optional(v.string())` to `agentRuns` table in `schema.ts` to persist the activity log after completion
  2. **Validator**: Added `activityLog: v.optional(v.string())` to `agentRunValidator` in `agentRuns.ts` so queries return the persisted field
  3. **Workflow**: Updated `completeRun` mutation in `taskWorkflow.ts` to:
     - Accept `activityLog: v.union(v.string(), v.null())` in args
     - Save `activityLog` when patching the run document
     - Pass `result.activityLog` from workflow step 7 to `completeRun`
  4. **Alternative path**: Updated `agentRuns.complete` mutation to accept and save `activityLog` for manual run completion
  5. **Frontend**: Updated `TaskDetailModal.tsx` and `ProjectTaskDetailPanel.tsx` to render persisted activity log as static `ActivitySteps` component when run is completed/errored

- **Impact**:
  - **Auditability**: Full step-by-step activity logs are now preserved after run completion, enabling post-mortem debugging and compliance tracking
  - **User experience**: Users can expand completed runs and see exactly what the agent did (file changes, commands run, thinking process)
  - **No breaking changes**: New optional field, backward compatible with existing runs

## Consolidate Env Var Resolution into Shared Helper — 2026-02-25

- **Why**: After BYOK implementation, env var resolution (team + repo → decrypt → merge) was duplicated across `daytona.ts`, `snapshotActions.ts`, and `mcpRoutes.ts` with subtle bugs and inefficiencies. Each copy had different issues: `snapshotActions.ts:rebuildSnapshot` only checked repo env vars (skipped team entirely), `snapshotActions.ts:deleteDaytonaSnapshot` had flipped precedence (team overrode repo instead of repo overriding team), and sandbox operations in `daytona.ts` resolved env vars twice (4 queries instead of 2). Consolidating into a shared helper eliminates duplication, fixes bugs, and improves performance.

- **Changes**:
  1. **New shared helpers in `envVarResolver.ts`**:
     - `resolveEnvVars(ctx, repoId)`: Generic helper that fetches team + repo env vars, decrypts, and merges with correct precedence (repo overrides team)
     - `resolveDaytonaApiKey(ctx, repoId)`: Daytona-specific helper that calls `resolveEnvVars`, extracts and validates `DAYTONA_API_KEY` (throws if missing), returns both API key and sandbox env vars (with key stripped)

  2. **Updated `daytona.ts`**:
     - Removed `resolveTeamEnvVars` and `resolveDaytonaApiKey` functions (replaced by shared helpers)
     - Updated 9 functions to use `resolveDaytonaApiKey`: `runSandboxCommand`, `getPreviewUrl`, `setupAndExecute`, `launchOnExistingSandbox`, `launchAudit`, `runSessionAudit`, `deleteSandbox`, `startSessionSandbox`, `startDesignSandbox`
     - Eliminated double-resolution in sandbox operations (4 queries → 2)

  3. **Updated `snapshotActions.ts`**:
     - Removed `requireEnv` function (no longer used)
     - Updated `getGithubPat` to take decrypted merged vars instead of raw encrypted array
     - Fixed `rebuildSnapshot` and `pollWorkflowRun` to check both team AND repo env vars for `SNAPSHOT_GITHUB_PAT` (was only checking repo before)
     - Fixed `deleteDaytonaSnapshot` to use correct precedence (repo overrides team, was flipped before)

  4. **Updated `mcpRoutes.ts`**:
     - Simplified `getDecryptedRepoEnvVars` to use `resolveEnvVars` (reduced from ~30 lines to ~5 lines)

- **Impact**:
  - **DRY**: Single source of truth for env var resolution eliminates 9 duplicate error-handling blocks
  - **Performance**: Sandbox operations now make 2 queries instead of 4 (eliminated double-resolution)
  - **Bug fixes**: Snapshot operations now correctly check team-level env vars (fixes "env var not defined" when `SNAPSHOT_GITHUB_PAT` is set at team level)
  - **Consistency**: All env var resolution follows same precedence rules (repo overrides team)
  - **Maintainability**: Future changes to env var resolution only need to touch one file

## BYOK: Move DAYTONA_API_KEY and CONVEX_DEPLOY_KEY to User Env Vars — 2026-02-25

- **Why**: Platform was using its own `DAYTONA_API_KEY` and `CONVEX_DEPLOY_KEY` from process.env for all users, creating a single point of failure and preventing users from bringing their own infrastructure keys. Users should control their own Daytona and Convex deployment credentials via team/repo environment variables (BYOK - Bring Your Own Key). Platform infrastructure keys (CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL) remain as platform env vars since they connect sandboxes back to the platform.

- **Changes**:
  1. **CONVEX_DEPLOY_KEY → BYOK (trivial)**:
     - Removed `extraEnvVarNames: ["CONVEX_DEPLOY_KEY"]` from `researchQueryWorkflow.ts:213`
     - Removed entire `extraEnvVarNames` mechanism from `daytona.ts` (parameter + loop that read from platform process.env)
     - User now sets `CONVEX_DEPLOY_KEY` in team/repo env vars, flows through via `mergedEnvVars` spread

  2. **DAYTONA_API_KEY → BYOK (medium)**:
     - Changed `getDaytona()` → `getDaytona(apiKey: string)` in both `daytona.ts` and `snapshotActions.ts`
     - Added `resolveDaytonaApiKey(ctx, repoId)` helper in `daytona.ts` to fetch/decrypt key from team/repo env vars (throws if missing)
     - Strip `DAYTONA_API_KEY` from `mergedEnvVars` before injecting into sandbox (sandbox doesn't need it)
     - Updated all Daytona action call sites (15 functions across 11 files) to resolve and pass API key:
       - **Already had repoId**: `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox`
       - **Added repoId param**: `runSandboxCommand`, `getPreviewUrl`, `launchOnExistingSandbox`, `launchAudit`, `deleteSandbox`, `deleteDaytonaSnapshot`
       - **Internal repoId lookup**: `runSessionAudit` (queries session to get repoId)
     - Updated workflow callers (7 files): `sessionWorkflow.ts`, `taskWorkflow.ts`, `designWorkflow.ts`, `designSessions.ts`, `sessions.ts`, `projects.ts`, `repoSnapshots.ts`
     - Updated frontend callers (3 files): `DesignDetailClient.tsx`, `EditorPanel.tsx`, `SandboxPanel.tsx` (pass repoId to `getPreviewUrl` action)

  3. **SetupBanner enhancements**:
     - Check both team AND repo env vars (not just team)
     - Check for all required keys: `CLAUDE_CODE_OAUTH_TOKEN`, `DAYTONA_API_KEY`, `CONVEX_DEPLOY_KEY`
     - List ALL missing keys in modal (not just one)
     - Renamed dialog title: "Setup Required" (was "OAuth Setup Required")

- **Impact**:
  - **BYOK enforcement**: Users must provide their own Daytona API key and Convex deploy key via team/repo env vars
  - **Better security**: Keys are per-team/repo instead of shared across all users
  - **Clear errors**: Missing keys throw descriptive errors instead of silently failing
  - **No platform key exposure**: Sandbox env vars no longer include DAYTONA_API_KEY (stripped before injection)
  - **Frontend type safety**: All `getPreviewUrl` calls include required `repoId` parameter

## Add Public Landing Page and Move Dashboard to /home — 2026-02-25

- **Why**: The root route (`/`) was directly showing the authenticated repos dashboard, requiring users to be signed in before seeing any content. This creates a poor first-time user experience and prevents unauthenticated users from learning about the platform before signing up.

- **Changes**:
  1. **Route restructure**: Moved repos dashboard from `/` to `/home` (moved `app/(main)/page.tsx` and `app/(main)/ReposClient.tsx` to `app/(main)/home/` directory)
  2. **New landing page**: Created public landing page at `/` with Clerk sign-in/sign-up buttons for unauthenticated users, auto-redirects to `/home` when signed in
  3. **Middleware update**: Added `/` to `isPublicRoute` matcher to allow unauthenticated access
  4. **ClerkProvider redirects**: Updated `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` from `/` to `/home`
  5. **Internal navigation**: Updated all internal references from `/` to `/home` across:
     - `app/(main)/layout.tsx` - TopNavBar display condition
     - `lib/components/TopNavBar.tsx` - logo link and "Repositories" nav button
     - `lib/components/Sidebar.tsx` - mobile and desktop logo links
     - `app/(main)/setup/[id]/RepoSetupClient.tsx` - all redirect buttons after repo setup

- **Impact**:
  - **Better onboarding**: Unauthenticated users see a clean landing page with clear sign-in/sign-up options
  - **Consistent navigation**: All "home" links now point to `/home` (repos dashboard)
  - **Clean separation**: `/` is public, `/home` and repo routes require authentication
  - **Zero breaking changes**: TypeScript compilation passes, existing functionality preserved

## Complete Auth Custom Functions Migration + Schema Migration — 2026-02-24

- **Why**: Every query/mutation/action manually called `getCurrentUserId(ctx)` or `ctx.auth.getUserIdentity()` with 2-3 lines of boilerplate. ~110 functions used `getCurrentUserId`, ~45 used `getUserIdentity` directly. This created inconsistency, duplication, and weak auth gates (20+ mutations didn't actually enforce auth). Additionally, `boards.ownerId` and `taskComments.authorId` were `v.string()` storing Clerk subject IDs, inconsistent with the rest of the schema which uses `Id<"users">`.

- **Changes**:
  1. **Setup**: Installed `convex-helpers`, created `packages/backend/convex/functions.ts` with 6 custom function builders (`authQuery`, `authMutation`, `authAction`, `internalAuthQuery`, `internalAuthMutation`, `internalAuthAction`). Added `getUserIdFromIdentity` internalQuery to `auth.ts` for action support.
  2. **Schema Migration**: Changed `boards.ownerId` from `v.string()` to `v.id("users")`, changed `taskComments.authorId` from `v.string()` to `v.id("users")`. Added data migration `migrateBoardsAndCommentsToUserIds` in `migrations.ts` to convert existing Clerk IDs to user IDs.
  3. **Migrated 110+ functions across 50+ files**: All functions using `getCurrentUserId` pattern migrated to `authQuery`/`authMutation`. All board cluster files using `getUserIdentity` pattern migrated. All action files migrated to `authAction`.

- **Files migrated** (50+ files):
  - **Auth cluster**: `auth.ts` (8 functions - me, isCurrentUserAdmin, getTheme, setTheme, getToolbarVisible, setToolbarVisible)
  - **Board cluster**: `boards.ts` (7), `columns.ts` (5), `agentTasks.ts` (18), `agentRuns.ts` (7), `taskComments.ts` (3), `taskProof.ts` (4), `subtasks.ts` (6), `taskDependencies.ts` (7)
  - **Core operations**: `projects.ts` (17), `sessions.ts` (16), `docs.ts` (17), `users.ts` (1)
  - **Analytics & reporting**: `analytics.ts` (8), `evaluationReports.ts` (7), `sessionAudits.ts` (3)
  - **Research & design**: `researchQueries.ts` (8), `designSessions.ts` (12), `designPersonas.ts` (5), `savedQueries.ts` (5), `routines.ts` (5)
  - **Teams & repos**: `teams.ts` (5), `teamMembers.ts` (4), `teamEnvVars.ts` (2), `repoEnvVars.ts` (2), `repoSnapshots.ts` (6)
  - **Misc**: `annotations.ts` (3), `notifications.ts` (5), `presence.ts` (1)
  - **Workflows** (26 mutations across 12 files): `buildWorkflow.ts`, `taskWorkflow.ts`, `sessionWorkflow.ts`, `summarizeWorkflow.ts`, `designWorkflow.ts`, `docInterviewWorkflow.ts`, `docPrdWorkflow.ts`, `evaluationWorkflow.ts`, `testGenWorkflow.ts`, `projectInterviewWorkflow.ts`, `researchQueryWorkflow.ts`
  - **Mutations** (2 functions in 1 file): `githubRepos.ts` (2 - create, remove)

- **Pattern changes**:
  - Removed ~500 lines of `const userId = await getCurrentUserId(ctx)` boilerplate
  - Removed ~500 lines of `const identity = await ctx.auth.getUserIdentity()` boilerplate
  - Replaced all `identity.subject` comparisons with `ctx.userId`
  - Fixed 20+ weak auth mutations that only called `getCurrentUserId()` without checking result
  - Changed query behavior from returning empty/null on no auth to throwing (consistent with mutations)

- **Impact**:
  - **Consistency**: Single auth pattern across entire backend
  - **Type safety**: `ctx.userId` guaranteed to be `Id<"users">` in all handlers
  - **Security**: All functions now properly enforce authentication
  - **Maintainability**: Centralized auth logic in `functions.ts`
  - **Schema consistency**: All owner/author fields now use `Id<"users">` instead of strings
  - **Migration ready**: Data migration available for boards and comments
  - **Zero TypeScript errors**: Full compilation success

- **Not migrated** (by design):
  - `auth.ts`: `createOrMigrateUser`, `ensureUserExists` (they create users, can't require user to exist)
  - `notifications.ts`: `create` (called internally with explicit userId)
  - `streaming.ts`, `prosemirrorSync.ts`: No auth by design
  - `extensionReleases.ts`: Uses custom admin key auth
  - `sessions.ts`: `getOrCreateExtensionSession` (uses clerkId arg)
  - `presence.ts`: `list`, `disconnect` (use token-based auth)
  - **Node.js actions** (all files with `"use node"` directive): `daytona.ts`, `github.ts`, `repoEnvVarsActions.ts`, `teamEnvVarsActions.ts` - convex-helpers custom function wrappers don't work with Node.js actions, so these keep manual `getUserIdentity()` auth checks
  - Internal mutations/queries that don't check auth
  - Workflow definitions

## Migrate projects.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 17 functions (4 queries, 13 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Five mutations had weak authentication - they called `getCurrentUserId()` but didn't throw when unauthenticated, allowing unauthenticated calls to proceed. The `startDevelopment` mutation used BOTH patterns (both `ctx.auth.getUserIdentity()` and `getCurrentUserId(ctx)`), creating redundancy.
- **Changes**: Replaced imports to add `{ authQuery, authMutation }` from `./functions`. Removed `import { mutation, query } from "./_generated/server"` and `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (13 occurrences). Removed dual auth pattern in `startDevelopment` (removed both `identity` and `userId` variable declarations). Removed all `if (!userId)` checks from queries (4 returning null/empty) and error throws from mutations (8 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in project creation, message creation, task creation, and authorization checks (8 locations). Replaced `identity.subject` with `ctx.userId` in board creation within `startDevelopment`.
- **Functions migrated**: `list`, `get`, `getTaskCount`, `getTaskProgress` (4 authQuery) + `create`, `update`, `addMessage`, `remove`, `deleteCascade`, `clearMessages`, `startDevelopment`, `createFromTasks`, `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage` (13 authMutation).
- **Impact**: Consistent auth pattern across all project operations. Less boilerplate (removed ~40 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. Five weak auth mutations now properly enforce authentication: `updatePrUrl`, `updateProjectSandbox`, `clearProjectSandbox`, `updateLastSandboxActivity`, `updateLastConversationMessage`. The `startDevelopment` function simplified from dual auth pattern to single `ctx.userId` access. Queries now throw when unauthenticated instead of returning empty/null, matching mutation behavior. TypeScript compilation passes with only pre-existing downlevelIteration warning (unrelated to auth changes).

## Migrate sessions.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 16 public functions (2 queries, 14 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Seven mutations had weak authentication - they called `getCurrentUserId()` but didn't check the result, allowing unauthenticated calls to proceed.
- **Changes**: Replaced imports to add `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"` and unused `query` import. Removed all `const userId = await getCurrentUserId(ctx)` calls (11 occurrences). Removed all `if (!userId)` checks from queries (2 returning null/empty) and error throws from mutations (5 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in session creation, message creation, and authorization checks (6 locations).
- **Functions migrated**: `list`, `get` (2 authQuery) + `create`, `addMessage`, `updateStatus`, `update`, `updateSummary`, `archive`, `updateSandbox`, `clearSandbox`, `updatePtySession`, `updateFileDiffs`, `updatePlanContent`, `updateLastMessage`, `startSandbox`, `stopSandbox` (14 authMutation). Skipped 4 internal functions (`sandboxReady`, `sandboxError`, `getInternal`, `setPrUrl`) and `getOrCreateExtensionSession` (uses clerkId for auth) as requested.
- **Impact**: Consistent auth pattern across all session operations. Less boilerplate (removed ~40 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. Seven weak auth mutations now properly enforce authentication: `updateSummary`, `updateSandbox`, `clearSandbox`, `updatePtySession`, `updateFileDiffs`, `updatePlanContent`, `updateLastMessage`. The `list` query now throws when unauthenticated instead of returning empty array, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate docs.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in all 17 functions (5 queries, 12 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. Four mutations (`addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox`) had weak authentication - they called `getCurrentUserId()` but didn't enforce authentication, allowing unauthenticated calls to proceed.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (17 occurrences). Removed all `if (!userId)` checks from queries (3 returning empty/null) and error throws from mutations (9 occurrences). In `addInterviewMessage`, replaced `userId: userId ?? undefined` with `userId: ctx.userId` to ensure userId is always set on interview messages.
- **Functions migrated**: `list`, `get`, `timelineStatus`, `timelineHistory` (4 authQuery) + `create`, `update`, `remove`, `startTestGen`, `completeTestGen`, `failTestGen`, `saveVersion`, `timelineUndo`, `timelineRedo`, `addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox` (13 authMutation). All 17 functions now enforce authentication.
- **Impact**: Consistent auth pattern across all doc operations. Less boilerplate (removed ~50 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. The 4 weak auth mutations now properly enforce authentication instead of silently accepting unauthenticated calls. The `list` and `get` queries now throw when unauthenticated instead of returning empty/null, matching mutation behavior. Interview messages now always have a userId attached. TypeScript compilation passes with no errors in this file.

## Migrate designSessions.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 12 functions (2 queries, 10 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly. The `updateLastMessage` mutation had weak authentication (only called `getCurrentUserId()` without checking result), now enforced with `authMutation`.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (10 occurrences). Removed all `if (!userId)` null/empty checks from queries (1 occurrence) and error throws from mutations (8 occurrences). Replaced all instances of `userId` variable with `ctx.userId` in message creation, session creation, and authorization checks (3 locations).
- **Functions migrated**: `list`, `get` (queries) + `create`, `addMessage`, `updateLastMessage`, `selectVariation`, `startSandbox`, `stopSandbox`, `executeMessage`, `cancelExecution`, `archive` (mutations). Skipped 3 internal mutations (`updateSandbox`, `sandboxReady`, `sandboxError`) as they don't require user authentication.
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~30 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. The `updateLastMessage` mutation now properly enforces authentication instead of silently accepting unauthenticated calls. The `list` query now throws when unauthenticated instead of returning empty array, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate presence.ts heartbeat to authMutation — 2026-02-24

- **Why**: The `heartbeat` function had weak authentication - it accepted `userId` as an argument but only used `getCurrentUserId()` for the `lastSeenAt` update without enforcing that the caller was authenticated. This allowed unauthenticated calls to register presence for any user. The migration to `authMutation` enforces authentication at the function level.
- **Changes**: Changed `heartbeat` from `mutation` to `authMutation`. Added validation to ensure the passed `userId` matches the authenticated `ctx.userId` (throws "Cannot send heartbeat for another user" if mismatch). Removed the `getCurrentUserId` import as it's no longer needed. The `userId` argument is kept in the function signature (required by `@convex-dev/presence` React hook), but now validated against the authenticated user.
- **Functions migrated**: Only `heartbeat` mutation. The `list` query and `disconnect` mutation remain unchanged as they have no auth by design - `list` uses room tokens for access control and `disconnect` uses session tokens.
- **Impact**: Heartbeat calls now require authentication. Users cannot send heartbeats for other users. The `lastSeenAt` update logic is simplified since `ctx.userId` is guaranteed to exist. Compatible with existing `@convex-dev/presence` React hook which passes userId as an argument.

## Migrate repoEnvVars.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 2 functions (`list` query and `removeVar` mutation). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ query, mutation }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed `const userId = await getCurrentUserId(ctx)` from both `list` and `removeVar`. Removed `if (!userId) return []` check from `list` query. Removed `if (!userId) throw new Error("Not authenticated")` from `removeVar` mutation.
- **Functions migrated**: `list` (query) and `removeVar` (mutation). Internal functions `getForSandbox` and `upsertVarInternal` remain unchanged as they use `internalQuery` and `internalMutation` which don't require auth checks.
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~6 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — `list` query that returned `[]` when unauthenticated now throws, matching mutation behavior. TypeScript compilation passes with no errors in this file.

## Migrate notifications.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getCurrentUserId(ctx)` pattern in 5 functions (3 queries, 2 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"`. Removed all `const userId = await getCurrentUserId(ctx)` calls (5 occurrences). Removed all `if (!userId)` null/empty checks from queries (3 occurrences) and error throws from mutations (2 occurrences). Replaced 9 instances of `userId` variable with `ctx.userId` for notification ownership validation and database queries.
- **Functions migrated**: `list`, `get`, `countUnread` (queries) + `markAsRead`, `markAllAsRead` (mutations). Kept `create` and `createNotification` as plain mutation and helper function respectively (called internally by other modules).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~15 lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — queries that returned `[]`/`null`/`0` when unauthenticated now throw (matching mutation behavior). The `createNotification` helper function remains unchanged as it's used by `agentRuns.ts`, `agentTasks.ts`, `taskComments.ts`, and `taskWorkflow.ts` with explicit `userId` parameters.

## Migrate agentTasks.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getUserIdentity()` + `identity.subject` pattern in 18 functions (8 queries, 10 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed `import { getCurrentUserId } from "./auth"` — no longer needed since `ctx.userId` is guaranteed. Removed all `const identity = await ctx.auth.getUserIdentity()` blocks (18 occurrences removed). Removed all `if (!identity)` null/empty checks from queries and throw checks from mutations (18 occurrences). Replaced 20 instances of `identity.subject` with `ctx.userId` for board ownership validation and `ownerId` writes. Removed 2 redundant `await getCurrentUserId(ctx)` calls in `create` and `createQuickTask` — replaced with `ctx.userId` directly for `createdBy` field.
- **Functions migrated**: `listByBoard`, `listByColumn`, `listByProject`, `get`, `getActiveTasks`, `getAllTasks`, `getDependentTasks`, `getStatusesByIds` (8 queries) + `create`, `update`, `moveToColumn`, `updateOrder`, `updateStatus`, `remove`, `createQuickTask`, `startExecution`, `assignToProject`, `deleteCascade` (10 mutations).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~60+ lines of auth checks). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — queries that returned `[]` or `null` when unauthenticated now throw (matching mutation behavior). TypeScript compilation passes with no errors in this file.

## Migrate agentRuns.ts to Auth Helpers — 2026-02-24

- **Why**: Standardize authentication pattern across backend. The file used the old `getUserIdentity()` + `identity.subject` pattern in 6 functions (4 queries, 2 mutations). The new `authQuery`/`authMutation` helpers from `functions.ts` eliminate boilerplate by automatically throwing when unauthenticated and providing `ctx.userId` directly.
- **Changes**: Replaced imports from `{ mutation, query }` to `{ authQuery, authMutation }` from `./functions`. Removed all `const identity = await ctx.auth.getUserIdentity()` blocks (11 lines removed across 6 functions). Removed all `if (!identity)` null/empty checks (6 occurrences). Replaced 7 instances of `identity.subject` with `ctx.userId` for board ownership validation.
- **Functions migrated**: `get`, `getWithDetails`, `listByTask`, `listAll` (queries) + `updateStatus`, `appendLog`, `complete` (mutations).
- **Impact**: Consistent auth pattern. Less boilerplate (removed ~25 lines). Type safety improved — `ctx.userId` is guaranteed to exist in handler. No behavior changes — auth failures now throw instead of returning null/empty, matching existing mutation behavior. TypeScript compilation passes with no errors in this file.

## Add Home Button + Restructure Admin Navigation — 2026-02-24

- **Why**: Navigation confusion between repo home (`/[repo]` with Eva's Stats) and root repos list (`/`). Logo takes users to root, but no way to return to repo home without manually editing URL. Additionally, Stats being hidden inside Settings sidebar made it less discoverable.
- **Home button in header**: Added Home icon button in sidebar header (next to collapse button) that links to `/[repo]` (Eva's Stats page). Only visible when in a repo context. Icon highlights in primary color when on home page, muted color otherwise. Includes tooltip "Home". Appears in both desktop and mobile layouts.
- **Admin navigation restructure**: Split admin features into two top-level items in ADMIN group: (1) Stats - direct link to `/[repo]/admin/stats` (no sidebar), (2) Settings - opens admin sidebar with Env Variables and Snapshots tabs. Changed icons: Stats uses `IconChartBar`, Settings uses `IconSettings`. Updated `CONTEXT_SIDEBAR_BY_NAV_NAME` to map "Settings" to "admin" context. Removed Stats from AdminSidebar component (now only Env Variables and Snapshots).
- **Impact**: Stats more discoverable as top-level nav item. Settings clearly represents configuration (env vars, snapshots). Home button accessible from header without cluttering navigation groups. Clean sidebar hierarchy: Logo → Root, Home button → Repo overview, ADMIN group → Stats (metrics) and Settings (config).

## Remove Team Slugs + Restore OAuth Setup Banner — 2026-02-24

- **Why**: Team slugs added unnecessary complexity without providing value. The `slugify` helper, `by_slug` index, `getBySlug` query, and slug uniqueness checks were all overhead for a feature that could be replaced with simple `team._id` URLs. Additionally, removing the old `SetupBanner` left users without feedback when the required `CLAUDE_CODE_OAUTH_TOKEN` was missing from their team env vars.
- **Schema changes**: Removed `slug: v.string()` field and `.index("by_slug", ["slug"])` from `teams` table. Teams now only have `name`, `createdBy`, `createdAt`, and optional `isPersonal` fields.
- **Backend cleanup**: Deleted `slugify()` helper function (15 lines) and entire `getBySlug` query (40 lines) from `teams.ts`. Removed slug generation, uniqueness validation, and slug field from `getOrCreatePersonal`, `create`, and `update` mutations. Updated return validators in `list` and `get` queries to remove `slug: v.string()`.
- **Frontend routing**: Renamed directory `apps/web/app/(main)/teams/[slug]/` to `[teamId]/`. Updated `page.tsx` params type from `{ slug: string }` to `{ teamId: string }`. Changed `TeamDetailClient` to accept `teamId` prop and use `api.teams.get` with `id: teamId as Id<"teams">` instead of `api.teams.getBySlug`.
- **Frontend links**: Updated all team links from `/teams/${team.slug}` to `/teams/${team._id}` in `TeamsClient.tsx` and `TeamEnvVarsClient.tsx`. Removed slug display (`/{team.slug}`) from team cards and removed "URL-friendly slug will be generated automatically" helper text from create dialog.
- **EnvVarsTable readOnly improvements**: Fixed bug where `readOnly` prop hid the entire Actions column including reveal/copy buttons. Now always renders the Actions column. Reveal and copy buttons are always shown (users need to see env var values). Edit and delete buttons are hidden when `readOnly={true}`. Added `onReveal` callback to `TeamEnvVarsClient` that calls `api.teamEnvVarsActions.revealValue` with team ID.
- **Restore SetupBanner**: Created new `SetupBanner.tsx` component that checks if team has `CLAUDE_CODE_OAUTH_TOKEN` set in `teamEnvVars`. Queries team and env vars, returns null if OAuth token exists or data is still loading. Shows modal dialog (not inline banner) with setup instructions and two actions: "Dismiss" (closes modal for session) or "Configure Team Settings" (navigates to `/teams/${team._id}`). Modal includes icon, clear messaging about required variable, and styled code display. Re-added `SetupBanner` import and render to `layout.tsx` before `{children}` inside `MainContent`.
- **Impact**: Teams now use simpler ID-based URLs. Slug-related complexity removed from codebase (0 references to `getBySlug`, `slugify`, or `team.slug` remain). Users can now view team env var values in read-only mode via reveal/copy buttons. OAuth setup feedback restored via banner that appears when entering repos without required token. Both `npx tsc` checks pass with no type errors.

## Env Vars Simplification + Personal Teams — 2026-02-24

- **Why**: Three env var tables (`systemEnvVars`, `teamEnvVars`, `repoEnvVars`) created confusion. `systemEnvVars` stored platform OAuth tokens globally without team isolation. Users wanted a Vercel-like model: every user has a Personal team, all repos belong to a team, OAuth tokens are team-scoped, and infrastructure vars come from `process.env` only.
- **Goal**: Simplify to 2 tables (`teamEnvVars` + `repoEnvVars`). Auto-create Personal team per user. Team-scoped OAuth. Infrastructure vars from `process.env` only.
- **Schema changes**: Added `isPersonal: v.optional(v.boolean())` to `teams` table. Deleted `systemEnvVars` table definition and `systemEnvVarCategoryValidator` from validators.
- **Personal team auto-creation**: Added `getOrCreatePersonal` internalMutation in `teams.ts` that queries for user's Personal team, creates one if missing (name: "Personal", slug: `personal-{suffix}`, `isPersonal: true`), adds owner membership, returns `teamId`. Added guard in `teams.remove` mutation to prevent deletion of Personal teams. Updated return validators in `list`, `get`, `getBySlug` to include `isPersonal` field.
- **Auto-assign repos to Personal team**: Added optional `teamId` arg to `githubRepos.upsert` internalMutation. On insert, sets `teamId` if provided. On update, patches `teamId` if provided and repo doesn't have one. Updated `githubRepos.create` mutation to query user's Personal team directly and set `teamId` on insert. Added `getUserByClerkId` internalQuery to `auth.ts` for use in `github.syncRepos`. Updated `github.syncRepos` action to call `getOrCreatePersonal` before installation loop, pass `personalTeamId` to every `githubRepos.upsert` call.
- **Rewrite daytona.ts env var resolution**: Replaced `resolveSystemEnvVars` (async, 50 lines, queried DB for OAuth tokens and infra vars) with pure function `resolveInfraEnvVars` (4 lines, reads `REQUIRED_INFRA_KEYS` from `process.env`). Simplified `createSandbox` signature from 7 params to 5 — removed `oauthToken` and `accountKey`, added `mergedEnvVars` (team + repo combined). OAuth token now flows through `mergedEnvVars` as `CLAUDE_CODE_OAUTH_TOKEN`. Removed all `ACCOUNT_KEY` references (concept deleted). Simplified `getOrCreateSandbox`, `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox` to use new signature. Total removals: ~20 references to `accountKey`/`oauthAccountKey`/`ACCOUNT_KEY`.
- **Delete systemEnvVars backend**: Deleted `packages/backend/convex/systemEnvVars.ts` and `systemEnvVarsActions.ts`. Removed all `internal.systemEnvVars.*` imports from `daytona.ts`.
- **Frontend: Remove System tab**: Deleted `SystemEnvVarsClient.tsx`, `useSetupStatus.ts`, `SetupBanner.tsx`. Updated `EnvVariablesPageClient.tsx` to keep only Repo + Team tabs. Updated `TeamEnvVarsClient.tsx` to query `api.teamEnvVars.list` and render read-only `EnvVarsTable` (showing actual team env vars, not just a link). Added `readOnly?: boolean` prop to `EnvVarsTable.tsx` — when true, makes `onUpsert`/`onReveal`/`onRemove` optional, hides "Add Variable" button, hides Actions column header, hides all action buttons per row. Removed `SetupBanner` import and usage from `layout.tsx`.
- **Remove useSetupStatus from 7 consumer files**: Removed import, variable declaration, and all `!setupStatus?.isReady` conditions from `TaskDetailModal.tsx`, `ChatPanel.tsx`, `DesignDetailClient.tsx`, `ProjectChatArea.tsx`, `ProjectDetailClient.tsx`, `TestingArenaSidebar.tsx`, `testing-arena/[id]/page.tsx`. If OAuth is missing, sandbox creation error is now the feedback mechanism.
- **Migration**: Added `createPersonalTeamsAndMigrate` internalMutation to `migrations.ts`. For each user without a Personal team → creates one. For each repo with no `teamId` → finds owner's Personal team, patches `teamId`. Run via Convex dashboard after deploy.
- **Impact**: Env var model simplified from 3 tables to 2. Every user auto-gets a Personal team. OAuth tokens are team-scoped (stored in `teamEnvVars` as `CLAUDE_CODE_OAUTH_TOKEN`). Infrastructure vars come from `process.env` only. Setup banner and status checks removed — OAuth errors surface naturally during sandbox creation. Team env vars tab shows actual variables, not just a link. No type errors (`npx tsc` passes in both `packages/backend` and `apps/web`).

## Teams UI Fixes — Iteration 3 — 2026-02-24

- **Why**: Four UI issues after iteration 2 degraded UX: (1) repo card disconnected badge broke to its own row due to missing flex layout, (2) team env vars tab showed placeholder text with no management UI despite backend APIs being complete, (3) root pages (`/`, `/teams`) content width didn't match TopNavBar's `max-w-7xl` constraint, (4) sidebar logo trapped users on repo pages with no way back to root repos list.
- **Repo card layout**: Added `flex items-center` to CardContent in `ReposClient.tsx`. Badge now stays inline with repo info instead of wrapping to new row.
- **Team env vars UI**: Extracted shared `EnvVarsTable.tsx` component (340 lines) from `EnvVariablesClient.tsx` with props for `vars`, `onUpsert`, `onReveal`, `onRemove`, `description`. Supports add/edit inline rows, reveal/hide toggle, copy to clipboard, delete confirmation dialog. Refactored `EnvVariablesClient.tsx` to thin wrapper (15 lines) calling repo APIs. Updated `TeamDetailClient.tsx` env tab to use `EnvVarsTable` with team APIs. Team and repo env vars pages now identical UX, zero duplication.
- **Layout consistency**: Wrapped root page content in `layout.tsx` with same container as TopNavBar (`max-w-7xl px-4 sm:px-6 lg:px-8`) when `showTopNavBar === true`. Repo routes unaffected (no container). Pages now align properly.
- **Sidebar logo navigation**: Changed both logo links (mobile header + desktop sidebar) from conditional `href={isRepoRoute && repoSlug ? `/${repoSlug}` : "/"}` to always `href="/"`. Logo becomes global escape hatch to repos list. Users already have sidebar nav items to reach repo sub-pages.
- **Impact**: Disconnected badge inline on repo cards, team env vars fully functional with CRUD UI, root pages visually aligned with TopNavBar, sidebar logo provides consistent way to return home from any repo page. No backend changes, pure UI polish.

## Teams: Refactor Form State Management — 2026-02-24

- **Why**: Each form dialog used multiple `useState` calls (3-4 per form), creating cluttered code and making state updates verbose. This violates the principle of minimizing surface area of change.
- **Refactor approach**: Consolidated all form state into single objects per dialog. Team creation dialog now uses `createDialog` state object with `{ open, name, error, isSubmitting }`. Add member dialog uses `memberDialog` with `{ open, email, error, isSubmitting }`. Add repository dialog uses `repoDialog` with `{ open, selectedRepoId, error, isSubmitting }`.
- **State updates**: All updates use `setState(prev => ({ ...prev, field: value }))` pattern, ensuring immutability and preventing stale closure issues.
- **UX improvements**: Added Enter key support to submit forms (team creation and add member dialogs). Dialog state resets completely on close/submit via single state assignment.
- **Code reduction**: Removed 8 individual `useState` calls across both files, replaced with 3 consolidated state objects. Handler functions simplified from separate error/loading state management to single object updates.
- **Impact**: Form code is now more maintainable, easier to reason about, and follows React best practices. No functional changes to user experience, but cleaner implementation that's easier to extend.

## Teams: Auto-Slug Generation + Error Handling UI — 2026-02-24

- **Why**: Creating teams required manually entering a slug, creating friction and potential for mistakes. Form errors were only logged to console, leaving users confused when operations failed (e.g., "User not found" when adding team member, "Team already exists" on duplicate slug).
- **Backend — Auto-slugify**: Removed `slug` from `teams.create` args. Added `slugify()` helper that transforms team name into URL-friendly slug (lowercase, replaces spaces with hyphens, strips special chars). Mutation now auto-generates slug from name and validates uniqueness, throwing clear errors ("A team with this name already exists" instead of "Team with this slug already exists").
- **Frontend — Team creation UX**: Removed slug input field from create dialog. Added helper text "A URL-friendly slug will be generated automatically". Added error state, error display (red banner), and loading state ("Creating..." button text). Dialog now resets all state (name, error, isSubmitting) on close.
- **Frontend — Team member addition UX**: Added error state, error display, and loading state to add member dialog. Errors like "User not found" or "User is already a member" now shown in red banner below email input. Dialog resets state on close.
- **Frontend — Repository addition UX**: Added error state, error display, and loading state to add repo dialog. Errors now shown in red banner below repository selector. Dialog resets state on close.
- **Impact**: Team creation is now simpler (one field instead of two), slug conflicts are clear to users, and all form errors are visible in the UI instead of hidden in console.

## Teams Feature — Iteration 2: One Team Per Repo + Navigation — 2026-02-24

- **Why**: The first iteration allowed repos to belong to multiple teams (many-to-many via `teamRepos` join table), creating complexity and ambiguous ownership. Backward compatibility kept `connectedBy === undefined` repos visible to everyone, violating access control. Root-level pages (`/`, `/teams`) had no navigation between them, making the Teams feature feel disconnected from the main interface.
- **Schema changes**: Removed `teamRepos` table entirely. Added `teamId: v.optional(v.id("teams"))` field to `githubRepos` table with `by_team` index. Repos now have at most one team (1:1 relationship like Vercel).
- **Migration**: Created `migrations.ts` with `assignOrphanRepos` internalMutation that patches all `connectedBy === undefined` repos to assign them to a fallback user. This migration must be run manually via Convex dashboard to eliminate orphan repos before the new access logic takes effect.
- **Backend — Repo access**: Rewrote `githubRepos.list`, `get`, `getByOwnerAndName` to remove `connectedBy === undefined` fallback. Users now see repos where `connectedBy === userId` OR (`teamId` is defined AND user is a member of that team). No more global visibility for orphan repos.
- **Backend — New repo API**: Added `getTeamIdForRepo` internalQuery (accepts string repoId, returns `teamId | null`), `listByTeam` query (returns repos filtered by `by_team` index + membership check), `assignToTeam` mutation (patches `repo.teamId`), `removeFromTeam` mutation (patches `repo.teamId` to `undefined`).
- **Backend — Team cascade**: Updated `teams.remove` mutation to patch repos' `teamId` to `undefined` (instead of deleting join table rows) when team is deleted. Repos revert to personal ownership.
- **Backend — Env var resolution**: Rewrote `resolveTeamEnvVars()` in `daytona.ts` to call `getTeamIdForRepo` once, then `getForSandbox` once if teamId exists. No more loop over `teamRepos` join table. Fixed `startSessionSandbox` bug where team env vars were never merged — now uses same pattern as `setupAndExecute` and `startDesignSandbox` (fetch team vars + repo vars → merge with repo precedence → pass to `createSandbox`).
- **Backend — MCP routes**: Simplified `mcpRoutes.getDecryptedRepoEnvVars` to replace `teamRepos.getTeamsForRepoInternal` loop with single `getTeamIdForRepo` + `getForSandbox` call.
- **Frontend — Top nav bar**: Created `TopNavBar.tsx` component with logo/branding (left), Repositories and Teams links (center), and NotificationsPopoverClient + theme toggle + UserButton (right). Rendered conditionally in `layout.tsx` only when `pathname === "/" || pathname.startsWith("/teams") || pathname.startsWith("/setup")`. Repo routes and inbox retain their own Sidebar; TopNavBar is hidden for those routes.
- **Frontend — Sidebar cleanup**: Removed Teams link from `Sidebar.tsx` (replaced by TopNavBar).
- **Frontend — Team detail**: Updated `TeamDetailClient.tsx` to use new API — `api.githubRepos.listByTeam`, `api.githubRepos.assignToTeam`, `api.githubRepos.removeFromTeam`. Repos tab now renders direct repo objects (not join table entries). Fixed `selectedRepoId` state to use string instead of type assertion — lookup repo object by `_id` string match before calling `assignToTeam`.
- **Frontend — Team env vars**: Rewrote `TeamEnvVarsClient.tsx` to use `useRepo()` hook from RepoContext and check `repo.teamId` directly. If `repo.teamId` exists, query `api.teams.get({ id: repo.teamId })` to show single team card. If no `teamId`, show "not part of any team" message.
- **Frontend — Repos grouping**: Updated `ReposClient.tsx` to query `api.teams.list` alongside repos. Group repos by team: repos with `teamId === undefined` → "Personal", repos with `teamId` → grouped by team name. Render section headers per group with Personal first, then teams alphabetically.
- **Deleted files**: `packages/backend/convex/teamRepos.ts` (all references replaced by `teamId` field).
- **Impact**: Repos now have clear ownership (personal or team, never both). No more orphan repos visible to everyone. Team env vars flow through to all sandbox types including sessions (previously broken). Top nav bar provides clear navigation between Repositories and Teams pages. Repos page visually groups personal and team repositories for better organization.

## Teams Feature + Env Var Restructuring — 2026-02-24

- **Why**: All authenticated users could see all repos with no access control. Environment variables were split between repo-scoped and admin-only system vars with no team-level sharing. Users needed a way to collaborate on repos and share configurations across team repositories.
- **Schema changes**: Added 4 new tables (`teams`, `teamMembers`, `teamRepos`, `teamEnvVars`) for Vercel-like team model. Added `connectedBy` field to `githubRepos` to track who connected each repo. Removed `aiAccountStatus` table — rate-limiting code was never invoked.
- **Backend — Teams CRUD**: New modules `teams.ts`, `teamMembers.ts`, `teamRepos.ts` provide full team lifecycle management. Team owners can add/remove members, manage repos, and configure team-scoped environment variables.
- **Backend — Repo access control**: Modified `githubRepos.list`, `get`, and `getByOwnerAndName` to filter repos by access: users see repos they connected + repos from their teams + legacy repos (no `connectedBy`). Repos without `connectedBy` remain visible to all users for backward compatibility.
- **Backend — Env var hierarchy**: Added `resolveTeamEnvVars()` helper in `daytona.ts` that fetches team env vars for all teams a repo belongs to, decrypts them, and merges them. Sandbox creation now merges team vars + repo vars with repo vars taking precedence. Updated `setupAndExecute`, `startSessionSandbox`, `startDesignSandbox` to include team vars. MCP server `getDecryptedRepoEnvVars` also includes team vars.
- **Backend — AI account rotation**: Replaced dead `internal.aiAccounts.getAvailableAccountKey` call in `daytona.ts` with direct query to `systemEnvVars.getOAuthAccounts` (returns first claude_oauth account). Removed `aiAccountStatus` cleanup from `systemEnvVars.removeVar`. Deleted `aiAccounts.ts` entirely.
- **Frontend — Team management**: New `/teams` route lists user's teams with create dialog. New `/teams/[slug]` route shows team details with tabs for Members (add/remove, change roles), Repos (add/remove from user's connected repos), and Env Variables (team-scoped configuration).
- **Frontend — Env vars page**: Added "Team" tab to `EnvVariablesPageClient` showing teams this repo belongs to with links to manage team variables. Team env vars are inherited by all team repos (repo vars override team vars).
- **Frontend — Navigation**: Added "Teams" link to main sidebar (visible when not in a repo route) below the repo selector.
- **Impact**: Users can now create teams, collaborate on shared repos, and manage team-level environment variables that cascade to all team repositories. Access control ensures users only see repos they have permission to access. Legacy repos (migrated without `connectedBy`) remain visible to all users.

## Projects Timeline: Fix Drag-to-Pan on Windows — 2026-02-24

- **Why**: Viewport panning (grab-and-drag to scroll timeline) was completely broken on Windows. Clicking and dragging did nothing, making it impossible to navigate the timeline without scroll/zoom.
- **Root cause**: The refactor from mouse events to pointer events introduced a regression. `e.movementX` returns 0 on Windows when pointer capture is active, so `scrollLeft` never changed during drag operations.
- **Fix**: Rewrote the three pointer handlers (`handlePointerDown`, `handlePointerMove`, `handlePointerUp`) to use absolute `clientX` delta instead of incremental `movementX`. The new implementation tracks `{ startX: number; startScroll: number }` in a single `dragRef`, computes `delta = startX - clientX`, and applies `startScroll + delta` for reliable cross-platform panning.
- **Movement threshold**: The implementation only sets `isDragging(true)` when `|delta| > DRAG_THRESHOLD_PX` (4px), allowing clicks on project bars/labels to pass through naturally without suppression. Changed `onPointerDownCapture` to `onPointerDown` so child elements receive their events first.
- **Impact**: Timeline panning now works reliably on all platforms (Windows, macOS, Linux) using absolute position math that avoids accumulated errors from incremental deltas.

## MCP Server: Fix OAuth 302 Redirect for Third-Party Clients — 2026-02-23

- **Why**: The `POST /oauth/authorize` endpoint rendered an HTML page with a hidden iframe to deliver the authorization code. This worked for Claude Desktop's popup-based flow but broke for any other MCP client (ChatGPT, Cursor, etc.) that expected a standard OAuth 302 redirect. Third-party clients would hang forever waiting for the redirect callback.
- **Root cause**: `renderRedirectPage()` function rendered HTML with `<iframe src="${callbackUrl}">` instead of issuing an HTTP 302 redirect. This was designed for popup windows but violated the OAuth 2.1 spec (RFC 6749 Section 4.1.2) which requires a 302 redirect to `redirect_uri?code={code}&state={state}`.
- **Fix**: Replaced `res.type("html").send(renderRedirectPage(redirectUrl))` with `res.redirect(redirectUrl)` in the POST handler. Deleted the `renderRedirectPage` function entirely.
- **Impact**: The OAuth flow now works universally — Claude Desktop popups, third-party MCP clients in tabs, embedded browsers. All follow 302 redirects correctly.

## Repos: Add Connection Status Tracking — 2026-02-22

- **Why**: When users revoked access to a repo via GitHub, the repo remained in the list showing no indication it was no longer connected. Users had no way to distinguish between active and disconnected repos.
- **Schema change**: Added optional `connected` boolean field to `githubRepos` table to track repo accessibility status.
- **Sync detection**: Modified `syncRepos` action to compare repos returned by GitHub API against stored repos. Repos no longer accessible are marked `connected: false`; newly found repos are marked `connected: true`. Added `syncConnectedStatus` internal mutation to handle bulk status updates.
- **UI indicator**: Added red "Disconnected" badge to repo cards when `connected: false`. GitHub icon also dims for disconnected repos, providing visual feedback that access has been revoked.

## Repos Page: Onboarding UI Overhaul — 2026-02-22

- **Why**: The previous empty state was a sparse icon + button with no context. New users had no understanding of what the platform offered before connecting GitHub. The welcome banner was also minimal and gave little guidance once repos were connected.
- **Empty state redesigned** into a full `EmptyOnboarding` component: a 3-step progress indicator, a focused CTA section (connect GitHub), and a feature preview grid of four platform sections (Projects, Sessions, Quick Tasks, Documents) with descriptions.
- **WelcomeBanner improved** into a "Getting started with Eva" guide with a 4-column feature grid, showing each tool's name and purpose. Now animated in/out with `motion/react` via `AnimatePresence`.
- **State lifted**: Welcome-dismissed state moved from inside `WelcomeBanner` to `ReposClient` so the parent controls conditional rendering, and `AnimatePresence` can handle the exit animation cleanly.

## MCP Server: Convex HTTP Action Bug Fixes — 2026-02-22

- **Why**: Two bugs prevented the MCP server from bootstrapping after deployment. First, the Convex bundler rejected `http.ts` because it statically imported `mcpRoutes.ts` → `encryption.ts` → `node:crypto`, and Convex's V8 HTTP router cannot have Node.js APIs in its import chain. Second, the bootstrap and env-vars endpoints were being called on the wrong domain — Convex HTTP actions are served at `.convex.site`, not `.convex.cloud`, but `CONVEX_CLOUD_URL` uses `.convex.cloud`.
- **`node:crypto` fix**: Restructured `http.ts` to define handlers inline with no static imports of node-specific code. The `/api/mcp/env-vars` handler now delegates env var decryption to `mcpRoutes.getDecryptedRepoEnvVars` (a Node.js `internalAction`) via `ctx.runAction` at runtime, keeping the V8 bundle free of `node:crypto`.
- **`.convex.site` fix**: Added `toSiteUrl()` helper in `convex-api.ts` that derives the `.convex.site` domain from the `.convex.cloud` URL. Bootstrap and env-vars calls now use the site URL; all other Convex REST API calls (`/api/query`, `/api/run_test_function`) continue using `.convex.cloud`.
- **Troubleshooting docs**: Updated README with specific error messages for 401/404/500 bootstrap failures, added the Convex deployment step to setup instructions, and documented the `.convex.cloud` vs `.convex.site` URL distinction.

## Remove Sandpack/CodeSandbox from Design Sessions — 2026-02-22

- **Why**: The `@codesandbox/sandpack-react` package was only used for a legacy preview path (`LegacySandpackPreview`) for old design session variations that stored raw React component code in a `code` field. The modern flow uses Daytona sandboxes with iframe previews. The legacy path was dead weight adding a large dependency.
- **Removed**: `LegacySandpackPreview` component, `SandpackConfig` interface, `isLegacyVariation` helper, and `sandpackConfig` prop from `DesignDetailClient`. Removed `getSandpackConfig()` and all CSS/theme extraction logic from `page.tsx`.
- **Schema cleanup**: Removed `code` field from `variationValidator` in `designSessions.ts` and from `schema.ts`. Ran a one-time DB migration (`migrateRemoveLegacyCode`) to strip the field from all existing documents, then removed the migration function.
- **Package removed**: `@codesandbox/sandpack-react` uninstalled from `apps/web`.

## MCP Server: Repo-Aware Queries Without Credential Exposure — 2026-02-22

- **Why**: The previous `get_repo_env_vars` tool returned decrypted environment variable values (API keys, database URLs) as MCP tool output, making credentials visible to Claude and users. This violated the security requirement that only query results should be returned, never credential values.
- **Removed**: `get_repo_env_vars` tool — no longer exposes env var values.
- **Repo-aware queries**: All 5 query tools (`list_tables`, `query_table`, `get_document`, `run_query`, `count_table`) now accept an optional `repoId` parameter. When provided, the MCP server internally fetches that repo's Convex credentials from Conductor's `repoEnvVars`, resolves the correct Convex URL and deploy key, and queries that repo's database — credentials never leave server memory.
- **New function**: `getRepoConvexCredentials()` in `convex-api.ts` fetches repo env vars, extracts `NEXT_PUBLIC_CONVEX_URL`/`CONVEX_URL` and `CONVEX_DEPLOY_KEY`/`CONVEX_ADMIN_KEY`, and caches them by repoId.
- **New helper**: `resolveTarget()` in `tools.ts` determines whether a query targets Conductor's Convex (default) or a repo's own Convex (when `repoId` provided).
- **User experience**: Claude calls `list_repos`, user picks a repo, Claude adds `repoId` to subsequent query tools. All credential resolution happens server-side; only results are returned.

## MCP Server: Auth-Only Setup + Codebase Env Var Injection — 2026-02-22

- **Why**: The MCP server required `CONDUCTOR_DEPLOY_KEY` as an MCP server env var (Railway), which was redundant config to manage separately from the Convex deployment. Users also had no way to select a codebase and get its env vars injected into Claude's context.
- **Deploy key bootstrap**: `CONDUCTOR_DEPLOY_KEY` is now stored only in Convex env vars. On first tool call, the MCP server fetches it via `GET /api/mcp/bootstrap` (authenticated with `MCPBootstrap {MCP_JWT_SECRET}`) and caches it in memory. Removed from Railway/MCP server env vars.
- **New Convex HTTP routes** (`packages/backend/convex/http.ts` + `mcpRoutes.ts`): `GET /api/mcp/bootstrap` returns the deploy key; `POST /api/mcp/env-vars` returns decrypted env vars for a given repo (using `repoEnvVars.getForSandbox` + `decryptValue`).
- **New MCP tools**: `list_repos` (lists all connected GitHub repos) and `get_repo_env_vars` (returns decrypted per-repo env vars). Claude now prompts the user to pick a codebase, then injects that repo's vars into context.
- **`ConvexCredentials` interface change**: Removed `deployKey` field, added `clerkUserId`. Deploy key is lazily bootstrapped in `convex-api.ts` and cached module-level.
- **Architectural reason**: Centralising the deploy key in Convex env vars means it's managed in one place alongside `ENCRYPTION_KEY` and other backend secrets, rather than duplicated across two deployments.

## Documents and Testing Arena Sidebar Migration — 2026-02-22

- **Why**: Documents and Testing Arena had their own `SidebarLayoutWrapper`-based secondary sidebars inside the page layout, inconsistent with how Design, Sessions, Analyse, and Admin work through the main sidebar context panel.
- **Solution**: Created `DocsSidebar` and `TestingArenaSidebar` components and wired them into the main `Sidebar.tsx` context panel pattern. Both nav items now transition the sidebar instead of rendering a separate panel.
- **DocsSidebar**: Search + doc list with delete (dots menu), create new untitled doc via `+` button, Upload PRD button at sidebar bottom. All logic moved from `DocsClient` + `DocsList`.
- **TestingArenaSidebar**: Search + doc list as test targets, "Test All" confirmation dialog triggered by `+` button. All logic moved from `TestingArenaClient`.
- **Deleted**: `DocsClient.tsx`, `TestingArenaClient.tsx`, `DocsList.tsx` — all now unused; layouts simplified to `{children}`.

## Admin Elevated to Sidebar Context Panel — 2026-02-22

- **Why**: Admin was buried in a three-dots dropdown at the sidebar footer, making it hard to discover and inconsistent with how other sections (Design, Sessions, Analyse) work.
- **Solution**: Added "Admin" as a first-class sidebar nav item under an ADMIN group. Clicking it opens a context sidebar panel (same pattern as Design/Sessions/Analyse) with links to Overview, Stats, Env Variables, and Snapshots.
- **New file**: `apps/web/lib/components/sidebar/AdminSidebar.tsx` — simple static nav, no Convex queries needed, renders immediately without waiting for repo data.
- **Sidebar changes**: Added `"admin"` to `ContextSidebarMode`, `CONTEXT_SIDEBAR_BY_NAV_NAME`, and `getInitialContextSidebarMode`. `+` create button is hidden when in admin context mode. Admin removed from footer dropdown.
- **Admin layout simplified**: Removed `SidebarLayoutWrapper` and the duplicated secondary sidebar from `admin/layout.tsx` — now just renders `{children}` directly.

## Per-Repo Snapshot Management (GitHub Actions) — 2026-02-20

- **Why**: All sandboxes used a hardcoded `eva-snapshot` rebuilt daily by a GitHub Action. Users couldn't control when snapshots rebuild, customize their setup, or manage snapshots for different repos independently. The initial Daytona SDK approach hit sandbox storage limitations during image builds.
- **Solution**: New admin UI (Admin > Snapshots) lets users configure per-repo Daytona snapshots with custom rebuild schedules (daily/every 3 days/weekly/manual), custom setup commands, and custom environment variables baked into the snapshot image.
- **Dynamic crons**: Uses `@convex-dev/crons` component for per-repo dynamic scheduling — each repo gets its own independent cron job that self-registers and self-deletes when the schedule changes.
- **GitHub Actions build**: Instead of building snapshots via Daytona SDK (which has storage limits), Convex triggers a `workflow_dispatch` on the repo's `rebuild-snapshot.yml` GitHub Action. The workflow generates a Dockerfile dynamically, builds the Docker image on GitHub's runner (14GB+ disk), and pushes to Daytona via CLI. Convex polls the GitHub Actions API for completion.
- **Per-repo setup**: Each repo needs `rebuild-snapshot.yml` workflow file + `DAYTONA_API_KEY` GitHub secret + `SNAPSHOT_GITHUB_PAT` (with `actions:write` scope) in Admin > Env Variables.
- **Fallback**: Repos without a snapshot config continue using the global `eva-snapshot`.
- **New tables**: `repoSnapshots` (config per repo) and `snapshotBuilds` (build history with logs, `workflowRunId` for GitHub Actions link).

## MCP Server: Clerk Authentication — 2026-02-20

- **Why**: MCP server required users to manually enter a Convex deployment URL and deploy key during OAuth authorization. This was disconnected from the main app's auth — users already have Conductor accounts via Clerk, yet had to provide raw credentials for the MCP integration.
- **Solution**: Replaced the manual credential form with Clerk's prebuilt sign-in widget on the OAuth authorize page. After sign-in, the server verifies the Clerk session token server-side (`@clerk/backend`), then issues MCP OAuth tokens containing the user's Clerk ID.
- **Simplification**: MCP tools now use shared `CONVEX_CLOUD_URL` + `CONDUCTOR_DEPLOY_KEY` env vars for all Convex API calls. JWTs are self-contained (no database lookup needed). Removed `tokenStore` in-memory cache, `persistToken`, and `mcpTokens` table dependency. The `mcpTokens` table is now dead code (cleanup in follow-up).
- **New env vars**: `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` required on the MCP server (same values as the web app).

## System Env Var Validation + Infrastructure Category Cleanup — 2026-02-20

- **Why**: Workflows (sessions, projects, tasks, design, testing) failed mid-execution with cryptic errors like "No OAuth accounts available" when required system env vars weren't configured. No upfront validation or user feedback existed. Additionally, the admin UI exposed an "Infrastructure" category for vars that should be Convex env vars, not platform DB entries.
- **Validation**: New `getSetupStatus` Convex query checks if at least 1 OAuth token is configured. `useSetupStatus` hook + `SetupBanner` component show a persistent dismissible alert on all repo pages when setup is incomplete.
- **Hard block**: All 8 workflow trigger points (task execution, session chat, session sandbox auto-start, design send/sandbox, project build, project chat, testing arena) disable their action buttons when no OAuth tokens are configured.
- **Admin UI cleanup**: Removed the Infrastructure category from the System Variables admin page. Only OAuth tokens are shown/addable now — infrastructure vars should live as Convex env vars with process.env fallback.

## MCP Server: Persistent Token Storage — 2026-02-20

- **Why**: MCP server stored OAuth tokens (user Convex credentials) in in-memory Maps. Every Railway deploy/restart wiped all tokens, forcing users to re-authenticate by entering their Convex URL + deploy key again.
- **Solution**: New `mcpTokens` Convex table stores token→credentials mapping with encrypted deploy keys (AES-256-GCM via existing `encryption.ts`). MCP server writes to Convex on token creation (fire-and-forget) and falls back to Convex on cache miss after restart.
- **Architecture**: In-memory Map kept as hot cache for zero-latency reads. Convex actions (`mcpTokensActions.ts`) handle encryption/decryption server-side — MCP server only needs `CONVEX_CLOUD_URL` + `CONDUCTOR_DEPLOY_KEY` env vars, not `ENCRYPTION_KEY`.
- **Graceful degradation**: If Conductor env vars aren't set, server falls back to in-memory-only behavior (current behavior). No breaking changes.

## Chrome Extension Distribution Pipeline — 2026-02-19

- **Why**: The Eva Assist Chrome extension had no distribution pipeline. Team members had to manually load the unpacked `dist/` folder in developer mode, with no auto-update mechanism. This doesn't scale for team adoption.
- **Convex backend**: New `extensionReleases` table stores CRX files in Convex file storage with version tracking. Public `getLatest` query (unauthenticated, required by Chrome's update poller). Admin mutations protected by `EXTENSION_ADMIN_KEY` env var.
- **Update server**: Fixed `apps/web/app/api/updates/extension/route.ts` — previously read from local filesystem (broken on Vercel), now queries Convex for the latest release and serves Omaha-protocol XML. CRX downloads redirect to Convex storage URL.
- **Release script**: `pnpm ext:release` builds the extension, injects `update_url` into the manifest, packs as CRX using Chrome CLI, uploads to Convex storage, and records the release. Chrome auto-updates within ~5 hours.
- **Intune deployment**: PowerShell scripts and README with 4 deployment methods (Settings Catalog, OMA-URI, PowerShell script, manual registry). Uses `normal_installed` mode — auto-installs but users can remove.

## Dynamic System Environment Variables — 2026-02-19

- **Why**: OAuth tokens and infrastructure secrets (CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL, etc.) were hardcoded as Convex environment variable names. Adding/removing OAuth accounts required code changes. This makes the system inflexible and ties it to a specific deployment's env vars.
- **New `systemEnvVars` table**: Stores env vars encrypted at rest (AES-256-GCM) with two categories: `claude_oauth` (OAuth tokens for rate limit rotation) and `infrastructure` (secrets injected into sandboxes). Only bootstrap vars remain as Convex env vars: `ENCRYPTION_KEY`, `DAYTONA_API_KEY`, `CONVEX_CLOUD_URL`.
- **Dynamic OAuth discovery**: `aiAccounts.ts` no longer has a hardcoded 3-element array. `getAvailableAccountKey` dynamically queries `systemEnvVars` for `claude_oauth` entries and picks the first non-limited account. `aiAccountStatus` now references `systemEnvVars` via `accountId`.
- **`resolveSystemEnvVars()` in `daytona.ts`**: Single helper that fetches infrastructure vars + resolves the OAuth token from DB before creating a sandbox. Includes process.env fallback for infrastructure keys during the transition period.
- **Admin UI**: New "System Variables" tab under Admin (admin-gated) for managing system env vars — add, edit, reveal, copy, delete with encrypted storage.

## Remote Convex MCP Server — 2026-02-19

- **Why**: The Analyse page wraps "Claude generates and runs Convex queries" but Claude natively handles this better via MCP connectors. A remote MCP server lets any user connect their Convex deployment to Claude and query data directly — no custom UI needed.
- **Architecture**: Stateless Express server at `apps/mcp/` using `@modelcontextprotocol/sdk` with Streamable HTTP transport. OAuth 2.0 with PKCE flow stores Convex credentials (deployment URL + deploy key) in a signed JWT — no database needed.
- **5 MCP tools**: `list_tables` (schema discovery via `/api/shapes2` + `_system/frontend/getSchemas`), `query_table` (paginated reads via `_system/cli/tableData`), `get_document` (single doc by ID), `count_table` (document count), `run_query` (arbitrary read-only Convex query code via `/api/run_test_function`).
- **`run_query` is the power tool**: Claude writes Convex server-side JS (joins, aggregations, filters) and executes it read-only. Replaces the entire Analyse page workflow.
- **Replaces**: `apps/web/app/(main)/[repo]/analyse/` and related backend (`researchQueries.ts`, `researchQueryWorkflow.ts`, `savedQueries.ts`). Those can be deprecated once this ships.

## Desktop: Fix Slow Tab Switching and Navigation — 2026-02-19

- **Render diff tabs with CSS visibility toggle instead of mount/unmount**: PatchDiff from `@pierre/diffs/react` was being unmounted and remounted from scratch on every diff tab switch — expensive because it re-parses and re-renders the full syntax-highlighted diff. Now uses the same pattern as TerminalView: all diff tabs stay mounted, inactive ones hidden via `display: none`. Wrapped in a memoized `DiffTabContent` component.
- **Defer xterm.js cleanup to next tick**: When navigating away from a session (e.g. clicking the plus button), all TerminalView components unmounted synchronously, each calling `term.dispose()` which tears down WebGL contexts. This blocked the navigation transition. Moved `term.dispose()` into `setTimeout(0)` so cleanup runs after React finishes the transition.
- **Split DiffTabContext into data + actions**: GitPanel only needs `openDiffTab` and `openAllDiffsTab` (actions), but the monolithic context caused it to re-render on every `activeDiffTabId` change (`useContext` bypasses `memo`). Split into `DiffTabDataContext` and `DiffTabActionsContext` — same pattern already used by SessionContext.

## Claude Usage Limit Detection + Auto-Switch + Schedule Later — 2026-02-19

- **Why**: When Claude Code CLI hits usage limits during sandbox execution, tasks silently fail with a generic error. Users have no visibility into why a task failed or when they can retry. With multiple OAuth accounts available, the system should rotate to an available account before giving up.
- **Error classification**: Callback script now captures stderr and classifies errors by pattern-matching rate limit indicators (`usage limit`, `rate_limit_error`, `429`). Extracts reset time when available.
- **Multi-account rotation**: New `aiAccounts.ts` tracks per-account rate limit status. Task and session workflows automatically mark the current account as limited, clear expired limits, and retry with the next available account before failing.
- **Schema additions**: `errorType`/`limitResetAt` on `agentRuns`, `scheduledRetryAt` on `agentTasks`, new `aiAccountStatus` table, `rate_limit` notification type.
- **Frontend**: Rate limit banner in task detail modal with reset time and "Schedule Retry" button. Quick task cards show amber warning styling for rate-limited tasks vs red for generic errors. Rate limit notification type with warning styling.
- **All 11 workflow `handleCompletion` mutations** updated to accept `errorType`, `limitResetAt`, and `accountKey` from the callback script.

## Desktop: Main Process Startup Optimizations — 2026-02-19

- **Disabled default Electron menu**: `Menu.setApplicationMenu(null)` prevents Electron from building a full default menu at startup — wasted work since the app uses a custom frameless titlebar.
- **Reordered startup sequence**: Previously `initDatabase()` → `createWindow()` (which registered handlers + loaded URL). Now: create window + load URL first, then init DB and register handlers while the renderer is loading. The renderer can't send IPC until its preload + React scripts execute, so handlers are ready well before they're needed.
- **Lazy-loaded `simple-git` via dynamic import**: Changed from eager top-level `import { simpleGit }` to async `import("simple-git")` on first git operation. Since `simple-git` is externalized (not bundled), the eager `require()` was adding to handler registration time even though git ops aren't needed until the user opens a session with a repo.

## Desktop: Performance Improvements Round 4 — 2026-02-19

- **Split SessionContext into two contexts**: Single monolithic context caused every consumer to re-render on any session change. Split into `SessionListContext` (sessions array) and `SessionActionsContext` (activeSessionId + callbacks). `HomePage` now only subscribes to actions — no longer re-renders when the session list changes.
- **Memoized provider values**: Both SessionContext and DiffTabContext were creating new value objects every render, defeating `React.memo` on all consumers. Wrapped in `useMemo`.
- **Wrapped key components in `memo`**: `TerminalView`, `GitPanel`, and `SessionSidebar` now skip re-renders when their props haven't changed. Terminal is especially expensive (xterm.js reconciliation).
- **Stabilized GitPanel filters and callbacks**: `stagedFiles`/`unstagedFiles` arrays were recreated every render via `.filter()`, defeating `FileSection` memo. Wrapped in `useMemo`. `handleStageAll`/`handleUnstageAll`/`handleCommit` now read from `status` directly instead of depending on the derived arrays.
- **Reduced git watcher debounce**: 1500ms → 500ms. The old delay made the git panel feel sluggish after file saves. 500ms still coalesces rapid changes but feels responsive.
- **Guarded redundant tab respawn IPC**: Clicking the already-active terminal tab was firing a `tabRespawn` IPC call on every click. Now tracks active tab in a ref and skips the call.
- **SQLite performance pragmas**: Added `synchronous=NORMAL` (safe with WAL), `cache_size=-8000` (8MB page cache), `temp_store=MEMORY` (temp tables in RAM).
- **Eliminated window flash on startup**: Added `show: false` + `ready-to-show` to BrowserWindow — window now appears fully rendered instead of flashing white.

## Encrypt Repo Environment Variables at Rest — 2026-02-19

- **Why**: Env var values were stored as plaintext in Convex, meaning anyone with dashboard access, data exports, or even the public `list` query could see raw secrets. The `list` query was sending real values to the client with only cosmetic client-side masking.
- **Encryption**: AES-256-GCM via `node:crypto`. Values stored as `enc:<base64(iv+ciphertext+tag)>`. Requires `ENCRYPTION_KEY` Convex env var (32-byte hex).
- **Server-side masking**: `list` query now returns `"••••••"` for all values — real values never leave the backend. Removed copy button from UI.
- **Backward compatible**: `decryptValue()` passes through non-prefixed values as plaintext, so existing data works until re-saved through the UI.
- **Architecture**: Split `upsertVar` from mutation to action in new `repoEnvVarsActions.ts` (`"use node"`) since encryption requires Node.js crypto. Decryption added to all 3 sandbox injection points in `daytona.ts`.

## Centralize GitHub API Access in Convex — 2026-02-19

- **Unified GitHub auth across backend**: Moved `syncGitHubRepos` server action and `getWorkflowTokens` GitHub auth logic to Convex actions. All GitHub App token generation now flows through Convex, eliminating duplicated `@octokit/auth-app` code across web and sandbox modules.
- **Refactored task PR creation**: Updated `taskWorkflowActions.ts` to use Octokit instead of raw fetch, consistent with other Convex GitHub actions.
- **Removed GitHub client code from web app**: Deleted `apps/web/lib/github/client.ts` (dead code) and removed `octokit` and `@octokit/auth-app` from web dependencies. GitHub App env vars no longer needed by web — only Convex.
- **Cleaned up dead code**: Removed `getGitHubToken` from sandbox.ts (never imported), deleted `syncGitHubRepos` server action file (migrated to Convex), removed unused GITHUB\_\* env vars from web server env validation.
- **Preserved server action for auth layering**: Kept `getWorkflowTokens` as a Next.js server action (still needs Clerk token) — it now delegates GitHub auth to `getInstallationTokenAction` Convex action. ~20 callers unchanged (same signature).

## Desktop: Performance Improvements Round 3 — 2026-02-19

- **Cached simpleGit instances per repo**: Every git operation was constructing a new `simpleGit()` instance (re-discovering git config each time). Now cached per repo path, eliminating repeated setup across the 8 call sites.
- **WebGL terminal renderer**: Added `@xterm/addon-webgl` for GPU-accelerated terminal rendering. Canvas renderer was the bottleneck during heavy Claude streaming output. Falls back to canvas automatically if WebGL context fails.
- **Debounced ResizeObserver with rAF**: `fitAddon.fit()` + `ptyResize` IPC was firing on every pixel change during window resize. Now coalesced via `requestAnimationFrame` to at most one fit/resize per frame.
- **Fixed handleDelete callback stability**: `handleDelete` in SessionContext depended on `activeSessionId`, causing the callback reference to change on every session switch and breaking all downstream memoization (SessionSidebar → SessionItem). Switched to functional updater for `setActiveSessionId` — now zero deps, stable forever.
- **Lazy session restore (active tab only)**: `SESSION_RESTORE` was spawning PTYs for ALL tabs at once. Now only spawns the active tab's PTY. Added `TAB_RESPAWN` IPC channel so the renderer lazily spawns a tab's PTY when the user clicks it. `spawnPty` is already idempotent (returns immediately if PTY exists).

## Move GitHub API Routes to Convex Actions — 2026-02-19

- **Moved 4 Next.js API routes to Convex actions** (`packages/backend/convex/github.ts`): `getInstallationToken`, `listBranches`, `listRepos`, `createSessionPr`. Centralizes server-side GitHub logic in Convex, consistent with the earlier preview route migration.
- **Web callers updated**: `ChatPanel.tsx` (create-pr), `useBranches.ts` (branches), `RepoSetupClient.tsx` (repos) now use `useAction` from `convex/react` instead of `fetch()` to Next.js API routes.
- **Chrome extension callers updated**: `App.tsx` and `ChatPanel.tsx` now use `useAction(api.github.getInstallationToken)` instead of HTTP fetch to the web app, eliminating the dependency on `CONDUCTOR_URL`/`VITE_API_URL` for these calls.
- **Deleted**: 4 API route files, `useGitHubToken.ts` hook (dead code).
- **Added `octokit` and `@octokit/auth-app`** to `packages/backend` dependencies. GitHub App env vars (`GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) must be set in Convex dashboard.
- **Note**: `apps/web/lib/github/client.ts` still needed by server actions in `actions.ts` files — left as-is for now.

## Desktop: Performance Improvements Round 2 — 2026-02-19

- **Removed StrictMode**: `React.StrictMode` double-fires every effect in dev mode, meaning PTYs spawn→kill→spawn, IPC calls fire twice, and git watchers start→stop→start. Removed it since this is a desktop app where we control the runtime.
- **Per-file diff endpoint**: Clicking a file in the git panel was fetching diffs for ALL files then filtering to one. Added `getFileDiff(repoPath, filePath, staged)` that runs `git diff` scoped to a single file, making diff tab opens near-instant.
- **Memoized GitFileItem, FileSection, TabButton, DiffTabButton**: Wrapped all list-rendered components in `React.memo()`. Removed `useDiffTabContext()` from GitFileItem (passed `onViewDiff` as prop instead) to stop context-change cascades.
- **Stabilized callback references**: Wrapped all GitPanel action handlers in `useCallback`. Changed TabButton/DiffTabButton to accept handler + ID instead of pre-bound closures, so memo actually works.
- **Watcher debounce 500ms → 1500ms**: During heavy file writes (Claude streaming), 500ms debounce triggered `git status` too frequently. 1500ms reduces thrash while still feeling responsive.
- **In-flight refresh guard**: Added ref-based guard to GitPanel's `refresh()` — if a `git status` is already running, the next request is queued and runs after, preventing stacked concurrent calls.

## Desktop: Performance Improvements — 2026-02-19

- **Fixed SQLite N+1 queries**: `selectAllSessions()` was running 1 + N queries (one per session to fetch tabs). Replaced with a single `LEFT JOIN` query that fetches all sessions and tabs in one round-trip, then groups in JS.
- **Eliminated unnecessary full-session reads**: `addTab`, `removeTab`, and `setActiveTab` each loaded the entire session (with all tabs) just to check existence. Replaced with lightweight single-column queries (`sessionExists`, `selectTabPtyId`, `tabExistsInSession`).
- **Removed redundant re-query in SESSION_CREATE**: Handler was calling `getSession()` after `createSession()` + `spawnTab()`. Now constructs the return object directly from what those functions already produce.
- **Batched PTY data before IPC**: Every byte of terminal output was firing a separate IPC message. Added `setImmediate`-based batching that coalesces all chunks within an event loop tick into a single IPC send, reducing hundreds of messages/sec to 1-2 during heavy output.
- **Memoized SessionItem**: Wrapped in `React.memo()` so it only re-renders when its own props change, not on every session list update. Stabilized `handleDelete` callback with `useCallback` to avoid breaking memoization.
- **Added xterm.js scrollback limit**: Set `scrollback: 5000` (was unlimited). Long sessions could accumulate hundreds of thousands of lines, eating memory and slowing rendering.

## Desktop: SQLite Persistence for Sessions — 2026-02-19

- **Replaced in-memory session store with SQLite** (`better-sqlite3`) so sessions, tabs, and preferences survive app restarts. Previously all state was lost on quit.
- **Session restore flow**: On app restart, persisted sessions appear in the sidebar. Clicking one re-spawns PTYs for all tabs (terminal output is blank but the CLI tool restarts). `spawnPty` guard makes this idempotent — safe on already-running sessions.
- **New database module** (`src/main/db/`): `database.ts` (WAL mode, foreign keys, init/close lifecycle), `migrations.ts` (version-stamped via `PRAGMA user_version`), `queries.ts` (typed wrappers with boundary parsing instead of `as` casts).
- **3 tables**: `sessions` (with `last_opened_at` for recency sorting, `pinned` for future use), `tabs` (FK cascade delete), `preferences` (key-value).
- **Recent repos on home page**: Derived from sessions table via `SELECT DISTINCT repo_path`, shown as clickable items that pre-fill the folder path.
- **Preferences IPC**: `preferences:get`/`preferences:set` channels for future settings persistence.
- **App quit no longer deletes sessions**: Removed the `before-quit` loop that cleared all sessions; now just kills PTYs, stops watchers, and closes the DB.
- Native module setup: `better-sqlite3` added to `onlyBuiltDependencies` (root package.json) and `asarUnpack` (electron-builder config).

## Refactor Design Sessions: Sandbox-Based Live Preview — 2026-02-19

- **Switched from Sandpack to live iframe preview**: Design sessions now use a persistent Daytona sandbox with a real dev server instead of Sandpack. Claude writes actual files into the project's `app/design-preview/` directory, and the user sees real previews rendered by the project's own framework with actual Tailwind config/design tokens.
- **Git-tracked design history**: Each design iteration is committed on a `design/{designSessionId}` branch, so design history is tracked in git rather than stored as inline JSON.
- **New sandbox lifecycle**: Added `startSandbox`/`stopSandbox` mutations and `startDesignSandbox` action — lighter than session sandboxes (no code-server, no terminal). Sandbox auto-starts on first message if not running.
- **Workflow uses existing sandbox**: Instead of `setupAndExecute` creating a new sandbox per workflow run, the workflow now uses the already-running persistent sandbox via `launchOnExistingSandbox`.
- **Backward compatibility**: Old design sessions with `variation.code` still render via Sandpack; new sessions with `variation.route` render via iframe.
- **Schema changes**: Added `branchName` to `designSessions`, updated variation shape to include optional `route` and `filePath` fields alongside optional `code`.

## Move Branch Selector from Sidebar to Inline Contexts — 2026-02-19

- Removed the global sidebar branch selector — it stored a branch in `localStorage` but nothing ever read it (dead feature)
- Branch selection is now per-context: standalone tasks, new projects, and testing arena each have their own `BranchSelect` inline component
- **Standalone tasks**: Branch selector appears in the task detail modal sidebar when the task has no project and status is "todo". The selected `baseBranch` is threaded through `triggerExecution` → workflow → `setupAndExecute` so the sandbox checks out the correct base before creating the working branch
- **New projects**: Branch selector added to the create project form. Stored as `baseBranch` on the project document and used when `startDevelopment` / `buildWorkflow` creates the working branch
- **Testing arena**: Branch selector in the header (via nuqs URL state) so evaluations can test against a specific branch. Passed through `startEvaluation` → evaluation workflow → `setupAndExecute` as `baseBranch`
- **Backend**: Added `baseBranch` param to `daytona.setupAndExecute` — when set, runs `git fetch + checkout + pull` on that branch before `setupBranch` creates the working branch. Added `baseBranch` to project schema and `projects.create` mutation
- Created reusable `useBranches` hook (extracted from old `BranchSelector`) and `BranchSelect` controlled component

## Per-Repo Environment Variables + Sidebar Cleanup — 2026-02-19

- **Per-repo env vars**: Users can now configure key-value environment variables per GitHub repo via Admin > Env Variables. Variables are stored in Convex (`repoEnvVars` table), masked in the UI, and automatically injected into Daytona sandboxes when sessions and workflows run — so API keys, tokens, etc. are available to Claude without hardcoding
- **Sandbox injection**: `createSandbox` accepts optional `extraEnvVars` spread before system vars (user vars can't overwrite system vars). `setupAndExecute` and `startSessionSandbox` look up repo env vars via `repoEnvVars.getForSandbox` when `repoId` is provided. All 10+ workflow files now pass `repoId` through to `setupAndExecute`
- **Sidebar footer cleanup**: Replaced bottom nav items (Admin, Inbox, Settings) and standalone theme toggle with a compact dots-menu dropdown (`IconDots`) containing Toggle Theme, Admin (repo-scoped), and Settings — reduces footer clutter

## Snapshot Rebuild: Daily Schedule Instead of Per-Commit — 2026-02-19

- Changed `rebuild-snapshot.yml` trigger from `push` to `main` to a daily cron at 7 AM UTC — avoids unnecessary snapshot rebuilds on every commit when the base image rarely changes
- Added `workflow_dispatch` for manual triggers when needed

## Fix Type Errors + Move View PR to Header — 2026-02-19

- **Regenerated Convex types** — `npx convex codegen` to pick up the new `sessionAudits` module that was missing from the generated API types, fixing `api.sessionAudits` / `internal.sessionAudits` resolution errors
- **Removed invalid `branchName` prop** from `QuickTasksKanbanBoard` and `QuickTasksListView` — `agentTasks` schema doesn't have `branchName`, the card already fetches PR URL from `agentRuns` independently
- **Moved "View PR" badge** from above the prompt input to the ChatPanel header bar, next to "Send for Review" — shows as a mutually exclusive pair: View PR when `prUrl` exists, Send for Review when only `branchName` exists

## Multi-Step Review Modal for Sessions — 2026-02-19

- Replaced the single-step confirmation dialog for "Send for Review" with a 3-step animated modal: Confirm → Auditing Progress → Review Sent
- **Backend: `sessionAudits` table** — mirrors `taskAudits` structure (accessibility, testing, codeReview arrays with pass/fail results + summary). Indexed by `sessionId`
- **Backend: `sessionAudits.ts`** — `getBySession` query (frontend subscribes for real-time status), `startAudit` mutation (creates record + schedules sandbox action), `handleCompletion` callback mutation (sandbox calls back with parsed JSON results), `fail` internal mutation
- **Backend: `runSessionAudit` action in `daytona.ts`** — gets git diff from session sandbox, builds audit prompt (same 3-category format as task audits), launches Claude Haiku via `launchScript` with fire-and-forget nohup pattern. Sandbox calls back to `sessionAudits:handleCompletion` when done
- **Frontend subscribes to real audit status** — `useQuery(api.sessionAudits.getBySession)` reactively updates when the audit record changes. Stagger animation (spinner → checkmark) triggers only when the backend audit completes, not on fake timers
- **Graceful fallback**: if the audit mutation fails to start (e.g. sandbox inactive), the modal falls back to a timer-based animation so the user isn't stuck — the PR was still created successfully
- Fixed dialog spacing: added `space-y-4` to each `motion.div` step wrapper to restore the `gap-4` lost when `AnimatePresence` became the only direct child of `DialogContent`

## Desktop: View All Diffs + Push Button — 2026-02-18

- **PR-style "Review All" diff view** — new "Review All" eye icon in git panel header opens a single tab showing all staged + unstaged diffs in collapsible file cards with status badges, reviewed checkboxes, and a progress summary bar
- **Git push support** — added push button (arrow-up icon) next to the commit button, shows ahead count in tooltip, disabled when nothing to push. Full IPC pipeline: ipc-channels → operations → handlers → preload
- **DiffTab discriminated union** — refactored `DiffTab` into `SingleFileDiffTab | AllFilesDiffTab` to support both single-file and all-files diff views in the same tab system. SessionPage routes to `AllDiffsView` or `PatchDiff` based on tab kind

## Desktop: Diff Tabs in Main Panel — 2026-02-18

- **Moved diffs from inline expansion to center-panel tabs** — clicking a file in the git panel now opens a diff tab alongside terminal tabs (VS Code style) instead of expanding a cramped inline diff inside the narrow git panel
- Created `DiffTabContext` to bridge the `GitPanel` ↔ `SessionPage` sibling gap — shared context holds diff tab state (open, close, focus), provided by `AppShellInner`
- Deterministic tab IDs (`diff:staged:path` / `diff:unstaged:path`) ensure re-clicking a file focuses the existing tab rather than duplicating it
- Diff tabs clear automatically on session switch
- Removed inline expand/collapse logic from `GitFileItem`, deleted the now-unused `DiffViewer` component

## Improve Diff Viewer UI (Web + Desktop) — 2026-02-18

- **Web DiffPanel**: Added unified/split view toggle, word-level inline diff highlighting (`lineDiffType: "word"`), collapsible unchanged regions (`expandUnchanged`), and `+N -N` line count stats in the file sidebar — the bare-bones PatchDiff setup now feels closer to VS Code/GitHub's diff viewer
- **Desktop DiffViewer**: Replaced the custom table-based diff renderer (DiffLine/DiffHunk/DiffFile types, manual line counting, no syntax highlighting) with `@pierre/diffs` PatchDiff — same library used by web, gives syntax highlighting, word-level diffs, and dark theme for free
- **Desktop data flow simplification**: Removed `parseDiff()` in `diff.ts` that split raw git output into typed hunks/lines (100+ lines of parsing code). Replaced with `splitPatchByFile()` that just splits the raw multi-file patch into per-file strings — PatchDiff handles all parsing internally
- Deleted `apps/desktop/src/main/git/diff.ts`, replaced `DiffFile`/`DiffHunk`/`DiffLine` types with single `RawFilePatch` interface

## Replace Session Diff Viewer with @pierre/diffs — 2026-02-18

- Replaced the hand-rolled line-by-line diff renderer with `PatchDiff` from `@pierre/diffs` — the custom renderer had no syntax highlighting, no line numbers, and no inline change highlighting
- `@pierre/diffs` provides Shiki-based syntax highlighting, line numbers, word-level inline diffs, and automatic light/dark theme via Shadow DOM — all for free with zero custom rendering code
- Removed the `DiffLine` component entirely; the file sidebar and header bar are unchanged
- Fixed `as` type assertion in `getConfig` with a proper type guard function

## Desktop: Session-Based Terminal Manager Rearchitecture — 2026-02-18

- **Rearchitected the desktop app from agent-based one-shot workflow to session-based interactive terminal manager** — the app now focuses on being a lightweight IDE wrapper around CLI AI tools (Claude Code, OpenCode, Codex)
- Users select a repo folder, pick a tool, and get an interactive terminal session instead of filling a form to spawn a one-shot `claude --print` agent
- Multiple terminal tabs per session (Claude Code, OpenCode, Codex, Shell) with tab switching that preserves scroll buffer via `display: none`
- New git panel (right sidebar, collapsible) with real-time file status, stage/unstage, inline diffs, and commit — auto-refreshes via chokidar file watcher
- Session sidebar replaces agent sidebar — shows repo name, tab count, and relative time
- Removed all agent and worktree infrastructure (agent runner, worktree manager, agent IPC channels, agent types) — replaced with session store, tab spawner, git operations via `simple-git`
- Added `simple-git` (clean git API) and `chokidar` (file watching) as new dependencies
- Fixed `as Record<string, string>` type assertion in pty/manager.ts with proper `Object.fromEntries` + filter

## Desktop: Folder Picker + Optional Worktree — 2026-02-18

- Replaced manual repo path text input with a native OS folder picker dialog — eliminates typos and invalid paths
- Added "Create worktree" checkbox (default: checked) so users can run agents directly in a repo without creating a worktree/branch
- When worktree is unchecked, branch input is hidden and agent spawns directly in the selected folder
- `killAgent` now skips worktree removal when no worktree was created (checks `worktreePath` is non-empty)
- New `dialog:openDirectory` IPC channel wired through preload bridge to Electron's `dialog.showOpenDialog`
- **Fixed node-pty native module crash**: Config file was named `electron-vite.config.ts` (hyphens) but electron-vite v3 expects `electron.vite.config.ts` (dots) — the entire config was silently ignored, so `externalizeDepsPlugin()` never ran and node-pty was bundled inline instead of externalized. Renamed file; main bundle dropped from 54KB to 10KB.
- Added `asarUnpack` for `node-pty` in electron-builder config so native `.node` binaries are accessible outside the asar archive in distribution builds

## Improve Project Timeline UI — 2026-02-18

- Increased row height (36→40px) and label column width (192→200px) for better readability
- Adaptive day label spacing based on zoom level — prevents label overlap at low zoom
- Alternating month shading in header for visual rhythm
- Phase-colored dot next to project labels in the sidebar column
- Alternating row backgrounds with hover highlight
- Timeline bars use vibrant phase colors (rounded-full, 8px height) with tooltip showing title + date range
- Today indicator: solid primary dot + vertical line replacing faint text
- Deadline markers: centered diamond shape at row midpoint
- Undated projects section: accent strip pattern with phase-colored left border
- "Today" button with dot indicator for quick navigation

## Add List View Toggle to Projects & Quick Tasks Pages — 2026-02-18

- Added list view as a third view option on the Projects page (alongside kanban and timeline)
- Added kanban/list view toggle to the Quick Tasks page (previously had no toggle)
- List views show items grouped by section (phase for projects, status for tasks) with collapsible headers
- Both list views reuse existing card components (ProjectCard, QuickTaskCard) for consistent behavior
- Quick Tasks list view includes the "Fix All" button in the todo section header, status filtering, and selection mode support
- View state persisted in URL via nuqs (`quickTaskViewParser` added to search-params.ts, `projectViewParser` expanded to include "list")

## Complete Inngest Removal — Migrate Session Sandbox + Project Cleanup to Convex — 2026-02-17

- Migrated final 3 Inngest functions (`startSandbox`, `stopSandbox`, `cleanupProjectSandbox`) to Convex
- Added `deleteSandbox` internalAction in `daytona.ts` — fire-and-forget sandbox deletion reused by session stop and project cleanup
- Added `startSessionSandbox` internalAction in `daytona.ts` — creates/reuses Daytona sandbox, sets up git + pnpm install + dev server + code-server, calls `sandboxReady`/`sandboxError` mutations when done
- Added `startSandbox`, `stopSandbox`, `sandboxReady`, `sandboxError` to `sessions.ts` — public mutations use `ctx.scheduler.runAfter` pattern (no workflows needed)
- Updated `clearProjectSandbox` in `projects.ts` to also schedule sandbox deletion via `deleteSandbox`
- Updated frontend: `SessionsSidebar.tsx`, `SessionDetailClient.tsx`, `ProjectActiveLayout.tsx` — replaced `fetch("/api/inngest/send")` with direct Convex mutations
- Created `apps/web/lib/sandbox.ts` with PTY/WebSocket utilities moved from `inngest/sandbox.ts`
- **Fully removed Inngest**: deleted all files under `apps/web/lib/inngest/` and `apps/web/app/api/inngest/`, removed `inngest` dependency from package.json, removed `pnpm inngest` script
- Updated CLAUDE.md to remove all Inngest references

## Migrate Task Execution + Build Project from Inngest to Convex Workflows — 2026-02-17

- Migrated `executeTask` and `buildProject` from Inngest background jobs to Convex Workflows for durable orchestration
- Created `taskWorkflow.ts` with task execution workflow: sandbox setup, Claude CLI execution, PR creation, subtask completion, notifications, and post-execution code audits
- Created `taskWorkflowActions.ts` with Node.js-specific actions (GitHub PR creation) separated from the workflow file per Convex runtime constraints
- Created `buildWorkflow.ts` with sequential project build workflow that orchestrates multiple task executions using inter-workflow events (`buildTaskDoneEvent`)
- Updated three frontend components (TaskDetailModal, QuickTasksKanbanBoard, ProjectDetailClient) to use Convex mutations instead of `fetch("/api/inngest/send")`
- Added `activeWorkflowId` to agentTasks and `activeBuildWorkflowId` to projects schema for workflow event routing
- Removed dead code: deleted `agentExecution.ts` and removed auto-execute logic from `moveToColumn` (never called from frontend)
- Updated chrome extension `App.tsx` to use Convex `triggerExecution` mutation instead of `fetch` to Inngest, using `/api/github/installation-token` for GitHub tokens
- Deleted `execute-task.ts` and `build-project.ts` Inngest functions; remaining Inngest functions: startSandbox, stopSandbox, cleanupProjectSandbox
- Migrated `runAudit` from synchronous Convex action to Daytona fire-and-forget pattern (`launchAudit` in `daytona.ts` + `auditCompleteEvent`/`handleAuditCompletion` callback)
- `activeWorkflowId` is now cleared at end of workflow (after audit completes) instead of in `completeRun`, so audit callback can route events
- Added `extractJsonBlock` helper in `taskWorkflow.ts` to replace `LlmJson` dependency (regex-based JSON extraction from raw LLM output)
- Stripped `taskWorkflowActions.ts` down to only `createPullRequest` (removed `runAudit`, `LlmJson`, `Daytona` imports)

## Resizable console/terminal panel in session preview — 2026-02-17

- Replaced fixed `h-64` console/terminal drawer with a draggable resizable panel using `react-resizable-panels`
- When `showConsole` is true, the preview area splits into a vertical `Group` with a drag handle between the iframe and the console/terminal tabs
- Preview panel defaults to 70%, console/terminal to 30%, with min 80px each and max 400px for the bottom panel
- When `showConsole` is false, the iframe fills the full space (no panel group mounted)
- Tab content uses `flex-1 min-h-0` instead of fixed `h-64` so it fills whatever size the user drags to
- Added `data-[state=inactive]:hidden` on `forceMount` `TabsContent` to fix both panels being visible simultaneously
- Drag handle has a subtle `IconGripHorizontal` indicator and highlights on hover/active

## SearchInput component + PageWrapper centering fix — 2026-02-17

- Added `inputClassName` prop to `SearchInput` for sidebar-specific border/bg styling
- Fixed `PageWrapper` `headerCenter` to use absolute positioning so the search bar stays visually centered regardless of title/right content width
- Migrated all 7 inline search bar instances to use `SearchInput`:
  - `ProjectsClient`, `QuickTasksClient` (page headers)
  - `TestingArenaClient` DocsListPanel, `DocsList` (panel search)
  - `AnalyseSidebar`, `SessionsSidebar`, `DesignSessionsSidebar` (sidebar search with custom sidebar styling via `inputClassName`)

## Migrate Session Execute from Inngest to Convex Workflows — 2026-02-17

- Migrated `sessionExecute` (execute, ask, plan modes) from Inngest to Convex Workflows with fire-and-forget sandbox pattern
- Created `sessionWorkflow.ts` with single unified workflow handling all 3 modes, prompt builders, diff parsing, and supporting internal functions
- Added `runSandboxCommand` internalAction to `daytona.ts` for post-completion sandbox operations (git diff capture, plan.md reading)
- Updated `getOrCreateSandbox` in `daytona.ts` to sync repo (fresh GitHub token + git pull) when reusing existing sandboxes
- Execute mode captures git diffs via `runSandboxCommand` after Claude completes, plan mode reads `plan.md` content
- Workflow supports cancel via `workflow.cancel` — replaces Inngest `cancelOn` event pattern
- Updated web ChatPanel.tsx to use Convex mutations (`startExecute`, `cancelExecution`) instead of `fetch("/api/inngest/send")`
- Updated chrome extension ChatPanel.tsx to call Convex mutation directly instead of Inngest API endpoint
- Deleted `session-execute.ts` and removed from Inngest route registration
- Remaining Inngest functions: executeTask, buildProject, startSandbox, stopSandbox, cleanupProjectSandbox

## Migrate Research Query Workflows from Inngest to Convex — 2026-02-17

- Migrated `generateResearchQuery` and `confirmResearchQuery` from Inngest to Convex Workflows with fire-and-forget sandbox pattern
- Created `researchQueryWorkflow.ts` with both workflows, shared completion event, prompt builders, and all supporting internal functions
- Added `extraEnvVarNames` arg to `setupAndExecute` in `daytona.ts` — workflows specify env var names, the action reads values from `process.env` (keeps secrets out of workflow args)
- Added missing sandbox env vars (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_ENV`) to `createSandbox` to match Inngest parity
- Confirm workflow reuses the sandbox from the generate step via `sandboxId` stored on the research query document, avoiding redundant sandbox creation
- Added `activeWorkflowId` and `sandboxId` fields to `researchQueries` schema
- Updated `QueryDetailClient.tsx` to use Convex mutations with `getWorkflowTokens` instead of `fetch("/api/inngest/send")`
- Added ActivitySteps streaming UI to the research query page
- Deleted `execute-research-query.ts` and removed both functions from Inngest route
- Remaining Inngest functions: executeTask, buildProject, sessionExecute, startSandbox, stopSandbox, cleanupProjectSandbox

## Migrate 6 Remaining Inngest Functions to Convex Workflows — 2026-02-16

- Migrated `summarizeSession`, `docPrdUpload`, `evaluateDoc`, `docInterview`, `interviewQuestion`, and `generateTests` from Inngest background jobs to Convex Workflow (`@convex-dev/workflow`)
- Generalized `daytona.ts` with shared utilities: `buildCallbackScript(completionMutation, entityIdField)`, `launchScript(sandbox, prompt, ...)`, `setupBranch(sandbox, branchName)`, and a new generic `setupAndExecute` internalAction used by all workflows
- Created shared `getWorkflowTokens(installationId)` server action in `apps/web/app/(main)/[repo]/actions.ts`, replacing per-feature token fetching
- Split interview workflows (docInterview, projectInterview) into separate question and generate/spec workflows, with `ready: true` detection on the frontend triggering the second phase
- Added `activeWorkflowId` field to sessions, docs, projects, and evaluationReports tables for workflow event routing
- Replaced all `fetch("/api/inngest/send")` calls in 8 frontend files with direct Convex mutation calls
- Deleted 6 Inngest function files and removed their exports/registrations from `inngest/index.ts` and `api/inngest/route.ts`
- Remaining Inngest functions: executeTask, buildProject, sessionExecute, startSandbox, stopSandbox, cleanupProjectSandbox, generateResearchQuery, confirmResearchQuery

## Migrate Design Sessions from Inngest to Convex Workflow — 2026-02-16

- Migrated design session execution from Inngest background jobs to Convex Workflow (`@convex-dev/workflow`) for durable orchestration with retry/timeout semantics
- Moved all sandbox operations (Daytona SDK calls, Claude CLI execution) into `packages/backend/convex/daytona.ts` as a Convex `internalAction`
- Sandbox callback now authenticates via Clerk JWT token passed through the workflow chain, calling Convex mutations directly via the HTTP API (`POST /api/mutation`) with `Authorization: Bearer <jwt>`
- Removed custom HTTP endpoints (`http.ts`) and callback token storage — auth is handled by Clerk, not custom tokens
- Moved GitHub App token generation to a Next.js server action (`getDesignTokens`) since `@octokit/auth-app` crypto doesn't work in Convex's Node.js runtime
- Moved design prompt building logic from `apps/web/lib/prompts/designPrompts.ts` into `packages/backend/convex/designWorkflow.ts` to keep it co-located with the workflow
- Created `WorkflowManager` singleton (`workflowManager.ts`) with retry defaults (3 attempts, exponential backoff)
- Removed `callbackTokens` table and `callbackToken` field from `designSessions` schema
- Deleted `apps/web/lib/inngest/functions/design-execute.ts` and removed design exports from Inngest config
- Added `convex` to Dockerfile global install + `NODE_PATH` for future sandbox script improvements

## Activity Steps — Chain of Thought UI for Streaming Logs — 2026-02-13

- Installed Chain of Thought component from AI Elements SDK into `packages/ui/src/ai-elements/chain-of-thought.tsx`
- Created `ActivitySteps` wrapper component with custom step types (read, edit, write, bash, search_files, search_code, web_fetch, web_search, subtask, notebook, tool) and icon mapping
- Modified `runClaudeCLIStreaming` in sandbox.ts to accumulate structured `ActivityStep[]` objects instead of flat text, storing JSON in `currentActivity` and `activityLog`
- Created `parseActivitySteps` utility for backward-compatible parsing (JSON or legacy plain text)
- Updated `ChatPanel.tsx` (sessions) to render steps via `<ActivitySteps>` for both real-time streaming and historical activity logs
- Updated `ProjectTaskDetailPanel.tsx` (project tasks) to render steps via `<ActivitySteps>` for real-time streaming display
- Replaced raw text activity logs with a step-by-step Chain of Thought UI showing each tool call (read, edit, write, bash, search, etc.) as a distinct step with icons and status indicators
- Backend now accumulates structured steps during Claude CLI execution instead of flat text strings
- Sessions chat panel and project task detail panel both display the new step-by-step UI for real-time streaming and historical logs
- Old session data with plain-text logs continues to render correctly via automatic fallback

## Restyle to shadcn Nova + Neutral + Teal — 2026-02-12

- **CSS Variables**: Neutralized all teal-tinted grays (foreground, card-foreground, popover-foreground, sidebar colors) to pure neutral (0 chroma) in both light and dark mode. Updated primary hue from 178° to 183.788° to match shadcn teal preset. Reduced `--radius` from 0.75rem to 0.625rem. Darkened dark mode background from 0.182 to 0.145, bumped muted-foreground to 0.708 for better contrast.
- **UI Primitives (packages/ui)**: Applied Nova compact sizing — buttons (h-10→h-9, h-9→h-8, h-11→h-10), inputs (h-10→h-9), tabs (h-9→h-8), card padding (p-6→p-5), dialog (gap-5 p-7 rounded-2xl → gap-4 p-6 rounded-xl), badge (rounded-full→rounded-md), dropdown items (rounded-lg→rounded-sm, py-2→py-1.5), popover (rounded-xl→rounded-lg, p-4→p-3). Removed glass effects from dropdowns/popovers (no more /bg-popover/90).
- **App Components**: Compacted PageWrapper (px-5→px-4, py-3→py-2.5, title text-xl→text-lg), Container gaps/padding reduced by 1 step, EmptyState (py-20→py-16, icon w-14→w-12), SidebarLayoutWrapper headers reduced, Sidebar nav items (py-2.5→py-2), kanban column/board gaps, project cards (p-4→p-3), quick task cards (p-3→p-2.5), docs list items, active tasks accordion trigger.
- **Page Layouts**: Repo layout rounded-l-2xl→rounded-l-xl, sidebar item padding reduced across sessions/design/analyse/admin layouts, inbox item padding reduced, repos grid gap reduced.
- **Chrome Extension**: Synced all CSS variables to match web app — neutralized grays, updated primary hue, reduced radius from 1rem to 0.625rem.

## Apple Design System Overhaul — Neutral Palette, Glass Effects, Pill Shapes — 2026-02-12

- **Phase 1 — Design Foundations**: Shifted all teal-tinted grays to pure neutral grays (light + dark mode), softer diffused shadows (Apple-style barely-there depth), bumped `--radius` to 14px, tighter letter spacing (-0.02em), added `.glass` utility for frosted glass surfaces
- **Phase 2 — Layout & Navigation**: Sidebar gets frosted glass effect on desktop, nav items use explicit teal for active state (`bg-primary/10 text-primary`), taller nav items (40px), rounder pill shape (`rounded-lg`), stronger hover feedback, more breathing room in group headers, footer divider, page titles bumped to `text-xl`, increased padding throughout PageWrapper and Container, sidebar layout width to 320px, content area rounded to `rounded-l-2xl`
- **Phase 3 — Components**: Cards `rounded-xl`, buttons `rounded-lg` with taller sizes (h-10 default), badges pill-shaped (`rounded-full`), inputs taller with `rounded-lg`, dialogs `rounded-2xl` with lighter overlay + stronger blur, popovers/dropdowns get glass effect (` bg-popover/90`), dropdown items `rounded-lg` with more padding, tabs get active shadow lift, empty state larger icon container + title, kanban columns more padding + gap, quick task cards subtler shadow, project cards rounder with hover shadow

## Apple Design Philosophy Pass — Border Reduction, Frosted Glass, Selection Styling — 2026-02-12

- Removed `border-b border-border` from PageWrapper header — sections now separated by whitespace and typography hierarchy
- Removed `border-b border-border` from both SidebarLayoutWrapper headers (mobile + desktop) — same Apple-style space separation
- Removed `border-t border-sidebar-border` from Sidebar bottom user section — reduces visual noise
- Added ``to Dialog overlay for Apple's frosted glass effect, lightened overlay from`bg-black/50`to`bg-black/40`
- Bumped Dialog content from `rounded-md` to `rounded-lg` for Apple's generous modal corner radius
- Added `::selection { background: rgb(var(--primary) / 0.15) }` for tinted text selection highlighting

## Apple/Linear Design Polish — Rounder Corners, Better Spacing, Font Smoothing — 2026-02-12

- Bumped global `--radius` from `0.5rem` to `0.625rem` (both light and dark themes) — cascades through all UI primitives: `rounded-md` is now 8px (was 6px), `rounded-lg` is 10px (was 8px)
- Added `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` to body for Apple-style text rendering
- Increased PageWrapper header/content padding from `px-4 py-2.5`/`px-4 py-2` to `px-5 py-3` for more breathing room
- Increased SidebarLayoutWrapper header padding (`py-2.5` → `py-3`) and mobile top bar (`py-2` → `py-2.5`)
- Increased main sidebar nav item padding (`py-1.5` → `py-2`) and bottom section separation (`pt-3` → `pt-4`)
- Matched inner sidebar items to new nav density (`py-1.5` → `py-2`) across sessions, analyse, admin, design, docs, testing-arena, and active tasks accordion
- Increased card spacing: QuickTaskCard (`p-2` → `p-3`), ProjectCard (`p-3` → `p-4`), KanbanColumn header/content (`p-2` → `p-3`), RepoHome stat cards (`p-4` → `p-5`)
- Removed redundant `rounded-md` from KanbanColumn and ProjectCard (Card primitive now handles it at 8px)
- Increased kanban column gaps from `gap-2` to `gap-3` in both KanbanBoard and ProjectsClient
- Increased Container padding (`px-2 md:px-4 pt-2 md:pt-4` → `px-3 md:px-5 pt-3 md:pt-5`)
- Increased EmptyState generosity: `py-16` → `py-20`, icon `w-12 h-12` → `w-14 h-14`, spacing adjustments

## UI Consistency Pass — Inner Sidebars, Chat Bubbles, Page Density — 2026-02-12

- Standardized all inner sidebar list items (sessions, analyse, design, docs, testing-arena, admin) to match main sidebar: `rounded-md`, `py-1.5`, `duration-150`
- Tightened chat message bubbles from `rounded-2xl` to `rounded-xl` across sessions, analyse, design, and plan context panel
- Compacted repo home stats (smaller padding, text sizes, removed logo pill background)
- Tightened repo listing cards (`p-3`, `text-sm`, `duration-150`)
- Tightened inbox notification items (`py-2.5`, `rounded-md`, `duration-150`)
- Standardized all animation durations to 150ms (from mixed 200ms/300ms) across MultipleChoiceQuestion, QueryDetailClient, DesignDetailClient
- Reduced admin sidebar icon size from 20px to 16px to match rest of sidebar

## Linear/Notion-style UI Polish — 2026-02-12

- Tightened global `--radius` from `0.8rem` to `0.5rem` (both light and dark) — cascades through all buttons, cards, inputs, dialogs
- Neutralized border colors (`--border`, `--input`, `--sidebar-border`) from teal-tinted to neutral gray in both themes
- Sidebar: added `bg-sidebar` background + `border-r border-sidebar-border` separator, removed logo pill shape, compacted nav items (`rounded-md`, `py-1.5`, `text-[13px]`), added `border-t` on user section
- Sidebar active/hover states now use sidebar-specific tokens (`bg-sidebar-accent`, `text-sidebar-primary`)
- Group labels: `text-[11px] font-medium`, tighter spacing (`space-y-1` between groups, `space-y-px` between items)
- PageWrapper: added `border-b border-border` header separator, `text-base` title, `rounded-md` back button
- SidebarLayoutWrapper: added `border-r border-border` and `border-b border-border` to inner sidebar/headers, `text-base` titles
- Main content panels: `lg:rounded-l-xl` (tighter corner), `duration-150` transitions throughout

## Inbox Page + Projects Timeline View — 2026-02-12

- Created full-page `/inbox` route with its own layout (Sidebar + MainContent, no RepoProvider)
- Extracted shared `notification-config.tsx` (typeConfig, NotificationIcon, Notification type) from popover into `lib/components/notifications/`
- Refactored `NotificationsPopoverClient` to import from shared config and added "View all" link to `/inbox`
- Inbox page: All/Unread filter (nuqs), notification list with type icons, click-to-navigate + mark-as-read, "Mark all read" button
- Added Inbox nav item with unread count badge to sidebar bottom navigation
- Created `ProjectsTimeline` component: interactive drag-to-pan, Ctrl+scroll to zoom, pixel-based coordinate system with padded date range for exploring past/future
- Today marker (primary vertical line), phase-colored bars, click opens ProjectCardModal
- Added `deadline` field to projects schema, projectValidator, and update mutation
- Deadline date picker in ProjectCardModal sidebar (red-styled label)
- Deadlines render as red diamond markers with vertical line on the timeline, with tooltip showing date
- Added Kanban/Timeline view toggle to Projects page toolbar (nuqs-controlled `view` param)
- Both views share the same search, phase filter, and sort controls
- Added `inboxFilterParser` and `projectViewParser` to `search-params.ts`

## Project Card Modal — 2026-02-12

- Added `projectLead`, `members`, `startDate`, `endDate` optional fields to the `projects` schema
- Extended `projects.update` mutation to accept the new fields
- Created `ProjectCardModal` component with two-column layout: left shows description + progress bar, right sidebar has phase badge, project lead selector, members multi-select, and start/end date inputs
- Modified `ProjectCard` to open the modal on click instead of navigating directly (replaced `<Link>` with clickable `<div>`)
- "View Project" button in modal footer navigates to the full project page

## Post-Execution Audits for Quick Tasks — 2026-02-11

- Added `taskAudits` Convex table with status, accessibility/testing/codeReview arrays, and indexes by task and run
- Created `taskAudits.ts` with `getByTask` query, `create`/`complete`/`fail` mutations
- Added `run-audit` step to `execute-task.ts` — captures git diff before/after, runs Claude Haiku audit (read-only, no tools), parses structured JSON results
- Audit is best-effort: wrapped in try/catch so failures don't block task completion
- Added audit UI to `TaskDetailModal` — shows streaming progress while running, 3 accordion sections (Accessibility, Code Testing, Code Review) with pass/fail badges when complete

## Doc Interview Feature — 2026-02-11

- Added `interviewHistory` and `sandboxId` fields to `docs` table schema
- Added `addInterviewMessage`, `updateLastInterviewMessage`, `clearInterview`, `updateDocSandbox` mutations to `docs.ts`
- Created `doc-interview.ts` Inngest function mirroring project interview pattern (sandbox + Claude CLI streaming)
- Created `DocInterviewDialog` component with chat UI reusing `MultipleChoiceQuestion` and `ChatMessage`
- Added "Interview Me" button to `DocViewer` header that opens the interview dialog
- AI asks codebase-grounded questions then auto-generates description, requirements, and user flows

## Speech-to-Text Input for PromptInput — 2026-02-11

- Created `PromptInputSpeech` component in `packages/ui/src/ai-elements/prompt-input-speech.tsx` using native Web Speech API
- Renders a mic button that toggles speech recognition; returns `null` on unsupported browsers (Firefox/Safari)
- Appends final transcription results to the textarea via native value setter + input event dispatch
- Added speech button to sessions (`ChatPanel.tsx`), design (`DesignDetailClient.tsx`), and analyse (`QueryDetailClient.tsx`)
- Exported from `@conductor/ui`

## Persona Selector for Design Sessions — 2026-02-11

- Added `designPersonas` table to Convex schema with `name`, `prompt`, `repoId`, `userId` fields
- Added `selectedPersonaId` field to `designSessions` table
- Created `designPersonas.ts` with CRUD operations (list, get, create, update, remove)
- Added `selectPersona` mutation to `designSessions.ts`
- Created `PersonaSelector` component with popover dropdown and manage modal
- Updated `buildDesignPrompt` to inject persona context into AI prompt
- Updated `design-execute` Inngest function to fetch persona and pass to prompt builder

## Sandbox + CodeBlock AI Elements for Research Queries — 2026-02-11

- Created `CodeBlock` and `CodeBlockCopyButton` components in `packages/ui/src/ai-elements/code-block.tsx` — reusable code display with clipboard copy
- Created `Sandbox`, `SandboxHeader`, `SandboxContent`, `SandboxTabs`, `SandboxTabsList`, `SandboxTabsTrigger`, `SandboxTabContent` components in `packages/ui/src/ai-elements/sandbox.tsx` — collapsible container with status badges and tabbed content
- Updated `QueryDetailClient` pending state to use `CodeBlock` with copy button instead of plain `<pre><code>`
- Updated `QueryDetailClient` completed state to use `Sandbox` with Output/Code tabs instead of inline Collapsible "View query"
- Updated saved queries panel to use `CodeBlock` for consistent code display
- Exported all new components from `@conductor/ui`

## Model Selector for Task Execution — 2026-02-11

- Added `claudeModelValidator` (opus/sonnet/haiku) to Convex validators and optional `model` field to `agentTasks` schema
- Extended `agentTasks.update` mutation and `agentTaskValidator` to support `model` field
- Added `model` to `startExecution` return type so it flows to the Inngest event
- Added Model dropdown in TaskDetailModal sidebar (between Assign and Pull Request), defaulting to Sonnet
- Updated `execute-task.ts` to use `model` from event data instead of hardcoded `"sonnet"`

## Design Page — Skills, Icons, and Prompt Quality Improvements — 2026-02-11

- Pre-installed Claude Code plugins in Daytona sandbox Dockerfile: `anthropics/claude-plugins-official` (for `/frontend-design` skill) and `Dammyjay93/interface-design` (for `/interface-design` craft-focused design skill)
- Added `Skill` to allowed tools in `design-execute.ts` so Claude can invoke design skills before generating variations
- Updated design prompt to invoke 3 skills before generating: `/frontend-design` (production-grade aesthetics), `/interface-design` (craft + domain exploration), `/web-design-guidelines` (accessibility/WCAG)
- Added `lucide-react` as a Sandpack dependency — generated components can now use icons, which is the single biggest visual quality improvement
- Added "Available Libraries" section to prompt telling Claude what's available in the preview environment (lucide-react icon examples, Inter font weight/size guidance)
- Strengthened prompt rules: icons required on all clickable elements/headers, realistic content enforced, hover feedback on all interactive elements
- Added `"Skill"` to the `ClaudeTool` type union in `sandbox.ts`

### Learnings & Notes

**Plugin system structure**: Plugins live at `~/.claude/plugins/marketplaces/<name>/`, enabled via `~/.claude/settings.json` `enabledPlugins` field (format: `plugin-name@marketplace-name`). Marketplace repos have `.claude-plugin/marketplace.json`, standalone plugin repos have `.claude-plugin/plugin.json`.

**Dockerfile plugin pre-install**: Clone repos into `~/.claude/plugins/marketplaces/` and write a `settings.json` with `enabledPlugins`. Built-in skills (like `web-design-guidelines`) don't need installation.

**Test prompts for design page quality**:

1. "Design a project analytics dashboard with key metrics at the top (tasks completed, active contributors, sprint velocity, bugs filed), a line chart placeholder area, and a real-time activity feed showing recent commits, PR merges, and deployments with timestamps and user avatars"
2. "Create a settings page with a sidebar navigation (Profile, Notifications, Integrations, Billing, Security) and a main content area. Show the Notifications section with toggle switches for email digests, Slack alerts, and in-app notifications, each with a description and icon"
3. "Build a user management table with columns for name, email, role, status, and last active date. Include a search bar, role filter dropdown, bulk selection checkboxes, and a toolbar that appears when rows are selected with actions like Export, Deactivate, and Send Invite"
4. "Design a team inbox view. Include a toggle to switch between an empty state (no messages yet — show an illustration-like icon composition and a CTA to invite teammates) and a populated state with a message list, preview pane, and quick-reply input"
5. "Create a 3-step onboarding wizard for connecting a GitHub repository. Step 1: select organization and repo from a searchable list. Step 2: configure branch protection and review settings with checkboxes. Step 3: confirmation summary with an animated success state. Include a progress bar and back/next navigation"

## Annotation Card UX Improvements — 2026-02-11

- Added "Run Eva" button to existing annotation cards — triggers task execution from the annotation overlay without opening the sidepanel
- Regrouped footer buttons: new annotations show Cancel + Create Task; existing annotations show Run Eva (left) + Cancel + Edit Task (right)
- Fixed inverted dark/light color scheme in InputCard — dark mode now uses dark backgrounds, light mode uses light backgrounds
- Added creator avatar (Facehash) to annotation card header next to "Annotation #N"
- Content script stores `userId` and `creatorInitials` per pin, persisted across page reloads
- Sidepanel sends user data (Convex userId + initials from Clerk) with `ANNOTATION_TASK_CREATED` messages
- Replaced local `UserAvatar` component in ChatPanel with `UserInitials` from `@conductor/shared` (Facehash-based)
- Added `RUN_ANNOTATION_TASK` message type for single-task execution from content script
- Added `facehash` and `dayjs` dependencies to chrome extension (peer deps of `@conductor/shared`)

## Create `@conductor/shared` Package — 2026-02-10

- Created `packages/shared/` workspace package (`@conductor/shared`) for smart components and utilities shared between web and chrome-extension
- Moved `UserInitials` component from `apps/web/lib/components/ui/` to `packages/shared/src/components/`
- Moved `dates.ts` (dayjs with relativeTime) from `apps/web/lib/` to `packages/shared/src/utils/`
- Changed `UserInitials` `userId` prop from `string` to `Id<"users">` (removed internal `as` cast)
- Removed dead `avatar` variable and commented-out block from `UserInitials`
- Updated 22 import statements across `apps/web` to use `@conductor/shared` and `@conductor/shared/dates`
- Added `@conductor/shared` dependency to both `apps/web` and `apps/chrome-extension`

## Design Page Improvements — Prompt quality, iteration flow, UX - 2026-02-10

- Rewrote design prompt with explicit variation strategies (clean/conventional, creative/bold, compact/efficient) and design quality guidelines (realistic content, consistent spacing, visual hierarchy)
- Fixed codebase-reading instruction to clarify output runs in isolation — recreate style patterns, no project imports
- Stronger iteration prompt: preserves core layout/colors from selected base, only changes what user requests
- Added `selectedCode` and `selectedLabel` fields to `designSessions` schema — stores selected variation directly instead of fragile reverse-search through message history
- Reset `selectedVariationIndex`/`selectedCode`/`selectedLabel` when new variations arrive (fixes stale selection across batches)
- Auto-select current tab when user sends follow-up without clicking "Use this design"
- Added "Using as base" indicator below chat when a variation is selected
- Added hint text when variations exist but none selected
- Added check icon on selected variation tab
- Better loading state in preview panel: Spinner + streaming activity text instead of plain "Generating designs..."
- Added suggestion chips after first generation ("Make it more minimal", "Add more whitespace", "Make the colors bolder")
- Simplified Inngest `design-execute.ts` selectedBase lookup to use stored `selectedCode`/`selectedLabel`

## Annotation UX Flow Refinements - 2026-02-10

- Simplified InputCard to single primary action: "Create Task" (new) or "Edit Task" (existing) — removed standalone "Save" button
- Locked editing for in-progress/business_review/code_review pins: textarea becomes read-only, footer hidden, delete hidden
- Annotations now immediately delete when task status becomes "done" (task record persists in web app)
- Removed `handleInputSave`, `hiddenDonePins` state, and 5-second auto-hide logic

## Chrome Extension UI Improvements — Annotation pins, toolbar, and status sync - 2026-02-10

- Changed annotation cursor from purple to teal theme color (`#109182`)
- Scaled annotation pins 1.25x (24px → 30px) with proportional font/offset/shadow adjustments
- Added status-colored pins: grey (todo), yellow (in_progress), orange (business_review), purple (code_review), grey at 40% opacity (done)
- Pins now persist after "Create Task" instead of being deleted — marked as `todo` with grey color
- Added `taskId` and `status` fields to `StoredPin` for tracking linked tasks
- Added `getStatusesByIds` Convex query for batch task status lookups
- Added real-time status sync: `AnnotationTool` subscribes to task statuses via Convex and pushes updates to content script pins
- Done pins fade to 40% opacity then auto-hide after 5 seconds (remain in storage)
- Replaced "Add all to Quick Tasks" toolbar button with "Run All" — creates tasks AND triggers execution via Inngest
- Increased toolbar size (padding, gaps, fonts, dividers, eye button) for Vercel-inspired look
- Added 5 new message types: `ANNOTATION_TASK_CREATED`, `ANNOTATION_STATUS_SYNC`, `RUN_ALL_ANNOTATIONS`, `RUN_ALL_RESULT`, `TaskStatus` type

## Fix session editor tab + audit cleanup - 2026-02-10

**Problem:** The editor tab in sessions showed nothing — code-server was being downloaded fresh (~100MB+) via `npx -y code-server@latest` every sandbox start, which exceeded the 30s exec timeout and silently failed as a backgrounded process.

**Solution — pre-install code-server in the snapshot image:**

- Added `curl -fsSL https://code-server.dev/install.sh | sh` to the Dockerfile (as root, before `USER eva`) to bake code-server into the `eva-snapshot`
- Used the official install script instead of `npm install -g` because code-server has native deps that need build tools not in the base image — the script downloads pre-built binaries
- Updated `session-sandbox.ts` startup command from `npx -y code-server@latest` to just `code-server` (pre-installed binary), reduced timeout from 30s to 10s

**Architecture decision — why code-server:**

- VS Code is a desktop Electron app, can't run in a browser directly — all browser solutions are HTTP servers serving the VS Code web UI in an iframe
- Evaluated code-server (Coder), OpenVSCode Server (Gitpod), and `code serve-web` (official Microsoft) — all work identically (HTTP server on a port → iframe)
- Chose code-server: most popular, well-documented, no commercial license restrictions

**How the editor tab works end-to-end:**

- Sandbox starts → `code-server --port 8080 --auth none --bind-addr 0.0.0.0 /workspace/repo` runs in background
- `EditorPanel.tsx` polls `GET /api/sessions/preview?port=8080&check=1` every 3s (up to 20 attempts)
- Preview route gets a signed Daytona proxy URL (`sandbox.getSignedPreviewUrl(8080, 3600)`) and runs `curl localhost:8080` inside the sandbox to verify readiness
- Once ready, the signed URL loads in a full-screen iframe with clipboard permissions

**Audit fixes:**

- Fixed broken JSX in EditorPanel where "Starting editor..." text and "Retry" button rendered unconditionally (were outside their `{isLoading && ...}` and `{error && ...}` blocks)
- Fixed sandbox reconnect path to restart both code-server and dev server (previously only checked sandbox liveness without restarting services killed by Daytona auto-stop)
- Fixed stale iframe URL not being cleared when editor re-polls after retry or sandbox reconnect

## Add Editor tab (code-server) to session sandbox panel - 2026-02-10

- Added "editor" tab to the SandboxPanel alongside existing Preview and Diffs tabs
- code-server is installed and started on port 8080 during new sandbox creation (runs alongside `pnpm dev`)
- Created `EditorPanel.tsx` — fetches signed URL from existing preview API with `port=8080` and renders code-server in an iframe
- No new API routes needed — reuses existing `/api/sessions/preview` route which already accepts a `port` parameter

## Migrate local state to nuqs URL state management - 2026-02-09

- Installed nuqs and added NuqsAdapter to the client provider tree
- Created centralized `lib/search-params.ts` with typed parsers for all URL params (search, filters, sort, tabs, modes)
- Migrated search bars from useState to useQueryState in KanbanBoard, ProjectsClient, DocsList, TestingArenaClient
- Migrated Set-based column/phase filters from useState to useQueryStates with array parsers in KanbanBoard and ProjectsClient
- Migrated sort field + direction from useState to useQueryStates in ProjectsClient
- Migrated time range filter from useState to useQueryState in AnalyticsClient
- Migrated tab switching from useState to useQueryState in SandboxPanel (preview/diffs), ChatPanel (execute/ask/plan), DesignDetailClient (variation + device), and testing-arena doc page (code/ui)
- All search/filter state now persists in the URL, enabling shareable links, page refresh persistence, and browser back/forward navigation

## Replace OpenRouter with Claude Code CLI + Daytona for research queries - 2026-02-09

- Replaced paid OpenRouter GPT-5-nano API calls with Claude Code CLI running inside ephemeral Daytona sandboxes, using the free Claude Max subscription (`CLAUDE_CODE_OAUTH_TOKEN`)
- Both Inngest functions (`generateResearchQuery` and `confirmResearchQuery`) now spin up sandboxes instead of calling OpenRouter
- Query execution uses Bash tool inside the sandbox to POST to Convex's `/api/run_test_function` endpoint via a node.js script
- Removed `ai` SDK, OpenRouter, and Zod dependencies from the research query module

## Install AI Elements WebPreview + Plan components - 2026-02-09

- Added `WebPreview`, `WebPreviewNavigation`, `WebPreviewNavigationButton`, `WebPreviewUrl`, `WebPreviewBody`, `WebPreviewConsole` components to `packages/ui/src/ai-elements/web-preview.tsx` (ported from AI Elements registry)
- Added `Plan`, `PlanHeader`, `PlanTitle`, `PlanDescription`, `PlanAction`, `PlanContent`, `PlanFooter`, `PlanTrigger` components to `packages/ui/src/ai-elements/plan.tsx` (ported from AI Elements registry)
- Added `CardAction` to `packages/ui/src/ui/card.tsx` (required by Plan component)
- Refactored `WebPreviewPanel.tsx` to use AI Elements `WebPreview` component with composable nav bar, URL display, and iframe body
- Moved address bar from `SandboxPanel.tsx` into `WebPreviewPanel.tsx`, simplifying SandboxPanel
- Replaced PRD Dialog modal in `ChatPanel.tsx` with inline collapsible `Plan` component above the prompt input (shows plan content with "Approve Plan" button when in PRD mode)

## Replace manual patterns with UI components (Chrome Extension) - 2026-02-08

- Replaced manual spinner div with `Spinner` component in App.tsx loading state
- Replaced raw `<input>` with `Input` component for project title field in App.tsx
- Replaced raw `<button>` project selector items with `Button` component in App.tsx
- Replaced 2 manual avatar divs with `Avatar`/`AvatarFallback` in ChatPanel UserAvatar component
- Replaced raw close `<button>` + inline SVG with `Button` + `IconX` in ContextPreview
- Replaced raw `<button>` session list items with `Button` component in SessionSidebar

## Design Page with Sandpack Live React Previews - 2026-02-08

- Added `/design` page for AI-powered UI design generation
- New `designSessions` Convex table with message variations (`{ label, code }` per design)
- Convex CRUD functions for design sessions (list, get, create, addMessage, updateLastMessage, selectVariation, updateSandbox, archive)
- Inngest `design-execute` function: reads codebase in sandbox, generates 3 design variations via Claude CLI
- Design prompt generates live React components using `import { useState } from 'react'` + `export default function App()`
- Sandpack preview uses `externalResources` for Tailwind CDN + Google Fonts, with custom `/styles.css` (CSS variables) and `/setupTailwind.js` (theme config)
- Extracted shared `lib/tailwind-theme.js` — single source of truth for theme extend (colors, borderRadius, fontFamily), imported by both `tailwind.config.js` and the Sandpack config generator
- CSS variables read from `globals.css` at render time via `fs.readFileSync` in the server component — no hardcoded duplicates
- Code modal: "Code" button in toolbar opens a Dialog with the component source (replaced side-by-side code editor)
- Frontend: SidebarLayoutWrapper layout with session list, detail page with chat panel + full-width Sandpack preview
- Added "Design" link to sidebar BUILD group

## Replace manual div patterns with UI components - 2026-02-08

- Replaced manual spinner div with `Spinner` component in testing-arena report card
- Replaced manual progress bar div with `Progress` component in testing-arena
- Replaced raw `<button>` toggle with `Button` component in testing-arena
- Replaced card-like div with `Card`/`CardContent` in saved-queries page
- Replaced 5 raw `<button>` elements with `Button` component in RepoSetupClient (add, add all, done, back)
- Replaced manual loading spinner (`IconLoader2`) with `Spinner` component in RepoSetupClient
- Replaced raw refresh `<button>` with `Button` in SandboxPanel
- Replaced 2 manual avatar divs with `Avatar`/`AvatarFallback` in PlanContextPanel
- Replaced manual avatar div with `Avatar`/`AvatarFallback` in ChatPanel
- Replaced manual avatar div with `Avatar`/`AvatarFallback` in QueryDetailClient
- Replaced notification count `<span>` with `Badge` component in NotificationsPopoverClient

## Flat minimal UI redesign — Inset panel design - 2026-02-08

- Added `bg-card lg:rounded-l-2xl` to MainContent in repo layout for inset panel effect (content area has curved left edge against sidebar)
- Removed `border-r` from main Sidebar and `border-t` from sidebar user section
- Removed `border-b` header border and redundant `bg-background`/`bg-card` from PageWrapper (parent now handles backgrounds)
- Removed all `border-r`/`border-b` from SidebarLayoutWrapper (mobile header, mobile drawer, desktop sidebar)
- Removed structural borders from 6 project components: ProjectActiveLayout, ProjectTabs, ProjectPlanTab, ProjectTaskDetailPanel, ProjectChatTab, PlanContextPanel
- Removed structural borders from SpotlightSearch, TaskDetailModal, SandboxPanel, DiffPanel, QueryDetailClient
- Kept borders on interactive elements (inputs, buttons, accordion items) and timeline indicators

## Design audit #2 — semantic color token system + consistency sweep - 2026-02-08

### Phase 1 — Status color tokens & critical fixes

- Added 17 new CSS variables (light + dark) for 4-status color system: `--status-progress`, `--status-business-review`, `--status-code-review`, `--status-done` — each with DEFAULT, bg, subtle, and bar variants
- Added `--warning-bg` and `--success-bg` tokens for callout backgrounds
- Registered all status tokens in tailwind.config.js under `colors.status`
- Replaced all hardcoded yellow/orange/purple/green in `TaskStatusBadge.tsx` and `ProjectPhaseBadge.tsx` with semantic status tokens
- Replaced all `text-amber-*`/`bg-amber-*` warning colors across 5 files (sessions/layout, ProjectsClient, QuickTasksKanbanBoard, TaskDetailModal, ProjectTaskDetailPanel) with `text-warning`/`bg-warning`/`bg-warning-bg` tokens
- Replaced presence indicator colors in `UserInitials.tsx` (`bg-emerald-500` → `bg-success`, `bg-amber-500` → `bg-warning`)
- Standardized 4 empty state pages (sessions, analyse, docs, testing-arena) to use `EmptyState` component
- Eliminated all `text-foreground/80` opacity modifiers across 8 files → `text-muted-foreground`

### Phase 2 — Refinement

- Replaced Spinner loading with Skeleton loaders in ProjectsClient and QuickTasksClient
- Standardized all dialog cancel buttons from `variant="secondary"` to `variant="ghost"` across 7 files
- Fixed search icon position in sessions/layout (`left-2.5` → `left-3`)
- Replaced custom `<button>` elements with `<Button>` component in sessions/layout, QuickTaskCard, and analyse/layout

### Phase 3 — Remaining hardcoded colors

- Replaced all `text-green-600`/`bg-green-600` in ChatPanel.tsx (5 instances) with `text-success`/`bg-success text-success-foreground`
- Replaced `bg-green-100 dark:bg-green-900/30` and `text-green-700 dark:text-green-400` in DependencyBadge with `bg-status-done-bg`/`text-status-done`
- Replaced `text-emerald-600 dark:text-emerald-400` in ProjectFinalizationModal and ProjectPlanTab with `text-success`
- Replaced `bg-emerald-50 dark:bg-emerald-900/20` in ProjectPlanTab with `bg-success-bg`
- Replaced `text-emerald-500` in ProjectTaskCard with `text-success`
- Replaced `text-green-600` in RepoSetupClient with `text-success`
- Left DiffPanel git diff colors (green/red/blue) and Leaderboard medal colors (gold/bronze) as intentionally decorative

## Design audit #1 — 3-phase UI consistency overhaul - 2026-02-08

### Phase 1 — Critical fixes

- Replaced 14 manual spinner `<div>` elements with unified `<Spinner>` component across all loading states
- Fixed sidebar group labels from `text-[10px] text-muted-foreground/60` to `text-[11px] text-muted-foreground` for WCAG accessibility
- Standardized icon sizing: converted all `w-N h-N` className patterns to Tabler `size` prop across sidebar, layouts, and components
- Differentiated `--muted` token from `--secondary` in light mode (was identical `rgb(236, 245, 243)`, now `rgb(240, 244, 243)`)
- Eliminated non-standard opacity modifiers (`text-muted-foreground/60`, `text-foreground/70`, `bg-muted/30`) — replaced with full semantic tokens
- Added mobile responsiveness to `SidebarLayoutWrapper` — overlay drawer on mobile, existing sidebar on desktop

### Phase 2 — Refinement

- Standardized PageWrapper header padding to `py-3` (was `py-2.5`)
- Simplified sidebar navigation: removed collapsible groups (4 toggleable sections for 6 items → flat list with non-interactive section labels)
- Added `--success` and `--warning` semantic color tokens to globals.css (light + dark) and tailwind.config.js
- Updated badge `success`/`warning` variants from hardcoded emerald/amber with `dark:` overrides to `bg-success/10 text-success` semantic tokens
- Standardized all collapsed panel widths to `w-12` (was inconsistent: `w-10` in secondary sidebar, chat, query panel)
- Removed `mr-2` from 11 button icons — buttons already have `gap-2` built in

### Phase 3 — Polish

- Added `Skeleton` component and replaced spinner loading states with skeleton loaders for repo home stats, session list, and analyse query list
- Elevated `EmptyState` component: larger icon in rounded circle, `text-base` title, proper `Button` for action, more generous padding
- Added `border-b border-border` to PageWrapper header for clear visual separation from content
- Removed dead `shadow-none` class from StatCard (Card has no shadow by default)
- Removed hardcoded hex color props from StatCard sparklines (gradient already used `var(--muted-foreground)`)
- Fixed PageWrapper `headerCenter` from fragile absolute positioning to flexbox layout (prevents overlap on narrow viewports)

## Teal theme + fix broken opacity modifiers - 2026-02-08

- Changed theme color from purple to aqua/teal across web app and chrome extension (globals.css, chrome extension index.css, 3 overlay files with hardcoded hex)
- Lightened dark mode backgrounds (~5 RGB units brighter) after user reported "too dark"
- Fixed all broken `bg-primary/XX` Tailwind opacity modifiers (invalid CSS because CSS vars contain full `rgb()` values) — replaced with solid `bg-accent` token across 11 files: SpotlightSearch, MultipleChoiceQuestion, GroupTasksModal, ProjectPhaseBadge, PlanContextPanel, RepoHomeClient, ProjectChatTab, QuickTaskCard, ProjectTaskCard, RepoSetupClient
- Added missing hover states to QuickTaskCard and ProjectTaskCard (`hover:shadow-md hover:brightness-[0.97] dark:hover:brightness-110`)

## ChatGPT-inspired UI modernization - 2026-02-08

- Replaced card-on-card secondary sidebars with clean border separators (SidebarLayoutWrapper) — affects Sessions, Analyse, Admin, Testing Arena, and Docs layouts
- Added border-right to main sidebar and border-top footer separator for cleaner visual structure
- Slimmed PageWrapper header padding for a lighter, less chrome-heavy feel
- Migrated all 50 files with hardcoded `neutral-*` Tailwind colors to semantic design tokens (`bg-secondary`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.)
- Eliminated all `dark:bg-neutral-*` / `dark:text-neutral-*` paired classes — dark mode now handled entirely by semantic tokens
- Updated RepoHome stat cards, repo listing cards, welcome banner, and empty states to use semantic tokens

## Replace neutral-\* colors with semantic design tokens (batch 2) - 2026-02-08

- Replaced all hardcoded `neutral-*` Tailwind classes with semantic tokens across 15 files
- Files: SpotlightSearch, NotificationsPopoverClient, ThemeToggleClient, TaskDetailModal, TaskStatusBadge, ChatMessage, MultipleChoiceQuestion, Leaderboard, StatCard, PRsOverTimeChart, ActivityTimelineChart, SessionFunnel, KanbanColumn, ProjectPhaseBadge, RepoContext
- Mapping: `bg-neutral-50/100` -> `bg-secondary`, `bg-neutral-800/900/950` -> `bg-secondary`/`bg-background`, `text-neutral-400/500/600` -> `text-muted-foreground`, `text-neutral-900`/`text-white` (theme) -> `text-foreground`, `border-neutral-*` -> `border-border`, `hover:bg-neutral-*` -> `hover:bg-muted`, `bg-white dark:bg-neutral-900` -> `bg-card`/`bg-background`
- Collapsed light+dark variant pairs into single semantic tokens (dark mode handled automatically)

## Soft UI sidebar redesign - 2026-02-08

- Bumped global `--radius` from `0.75rem` to `1rem` for rounder, softer geometry across all components
- Gentler hover states on nav items and task list (`bg-muted/40` instead of `bg-muted/60`)
- More generous vertical padding on nav links (`py-2.5`) for a spacious, comfortable feel
- Softened active tasks accordion: gentler hover, more padding on task items
- Softened branch selector: lighter loading state bg (`bg-muted/30`), ghost sync button, wider gap
- Kept grouped navigation structure (BUILD/FIX/TEST/DATA) intact
- **All SidebarLayoutWrapper consumers updated** to Soft UI:
  - Sessions layout: replaced all `neutral-*`/`dark:` overrides with semantic tokens, added `rounded-xl` + `mx-2` on session items
  - Analyse layout: same treatment on query items and resource links (Saved queries, Routines, Files)
  - Admin layout: nav items now use `hover:bg-muted/40` and `text-muted-foreground`, icon color inherits from parent
  - Testing Arena: doc list items get `rounded-xl` + softer hover, empty states use `text-muted-foreground`
  - DocsList component: same rounded items + semantic color treatment

## Session PRD mode + Project active layout redesign - 2026-02-08

### Session PRD mode (was "Plan mode")

- Renamed Plan mode to PRD mode across the UI (tab label, mode badge, input placeholder, modal title, "View PRD" button)
- Updated the plan prompt in `session-execute.ts` from technical implementation plan to product-focused PRD (Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope)
- Prompt now instructs Claude to write for a non-technical audience — focus on WHAT to build and WHY, not HOW
- Execute mode now includes the approved PRD as context when `planContent` exists, so Claude follows the requirements when implementing
- Documented Sessions vs Projects distinction in `CLAUDE.md` and `internal/sessions-vs-projects.md`

### Project active layout redesign

- **Task-driven navigation**: Clicking a task in the left panel selects it and shows its details in the center panel (description, subtasks, agent runs with streaming activity). Previously the center was a "Sandbox (coming soon)" placeholder.
- **Progress bar**: Added `ProjectProgressBar` shared component used by both `ProjectCard` and `ProjectActiveLayout`. Color-segmented bar showing per-status counts (todo/in_progress/business_review/code_review/done) with tooltip breakdown. Replaces the basic green bar.
- **Chat panel hidden by default**: Chat is now fully hidden when closed (not a collapsed strip). Opens via chat button in the task detail header. Close button is an X on the right end with "Chat" title on the left.
- **Chat input upgraded**: Replaced custom Textarea/Button form with `PromptInput` components from `@conductor/ui` (matching sessions and query pages).
- **View Plan/Chat buttons moved to page header**: `PlanContextPanel` now renders in the header next to branch name and PR link (only for active/completed projects), removed from inside the tasks panel.
- **Task detail center panel**: New `ProjectTaskDetailPanel` component shows task number, title, status badge, description, subtasks, agent runs with streaming. Has "Open full details" button to open the existing `TaskDetailModal` for editing, and "Open chat" button to expand the chat panel.
- **Task selection highlighting**: Selected task card shows `ring-2 ring-primary` border in the task list.

**Justification**: Sessions and Projects had overlapping UIs (both had chat + sandbox). The redesign makes the project active layout task-driven (dashboard feel) vs session layout which is chat-driven (IDE feel). This matches the conceptual distinction: sessions are interactive pair programming, projects are autonomous task execution with monitoring.

## Saved queries feature - 2026-02-08

- Added optional `researchQueryId` to `savedQueries` schema to link back to source conversation
- Added save button in the "View query" collapsible on research query results (shows "Saved" state if already saved)
- Right panel in query detail page now lists all saved queries with title, preview, and delete
- Implemented `/saved-queries` page with full list view, collapsible query code, delete, and empty states

## Research query confirmation flow - 2026-02-08

- Split `research/query.execute` Inngest event into two: `research/query.generate` (generates query code without executing) and `research/query.confirm` (executes confirmed query and returns analysis)
- Added `queryCode` and `status` (pending/confirmed/cancelled) optional fields to research query messages in schema
- Added `updateMessageStatus` Convex mutation for confirm/cancel actions
- Updated `QueryDetailClient` to show generated query code with Run/Cancel buttons when status is "pending"
- Cancel directly updates message status via Convex mutation; Confirm triggers execution via Inngest

## Share Convex backend as a workspace package (`@conductor/backend`) - 2026-02-07

- Created `backend/index.ts` exporting `api`, `internal`, `Id`, `Doc`, `DataModel`, `TableNames` from Convex's generated types
- Added `@conductor/backend` as a workspace dependency in web and chrome-extension
- Deleted `web/api.ts` (~1,850 lines) and `chrome-extension/src/api.ts` (~1,850 lines) — replaced with direct imports from `@conductor/backend`
- Updated ~63 files across web and chrome-extension to import `api` and `Id` from `@conductor/backend` instead of `@/api` and `convex/values`
- Removed `convex-helpers ts-api-spec` generation scripts from web, chrome-extension, and root package.json
- Removed `convex-helpers` devDependency from chrome-extension (no longer needed)
- Fixed unused vars in backend `auth.ts` and `taskDependencies.ts` surfaced by chrome-extension's strict tsconfig

## Replace `@streamdown/code` with custom 4-language shiki code highlighter - 2026-02-07

- Created `packages/ui/src/lib/code-highlighter.ts` using `shiki/core` with JavaScript regex engine (no WASM)
- Only bundles 4 language grammars (HTML, CSS, JavaScript, TypeScript) + 2 themes instead of 300+ bundled languages
- Eliminates ~300 chunk files from chrome extension build, significantly reducing build time and output size
- Removed `@streamdown/code` dependency from `packages/ui`, `web`, and `chrome-extension`
- Added `shiki` as direct dependency to both apps for the custom highlighter
- Updated 2 web files (`ChatMessage.tsx`, `PlanContextPanel.tsx`) to import `code` from `@conductor/ui`

## WebSocket terminal — eliminate polling latency - 2026-02-07

- Browser now connects directly to Daytona's PTY WebSocket instead of HTTP polling (~250ms/keystroke → ~1-5ms)
- Added `getPtyWebSocketUrl()` helper in `sandbox.ts` that resolves the Daytona toolbox URL + preview token into a signed WebSocket URL
- Rewrote terminal route: `GET` returns signed WebSocket URL, `POST` only handles resize/disconnect (removed all server-side I/O proxying)
- Rewrote `TerminalPanel.tsx` to use native `WebSocket` with Daytona's control message protocol, auto-reconnection (3 attempts), and direct `ws.send()` for input
- Removed `activePtyHandles` in-memory Map and all server-side PTY buffering code — no more serverless cold-start issues

## Add Daytona volume for Claude Code session persistence across sandboxes - 2026-02-07

- Mount `eva-volume` at `/home/eva/.claude` on every sandbox so Claude Code session `.jsonl` files persist across sandbox lifecycles
- Added cached volume lookup (`getSessionVolume()`) to avoid repeated API calls
- Added `sessionId` and `resumeSessionId` options to `runClaudeCLI()` and `runClaudeCLIStreaming()` for `--session-id` and `--resume` CLI flags
- Added `claudeSessionId` field to `sessions` schema and `updateSandbox` mutation
- Wired session resume into `session-execute.ts`: first message generates a UUID (`--session-id`), subsequent messages resume it (`--resume`) — shared across ask/plan/execute modes
- Fixed terminal PTY route using wrong home directory (`/home/daytona/workspace` → `/workspace/repo`)

## Refactor terminal PTY route — remove duplication, add serverless resilience and resize support - 2026-02-07

- Removed duplicate `Daytona` instance from terminal route, now imports `getSandbox` and `WORKSPACE_DIR` from shared `sandbox.ts`
- Added `connectPty` reconnection fallback so `input`/`poll` actions recover on serverless cold starts instead of failing
- Added `resize` action using Daytona SDK's `resizePtySession()` to send SIGWINCH on terminal resize
- Updated `TerminalPanel.tsx` to POST new cols/rows to backend after `FitAddon.fit()`
- Added `TERM: "xterm-256color"` env to PTY creation for proper terminal rendering
- Removed unnecessary 50ms/100ms sleep delays after input and connection

## Confirm Vercel stop completion before closing sessions - 2026-07-09

- Keep session state in `stopping` until Vercel confirms that its asynchronous stop/snapshot transition has reached a terminal stopped state, preventing a misleading closed UI and start/stop races.

## Extract shared `@conductor/ui` workspace package - 2026-02-07

- Created `packages/ui/` as a source-only pnpm workspace package (`@conductor/ui`) — no build step needed
- Moved 23 shared UI components (accordion, avatar, badge, button, button-group, card, checkbox, collapsible, command, dialog, dropdown-menu, hover-card, input, input-group, label, popover, progress, select, separator, spinner, tabs, textarea, tooltip) into the shared package
- Moved 5 ai-elements components (conversation, message, prompt-input, reasoning, shimmer) into the shared package
- Moved shared `cn` utility (clsx + tailwind-merge) into the shared package
- Updated ~67 files in `web/` and ~20 files in `chrome-extension/` to import from `@conductor/ui`
- Deleted all duplicate component files from both codebases
- Added `pnpm-workspace.yaml` to enable monorepo workspace linking
- Updated Tailwind configs in both apps to scan shared package for classes

## Port AI Elements SDK to Chrome extension - 2026-02-06

- Ported AI Elements components (conversation, message, prompt-input, reasoning, shimmer) from web app to `chrome-extension/src/components/ai-elements/`
- Refactored `ChatPanel.tsx` to use `Conversation` for auto-scroll, `Message`/`MessageResponse` for message rendering, `Reasoning` for collapsible activity logs and loading state, and `PromptInput` for the input area
- Replaced custom bouncing dots loading indicator with `Reasoning isStreaming` component
- Replaced raw textarea + manual key handling with `PromptInput` compound component
- Replaced custom scroll management with `Conversation`/`ConversationScrollButton`
- Added 7 new shadcn UI primitives: input-group, spinner, button-group, hover-card, command, dropdown-menu, separator
- Replaced custom options-array `Select` with shadcn compound component pattern and updated `RepoSelector.tsx`
- Added `icon-sm` button size variant and `textarea.tsx` primitive
- Installed dependencies: use-stick-to-bottom, streamdown + plugins, motion, nanoid, lucide-react, Radix primitives, cmdk

## Design cleanup: ChatGPT-style minimalism - 2026-02-06

- Flattened all CSS shadow variables to `none` across light and dark modes for a flat, clean aesthetic
- Lightened global border and input colors for subtler visual separation
- Removed shadows from button, card, input, textarea, input-group, select, tabs, and badge components
- Softened hover states on buttons and ghost elements (half-opacity accent backgrounds)
- Simplified badges: tinted backgrounds instead of solid fills, removed borders from base class
- Lightened dialog overlay from 80% to 50% opacity, removed dialog border
- Removed default `border-b` from accordion items
- Flattened sidebar navigation: removed grouped headers (BUILD/FIX/TEST/DATA), chevrons, and expand/collapse logic in favor of a simple flat list
- Removed sidebar bottom border separator and logo pill background
- Removed border separators from chat header, summary accordion, and input area in ChatPanel and QueryDetailClient
- Updated message bubbles: user messages use subtle `bg-secondary` instead of `bg-primary`, assistant messages have no background
- Removed border separators from DocViewer, ProjectDetailClient, testing-arena pages, and SessionFunnel

## Stabilize Vercel sandbox parity - 2026-07-07

- Restored preview auth proxy behavior for Vercel app previews while keeping editor and desktop on their dedicated exposed ports.
- Added Vercel desktop/noVNC support and made Chrome launch tolerate Chromium-based runtimes.
- Made Vercel session reuse use the provider-neutral sandbox path so resumes keep sandbox state instead of creating replacements.
- Updated Vercel seeded snapshot builds to include the Daytona-equivalent CLI/desktop toolchain and delete the previous seeded snapshot before capture.
- Removed an avoidable first-message desktop startup wait so chat does not pay for VNC/Chrome unless desktop is actually needed.

## Add response length selector to chat UIs - 2026-02-06

- Created `ResponseLengthSelector` component with concise/default/detailed options
- Added response length selector to sessions `ChatPanel.tsx` and research queries `QueryDetailClient.tsx` toolbars
- Wired response length through Inngest event data to `session-execute.ts` (ask/plan/execute modes) and `execute-research-query.ts`
- Injected response length instructions into Claude CLI prompt strings

## Refactor Sessions + Queries chat UI with AI Elements SDK - 2026-02-06

- Installed AI Elements SDK components (message, conversation, prompt-input, reasoning) as source code in `web/lib/components/ai-elements/`
- Refactored `ChatPanel.tsx` (sessions) to use `Conversation` for auto-scroll, `Message`/`MessageContent`/`MessageResponse` for message rendering, `Reasoning` for collapsible activity logs, and `PromptInput` for the input area
- Refactored `QueryDetailClient.tsx` (research queries) with the same AI Elements components
- Replaced manual scroll management (`useRef` + `useEffect`) with `Conversation`/`ConversationScrollButton`
- Replaced raw `Streamdown` markdown rendering with `MessageResponse` (includes GFM, math, code highlighting, CJK, mermaid)
- Replaced custom `Accordion`-based activity logs with `Reasoning` component (auto-open during streaming, auto-close after)
- Replaced custom `Textarea`/form with `PromptInput` compound component (auto-resize, Enter to submit, form reset)
- Added new shadcn/ui primitives: collapsible, hover-card, button-group, command, input-group
- Adapted all AI Elements components for Tailwind v3 compatibility (replaced v4-only `field-sizing-content`, `shadow-xs`, `--color-*` CSS vars)
- Added `icon-sm` button size variant and restored `Spinner` size prop for backwards compatibility
- Added streamdown dist to Tailwind content config for proper style scanning

## Port purple theme to chrome-extension - 2026-02-06

- Updated chrome-extension CSS variables from HSL teal to RGB purple theme matching the web app
- Switched tailwind.config.js color references from `hsl(var(--...))` to `var(--...)` format
- Replaced all hardcoded `teal-*` Tailwind classes across 5 sidepanel files with `primary` theme equivalents
- Replaced all `#14b8a6` teal hex colors in 3 content script overlay files with `#975799` purple using Tailwind arbitrary values and inline styles (shadow DOM compatible)
- Updated dialog and tabs UI components to use `rounded-md` for consistency with web

## Replace hardcoded teal colors with primary theme variables - 2026-02-06

- Replaced all hardcoded `teal-*` Tailwind color classes across 29 files with `primary` theme equivalents (`text-primary`, `bg-primary/10`, `border-primary`, etc.)
- Collapsed redundant `dark:` variant classes since `primary` CSS variables already adapt to dark mode
- Updated gradient backgrounds (sidebar logo, welcome banner, repo home) to use `bg-primary/10` and `bg-gradient-to-br from-primary/80 to-primary/90`
- Replaced teal spinner borders, selection rings, chat bubbles, and status indicators with primary color
- Updated `UserInitials` to use `bg-primary text-primary-foreground`
- Updated `ProjectPhaseBadge` finalized phase to use `bg-primary/15` and `text-primary`

## Replace HeroUI with shadcn/ui - 2026-02-06

- Migrated all 57 files from HeroUI components to shadcn/ui equivalents
- Created 15 shadcn UI components (button, dialog, input, textarea, card, tabs, accordion, tooltip, popover, dropdown-menu, select, checkbox, avatar, badge, progress, separator, label, spinner)
- Added CSS variable theming in globals.css preserving teal primary color scheme
- Updated tailwind.config.js to remove HeroUI plugin and add shadcn color config
- Replaced HeroUIProvider with TooltipProvider in ClientProvider.tsx
- Created useDisclosure hook replacement at lib/hooks/use-disclosure.ts
- Replaced all HeroUI-specific Tailwind classes (text-default-_, bg-default-_, border-divider) with shadcn equivalents
- Added components.json for shadcn CLI configuration
- Installed Radix UI primitives and class-variance-authority dependencies

## Before/After Web App Screenshots for Task Execution - 2026-02-05

- Added Playwright-based before/after screenshots to the task execution flow (`execute-task.ts`)
- Before Claude runs: installs Playwright, starts dev server, screenshots `localhost:3000`
- After Claude runs: screenshots again (hot reload applies changes), uploads both to Convex via `taskProof`
- Added 3 sandbox helpers: `detectPackageManager`, `installPlaywright`, `takeWebScreenshot`
- All screenshot steps are non-blocking — failures are caught and task execution continues normally

## Streaming Hot/Cold Path Separation - 2026-02-05

- Moved live streaming state to a separate `sessionStreaming` table (~100 bytes) so the heavy session document isn't rewritten every 500ms
- Session document now only written twice per execution (add empty message + final result) instead of 60-120 times
- `sessions.get` subscribers no longer hammered during streaming — only the lightweight `sessionStreaming` query updates frequently
- Simplified `runClaudeCLIStreaming` to send only the latest activity per interval instead of the full accumulated log
- Removed double-parsing of raw output — now parsed once at the end for both result extraction and activity log

## Unified streamingActivity Table + Projects Streaming Fix - 2026-02-05

- Replaced separate `sessionStreaming` table with a generic `streamingActivity` table using `entityId: string` — works for sessions, projects, and any future entity
- Created `backend/convex/streaming.ts` with shared `get`/`set`/`clear` functions
- Applied hot/cold path separation to project interview flow (`interview-question.ts`) — same pattern as sessions
- Updated `ProjectChatTab` to use `streamingActivity` prop from the new shared streaming query
