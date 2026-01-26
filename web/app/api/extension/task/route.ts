import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { validateAuth } from "../validate-auth";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

interface CreateTaskPayload {
  repoId: Id<"githubRepos">;
  title: string;
  description: string;
  extensionContext: {
    tree: unknown;
    metadata: {
      reactVersion: string;
      totalComponents: number;
      capturedAt: number;
      sourceUrl: string;
      elementSelector: string;
    };
  } | null;
  sourceUrl: string;
}

export async function POST(request: Request) {
  const authResult = await validateAuth(request);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateTaskPayload;

    let fullDescription = body.description || "";

    if (body.extensionContext) {
      fullDescription += `\n\n---\n**Captured React Context**\n`;
      fullDescription += `- Component: \`${(body.extensionContext.tree as { name?: string })?.name || "Unknown"}\`\n`;
      fullDescription += `- Total components: ${body.extensionContext.metadata.totalComponents}\n`;
      fullDescription += `- React version: ${body.extensionContext.metadata.reactVersion}\n`;
      fullDescription += `- Source URL: ${body.extensionContext.metadata.sourceUrl}\n`;
      fullDescription += `- Element selector: \`${body.extensionContext.metadata.elementSelector}\`\n\n`;
      fullDescription += `<details>\n<summary>Full Component Tree</summary>\n\n\`\`\`json\n${JSON.stringify(body.extensionContext.tree, null, 2)}\n\`\`\`\n</details>`;
    }

    if (body.sourceUrl && !body.extensionContext) {
      fullDescription += `\n\n**Source URL:** ${body.sourceUrl}`;
    }

    const taskId = await convex.mutation(api.agentTasks.createQuickTask, {
      repoId: body.repoId,
      title: body.title,
      description: fullDescription,
    });

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
