"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveAllEnvVars } from "./envVarResolver";

const LINEAR_API_URL = "https://api.linear.app/graphql";

interface LinearIssue {
  identifier: string;
  title: string;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

    const json = await response.json();

    if (!isRecord(json)) {
      throw new Error("Invalid Linear API response: not an object");
    }

    if (!isRecord(json.data)) {
      throw new Error("Invalid Linear API response: missing data field");
    }

    const results: LinearIssue[] = [];

    for (let i = 0; i < args.identifiers.length; i++) {
      const key = `issue${i}`;
      const issue = json.data[key];

      if (issue === null || issue === undefined) {
        continue;
      }

      if (!isRecord(issue)) {
        continue;
      }

      const identifier = issue.identifier;
      const title = issue.title;
      const description = issue.description;

      if (typeof identifier !== "string" || typeof title !== "string") {
        continue;
      }

      results.push({
        identifier,
        title,
        description: typeof description === "string" ? description : "",
      });
    }

    return results;
  },
});
