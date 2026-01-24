import { inngest } from "../client";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { createSandbox, getSandbox } from "../sandbox";

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
      const docData = await convex.query(api.docs.getNoAuth, {
        id: docId as Id<"docs">,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
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

      const repoUrl = `https://x-access-token:${githubToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sandbox.process.executeCommand(
        `git clone ${repoUrl} ~/workspace`,
        "/",
        undefined,
        120
      );

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
5. If there are no requirements in the document, return empty arrays and a summary stating that`;

      const jsonSchema = {
        type: "object",
        properties: {
          requirementsMet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                requirement: { type: "string" },
                evidence: { type: "string" },
              },
              required: ["requirement", "evidence"],
            },
          },
          requirementsNotMet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                requirement: { type: "string" },
                reason: { type: "string" },
              },
              required: ["requirement", "reason"],
            },
          },
          summary: { type: "string" },
        },
        required: ["requirementsMet", "requirementsNotMet", "summary"],
      };

      await sandbox.process.executeCommand(
        `cat << 'EOF' > /tmp/prompt.txt
${prompt}
EOF`,
        "/",
      );

      await sandbox.process.executeCommand(
        `cat << 'EOF' > /tmp/schema.json
${JSON.stringify(jsonSchema, null, 2)}
EOF`,
        "/",
      );

      let output = "";
      try {
        const cmdResult = await sandbox.process.executeCommand(
          `cd ~/workspace && cat /tmp/prompt.txt | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model sonnet --allowedTools "Read,Glob,Grep" --output-format json --json-schema /tmp/schema.json`,
          "/",
          undefined,
          0
        );
        output = cmdResult.result || "";
      } catch (err) {
        const error = err as { result?: string; message?: string };
        throw new Error(`Claude agent failed: ${error.result || error.message || "Unknown error"}`);
      }

      let parsed: Partial<EvaluationResult> = {};
      let parseError = "";

      try {
        const cliJson = JSON.parse(output);
        if (cliJson.result) {
          if (typeof cliJson.result === "string") {
            const jsonMatch = cliJson.result.match(/\{[\s\S]*"requirementsMet"[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          } else if (cliJson.result?.content?.[0]?.text) {
            parsed = JSON.parse(cliJson.result.content[0].text);
          }
        }
      } catch (e) {
        parseError = `Parse failed: ${e}. Raw output: ${output.slice(0, 500)}`;
      }

      return {
        requirementsMet: Array.isArray(parsed.requirementsMet) ? parsed.requirementsMet : [],
        requirementsNotMet: Array.isArray(parsed.requirementsNotMet) ? parsed.requirementsNotMet : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : parseError || "Failed to parse evaluation results",
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
  },
);
