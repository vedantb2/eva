import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request) {
  const {
    projectId,
    repoId,
    installationId,
    featureDescription,
    questionTopic,
    previousAnswers = [],
  } = await req.json();

  await inngest.send({
    name: "project/interview.question",
    data: {
      projectId,
      repoId,
      installationId,
      featureDescription,
      questionTopic,
      previousAnswers,
    },
  });

  return NextResponse.json({ status: "processing" });
}
