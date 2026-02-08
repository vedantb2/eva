import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import {
  getSandbox,
  getGitHubToken,
  getOrCreateSandbox,
  runClaudeCLIStreaming,
  extractJsonFromText,
} from "../sandbox";

export const summarizeSession = inngest.createFunction(
  { id: "summarize-session", retries: 2 },
  { event: "session/summary.generate" },
  async ({ event, step }) => {
    const { clerkToken, sessionId, repoId, installationId } = event.data;
    const convex = createConvex(clerkToken);

    const { session, repo } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!sessionData || !repoData) {
        throw new Error("Session or repo not found");
      }
      return { session: sessionData, repo: repoData };
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(installationId);
      const sandbox = await getOrCreateSandbox(
        session.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.sessions.updateSandbox, {
            id: sessionId as Id<"sessions">,
            sandboxId,
          });
        },
      );
      return { sandboxId: sandbox.id };
    });

    const result = await step.run("generate-summary", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const conversation = session.messages
        .filter((m) => m.mode !== "flag")
        .map((m) => m.content)
        .join("\n\n");

      const prompt = `Summarize what was accomplished in this coding session into 3-6 short bullet points. Focus on concrete outcomes: features built, bugs fixed, files changed, decisions made. Be direct and specific.

Session log:
${conversation}

Respond with ONLY a JSON array of strings, no other text. Example: ["Built login page with form validation", "Fixed auth token refresh bug"]`;

      const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "haiku",
        allowedTools: [],
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: sessionId,
            currentActivity,
          });
        },
      });

      await convex.mutation(api.streaming.clear, { entityId: sessionId });

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (jsonStr) {
        const parsed: unknown = JSON.parse(jsonStr);
        if (
          Array.isArray(parsed) &&
          parsed.every((item): item is string => typeof item === "string")
        ) {
          return parsed;
        }
      }
      return [claudeResult.result || "No summary available"];
    });

    await step.run("update-summary", async () => {
      await convex.mutation(api.sessions.updateSummary, {
        id: sessionId as Id<"sessions">,
        summary: result,
      });
    });

    return { success: true };
  },
);
