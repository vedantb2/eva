import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { validateAuth } from "../validate-auth";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request: Request) {
  const authResult = await validateAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const repos = await convex.query(api.githubRepos.listNoAuth, {});
  return NextResponse.json({ repos });
}
