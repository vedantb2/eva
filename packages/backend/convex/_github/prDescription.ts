"use node";

import { generateText } from "ai";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { getInstallationOctokit } from "../githubAuth";
import { fetchPullRequestDiff } from "./prRecapService";
import {
  buildPrDescriptionPrompt,
  cleanPrDescription,
  insertPrDescription,
  stripPrDescription,
} from "./prDescriptionPrompt";

/** Gateway model for PR descriptions. Needs to read a diff and sketch its
 * shape, which the nano tier used for titles gets wrong too often. */
const PR_DESCRIPTION_MODEL = "openai/gpt-5-mini";

/**
 * Writes the reviewer-facing description into a PR body from its diff.
 * Scheduled after every PR create/refresh so the body follows the code rather
 * than the task text. Best-effort: failures are logged and the static body
 * stays in place, so a gateway outage never blocks a PR.
 */
export const generatePrDescription = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prNumber: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const label = `${args.repoOwner}/${args.repoName}#${args.prNumber}`;
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      const target = {
        owner: args.repoOwner,
        repo: args.repoName,
        prNumber: args.prNumber,
      };
      const { data: pr } = await octokit.rest.pulls.get({
        owner: target.owner,
        repo: target.repo,
        pull_number: target.prNumber,
      });
      const diff = await fetchPullRequestDiff(octokit, target);
      if (diff.additions + diff.deletions === 0) {
        console.log(`[pr-description] ${label} has no diff; skipping`);
        return null;
      }

      const { text } = await generateText({
        model: PR_DESCRIPTION_MODEL,
        prompt: buildPrDescriptionPrompt({
          prTitle: pr.title,
          context: stripPrDescription(pr.body ?? ""),
          diffText: diff.diffText,
          changedFiles: diff.changedFiles,
          additions: diff.additions,
          deletions: diff.deletions,
          truncated: diff.truncated,
        }),
        providerOptions: {
          gateway: { serviceTier: "flex" },
          openai: { reasoningEffort: "low" },
        },
      });
      const description = cleanPrDescription(text);
      if (description.length === 0) {
        console.error(`[pr-description] ${label} model returned empty text`);
        return null;
      }

      // Re-read the body right before writing: a later push may have refreshed
      // the static sections while the model was working, and we must not
      // overwrite them with the copy we read at the start.
      const { data: latest } = await octokit.rest.pulls.get({
        owner: target.owner,
        repo: target.repo,
        pull_number: target.prNumber,
      });
      await octokit.rest.pulls.update({
        owner: target.owner,
        repo: target.repo,
        pull_number: target.prNumber,
        body: insertPrDescription(latest.body ?? "", description),
      });
    } catch (error) {
      console.error(
        `[pr-description] ${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  },
});
