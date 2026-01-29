import { NextResponse } from "next/server";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { validateAuth } from "../validate-auth";

export async function GET(request: Request) {
  const authResult = await validateAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const convex = createConvex(authResult.token);
  const repos = await convex.query(api.githubRepos.list, {});
  return NextResponse.json({ repos });
}
