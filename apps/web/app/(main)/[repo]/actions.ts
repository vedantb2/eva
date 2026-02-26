import { useAuth } from "@clerk/nextjs";

export async function getConvexToken(): Promise<{ convexToken: string }> {
  const { getToken } = useAuth();
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) throw new Error("Not authenticated");

  return { convexToken };
}
