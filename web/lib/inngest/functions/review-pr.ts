import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox, isSandboxAlive, createSandbox } from "../sandbox";
import {
  getGitHubToken,
  cloneRepo,
  setupBranch,
  runClaudeCLI,
  extractJsonFromText,
  installClaudeCode,
} from "../sandbox-helpers";

interface ReviewComment {
  path: string;
  line: number;
  body: string;
}

interface ReviewResult {
  summary: string;
  comments: ReviewComment[];
}

export const reviewPr = inngest.createFunction(
  {
    id: "review-pr",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; reviewId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const reviewId = eventData.event.data.reviewId as Id<"codeReviews">;
      await convex.mutation(api.codeReviews.fail, {
        id: reviewId,
        error: error.message,
      });
    },
  },
  { event: "pr/review.requested" },
  async ({ event, step }) => {
    const {
      clerkToken,
      reviewId,
      taskId,
      runId,
      repoId,
      installationId,
      projectId,
      prUrl,
      prNumber,
      branchName,
      sandboxId,
    } = event.data;
    const convex = createConvex(clerkToken);

    const { task, repo } = await step.run("fetch-data", async () => {
      const taskData = await convex.query(api.agentTasks.get, { id: taskId as Id<"agentTasks"> });
      const repoData = await convex.query(api.githubRepos.get, { id: repoId as Id<"githubRepos"> });
      if (!taskData || !repoData) throw new Error("Task or repo not found");
      return { task: taskData, repo: repoData };
    });

    await step.run("update-status-running", async () => {
      await convex.mutation(api.codeReviews.updateStatus, {
        id: reviewId as Id<"codeReviews">,
        status: "running",
      });
    });

    const diff = await step.run("get-diff", async () => {
      const githubToken = await getGitHubToken(installationId);
      const res = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3.diff",
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to fetch PR diff: ${res.status}`);
      const text = await res.text();
      return text.slice(0, 100_000);
    });

    const result = await step.run("run-review", async () => {
      let usedSandboxId = sandboxId;
      let sandbox;

      if (usedSandboxId) {
        const alive = await isSandboxAlive(usedSandboxId);
        if (alive) {
          sandbox = await getSandbox(usedSandboxId);
        }
      }

      if (!sandbox) {
        const githubToken = await getGitHubToken(installationId);
        sandbox = await createSandbox(githubToken);
        await installClaudeCode(sandbox);
        await cloneRepo(sandbox, githubToken, repo.owner, repo.name);
        await setupBranch(sandbox, branchName);
        usedSandboxId = sandbox.id;
      }

      const prompt = `You are reviewing a pull request. Analyze the diff and the codebase to find bugs, logic errors, security issues, and code quality problems.

## PR: ${task.title}
## Description: ${task.description || "No description"}

## Diff:
\`\`\`
${diff}
\`\`\`

Review the changes carefully. For each issue found, provide the exact file path and line number from the diff.

You MUST output ONLY valid JSON. No markdown. No explanations. No text outside JSON.

{
  "summary": "Brief overall assessment of the PR",
  "comments": [
    { "path": "relative/file/path.ts", "line": 42, "body": "Description of the issue" }
  ]
}

If the code looks good, return an empty comments array with a positive summary.`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
      });

      if (claudeResult.isError) {
        throw new Error(`Claude review failed: ${claudeResult.result}`);
      }

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        return {
          summary: `Review completed but could not parse results. Raw: ${claudeResult.result.slice(0, 300)}`,
          comments: [],
        };
      }

      const parsed: Partial<ReviewResult> = JSON.parse(jsonStr);
      return {
        summary: typeof parsed.summary === "string" ? parsed.summary : "Review completed",
        comments: Array.isArray(parsed.comments)
          ? parsed.comments
              .filter(
                (c: Record<string, unknown>) =>
                  typeof c.path === "string" && typeof c.line === "number" && typeof c.body === "string"
              )
              .map((c: Record<string, unknown>) => ({
                path: c.path as string,
                line: c.line as number,
                body: c.body as string,
              }))
          : [],
      };
    });

    await step.run("post-github-review", async () => {
      const githubToken = await getGitHubToken(installationId);
      const ghComments = result.comments.map((c) => ({
        path: c.path,
        line: c.line,
        side: "RIGHT" as const,
        body: c.body,
      }));

      const res = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls/${prNumber}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: result.summary,
            event: "COMMENT",
            comments: ghComments,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to post GitHub review: ${res.status} ${body}`);
      }
    });

    await step.run("save-results", async () => {
      await convex.mutation(api.codeReviews.complete, {
        id: reviewId as Id<"codeReviews">,
        summary: result.summary,
        comments: result.comments,
      });
    });

    return { success: true };
  }
);
