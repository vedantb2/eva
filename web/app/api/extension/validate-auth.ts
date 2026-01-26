import { auth } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { serverEnv } from "@/env/server";

export async function validateAuth(
  request: Request,
): Promise<{ token: string; userId: string } | null> {
  let token: string | null = null;
  let userId: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove "Bearer " prefix
    try {
      const verified = await verifyToken(token, {
        secretKey: serverEnv.CLERK_SECRET_KEY!,
      });
      userId = verified.sub;
    } catch (error) {
      return null;
    }
  } else {
    const { getToken, userId: clerkUserId } = await auth();
    token = await getToken({ template: "convex" });
    userId = clerkUserId;
  }
  if (!token || !userId) {
    return null;
  }
  return { token, userId };
}
