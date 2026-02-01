import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import {
  WORKSPACE_DIR,
  getGitHubToken,
  getOrCreateSandbox,
  runClaudeCLI,
  extractJsonFromText,
} from "../sandbox";

const INDEX_PROMPT = `Analyze this codebase and create a structured index. Use Glob to discover all files, Read to examine key files like package.json, README, and entry points, and Grep to find patterns.

Output ONLY valid JSON with this exact structure:

{
  "summary": "Brief 2-3 sentence description of what this project does",
  "techStack": {
    "language": "primary language",
    "framework": "main framework if any",
    "other": ["list", "of", "key", "dependencies"]
  },
  "structure": {
    "entryPoints": ["list of main entry files"],
    "keyDirectories": [
      {"path": "src/", "purpose": "source code"},
      {"path": "tests/", "purpose": "test files"}
    ]
  },
  "patterns": {
    "componentPattern": "how components are organized",
    "stateManagement": "how state is managed",
    "apiPattern": "how API calls are structured"
  },
  "keyFiles": [
    {"path": "src/index.ts", "purpose": "main entry point", "exports": ["main", "App"]},
    {"path": "src/api/client.ts", "purpose": "API client", "exports": ["fetchData"]}
  ],
  "conventions": {
    "naming": "camelCase/PascalCase conventions",
    "fileStructure": "how files are typically structured",
    "imports": "import patterns used"
  }
}

Focus on understanding:
1. Project structure and organization
2. Key files that would need modification for new features
3. Coding patterns and conventions used
4. Dependencies and how they're used

Analyze the codebase thoroughly before generating the index.`;

export const indexCodebase = inngest.createFunction(
  {
    id: "index-codebase",
    retries: 2,
    onFailure: async ({ event }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; repoId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const repoId = eventData.event.data.repoId as Id<"githubRepos">;
      await convex.mutation(api.githubRepos.setIndexingStatus, {
        id: repoId,
        status: "error",
      });
    },
  },
  { event: "project/index.requested" },
  async ({ event, step }) => {
    const { clerkToken, repoId, installationId } = event.data;
    const convex = createConvex(clerkToken);

    const repo = await step.run("fetch-data", async () => {
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repoData) throw new Error("Repo not found");
      return repoData;
    });

    await step.run("set-indexing-status", async () => {
      await convex.mutation(api.githubRepos.setIndexingStatus, {
        id: repoId as Id<"githubRepos">,
        status: "indexing",
      });
    });

    const codebaseIndex = await step.run("index-codebase", async () => {
      const githubToken = await getGitHubToken(installationId);
      const sandbox = await getOrCreateSandbox(
        undefined,
        githubToken,
        repo.owner,
        repo.name,
        async () => {},
      );

      const claudeResult = await runClaudeCLI(sandbox, INDEX_PROMPT, {
        model: "sonnet",
        workDir: WORKSPACE_DIR,
        timeout: 300,
      });

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        throw new Error(`Failed to extract JSON from output: ${claudeResult.result.slice(0, 500)}`);
      }

      return jsonStr;
    });

    await step.run("save-results", async () => {
      await convex.mutation(api.githubRepos.setCodebaseIndex, {
        id: repoId as Id<"githubRepos">,
        codebaseIndex,
      });
    });

    return { success: true };
  },
);
