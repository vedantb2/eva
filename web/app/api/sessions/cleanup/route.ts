import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sandboxId, sessionId } = await request.json();

  await inngest.send({
    name: "session/cleanup.requested",
    data: { sandboxId, sessionId },
  });

  return NextResponse.json({ success: true });
}
