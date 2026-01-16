import { Sandbox } from "e2b";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import Anthropic from "@anthropic-ai/sdk";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const anthropic = new Anthropic({
  authToken: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
});

export const maxDuration = 300;

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

export async function POST(request: NextRequest) {
  let sbx: Sandbox | null = null;

  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
    convex.setAuth(token);

    const { planId, repoOwner, repoName, githubToken } = await request.json();

    if (!planId || !repoOwner || !repoName || !githubToken) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: planId, repoOwner, repoName, or githubToken",
        },
        { status: 400 }
      );
    }

    sbx = await Sandbox.create("base", {
      apiKey: serverEnv.E2B_API_KEY,
      timeoutMs: 5 * 60 * 1000,
    });

    const repoUrl = `https://x-access-token:${githubToken}@github.com/${repoOwner}/${repoName}.git`;
    const workDir = "/home/user/repo";

    const cloneResult = await sbx.commands.run(
      `git clone --depth 1 "${repoUrl}" ${workDir}`,
      {
        timeoutMs: 120000,
      }
    );
    if (cloneResult.exitCode !== 0) {
      const sanitizedOutput = (
        cloneResult.stderr ||
        cloneResult.stdout ||
        ""
      ).replace(new RegExp(githubToken, "g"), "[REDACTED]");
      throw new Error(`Git clone failed: ${sanitizedOutput}`);
    }

    const treeResult = await sbx.commands.run(
      `cd ${workDir} && find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \\) | grep -v node_modules | grep -v .git | head -100 || true`
    );
    const fileList = treeResult.stdout || "";

    const packageJsonResult = await sbx.commands.run(
      `cd ${workDir} && cat package.json 2>/dev/null || echo "{}"`
    );
    const packageJson = packageJsonResult.stdout || "{}";

    const readmeResult = await sbx.commands.run(
      `cd ${workDir} && cat README.md 2>/dev/null || echo "No README"`
    );
    const readme = readmeResult.stdout?.slice(0, 2000) || "";

    const contextPrompt = `${INDEX_PROMPT}

Here's information about the codebase:

## File List
${fileList}

## package.json
${packageJson}

## README (excerpt)
${readme}

Now analyze this codebase and generate the JSON index. Remember to output ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: contextPrompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        `Failed to extract JSON from output: ${textContent.text.slice(0, 500)}`
      );
    }

    const codebaseIndex = jsonMatch[0];
    JSON.parse(codebaseIndex);

    await convex.mutation(api.plans.setCodebaseIndex, {
      id: planId,
      codebaseIndex,
    });

    return NextResponse.json({
      success: true,
      index: JSON.parse(codebaseIndex),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Index codebase error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    if (sbx) {
      await sbx.kill();
    }
  }
}
