import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { getGitHubToken, runClaudeCLI, ensureProjectSandbox } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful assistant helping a user plan and refine their software feature request.
Be concise and helpful. Focus on understanding user requirements and clarifying edge cases.
Keep responses short and to the point.`;

export const interviewChat = inngest.createFunction(
  {
    id: "interview-chat",
    retries: 2,
  },
  { event: "project/interview.chat" },
  async ({ event, step }) => {
    const { projectId, repoId, installationId, userMessage, systemPrompt } = event.data;

    const project = await step.run("fetch-project", async () => {
      const p = await convex.query(api.projects.getNoAuth, {
        id: projectId as Id<"projects">,
      });
      if (!p) throw new Error("Project not found");
      return p;
    });

    const repo = await step.run("fetch-repo", async () => {
      const r = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!r) throw new Error("Repo not found");
      return r;
    });

    const response = await step.run("generate-response", async () => {
      const githubToken = await getGitHubToken(installationId);
      const workDir = "/home/daytona/workspace/repo";

      const sandbox = await ensureProjectSandbox(
        project.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        workDir,
        async (sandboxId) => {
          await convex.mutation(api.projects.updateSandboxNoAuth, {
            id: projectId as Id<"projects">,
            sandboxId,
          });
        }
      );

      const conversationHistory = project.conversationHistory as ConversationMessage[];
      const historyText = conversationHistory
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${systemPrompt || SYSTEM_PROMPT}

## Conversation History
${historyText}

User: ${userMessage}

Respond helpfully to the user's message.`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "haiku",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir,
        timeout: 120,
      });

      return claudeResult.result;
    });

    await step.run("save-response", async () => {
      await convex.mutation(api.projects.addMessageNoAuth, {
        id: projectId as Id<"projects">,
        role: "assistant",
        content: response,
      });
    });

    await step.run("update-activity", async () => {
      await convex.mutation(api.projects.updateLastSandboxActivityNoAuth, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true, response };
  }
);
