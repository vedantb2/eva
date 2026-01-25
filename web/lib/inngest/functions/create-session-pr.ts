import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { getGitHubToken } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export const createSessionPr = inngest.createFunction(
  {
    id: "create-session-pr",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { sessionId: string } };
      };
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId,
        role: "assistant",
        content: `Failed to create PR: ${error.message}`,
      });
    },
  },
  { event: "session/pr.create" },
  async ({ event, step }) => {
    const { sessionId, repoId, installationId, title, description } = event.data;

    const { session, repo } = await step.run("fetch-data", async () => {
      const sessionData = await convex.query(api.sessions.getNoAuth, {
        id: sessionId as Id<"sessions">,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!sessionData || !repoData) {
        throw new Error("Session or repo not found");
      }
      if (!sessionData.branchName) {
        throw new Error("No branch associated with this session");
      }
      return { session: sessionData, repo: repoData };
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Creating pull request...",
      });
    });

    const prUrl = await step.run("create-pr", async () => {
      const freshToken = await getGitHubToken(installationId);

      const prTitle = title || session.title;
      const prBody = description || `Session: ${session.title}\n\n---\n*Created by Eva AI Agent*`;

      const response = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: prTitle,
            body: prBody,
            head: session.branchName,
            base: "main",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `GitHub API error: ${errorData.message || response.statusText}`
        );
      }

      const prData = await response.json();
      return prData.html_url;
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        prUrl,
      });

      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: `Pull request created: ${prUrl}`,
      });
    });

    return { success: true, prUrl };
  }
);
