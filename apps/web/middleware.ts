import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/api(.*)", "/sandbox-auth"]);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];

const isExtensionRoute = (url: string) => url.includes("/api/extension/");
const isExtensionOrigin = (origin: string) =>
  origin.startsWith("chrome-extension://");

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const origin = req.headers.get("origin") || "";
  const url = req.url;
  const isAllowedOrigin =
    allowedOrigins.includes(origin) ||
    (isExtensionRoute(url) && isExtensionOrigin(origin));

  if (req.method === "OPTIONS") {
    const headers = new Headers(corsHeaders);
    if (isAllowedOrigin) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    return new NextResponse(null, { status: 200, headers });
  }

  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const hasSandboxUser = Boolean(process.env.SANDBOX_CLERK_USER_ID);
      const attempted = Boolean(req.cookies.get("sandbox_auth_attempted"));
      if (hasSandboxUser && !attempted) {
        const redirectTarget = `${req.nextUrl.pathname}${req.nextUrl.search}`;
        const sandboxAuthUrl = req.nextUrl.clone();
        sandboxAuthUrl.pathname = "/sandbox-auth";
        sandboxAuthUrl.searchParams.set("redirect", redirectTarget);
        return NextResponse.redirect(sandboxAuthUrl);
      }
      await auth.protect();
    }
  }

  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

export default clerkHandler;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
