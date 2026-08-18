import { ConvexReactClient } from "convex/react";
import { clientEnv } from "@/env/client";
import { convexDeploymentUrl } from "./convexDeploymentUrl";

if (!clientEnv.VITE_CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL in your .env file");
}

export const convex = new ConvexReactClient(
  convexDeploymentUrl(clientEnv.VITE_CONVEX_URL, window.location.origin),
);
