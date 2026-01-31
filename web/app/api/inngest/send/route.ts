import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { serverEnv } from "@/env/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  let clerkToken: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7);
    try {
      await verifyToken(bearerToken, { secretKey: serverEnv.CLERK_SECRET_KEY! });
      clerkToken = bearerToken;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
  } else {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    clerkToken = await getToken({ template: "convex" });
  }

  if (!clerkToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const { name, data } = await request.json();
  await inngest.send({ name, data: { ...data, clerkToken } });

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}
