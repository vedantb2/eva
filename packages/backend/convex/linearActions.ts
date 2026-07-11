"use node";

import { v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars } from "./envVarResolver";

const LINEAR_API_URL = "https://api.linear.app/graphql";

interface LinearIssue {
  identifier: string;
  title: string;
  description: string;
}

// Boundary schema for the Linear GraphQL response. Each aliased issue may be
// null (missing/unknown id) or fail validation (wrong shape) — `.catch(null)`
// turns any per-issue failure into a skip, matching the old guard behaviour.
const linearIssueSchema = z.object({
  identifier: z.string(),
  title: z.string(),
  description: z.string().catch(""),
});

const linearResponseSchema = z.object({
  data: z.record(z.string(), linearIssueSchema.nullable().catch(null)),
});

/** Fetches Linear issues by their identifiers using the Linear GraphQL API. */
export const fetchIssues = action({
  args: {
    repoId: v.id("githubRepos"),
    identifiers: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      identifier: v.string(),
      title: v.string(),
      description: v.string(),
    }),
  ),
  handler: async (ctx, args): Promise<LinearIssue[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const envVars = await resolveAllEnvVars(ctx, args.repoId);
    const apiKey = envVars.LINEAR_API_KEY;

    if (!apiKey) {
      throw new Error(
        "LINEAR_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
      );
    }

    if (args.identifiers.length === 0) {
      return [];
    }

    const aliases = args.identifiers.map(
      (id, idx) => `issue${idx}: issue(id: "${id}")`,
    );
    const query = `
      query {
        ${aliases.join("\n")}
      }
      fragment IssueData on Issue {
        identifier
        title
        description
      }
    `.replace(/fragment IssueData on Issue \{[^}]+\}/g, "");

    const fieldsQuery = `
      query {
        ${args.identifiers
          .map(
            (id, idx) => `
          issue${idx}: issue(id: "${id}") {
            identifier
            title
            description
          }
        `,
          )
          .join("\n")}
      }
    `;

    const response = await fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: fieldsQuery }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Linear API request failed (${response.status}): ${text}`,
      );
    }

    const parsed = linearResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw new Error("Invalid Linear API response: missing data field");
    }

    const results: LinearIssue[] = [];

    for (let i = 0; i < args.identifiers.length; i++) {
      const issue = parsed.data.data[`issue${i}`];
      if (!issue) continue;
      results.push(issue);
    }

    return results;
  },
});
