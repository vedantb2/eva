import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import {
  createSandbox,
  getSandbox,
  getGitHubToken,
  runClaudeCLIStreaming,
  setupBranch,
  syncRepo,
} from "../sandbox";

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return slug || "untitled";
}

function sanitizeCommitTitle(title: string): string {
  return title.replace(/"/g, "'").trim() || "document";
}

function formatRequirements(requirements: string[]): string {
  if (requirements.length === 0) {
    return "1. No explicit requirements provided. Infer coverage from the feature description and user flows.";
  }
  return requirements
    .map((requirement, i) => `${i + 1}. ${requirement}`)
    .join("\n");
}

function formatUserFlows(
  userFlows: Array<{ name: string; steps: string[] }>,
): string {
  if (userFlows.length === 0) {
    return "### Primary Flow\n1. No explicit user flows provided. Infer the main flow and key edge cases from the feature description.";
  }
  return userFlows
    .map((flow) => {
      const flowName = flow.name?.trim() || "Unnamed Flow";
      const steps =
        flow.steps.length > 0
          ? flow.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")
          : "1. No steps provided.";
      return `### ${flowName}\n${steps}`;
    })
    .join("\n\n");
}

function buildGenerateTestsPrompt(args: {
  title: string;
  description?: string;
  requirements: string[];
  userFlows: Array<{ name: string; steps: string[] }>;
  branchName: string;
}): string {
  const commitTitle = sanitizeCommitTitle(args.title);

  return `You are a test engineer. Generate tests for the feature described below.

## Feature: ${args.title}
${args.description || "No description provided."}

## Requirements to test:
${formatRequirements(args.requirements)}

## User Flows:
${formatUserFlows(args.userFlows)}

## Steps:
1. Read CLAUDE.md for tech stack and testing conventions
2. Explore the codebase for existing test patterns and frameworks
3. Find the source code implementing this feature
4. Generate test files covering each requirement and user flow
5. Place tests alongside existing tests or in the appropriate directory
6. Match the existing testing framework and patterns
7. git add -A && git commit -m "test: add tests for ${commitTitle}"
8. git push -u origin ${args.branchName}

## Rules:
- Only generate test files, do NOT modify source code
- Cover each requirement with at least one test case
- Do NOT run the tests`;
}

export const generateTests = inngest.createFunction(
  {
    id: "generate-tests",
    retries: 1,
    onFailure: async ({ event }) => {
      const eventData = event.data as unknown as {
        event?: { data?: { clerkToken?: string; docId?: string } };
        clerkToken?: string;
        docId?: string;
      };
      const clerkToken =
        eventData.event?.data?.clerkToken ?? eventData.clerkToken;
      const docId = eventData.event?.data?.docId ?? eventData.docId;
      if (!clerkToken || !docId) return;
      const convex = createConvex(clerkToken);
      await convex.mutation(api.docs.failTestGen, {
        id: docId as Id<"docs">,
      });
      await convex.mutation(api.streaming.clear, { entityId: docId });
    },
  },
  { event: "docs/generate-tests.requested" },
  async ({ event, step }) => {
    const { clerkToken, docId, repoId } = event.data;
    const convex = createConvex(clerkToken);

    const { doc, repo } = await step.run("fetch-data", async () => {
      const docData = await convex.query(api.docs.get, {
        id: docId as Id<"docs">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!docData || !repoData) {
        throw new Error("Doc or repo not found");
      }
      return { doc: docData, repo: repoData };
    });

    if (doc.testGenStatus === "completed" && doc.testPrUrl) {
      return { success: true, prUrl: doc.testPrUrl, reused: true };
    }

    await step.run("update-status", async () => {
      await convex.mutation(api.docs.startTestGen, {
        id: docId as Id<"docs">,
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(repo.installationId);
      const sandbox = await createSandbox(githubToken);
      await syncRepo(sandbox, githubToken, repo.owner, repo.name);
      const branchName = `tests/doc-${slugify(doc.title)}`;
      await setupBranch(sandbox, branchName);
      return { sandboxId: sandbox.id, branchName };
    });

    await step.run("generate-tests", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);
      const prompt = buildGenerateTestsPrompt({
        title: doc.title,
        description: doc.description ?? undefined,
        requirements: doc.requirements ?? [],
        userFlows: doc.userFlows ?? [],
        branchName: sandboxData.branchName,
      });

      const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "sonnet",
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: docId,
            currentActivity,
          });
        },
      });

      if (claudeResult.isError) {
        throw new Error(`Claude agent failed: ${claudeResult.result}`);
      }
    });

    const prUrl = await step.run("create-pr", async () => {
      const githubToken = await getGitHubToken(repo.installationId);
      const prTitle = `test: add tests for ${doc.title}`;
      const prBody = `Tests generated from docs entry: ${doc.title}\n\n---\n*Created by Eva AI Agent*`;

      const response = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: prTitle,
            body: prBody,
            head: sandboxData.branchName,
            base: "main",
          }),
        },
      );

      if (!response.ok) {
        const errorData: { message?: string } = await response
          .json()
          .catch(() => ({}));
        throw new Error(
          `GitHub API error: ${errorData.message || response.statusText}`,
        );
      }

      const prData: { html_url: string } = await response.json();
      return prData.html_url;
    });

    await step.run("complete", async () => {
      await convex.mutation(api.docs.completeTestGen, {
        id: docId as Id<"docs">,
        prUrl,
      });
      await convex.mutation(api.streaming.clear, { entityId: docId });
      try {
        const sandbox = await getSandbox(sandboxData.sandboxId);
        await sandbox.delete();
      } catch {
        // Ignore cleanup errors
      }
    });

    return { success: true, prUrl };
  },
);
