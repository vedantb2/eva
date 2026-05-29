"use node";

import { v } from "convex/values";
import { marked } from "marked";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEmail } from "./email";
import { buildChangelogEmailHtml } from "./emailTemplates";

/** Reads a required environment variable, throwing a clear error when it is missing. */
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set in the Convex environment`);
  }
  return value;
}

/**
 * Emails the weekly changelog to every user with an email address. Scheduled by
 * updateRunStatus when an "Eva Weekly Changelog" automation run succeeds, so it
 * sends exactly once per published changelog. A failed send is logged and
 * skipped so it does not abort the batch.
 */
export const sendChangelogEmail = internalAction({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(internal.changelog.getChangelogRunForEmail, {
      runId: args.runId,
    });
    if (!run) return null;

    const appUrl = getEnv("WEB_APP_URL");
    const contentHtml = await marked.parse(run.content);
    const recipients = await ctx.runQuery(
      internal.users.listEmailRecipients,
      {},
    );

    let sent = 0;
    const failures: string[] = [];
    for (const recipient of recipients) {
      const html = buildChangelogEmailHtml({
        recipientName: recipient.name,
        appUrl,
        contentHtml,
        publishedAt: run.publishedAt,
      });
      try {
        await sendEmail({
          to: recipient.email,
          subject: `Eva Weekly Changelog #${run.runNumber}`,
          html,
        });
        sent += 1;
      } catch (error) {
        failures.push(`${recipient.email}: ${String(error)}`);
      }
    }

    console.log(
      `Changelog email: ${sent} sent, ${failures.length} failed of ${recipients.length} recipients.`,
    );
    if (failures.length > 0) {
      console.error(`Changelog email failures:\n${failures.join("\n")}`);
    }
    return null;
  },
});
