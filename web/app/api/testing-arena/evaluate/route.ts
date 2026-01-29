import { NextRequest, NextResponse } from "next/server";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  const convex = createConvex(clerkToken ?? undefined);

  const { docId, repoId } = await request.json();
  if (!docId || !repoId) {
    return NextResponse.json(
      { error: "Missing docId or repoId" },
      { status: 400 }
    );
  }

  const doc = await convex.query(api.docs.get, {
    id: docId as Id<"docs">,
  });
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  const reportId = await convex.mutation(api.evaluationReports.create, {
    repoId: repoId as Id<"githubRepos">,
    docId: docId as Id<"docs">,
  });

  await inngest.send({
    name: "testing-arena/evaluate.doc",
    data: { reportId, docId, repoId, clerkToken },
  });

  return NextResponse.json({ success: true, reportId });
}
