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
  runClaudeCLIStreaming,
  captureGitDiff,
} from "../sandbox";

const PR_PATTERN = /create\s*(a\s*)?pr|open\s*pr|make\s*pr/i;

export const sessionExecute = inngest.createFunction(
  {
    id: "session-execute",
    retries: 2,
    cancelOn: [{ event: "session/execute.cancel", match: "data.sessionId" }],
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
    const {
      clerkToken,
      sessionId,
      message,
      mode = "execute",
    } = event.data;
    const convex = createConvex(clerkToken);

    const { session, repo, installationId } = await step.run(
      "fetch-session-data",
      async () => {
        const sessionData = await convex.query(api.sessions.get, {
          id: sessionId as Id<"sessions">,
        });
        if (!sessionData) throw new Error("Session not found");
        const repoData = await convex.query(api.githubRepos.get, {
          id: sessionData.repoId,
        });
        if (!repoData) throw new Error("Repository not found");
        return {
          session: sessionData,
          repo: repoData,
          installationId: repoData.installationId,
        };
      },
    );

    const effectiveMode =
      mode === "execute" && PR_PATTERN.test(message) ? "pr" : mode;

    if (effectiveMode === "pr") {
      if (!session.branchName)
        throw new Error("No branch associated with this session");

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
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `GitHub API error: ${errorData.message || response.statusText}`,
          );
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
          .map(
            (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
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

        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: "",
          mode: "ask",
          activityLog: "",
        });
        const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
          model: "opus",
          allowedTools: ["Read", "Glob", "Grep"],
          onOutput: async (currentActivity) => {
            await convex.mutation(api.streaming.set, {
              entityId: sessionId,
              currentActivity,
            });
          },
        });

        return {
          text:
            claudeResult.result ||
            "I couldn't find an answer to your question.",
          activityLog: claudeResult.activityLog,
        };
      });

      await step.run("save-answer", async () => {
        await convex.mutation(api.streaming.clear, {
          entityId: sessionId,
        });
        await convex.mutation(api.sessions.updateLastMessage, {
          id: sessionId as Id<"sessions">,
          content: result.text,
          activityLog: result.activityLog || undefined,
        });
      });

      return { success: true };
    }

    if (effectiveMode === "plan") {
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
          .map(
            (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n\n");

        const existingPlan = session.planContent || "";

        const prompt = `You are a planning assistant helping a non-technical business user design an implementation plan for a codebase.

## Repository: ${repo.owner}/${repo.name}

## Previous Conversation:
${conversationHistory || "None"}

## Current plan.md contents:
${existingPlan || "No plan created yet."}

## User Message:
${message}

## Instructions:
1. Use Glob, Grep, Read to explore the codebase as needed to answer the user's question
2. Ask clarifying questions about requirements when needed
3. After each interaction, create or update plan.md in the repository root with the current state of the plan
4. The plan should be a living document - add sections incrementally as you learn more
5. Structure plan.md with: Overview, Files to Modify, Implementation Steps, Dependencies/Prerequisites

## Rules:
- You may ONLY write to plan.md in the repository root - do NOT modify any other files
- Use the Write tool to create/update plan.md
- Write for a non-technical audience - avoid jargon, explain concepts simply
- Keep your conversational response SHORT (2-4 sentences)
- Be specific about what files and changes are needed in the plan
- If this is the first message, create plan.md with initial structure based on the user's request
- If plan.md already exists, update it based on the new information from the conversation
- Do NOT commit or push any changes`;

        await convex.mutation(api.sessions.addMessage, {
          id: sessionId as Id<"sessions">,
          role: "assistant",
          content: "",
          mode: "plan",
          activityLog: "",
        });
        const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
          model: "opus",
          allowedTools: ["Read", "Write", "Glob", "Grep"],
          onOutput: async (currentActivity) => {
            await convex.mutation(api.streaming.set, {
              entityId: sessionId,
              currentActivity,
            });
          },
        });

        return {
          text:
            claudeResult.result || "I couldn't process your message.",
          activityLog: claudeResult.activityLog,
          sandboxId: sandboxData.sandboxId,
        };
      });

      await step.run("save-plan-content", async () => {
        const sandbox = await getSandbox(result.sandboxId);
        const catResult = await sandbox.process.executeCommand(
          `cat ${WORKSPACE_DIR}/plan.md 2>/dev/null || echo ""`,
          "/",
          undefined,
          10,
        );
        const planContent = (catResult.result || "").trim();
        if (planContent) {
          await convex.mutation(api.sessions.updatePlanContent, {
            id: sessionId as Id<"sessions">,
            planContent,
          });
        }
      });

      await step.run("save-answer", async () => {
        await convex.mutation(api.streaming.clear, {
          entityId: sessionId,
        });
        await convex.mutation(api.sessions.updateLastMessage, {
          id: sessionId as Id<"sessions">,
          content: result.text,
          activityLog: result.activityLog || undefined,
        });
      });

      return { success: true };
    }

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

      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "",
        activityLog: "",
      });
      const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: sessionId,
            currentActivity,
          });
        },
      });

      return {
        summary: claudeResult.result || "Task completed successfully.",
        activityLog: claudeResult.activityLog,
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

    await step.run("save-answer", async () => {
      await convex.mutation(api.streaming.clear, {
        entityId: sessionId,
      });
      await convex.mutation(api.sessions.updateLastMessage, {
        id: sessionId as Id<"sessions">,
        content: result.summary,
        activityLog: result.activityLog || undefined,
      });
    });

    return { success: true };
  },
);
