"use server";

import { auth } from "@clerk/nextjs/server";
import { createAppAuth } from "@octokit/auth-app";
import { serverEnv } from "@/env/server";

export async function getWorkflowTokens(
  installationId: number,
): Promise<{ githubToken: string; convexToken: string }> {
  const { getToken } = await auth();
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) throw new Error("Not authenticated");

  const ghAuth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });
  const { token: githubToken } = await ghAuth({
    type: "installation",
    installationId,
  });

  return { githubToken, convexToken };
}
