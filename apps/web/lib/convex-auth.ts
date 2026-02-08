import { ConvexHttpClient } from "convex/browser";
import { clientEnv } from "@/env/client";

export function createConvex(token?: string): ConvexHttpClient {
  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  if (token) convex.setAuth(token);
  return convex;
}
