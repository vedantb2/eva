import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "@/api";
import { clientEnv } from "@/env/client";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

interface CreateTaskPayload {
  repoId: string;
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
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await auth();
  if (!userId || userId !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
      repoId: body.repoId as ReturnType<typeof api.agentTasks.createQuickTask>["args"]["repoId"],
      title: body.title,
      description: fullDescription,
    });

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
