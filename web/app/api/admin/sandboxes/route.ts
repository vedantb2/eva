import { NextRequest, NextResponse } from "next/server";
import { Daytona } from "@daytonaio/sdk";
import { auth } from "@clerk/nextjs/server";

const daytona = new Daytona();

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sandboxes = await daytona.list();

  return NextResponse.json({
    sandboxes,
    hasMore: false,
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
    const sandbox = await daytona.get(sandboxId);
    switch (action) {
      case "pause": {
        await daytona.stop(sandbox);
        break;
      }
      case "resume": {
        await daytona.start(sandbox);
        break;
      }
      case "kill": {
        await sandbox.delete();
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
