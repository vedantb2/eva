import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@conductor/backend";
import { clientEnv } from "@/env/client";

const EXTENSION_ID = process.env.EXTENSION_ID ?? "conductor-extension";

function getConvex(): ConvexHttpClient {
  return new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (file === "updates.xml") {
    const convex = getConvex();
    const release = await convex.query(api.extensionReleases.getLatest, {});

    if (!release) {
      const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck status='noupdate' />
  </app>
</gupdate>`;

      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    const crxUrl =
      release.crxUrl ??
      `${request.nextUrl.origin}/api/updates/extension?file=conductor.crx`;

    const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck codebase='${crxUrl}' version='${release.version}' />
  </app>
</gupdate>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache",
      },
    });
  }

  if (file === "conductor.crx") {
    const convex = getConvex();
    const release = await convex.query(api.extensionReleases.getLatest, {});

    if (!release?.crxUrl) {
      return NextResponse.json(
        { error: "No extension release found. Run ext:release first." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(release.crxUrl, 302);
  }

  return NextResponse.json(
    {
      error: "Invalid request. Use ?file=updates.xml or ?file=conductor.crx",
    },
    { status: 400 },
  );
}
