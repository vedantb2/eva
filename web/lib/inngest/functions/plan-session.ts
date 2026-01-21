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

export const planSession = inngest.createFunction(
  {
    id: "plan-session",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { sessionId: string } };
      };
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId,
        role: "assistant",
        content: `Error during planning: ${error.message}`,
        mode: "plan",
      });
    },
  },
  { event: "session/plan.execute" },
  async ({ event, step }) => {
    const { sessionId, messageContent, repoId, installationId, generatePlan } =
      event.data;

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
        content: generatePlan
          ? "Generating implementation plan..."
          : "Thinking...",
        mode: "plan",
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
            branchName: session.branchName || `session/${sessionId}`,
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

      const branchName = session.branchName || `session/${sessionId}`;

      const branchCheckResult = await sandbox.process.executeCommand(
        `cd ~/workspace && git ls-remote --heads origin ${branchName}`,
        "/",
        undefined,
        30
      );

      if (branchCheckResult.result?.includes(branchName)) {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git fetch origin ${branchName} && git checkout ${branchName}`,
          "/",
          undefined,
          30
        );
      } else {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git checkout -b ${branchName}`,
          "/",
          undefined,
          30
        );
      }

      await sandbox.process.executeCommand(
        'git config --global user.name "Pulse Agent" && git config --global user.email "agent@pulse.dev"',
        "/",
        undefined,
        10
      );

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
        branchName,
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
    });

    const result = await step.run("plan-conversation", async () => {
      const freshToken = await getGitHubToken(installationId);

      const sandbox = await daytona.get(sandboxData.sandboxId);

      await sandbox.process.executeCommand(
        `cd ~/workspace && git remote set-url origin https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`,
        "/",
        undefined,
        10
      );

      const conversationHistory = session.messages
        .filter((m) => m.mode === "plan")
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      let prompt: string;
      let allowedTools: string;

      if (generatePlan) {
        prompt = `You are creating a detailed implementation plan based on a planning conversation.

## Repository: ${repo.owner}/${repo.name}
## Branch: ${sandboxData.branchName}

## Planning Conversation:
${conversationHistory}

## Final Request:
${messageContent}

## Instructions:
1. Review the conversation to understand the full scope
2. Use Glob, Grep, Read to analyze the codebase
3. Create a detailed plan.md file in the root directory with:
   - Overview of changes
   - List of files to create/modify
   - Step-by-step implementation tasks
   - Any dependencies or prerequisites
4. Commit and push the plan: git add plan.md && git commit -m "docs: add implementation plan" && git push -u origin ${sandboxData.branchName}
5. Respond with a summary of the plan

## Rules:
- Only create/modify plan.md - no other changes
- Use Markdown formatting in the plan
- Be specific about file paths and changes`;

        allowedTools = "Read,Write,Edit,Bash,Glob,Grep";
      } else {
        prompt = `You are a planning assistant helping design an implementation approach. This is the PLANNING phase - gather requirements and discuss approach before implementing.

## Repository: ${repo.owner}/${repo.name}

## Previous Planning Conversation:
${conversationHistory || "No previous conversation."}

## Current Message:
${messageContent}

## Instructions:
1. Use Glob, Grep, Read to explore the codebase as needed
2. Ask clarifying questions about requirements
3. Discuss implementation approaches and trade-offs
4. Help refine the plan with the user

## Rules:
- DO NOT make code changes - only read and discuss
- Ask questions to clarify requirements
- Suggest approaches and explain trade-offs
- When ready, tell the user to click "Generate Plan" to create plan.md`;

        allowedTools = "Read,Glob,Grep";
      }

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let output = "";
      try {
        const cmdResult = await sandbox.process.executeCommand(
          `cd ~/workspace && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model opus --allowedTools "${allowedTools}" --output-format json`,
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

      let response = generatePlan
        ? "Plan created successfully."
        : "I couldn't process your message.";
      try {
        const jsonResponse = JSON.parse(output);
        if (jsonResponse.result) {
          response = jsonResponse.result;
        }
      } catch {
        if (output.length > 0) {
          response = output.slice(-2000);
        }
      }

      return { response };
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.response,
        mode: "plan",
      });
    });

    return { success: true };
  }
);
