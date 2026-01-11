import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/demo(.*)",
  "/register(.*)",
  "/login(.*)",
  "/about(.*)",
  "/",
  "/waitlist(.*)",
  "/api(.*)",
  "/privacy(.*)",
]);

const allowedOrigins = [
  "https://vibot.projectv.uk",
  "https://verve-git-staging-vedantb.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://localhost:3001",
];

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export default clerkMiddleware(async (auth, req) => {
  const origin = req.headers.get("origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  console.log(`🔍 Middleware: ${req.method} ${req.url}`);
  console.log(`🌐 Origin: ${origin}, Allowed: ${isAllowedOrigin}`);

  // Handle preflight OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    console.log("✈️ Handling OPTIONS preflight request");
    const headers = new Headers(corsHeaders);
    if (isAllowedOrigin) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    return new NextResponse(null, { status: 200, headers });
  }

  // Continue with Clerk authentication for non-OPTIONS requests
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Create response and add CORS headers
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    console.log("✅ Added CORS Origin header");
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  console.log("📤 Response headers:", Array.from(response.headers.entries()));
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
