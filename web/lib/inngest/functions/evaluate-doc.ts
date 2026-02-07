import { inngest } from "../client";
import type { Id } from "conductor-backend";
import { api } from "conductor-backend";
import { createConvex } from "@/lib/convex-auth";
import {
  createSandbox,
  getSandbox,
  getGitHubToken,
  syncRepo,
  runClaudeCLIStreaming,
  extractJsonFromText,
} from "../sandbox";

interface EvaluationResult {
  results: Array<{ requirement: string; passed: boolean; detail: string }>;
  summary: string;
}

export const evaluateDoc = inngest.createFunction(
  {
    id: "evaluate-doc",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; reportId?: string } };
      };
      const { clerkToken, reportId } = eventData.event.data;
      if (!reportId) return;
      const convex = createConvex(clerkToken);
      await convex.mutation(api.evaluationReports.failEval, {
        id: reportId as Id<"evaluationReports">,
        error: error.message,
      });
    },
  },
  { event: "testing-arena/evaluate.doc" },
  async ({ event, step }) => {
    const { clerkToken, docId, repoId } = event.data;
    const convex = createConvex(clerkToken);

    const reportId = await step.run("create-report", async () => {
      return await convex.mutation(api.evaluationReports.create, {
        repoId: repoId as Id<"githubRepos">,
        docId: docId as Id<"docs">,
      });
    });

    await step.run("update-status-running", async () => {
      await convex.mutation(api.evaluationReports.updateEvalStatus, {
        id: reportId as Id<"evaluationReports">,
        status: "running",
      });
    });

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

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.evaluationReports.updateEvalSummary, {
        id: reportId as Id<"evaluationReports">,
        summary: "Setting up sandbox...",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(repo.installationId);
      const sandbox = await createSandbox(githubToken);
      await syncRepo(sandbox, githubToken, repo.owner, repo.name);
      return { sandboxId: sandbox.id };
    });

    await step.run("update-cloning-status", async () => {
      await convex.mutation(api.evaluationReports.updateEvalSummary, {
        id: reportId as Id<"evaluationReports">,
        summary: "Analyzing codebase...",
      });
    });

    const requirements = doc.requirements ?? [];

    await step.run("explore-codebase", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const explorationPrompt = `You are a QA engineer evaluating whether a codebase meets a specification.

## Feature: ${doc.title}
${doc.description || ""}

## Requirements to verify:
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

For each requirement above, explore the codebase to find evidence of whether it is implemented.
Search for relevant files, read implementations, and note what you find.
Be thorough — check routes, components, API handlers, database schemas, and business logic.
Do NOT output JSON. Reason through each requirement and gather facts.`;

      await runClaudeCLIStreaming(sandbox, explorationPrompt, {
        model: "opus",
        allowedTools: ["Read", "Glob", "Grep"],
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: reportId,
            currentActivity,
          });
        },
      });
    });

    const result = await step.run("generate-evaluation", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const jsonPrompt = `Based on your analysis, produce the final evaluation as JSON.

Requirements (evaluate exactly ${requirements.length}, one result per requirement):
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Rules:
- "passed": true means the requirement is fully implemented and functional
- "passed": false means it is missing, partial, or broken
- "detail": brief plain-language explanation of what you found (no file paths or code)
- You MUST produce exactly ${requirements.length} results, one per requirement, in order

Output ONLY valid JSON. No markdown, no explanation, no text outside the JSON object.

{"results": [{"requirement": "...", "passed": true, "detail": "..."}], "summary": "..."}`;

      const claudeResult = await runClaudeCLIStreaming(sandbox, jsonPrompt, {
        model: "opus",
        allowedTools: [],
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: reportId,
            currentActivity,
          });
        },
      });

      if (claudeResult.isError) {
        throw new Error(`Claude agent failed: ${claudeResult.result}`);
      }

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        return {
          results: requirements.map((r) => ({
            requirement: r,
            passed: false,
            detail: "Failed to parse evaluation",
          })),
          summary: `Failed to parse evaluation results. Raw output: ${claudeResult.result.slice(0, 300)}`,
        };
      }

      const parsed: Partial<EvaluationResult> = JSON.parse(jsonStr);

      const results = Array.isArray(parsed.results)
        ? parsed.results.map(
            (item: {
              requirement?: string;
              passed?: boolean;
              detail?: string;
            }) => ({
              requirement: item.requirement || "",
              passed: item.passed === true,
              detail: item.detail || "",
            }),
          )
        : requirements.map((r) => ({
            requirement: r,
            passed: false,
            detail: "No evaluation produced",
          }));

      return {
        results,
        summary:
          typeof parsed.summary === "string"
            ? parsed.summary
            : "Evaluation completed",
      };
    });

    await step.run("cleanup-sandbox", async () => {
      await convex.mutation(api.streaming.clear, { entityId: reportId });
      try {
        const sandbox = await getSandbox(sandboxData.sandboxId);
        await sandbox.delete();
      } catch {
        // Ignore cleanup errors
      }
    });

    await step.run("save-results", async () => {
      await convex.mutation(api.evaluationReports.completeEval, {
        id: reportId as Id<"evaluationReports">,
        results: result.results,
        summary: result.summary,
      });
    });

    return { success: true };
  },
);
