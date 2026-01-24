import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId, repoId } = await request.json();
  if (!docId || !repoId) {
    return NextResponse.json(
      { error: "Missing docId or repoId" },
      { status: 400 }
    );
  }

  const doc = await convex.query(api.docs.getNoAuth, {
    id: docId as Id<"docs">,
  });
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  const reportId = await convex.mutation(api.evaluationReports.createNoAuth, {
    repoId: repoId as Id<"githubRepos">,
    docId: docId as Id<"docs">,
  });

  await inngest.send({
    name: "testing-arena/evaluate.doc",
    data: { reportId, docId, repoId },
  });

  return NextResponse.json({ success: true, reportId });
}
