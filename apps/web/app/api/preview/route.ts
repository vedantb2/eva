import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for Daytona sandbox preview URLs.
 *
 * The Daytona proxy shows a warning page on first visit whose form action
 * uses plain HTTP, which triggers mixed-content errors when our app is
 * served over HTTPS.  By proxying the initial request we can:
 *  1. Send the `X-Daytona-Skip-Preview-Warning` header (impossible from
 *     an iframe directly).
 *  2. Attach a `Content-Security-Policy: upgrade-insecure-requests` header
 *     so that any remaining HTTP references in the response are upgraded.
 */
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Validate the URL belongs to a Daytona proxy domain to prevent SSRF.
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!parsed.hostname.includes("daytona")) {
    return NextResponse.json(
      { error: "Only Daytona preview URLs are allowed" },
      { status: 403 },
    );
  }

  // Ensure we always talk to the Daytona proxy over HTTPS.
  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }
  const httpsUrl = parsed.toString();

  try {
    const response = await fetch(httpsUrl, {
      headers: {
        "X-Daytona-Skip-Preview-Warning": "true",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "";
    const body = await response.arrayBuffer();

    if (contentType.includes("text/html")) {
      let html = new TextDecoder().decode(body);

      // Inject a <base> tag so relative URLs resolve against the Daytona
      // origin rather than against our proxy route.
      const origin = parsed.origin;
      const baseTag = `<base href="${origin}/">`;
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);

      return new NextResponse(html, {
        status: response.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": "upgrade-insecure-requests",
        },
      });
    }

    // Non-HTML responses (images, JS, CSS, etc.) are passed through as-is.
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 502 },
    );
  }
}
