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

  const { queryId, question, repoId } = await request.json();
  if (!queryId || !question || !repoId) {
    return NextResponse.json(
      { error: "Missing queryId, question, or repoId" },
      { status: 400 }
    );
  }

  const query = await convex.query(api.researchQueries.get, {
    id: queryId as Id<"researchQueries">,
  });
  if (!query) {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }

  await convex.mutation(api.researchQueries.addMessage, {
    id: queryId as Id<"researchQueries">,
    role: "user",
    content: question,
  });

  await inngest.send({
    name: "research/query.execute",
    data: { queryId, question, repoId, clerkToken },
  });

  return NextResponse.json({ success: true });
}
