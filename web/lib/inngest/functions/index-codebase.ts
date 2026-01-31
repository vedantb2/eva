import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { createSandbox, WORKSPACE_DIR } from "../sandbox";
import {
  getGitHubToken,
  syncRepo,
  runClaudeCLI,
  extractJsonFromText,
} from "../sandbox-helpers";

const INDEX_PROMPT = `Analyze this codebase and create a structured index. Output ONLY valid JSON with this exact structure:

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
        event: { data: { clerkToken: string; projectId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const projectId = eventData.event.data.projectId as Id<"projects">;
      await convex.mutation(api.projects.setIndexingStatus, {
        id: projectId,
        status: "error",
      });
    },
  },
  { event: "project/index.requested" },
  async ({ event, step }) => {
    const { clerkToken, projectId, repoId, installationId } = event.data;
    const convex = createConvex(clerkToken);

    const repo = await step.run("fetch-repo", async () => {
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repoData) {
        throw new Error("Repo not found");
      }
      return repoData;
    });

    await step.run("set-indexing-status", async () => {
      await convex.mutation(api.projects.setIndexingStatus, {
        id: projectId as Id<"projects">,
        status: "indexing",
      });
    });

    const { codebaseIndex, sandboxId } = await step.run(
      "index-codebase",
      async () => {
        const githubToken = await getGitHubToken(installationId);
        const sandbox = await createSandbox(githubToken);
        await syncRepo(sandbox, githubToken, repo.owner, repo.name);
        const treeResult = await sandbox.process.executeCommand(
          `cd ${WORKSPACE_DIR} && find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \\) | grep -v node_modules | grep -v .git | head -100 || true`,
          "/",
          undefined,
          30,
        );

        const packageJsonResult = await sandbox.process.executeCommand(
          `cd ${WORKSPACE_DIR} && cat package.json 2>/dev/null || echo "{}"`,
          "/",
          undefined,
          10,
        );

        const readmeResult = await sandbox.process.executeCommand(
          `cd ${WORKSPACE_DIR} && cat README.md 2>/dev/null || echo "No README"`,
          "/",
          undefined,
          10,
        );

        const contextPrompt = `${INDEX_PROMPT}

Here's information about the codebase:

## File List
${treeResult.result || ""}

## package.json
${packageJsonResult.result || "{}"}

## README (excerpt)
${readmeResult.result?.slice(0, 2000) || ""}

Now analyze this codebase and generate the JSON index. Remember to output ONLY valid JSON.`;

        const claudeResult = await runClaudeCLI(sandbox, contextPrompt, {
          model: "sonnet",
          workDir: WORKSPACE_DIR,
          timeout: 300,
        });

        const jsonStr = extractJsonFromText(claudeResult.result);
        if (!jsonStr) {
          throw new Error(
            `Failed to extract JSON from output: ${claudeResult.result.slice(0, 500)}`,
          );
        }

        return { codebaseIndex: jsonStr, sandboxId: sandbox.id };
      },
    );

    await step.run("save-results", async () => {
      await convex.mutation(api.projects.setCodebaseIndex, {
        id: projectId as Id<"projects">,
        codebaseIndex,
      });
      await convex.mutation(api.projects.updateProjectSandbox, {
        id: projectId as Id<"projects">,
        sandboxId,
      });
    });

    return { success: true };
  },
);
