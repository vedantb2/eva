import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Send the daily unread-notification digest at 08:00 UTC.
crons.daily(
  "daily notification digest",
  { hourUTC: 8, minuteUTC: 0 },
  internal.notificationDigest.sendDailyDigests,
  {},
);

export default crons;
