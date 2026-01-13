import { NextRequest, NextResponse } from "next/server";
import { createAppAuth } from "@octokit/auth-app";
import { serverEnv } from "@/env/server";

export async function POST(request: NextRequest) {
  const { installationId } = await request.json();

  if (!installationId) {
    return NextResponse.json(
      { error: "installationId is required" },
      { status: 400 }
    );
  }

  const auth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });

  const { token } = await auth({ type: "installation", installationId });
  return NextResponse.json({ token });
}
