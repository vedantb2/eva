"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export function useConvexToken() {
  const { getToken } = useAuth();

  return useCallback(async () => {
    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      throw new Error("Not authenticated");
    }
    return convexToken;
  }, [getToken]);
}
