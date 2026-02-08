import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const EXTENSION_ID = process.env.EXTENSION_ID || "conductor-extension";

function getExtensionDir(): string {
  return join(process.cwd(), "..", "chrome-extension", "dist");
}

function getLatestVersion(): string {
  const manifestPath = join(getExtensionDir(), "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return manifest.version || "1.0.0";
    } catch {
      return "1.0.0";
    }
  }
  return "1.0.0";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (file === "updates.xml") {
    const version = getLatestVersion();
    const baseUrl = request.nextUrl.origin;

    const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck codebase='${baseUrl}/api/updates/extension?file=conductor.crx' version='${version}' />
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
    const crxPath = join(getExtensionDir(), "conductor.crx");

    if (!existsSync(crxPath)) {
      return NextResponse.json(
        { error: "Extension package not found. Run build first." },
        { status: 404 },
      );
    }

    const crxBuffer = readFileSync(crxPath);

    return new NextResponse(crxBuffer, {
      headers: {
        "Content-Type": "application/x-chrome-extension",
        "Content-Disposition": "attachment; filename=conductor.crx",
        "Content-Length": crxBuffer.length.toString(),
      },
    });
  }

  if (file === "manifest.json") {
    const manifestPath = join(getExtensionDir(), "manifest.json");

    if (!existsSync(manifestPath)) {
      return NextResponse.json(
        { error: "Manifest not found" },
        { status: 404 },
      );
    }

    const manifest = readFileSync(manifestPath, "utf-8");

    return new NextResponse(manifest, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return NextResponse.json(
    {
      error:
        "Invalid request. Use ?file=updates.xml, ?file=conductor.crx, or ?file=manifest.json",
    },
    { status: 400 },
  );
}
