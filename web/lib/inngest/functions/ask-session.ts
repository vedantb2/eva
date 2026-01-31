import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox } from "../sandbox";
import {
  getGitHubToken,
  ensureSandbox,
  runClaudeCLI,
} from "../sandbox-helpers";

export const askSession = inngest.createFunction(
  {
    id: "ask-session",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; sessionId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId,
        role: "assistant",
        content: `Error processing question: ${error.message}`,
        mode: "ask",
      });
    },
  },
  { event: "session/ask.execute" },
  async ({ event, step }) => {
    const { clerkToken, sessionId, messageContent, repoId, installationId } =
      event.data;
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
      const sandbox = await ensureSandbox(
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

    const result = await step.run("ask-question", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const conversationHistory = session.messages
        .filter((m) => m.mode === "ask")
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `You are answering questions about a codebase for a non-technical user. This is READ-ONLY mode.

Repository: ${repo.owner}/${repo.name}

Previous conversation:
${conversationHistory || "None"}

Question: ${messageContent}

How to find information:
- Use Glob to find files
- Use Grep to search for patterns
- Use Read to examine files

CRITICAL response rules:
- Keep your answer SHORT (2-4 sentences max)
- Use PLAIN TEXT only, no markdown formatting, no headers, no bullet points, no code blocks
- Write for someone who does NOT know programming - avoid technical jargon
- If you must mention a file, just say the filename without the full path
- Be direct and answer the question simply
- DO NOT modify any files`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Glob", "Grep"],
      });

      return {
        answer:
          claudeResult.result || "I couldn't find an answer to your question.",
      };
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.answer,
        mode: "ask",
      });
    });

    return { success: true };
  },
);
