import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { createSandbox, getSandbox } from "../sandbox";
import { getGitHubToken, cloneRepo, runClaudeCLI, extractJsonFromText } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

interface EvaluationResult {
  requirementsMet: Array<{ requirement: string; evidence: string }>;
  requirementsNotMet: Array<{ requirement: string; reason: string }>;
  summary: string;
}

export const evaluateDoc = inngest.createFunction(
  {
    id: "evaluate-doc",
    retries: 1,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { reportId: string } };
      };
      const reportId = eventData.event.data.reportId as Id<"evaluationReports">;
      await convex.mutation(api.evaluationReports.failNoAuth, {
        id: reportId,
        error: error.message,
      });
    },
  },
  { event: "testing-arena/evaluate.doc" },
  async ({ event, step }) => {
    const { reportId, docId, repoId } = event.data;

    await step.run("update-status-running", async () => {
      await convex.mutation(api.evaluationReports.updateStatusNoAuth, {
        id: reportId as Id<"evaluationReports">,
        status: "running",
      });
    });

    const { doc, repo } = await step.run("fetch-data", async () => {
      const docData = await convex.query(api.docs.getNoAuth, { id: docId as Id<"docs"> });
      const repoData = await convex.query(api.githubRepos.getNoAuth, { id: repoId as Id<"githubRepos"> });
      if (!docData || !repoData) {
        throw new Error("Doc or repo not found");
      }
      return { doc: docData, repo: repoData };
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.evaluationReports.updateSummaryNoAuth, {
        id: reportId as Id<"evaluationReports">,
        summary: "Setting up sandbox...",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(repo.installationId);
      const sandbox = await createSandbox(githubToken);
      await cloneRepo(sandbox, githubToken, repo.owner, repo.name);
      return { sandboxId: sandbox.id };
    });

    await step.run("update-cloning-status", async () => {
      await convex.mutation(api.evaluationReports.updateSummaryNoAuth, {
        id: reportId as Id<"evaluationReports">,
        summary: "Analyzing codebase...",
      });
    });

    const result = await step.run("run-evaluation", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const prompt = `You are evaluating a codebase against requirements from a document.

## Document: ${doc.title}

${doc.content}

## Instructions

1. Extract all requirements explicitly stated in the document above
2. For each requirement, determine if it is met or not met based on the codebase functionality
3. Focus on business/functional requirements, not code structure
4. Use plain business language in your output (no file paths or code references)
5. If there are no requirements in the document, return empty arrays and a summary stating that

You MUST output ONLY valid JSON with this exact structure:
{
  "requirementsMet": [{"requirement": "string", "evidence": "string"}],
  "requirementsNotMet": [{"requirement": "string", "reason": "string"}],
  "summary": "string"
}`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir: "~/workspace",
        timeout: 0,
      });

      if (claudeResult.isError) {
        throw new Error(`Claude agent failed: ${claudeResult.result}`);
      }

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        return {
          requirementsMet: [],
          requirementsNotMet: [],
          summary: `Failed to parse evaluation results. Raw output: ${claudeResult.result.slice(0, 300)}`,
        };
      }

      const parsed: Partial<EvaluationResult> = JSON.parse(jsonStr);

      return {
        requirementsMet: Array.isArray(parsed.requirementsMet) ? parsed.requirementsMet : [],
        requirementsNotMet: Array.isArray(parsed.requirementsNotMet) ? parsed.requirementsNotMet : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "Evaluation completed",
      };
    });

    await step.run("cleanup-sandbox", async () => {
      try {
        const sandbox = await getSandbox(sandboxData.sandboxId);
        await sandbox.delete();
      } catch {
        // Ignore cleanup errors
      }
    });

    await step.run("save-results", async () => {
      await convex.mutation(api.evaluationReports.completeNoAuth, {
        id: reportId as Id<"evaluationReports">,
        requirementsMet: result.requirementsMet,
        requirementsNotMet: result.requirementsNotMet,
        summary: result.summary,
      });
    });

    return { success: true };
  }
);
