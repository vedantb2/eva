import { inngest } from "../client";
import { Sandbox } from "e2b";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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
          const sbx = await Sandbox.connect(session.sandboxId, {
            apiKey: serverEnv.E2B_API_KEY,
          });
          await sbx.commands.run("echo 'sandbox alive'", { timeoutMs: 5000 });
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || "main",
            isNew: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      const sbx = await Sandbox.create("anthropic-claude-code", {
        apiKey: serverEnv.E2B_API_KEY,
        envs: {
          GITHUB_TOKEN: freshToken,
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
        },
        timeoutMs: 60 * 60 * 1000,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sbx.commands.run(`git clone ${repoUrl} ~/workspace`, {
        timeoutMs: 120000,
      });

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sbx.sandboxId,
      });

      return { sandboxId: sbx.sandboxId, branchName: "main", isNew: true };
    });

    const result = await step.run("ask-question", async () => {
      const sbx = await Sandbox.connect(sandboxData.sandboxId, {
        apiKey: serverEnv.E2B_API_KEY,
      });

      const conversationHistory = session.messages
        .filter((m) => m.mode === "ask")
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `You are a code assistant answering questions about a codebase. This is READ-ONLY mode - do NOT make any changes to files.

## Repository: ${repo.owner}/${repo.name}

## Previous Conversation:
${conversationHistory || "No previous conversation."}

## Current Question:
${messageContent}

## Instructions:
1. Use Glob to find relevant files
2. Use Grep to search for specific patterns
3. Use Read to examine file contents
4. Answer the user's question based on your findings

## Rules:
- DO NOT use Write, Edit, or Bash tools that modify files
- DO NOT commit or push anything
- Only use: Read, Glob, Grep
- Provide clear, concise answers with code references`;

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let output = "";
      try {
        const cmdResult = await sbx.commands.run(
          `cd ~/workspace && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model opus --allowedTools "Read,Glob,Grep" --output-format json`,
          { timeoutMs: 0 }
        );
        output = cmdResult.stdout || "";
      } catch (err) {
        const error = err as {
          stderr?: string;
          stdout?: string;
          message?: string;
        };
        throw new Error(
          `Claude agent failed: ${
            error.stderr || error.stdout || error.message || "Unknown error"
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
