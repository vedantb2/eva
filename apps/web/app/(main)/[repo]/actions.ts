"use server";

import { auth } from "@clerk/nextjs/server";

export async function getConvexToken(): Promise<{ convexToken: string }> {
  const { getToken, userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) throw new Error("Not authenticated");

  return { convexToken };
}
