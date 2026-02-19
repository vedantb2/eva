"use server";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@conductor/backend";
import { clientEnv } from "@/env/client";

export async function getWorkflowTokens(
  installationId: number,
): Promise<{ githubToken: string; convexToken: string }> {
  const { getToken } = await auth();
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) throw new Error("Not authenticated");

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(convexToken);
  const { token: githubToken } = await convex.action(
    api.github.getInstallationTokenAction,
    { installationId },
  );

  return { githubToken, convexToken };
}
