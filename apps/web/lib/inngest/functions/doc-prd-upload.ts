import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import {
  WORKSPACE_DIR,
  getGitHubToken,
  runClaudeCLIStreaming,
  extractJsonFromText,
  getOrCreateSandbox,
} from "../sandbox";

const PARSE_PROMPT = `You are a product manager writing a PRD from an uploaded requirements document. Read CLAUDE.md and explore the codebase to understand existing product behavior, but write everything in plain business language.

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "description": "1-3 sentence description of what this feature does for the user",
  "requirements": ["Acceptance criterion 1", "Acceptance criterion 2"],
  "userFlows": [{"name": "Flow name", "steps": ["Step 1", "Step 2"]}]
}

## Guidelines
- Description: plain-English summary of what the user can do and why it matters
- Requirements: 5-15 acceptance criteria written as "The user can..." or "The system should..." statements. Each must be verifiable by a non-technical person just by using the product
- User flows: 2-5 step-by-step journeys written from the user's perspective (e.g. "User clicks the Create button", "User sees a confirmation message"). 3-8 steps each
- NEVER use technical language: no mention of APIs, databases, components, or code`;

interface ParsedDocFields {
  description?: string;
  requirements?: string[];
  userFlows?: Array<{ name: string; steps: string[] }>;
}

function buildParsePrompt(docTitle: string, prdContent: string): string {
  return `${PARSE_PROMPT}

## Document Title
"${docTitle}"

## Uploaded PRD Content
${prdContent}

## Task
Use the uploaded PRD content and repository context to produce description, requirements, and user flows.

Output ONLY valid JSON.`;
}

function normalizeParsedDocFields(
  raw: Partial<ParsedDocFields>,
): ParsedDocFields {
  const description =
    typeof raw.description === "string" && raw.description.trim().length > 0
      ? raw.description.trim()
      : undefined;

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const userFlows = Array.isArray(raw.userFlows)
    ? raw.userFlows
        .filter(
          (flow): flow is { name: string; steps: string[] } =>
            typeof flow === "object" &&
            flow !== null &&
            typeof flow.name === "string" &&
            Array.isArray(flow.steps),
        )
        .map((flow) => ({
          name: flow.name.trim(),
          steps: flow.steps
            .filter((step): step is string => typeof step === "string")
            .map((step) => step.trim())
            .filter(Boolean),
        }))
        .filter((flow) => flow.name.length > 0 && flow.steps.length > 0)
    : [];

  return { description, requirements, userFlows };
}

export const docPrdUpload = inngest.createFunction(
  {
    id: "doc-prd-upload",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken?: string; docId?: string } };
      };
      const { clerkToken, docId } = eventData.event.data;
      if (!clerkToken || !docId) return;
      const convex = createConvex(clerkToken);
      await convex.mutation(api.streaming.clear, { entityId: docId });
      console.error("doc-prd-upload failed", { docId, error: error.message });
    },
  },
  { event: "docs/prd-upload.parse" },
  async ({ event, step }) => {
    const { clerkToken, docId, repoId, installationId, prdContent } =
      event.data;
    const convex = createConvex(clerkToken);

    const { doc, repo } = await step.run("fetch-data", async () => {
      const docData = await convex.query(api.docs.get, {
        id: docId as Id<"docs">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!docData || !repoData) throw new Error("Doc or repo not found");
      return { doc: docData, repo: repoData };
    });

    const parseResult = await step.run("parse-prd", async () => {
      const prdText = typeof prdContent === "string" ? prdContent.trim() : "";
      if (!prdText) throw new Error("PRD content is empty");

      const githubToken = await getGitHubToken(installationId);
      const sandbox = await getOrCreateSandbox(
        doc.sandboxId ?? undefined,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.docs.updateDocSandbox, {
            id: docId as Id<"docs">,
            sandboxId,
          });
        },
      );

      const prompt = buildParsePrompt(doc.title, prdText);

      const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir: WORKSPACE_DIR,
        timeout: 180,
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: docId,
            currentActivity,
          });
        },
      });

      if (claudeResult.isError) {
        throw new Error(`Claude failed: ${claudeResult.result.slice(0, 500)}`);
      }

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        throw new Error(
          `Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`,
        );
      }

      return { jsonStr };
    });

    await step.run("save-parsed", async () => {
      const parsed = JSON.parse(
        parseResult.jsonStr,
      ) as Partial<ParsedDocFields>;
      const normalized = normalizeParsedDocFields(parsed);

      await convex.mutation(api.docs.update, {
        id: docId as Id<"docs">,
        description: normalized.description,
        requirements: normalized.requirements,
        userFlows: normalized.userFlows,
      });

      await convex.mutation(api.streaming.clear, { entityId: docId });
    });

    return { success: true };
  },
);
