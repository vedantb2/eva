"use client";

import { useState, useEffect } from "react";
import { ConvexHttpClient } from "convex/browser";
import { useAuth } from "@clerk/clerk-react";
import { clientEnv } from "@/env/client";
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from "convex/server";

const CONVEX_URL = clientEnv.VITE_CONVEX_URL;

/**
 * One-shot (non-reactive) Convex query. Fetches data once via HTTP instead of
 * maintaining a persistent WebSocket subscription. Re-fetches when args change.
 *
 * Use for low-freshness flows (analytics, reports, stats) where live updates
 * aren't needed and the reactive subscription cost is high.
 */
export function useOneShotQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
): FunctionReturnType<Query> | undefined {
  const { getToken } = useAuth();
  const [data, setData] = useState<FunctionReturnType<Query>>();
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args);

  useEffect(() => {
    if (args === "skip") {
      setData(undefined);
      return;
    }

    let cancelled = false;
    const queryArgs = args;
    setData(undefined);

    (async () => {
      try {
        const token = await getToken({ template: "convex" });
        const client = new ConvexHttpClient(CONVEX_URL);
        if (token) client.setAuth(token);
        const result = await client.query(query, queryArgs);
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("useOneShotQuery failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [argsKey, getToken, query]);

  return data;
}
