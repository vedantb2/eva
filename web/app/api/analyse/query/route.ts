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

  const { queryId, question, repoId } = await request.json();
  if (!queryId || !question || !repoId) {
    return NextResponse.json(
      { error: "Missing queryId, question, or repoId" },
      { status: 400 }
    );
  }

  const query = await convex.query(api.researchQueries.getNoAuth, {
    id: queryId as Id<"researchQueries">,
  });
  if (!query) {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }

  await convex.mutation(api.researchQueries.addMessageNoAuth, {
    id: queryId as Id<"researchQueries">,
    role: "user",
    content: question,
  });

  await inngest.send({
    name: "research/query.execute",
    data: { queryId, question, repoId },
  });

  return NextResponse.json({ success: true });
}
