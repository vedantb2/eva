import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { validateAuth } from "../validate-auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);

  if (!authResult) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const { sessionId, message, contextMessage } = await request.json();
  if (!sessionId || !message) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400, headers: corsHeaders });
  }

  await inngest.send({
    name: "session/execute",
    data: {
      sessionId,
      message: (contextMessage as string) || message,
      mode: "ask",
      clerkToken: authResult.token,
    },
  });

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}
