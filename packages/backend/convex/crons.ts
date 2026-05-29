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

export default crons;
