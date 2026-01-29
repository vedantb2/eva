import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });

  const {
    projectId,
    repoId,
    installationId,
    featureDescription,
    answers,
  } = await req.json();

  await inngest.send({
    name: "project/interview.spec",
    data: {
      projectId,
      repoId,
      installationId,
      featureDescription,
      answers,
      clerkToken,
    },
  });

  return NextResponse.json({ status: "processing" });
}
