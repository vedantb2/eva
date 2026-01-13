import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

export async function POST(request: NextRequest) {
  const { name, data } = await request.json();

  await inngest.send({ name, data });

  return NextResponse.json({ success: true });
}
