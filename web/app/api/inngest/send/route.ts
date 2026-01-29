import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });

  const { name, data } = await request.json();

  await inngest.send({ name, data: { ...data, clerkToken } });

  return NextResponse.json({ success: true });
}
