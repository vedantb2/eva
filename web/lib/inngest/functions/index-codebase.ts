import { inngest } from "../client";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { createSandbox } from "../sandbox";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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

export const indexCodebase = inngest.createFunction(
  {
    id: "index-codebase",
    retries: 2,
    onFailure: async ({ event }) => {
      const eventData = event.data as unknown as {
        event: { data: { projectId: string } };
      };
      const projectId = eventData.event.data.projectId as Id<"projects">;
      await convex.mutation(api.projects.setIndexingStatusNoAuth, {
        id: projectId,
        status: "error",
      });
    },
  },
  { event: "project/index.requested" },
  async ({ event, step }) => {
    const { projectId, repoId, installationId } = event.data;

    const repo = await step.run("fetch-repo", async () => {
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!repoData) {
        throw new Error("Repo not found");
      }
      return repoData;
    });

    await step.run("set-indexing-status", async () => {
      await convex.mutation(api.projects.setIndexingStatusNoAuth, {
        id: projectId as Id<"projects">,
        status: "indexing",
      });
    });

    const codebaseIndex = await step.run("index-codebase", async () => {
      const githubToken = await getGitHubToken(installationId);
      const sandbox = await createSandbox(githubToken);

      try {
        const repoUrl = `https://x-access-token:${githubToken}@github.com/${repo.owner}/${repo.name}.git`;
        const workDir = "/home/daytona/workspace/repo";

        const cloneResult = await sandbox.process.executeCommand(
          `git clone --depth 1 "${repoUrl}" ${workDir}`,
          "/",
          undefined,
          120
        );
        if (cloneResult.exitCode !== 0) {
          const sanitizedOutput = (cloneResult.result || "").replace(
            new RegExp(githubToken, "g"),
            "[REDACTED]"
          );
          throw new Error(`Git clone failed: ${sanitizedOutput}`);
        }

        const treeResult = await sandbox.process.executeCommand(
          `cd ${workDir} && find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \\) | grep -v node_modules | grep -v .git | head -100 || true`,
          "/",
          undefined,
          30
        );
        const fileList = treeResult.result || "";

        const packageJsonResult = await sandbox.process.executeCommand(
          `cd ${workDir} && cat package.json 2>/dev/null || echo "{}"`,
          "/",
          undefined,
          10
        );
        const packageJson = packageJsonResult.result || "{}";

        const readmeResult = await sandbox.process.executeCommand(
          `cd ${workDir} && cat README.md 2>/dev/null || echo "No README"`,
          "/",
          undefined,
          10
        );
        const readme = readmeResult.result?.slice(0, 2000) || "";

        const contextPrompt = `${INDEX_PROMPT}

Here's information about the codebase:

## File List
${fileList}

## package.json
${packageJson}

## README (excerpt)
${readme}

Now analyze this codebase and generate the JSON index. Remember to output ONLY valid JSON.`;

        const escapedPrompt = contextPrompt.replace(/'/g, "'\\''");

        const claudeResult = await sandbox.process.executeCommand(
          `cd ${workDir} && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model sonnet --output-format json`,
          "/",
          undefined,
          300
        );

        const output = claudeResult.result || "";

        let responseText = "";
        try {
          const jsonResponse = JSON.parse(output);
          if (jsonResponse.result) {
            responseText = jsonResponse.result;
          }
        } catch {
          if (output.length > 0) {
            responseText = output;
          }
        }

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`Failed to extract JSON from output: ${responseText.slice(0, 500)}`);
        }

        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } finally {
        await sandbox.delete();
      }
    });

    await step.run("save-index", async () => {
      await convex.mutation(api.projects.setCodebaseIndexNoAuth, {
        id: projectId as Id<"projects">,
        codebaseIndex,
      });
    });

    return { success: true };
  }
);
