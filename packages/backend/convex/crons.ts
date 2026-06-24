import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

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

export default crons;
