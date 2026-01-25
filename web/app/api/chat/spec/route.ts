import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request) {
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
    },
  });

  return NextResponse.json({ status: "processing" });
}
