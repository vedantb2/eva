import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { createSandbox, getSandbox } from "../sandbox";
import { getGitHubToken, cloneRepo, setupBranch, configureGit, updateRemoteUrl, runClaudeCLI, installClaudeCode } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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
    const { sessionId, messageContent, repoId, installationId, generatePlan } = event.data;

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
        content: generatePlan ? "Generating implementation plan..." : "Thinking...",
        mode: "plan",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(installationId);

      if (session.sandboxId) {
        try {
          const existingSandbox = await getSandbox(session.sandboxId);
          await existingSandbox.process.executeCommand("echo 'sandbox alive'", "/", undefined, 5);
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || `session/${sessionId}`,
            isNew: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      const sandbox = await createSandbox(freshToken);
      await installClaudeCode(sandbox);
      await cloneRepo(sandbox, freshToken, repo.owner, repo.name);

      const branchName = session.branchName || `session/${sessionId}`;
      await setupBranch(sandbox, branchName);
      await configureGit(sandbox);

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
        branchName,
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
    });

    const result = await step.run("plan-conversation", async () => {
      const freshToken = await getGitHubToken(installationId);
      const sandbox = await getSandbox(sandboxData.sandboxId);

      await updateRemoteUrl(sandbox, freshToken, repo.owner, repo.name);

      const conversationHistory = session.messages
        .filter((m) => m.mode === "plan")
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      let prompt: string;
      let allowedTools: ("Read" | "Write" | "Edit" | "Bash" | "Glob" | "Grep")[];

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

        allowedTools = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"];
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

        allowedTools = ["Read", "Glob", "Grep"];
      }

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "opus",
        allowedTools,
      });

      return { response: claudeResult.result || (generatePlan ? "Plan created successfully." : "I couldn't process your message.") };
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
