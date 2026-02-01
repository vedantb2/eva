import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest";
import { createConvex } from "@/lib/convex-auth";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  if (!clerkToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoId, tagId, tagIds, notes, dateRange } = await request.json();
  if (!repoId || !tagId) {
    return NextResponse.json(
      { error: "repoId and tagId are required" },
      { status: 400 }
    );
  }

  const convex = createConvex(clerkToken);

  // Create the report with base analysis (returns pending report)
  const reportId = await convex.mutation(api.reports.createReport, {
    repoId: repoId as Id<"githubRepos">,
    tagId,
    tagIds: tagIds || undefined,
    notes,
    dateRange: dateRange || undefined,
  });

  // Trigger AI analysis as background job
  await inngest.send({
    name: "report/analyze.requested",
    data: {
      clerkToken,
      reportId: reportId as string,
      repoId,
      tagId,
      tagIds: tagIds || undefined,
    },
  });

  return NextResponse.json({ reportId, status: "pending" });
}
