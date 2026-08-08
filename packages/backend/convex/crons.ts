import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Converge every chat turn whose lease has lapsed. This one level-triggered
// job replaces the per-turn watchdog chains: it does not need to have been
// armed by the turn it kills, so a turn whose scheduler entry was never
// created — or was created and then lost — still reaches a terminal state.
crons.interval(
  "turn lease reconcile",
  { seconds: 60 },
  internal.turns.reconcile,
  {},
);

// The same contract for task runs, which lease `agentRuns` rather than `turns`
// because a run carries record semantics (retries, exit reasons) a turn does
// not. Replaces `checkStaleRuns` and the 2-hour `handleStaleRun` backstop.
crons.interval(
  "run lease reconcile",
  { seconds: 60 },
  internal.taskWorkflow.reconcileRuns,
  {},
);

// Send the unread-notification digest at 08:00 UTC on weekdays (Mon-Fri).
crons.cron(
  "daily notification digest",
  "0 8 * * 1-5",
  internal.notificationDigest.sendDailyDigests,
  {},
);

// Check every 15 minutes whether the configured daily sandbox auto-stop time
// has been reached and, if so, stop every active sandbox. The action itself is
// a no-op when auto-stop is disabled or already ran for today's occurrence.
crons.interval(
  "sandbox auto-stop sweep",
  { minutes: 15 },
  internal.sandboxAutoStop.run,
  {},
);

// Rescan `.agents/skills` on every connected codebase every 6 hours. Push
// webhooks also trigger an immediate sync when the base branch changes skills;
// this cron is the backup when push events are not subscribed or a sync fails.
crons.interval(
  "repo skills github sync",
  { hours: 6 },
  internal._repoSkills.sync.syncAllRepos,
  {},
);

// Truth-sync eva's "active" sandbox statuses against the provider. Vercel
// stops VMs on its own (session-timeout cap, platform stops) with no webhook;
// without this, a session page left open showed "active" + a dead Preview
// until the next page-mount prewarm happened to probe it.
crons.interval(
  "stale active sandbox reconcile",
  { minutes: 5 },
  internal.sandbox.reconcileStaleActiveSandboxes,
  {},
);

// Safety net: delete sandboxes for archived sessions / done|cancelled tasks
// whose 48h grace has elapsed (or never got a grace schedule).
crons.cron(
  "dead sandbox sweep",
  "0 3 * * 0",
  internal.sandboxCleanup.sweepDeadSandboxes,
  {},
);

export default crons;
