"use server";

import { auth } from "@clerk/nextjs/server";

export async function getConvexToken(): Promise<{ convexToken: string }> {
  const { getToken } = await auth();
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) throw new Error("Not authenticated");

  return { convexToken };
}
