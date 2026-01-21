import { inngest } from "../client";
import { Daytona } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

export const askSession = inngest.createFunction(
  {
    id: "ask-session",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { sessionId: string } };
      };
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId,
        role: "assistant",
        content: `Error processing question: ${error.message}`,
        mode: "ask",
      });
    },
  },
  { event: "session/ask.execute" },
  async ({ event, step }) => {
    const { sessionId, messageContent, repoId, installationId } = event.data;

    const { session, repo } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.getNoAuth, {
        id: sessionId as Id<"sessions">,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!sessionData || !repoData) {
        throw new Error("Session or repo not found");
      }
      return { session: sessionData, repo: repoData };
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Analyzing codebase...",
        mode: "ask",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(installationId);

      if (session.sandboxId) {
        try {
          const sandbox = await daytona.get(session.sandboxId);
          await sandbox.process.executeCommand("echo 'sandbox alive'", "/", undefined, 5);
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || "main",
            isNew: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      const sandbox = await daytona.create({
        envVars: {
          GITHUB_TOKEN: freshToken,
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
        },
        autoStopInterval: 60,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sandbox.process.executeCommand(
        `git clone ${repoUrl} ~/workspace`,
        "/",
        undefined,
        120
      );

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
      });

      return { sandboxId: sandbox.id, branchName: "main", isNew: true };
    });

    const result = await step.run("ask-question", async () => {
      const sandbox = await daytona.get(sandboxData.sandboxId);

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

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let output = "";
      try {
        const cmdResult = await sandbox.process.executeCommand(
          `cd ~/workspace && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model opus --allowedTools "Read,Glob,Grep" --output-format json`,
          "/",
          undefined,
          0
        );
        output = cmdResult.result || "";
      } catch (err) {
        const error = err as {
          result?: string;
          message?: string;
        };
        throw new Error(
          `Claude agent failed: ${
            error.result || error.message || "Unknown error"
          }`
        );
      }

      let answer = "I couldn't find an answer to your question.";
      try {
        const jsonResponse = JSON.parse(output);
        if (jsonResponse.result) {
          answer = jsonResponse.result;
        }
      } catch {
        if (output.length > 0) {
          answer = output.slice(-2000);
        }
      }

      return { answer };
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.answer,
        mode: "ask",
      });
    });

    return { success: true };
  }
);
