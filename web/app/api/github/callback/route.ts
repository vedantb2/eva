import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");

  if (!installationId) {
    return NextResponse.redirect(new URL("/repos?error=no_installation", req.url));
  }

  return NextResponse.redirect(
    new URL("/repos/setup?installation_id=" + installationId, req.url)
  );
}
