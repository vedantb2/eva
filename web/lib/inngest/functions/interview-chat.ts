import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import {
  WORKSPACE_DIR,
  getGitHubToken,
  runClaudeCLI,
  ensureSandbox,
} from "../sandbox";

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
    const {
      clerkToken,
      projectId,
      repoId,
      installationId,
      userMessage,
      systemPrompt,
    } = event.data;
    const convex = createConvex(clerkToken);

    const { project, repo } = await step.run("fetch-data", async () => {
      const projectData = await convex.query(api.projects.get, {
        id: projectId as Id<"projects">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!projectData || !repoData)
        throw new Error("Project or repo not found");
      return { project: projectData, repo: repoData };
    });

    const response = await step.run("generate-response", async () => {
      const githubToken = await getGitHubToken(installationId);

      const sandbox = await ensureSandbox(
        project.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.projects.updateProjectSandbox, {
            id: projectId as Id<"projects">,
            sandboxId,
          });
        },
      );

      const conversationHistory =
        project.conversationHistory as ConversationMessage[];
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
        workDir: WORKSPACE_DIR,
        timeout: 120,
      });

      return claudeResult.result;
    });

    await step.run("save-response", async () => {
      await convex.mutation(api.projects.addMessage, {
        id: projectId as Id<"projects">,
        role: "assistant",
        content: response,
      });
      await convex.mutation(api.projects.updateLastSandboxActivity, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true, response };
  },
);
