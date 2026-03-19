import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { serverEnv } from "@/env/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Agent login is only available in development" },
      { status: 403 },
    );
  }

  const { AGENT_CLERK_USER_ID } = serverEnv;

  if (!AGENT_CLERK_USER_ID) {
    return NextResponse.json(
      { error: "AGENT_CLERK_USER_ID must be configured" },
      { status: 500 },
    );
  }

  const clerk = await clerkClient();
  const { token } = await clerk.signInTokens.createSignInToken({
    userId: AGENT_CLERK_USER_ID,
    expiresInSeconds: 60,
  });

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const callbackUrl = new URL("/agent-callback", `${proto}://${host}`);
  callbackUrl.searchParams.set("ticket", token);

  return NextResponse.redirect(callbackUrl, 302);
}
