import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "e2b";
import { auth } from "@clerk/nextjs/server";
import { serverEnv } from "@/env/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paginator = Sandbox.list({ apiKey: serverEnv.E2B_API_KEY });
  const sandboxes = await paginator.nextItems();

  return NextResponse.json({
    sandboxes,
    hasMore: paginator.hasNext,
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, sandboxId } = body as {
    action: "pause" | "resume" | "kill";
    sandboxId: string;
  };

  if (!action || !sandboxId) {
    return NextResponse.json(
      { error: "Missing action or sandboxId" },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case "pause": {
        const sbx = await Sandbox.connect(sandboxId, {
          apiKey: serverEnv.E2B_API_KEY,
        });
        await sbx.betaPause();
        break;
      }
      case "resume": {
        await Sandbox.connect(sandboxId, { apiKey: serverEnv.E2B_API_KEY });
        break;
      }
      case "kill": {
        await Sandbox.kill(sandboxId, { apiKey: serverEnv.E2B_API_KEY });
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
