import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { createSandbox, getSandbox, isSandboxAlive } from "../sandbox";
import { getGitHubToken, cloneRepo, runClaudeCLI, extractJsonFromText, installClaudeCode } from "../sandbox-helpers";

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
      const freshToken = await getGitHubToken(installationId);

      if (session.sandboxId && await isSandboxAlive(session.sandboxId)) {
        return { sandboxId: session.sandboxId, isNew: false };
      }

      const sandbox = await createSandbox(freshToken);
      await installClaudeCode(sandbox);
      await cloneRepo(sandbox, freshToken, repo.owner, repo.name);

      await convex.mutation(api.sessions.updateSandbox, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
      });

      return { sandboxId: sandbox.id, isNew: true };
    });

    const result = await step.run("generate-summary", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const conversation = session.messages
        .filter((m) => m.mode !== "flag")
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `Summarize the following session conversation into 3-6 concise bullet points. Each bullet should capture a key topic, decision, or action from the conversation.

Conversation:
${conversation}

Respond with ONLY a JSON array of strings, no other text. Example: ["Built login page", "Fixed API auth bug"]`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "haiku",
        allowedTools: [],
      });

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (jsonStr) {
        const parsed: unknown = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === "string")) {
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
  }
);
