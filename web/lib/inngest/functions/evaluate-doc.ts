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

    const result = await step.run("evaluate-in-sandbox", async () => {
      const githubToken = await getGitHubToken(repo.installationId);

      const sandbox = await daytona.create({
        envVars: {
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
          GITHUB_TOKEN: githubToken,
        },
        autoStopInterval: 10,
      });

      try {
        const repoUrl = `https://x-access-token:${githubToken}@github.com/${repo.owner}/${repo.name}.git`;
        await sandbox.process.executeCommand(
          `git clone ${repoUrl} ~/workspace`,
          "/",
          undefined,
          120
        );

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
                  evidence: { type: "string" }
                },
                required: ["requirement", "evidence"]
              }
            },
            requirementsNotMet: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirement: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["requirement", "reason"]
              }
            },
            summary: { type: "string" }
          },
          required: ["requirementsMet", "requirementsNotMet", "summary"]
        };

        const escapedPrompt = prompt.replace(/'/g, "'\\''");
        const escapedSchema = JSON.stringify(jsonSchema).replace(/'/g, "'\\''");

        const cmdResult = await sandbox.process.executeCommand(
          `echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model sonnet --output-format json --allowedTools "Read,Glob,Grep" --json-schema '${escapedSchema}'`,
          "/home/daytona/workspace",
          undefined,
          1800
        );

        const output = cmdResult.result || "";

        let parsed: Partial<EvaluationResult> = {};
        let parseError = "";

        try {
          const jsonResponse = JSON.parse(output);
          if (jsonResponse.result) {
            if (typeof jsonResponse.result === "object") {
              parsed = jsonResponse.result;
            } else if (typeof jsonResponse.result === "string") {
              parsed = JSON.parse(jsonResponse.result);
            }
          } else {
            parseError = `No result field: ${output.slice(0, 500)}`;
          }
        } catch (e) {
          parseError = `Parse failed: ${e}. Output: ${output.slice(0, 500)}`;
        }

        return {
          requirementsMet: Array.isArray(parsed.requirementsMet) ? parsed.requirementsMet : [],
          requirementsNotMet: Array.isArray(parsed.requirementsNotMet) ? parsed.requirementsNotMet : [],
          summary: typeof parsed.summary === "string" ? parsed.summary : (parseError || "Failed to parse evaluation results"),
        };
      } finally {
        await sandbox.delete();
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
