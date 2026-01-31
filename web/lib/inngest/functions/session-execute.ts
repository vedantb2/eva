import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import {
  getSandbox,
  WORKSPACE_DIR,
  getGitHubToken,
  setupBranch,
  getOrCreateSandbox,
  updateRemoteUrl,
  runClaudeCLI,
  captureGitDiff,
} from "../sandbox";

const PR_PATTERN = /create\s*(a\s*)?pr|open\s*pr|make\s*pr/i;

export const sessionExecute = inngest.createFunction(
  {
    id: "session-execute",
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
        content: `Error: ${error.message}`,
      });
    },
  },
  { event: "session/execute" },
  async ({ event, step }) => {
    const { clerkToken, sessionId, message, mode = "execute", generatePlan = false } = event.data;
    const convex = createConvex(clerkToken);

    const { session, repo, installationId } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      if (!sessionData) throw new Error("Session not found");
      const repoData = await convex.query(api.githubRepos.get, { id: sessionData.repoId });
      if (!repoData) throw new Error("Repository not found");
      return { session: sessionData, repo: repoData, installationId: repoData.installationId };
    });

    const effectiveMode = mode === "execute" && PR_PATTERN.test(message) ? "pr" : mode;

    if (effectiveMode === "pr") {
      if (!session.branchName) throw new Error("No branch associated with this session");

      const prUrl = await step.run("create-pr", async () => {
        const freshToken = await getGitHubToken(installationId);
        const prTitle = session.title;
        const prBody = `Session: ${session.title}\n\n---\n*Created by Eva AI Agent*`;

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
          throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
        }

        const prData = await response.json();
        return prData.html_url;
      });

      await step.run("update-session", async () => {
        await convex.mutation(api.sessions.updateSandbox, {
          id: sessionId as Id<"sessions">,
          prUrl,
        });
        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: `Pull request created: ${prUrl}`,
        });
      });

      return { success: true, prUrl };
    }

    if (effectiveMode === "ask") {
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

Question: ${message}

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

        return claudeResult.result || "I couldn't find an answer to your question.";
      });

      await step.run("update-session", async () => {
        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: result,
          mode: "ask",
        });
      });

      return { success: true };
    }

    if (effectiveMode === "plan") {
      await step.run("add-processing-message", async () => {
        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: generatePlan ? "Generating implementation plan..." : "Thinking...",
          mode: "plan",
        });
      });

      const sandboxData = await step.run("setup-sandbox", async () => {
        const githubToken = await getGitHubToken(installationId);
        const branchName = session.branchName || `session/${sessionId}`;
        const sandbox = await getOrCreateSandbox(
          session.sandboxId,
          githubToken,
          repo.owner,
          repo.name,
          async (sandboxId) => {
            await convex.mutation(api.sessions.updateSandbox, {
              id: sessionId as Id<"sessions">,
              sandboxId,
              branchName,
            });
          },
        );
        await setupBranch(sandbox, branchName);
        return { sandboxId: sandbox.id, branchName };
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
${message}

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
${message}

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

        return claudeResult.result || (generatePlan ? "Plan created successfully." : "I couldn't process your message.");
      });

      await step.run("update-session", async () => {
        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: result,
          mode: "plan",
        });
      });

      return { success: true };
    }

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Processing your request...",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(installationId);
      const branchName = session.branchName || `session/${sessionId}`;
      const sandbox = await getOrCreateSandbox(
        session.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.sessions.updateSandbox, {
            id: sessionId as Id<"sessions">,
            sandboxId,
            branchName,
          });
        },
      );
      await setupBranch(sandbox, branchName);
      return { sandboxId: sandbox.id, branchName };
    });

    const result = await step.run("execute-task", async () => {
      const freshToken = await getGitHubToken(installationId);
      const sandbox = await getSandbox(sandboxData.sandboxId);
      await updateRemoteUrl(sandbox, freshToken, repo.owner, repo.name);

      const headResult = await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git rev-parse HEAD`,
        "/",
        undefined,
        10,
      );
      const beforeHead = (headResult.result || "").trim();

      const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
      const prompt = `You are working on an ongoing session. The user has requested the following task:

## User Request:
${message}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${sandboxData.branchName}

## Instructions:
1. Read the CLAUDE.md file if it exists to understand the codebase
2. Use Glob and Read tools to explore and find relevant files
3. Make the requested changes using Edit or Write tools
4. Commit your changes with: git add -A && git commit -m "task: ${commitMessage}"
5. Push the changes: git push -u origin ${sandboxData.branchName}
6. Respond with a summary of what you did

## Rules:
- Do NOT create PRs - just commit and push
- Do NOT run build, lint, test, or dev commands
- Make minimal, focused changes
- Use the repository's lockfile to determine the correct package manager
- The GITHUB_TOKEN environment variable is set for git operations`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      });

      return {
        summary: claudeResult.result || "Task completed successfully.",
        beforeHead,
        sandboxId: sandboxData.sandboxId,
      };
    });

    await step.run("save-diffs", async () => {
      if (!result.beforeHead) return;
      const sandbox = await getSandbox(result.sandboxId);
      const diffs = await captureGitDiff(sandbox, result.beforeHead);
      if (diffs.length > 0) {
        await convex.mutation(api.sessions.updateFileDiffs, {
          id: sessionId as Id<"sessions">,
          fileDiffs: diffs,
        });
      }
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.summary,
      });
    });

    return { success: true };
  },
);
