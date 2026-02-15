import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { serverEnv } from "@/env/server";
import { createConvex } from "@/lib/convex-auth";
import { api } from "@conductor/backend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  let clerkToken: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7);
    try {
      await verifyToken(bearerToken, {
        secretKey: serverEnv.CLERK_SECRET_KEY!,
      });
      clerkToken = bearerToken;
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }
  } else {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }
    clerkToken = await getToken({ template: "convex" });
  }

  if (!clerkToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const payload = (await request.json()) as {
    name?: string;
    data?: Record<string, unknown>;
  };
  const name = payload.name;
  const data = payload.data ?? {};

  if (!name) {
    return NextResponse.json(
      { error: "Missing event name" },
      { status: 400, headers: corsHeaders },
    );
  }

  const convex = createConvex(clerkToken);

  if (name === "task/execute.requested") {
    const runId = data.runId;
    if (typeof runId !== "string") {
      return NextResponse.json(
        { error: "Missing runId for task/execute.requested" },
        { status: 400, headers: corsHeaders },
      );
    }
    await convex.mutation(api.agentExecution.triggerLegacy, {
      runId: runId as any,
    });
    return NextResponse.json(
      { success: true, routedTo: "convex-workflow" },
      { headers: corsHeaders },
    );
  }

  if (name === "project/build.requested") {
    const projectId = data.projectId;
    if (typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Missing projectId for project/build.requested" },
        { status: 400, headers: corsHeaders },
      );
    }
    await convex.mutation(api.projects.startBuildWorkflow, {
      projectId: projectId as any,
    });
    return NextResponse.json(
      { success: true, routedTo: "convex-workflow" },
      { headers: corsHeaders },
    );
  }

  await inngest.send({ name, data: { ...data, clerkToken } });

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}
