import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/agent-callback(.*)",
]);

const KNOWN_SUB_PAGES = new Set([
  "projects",
  "design",
  "docs",
  "sessions",
  "quick-tasks",
  "analyse",
  "settings",
  "testing-arena",
]);

export const proxy = clerkMiddleware(
  async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();

    if (
      req.nextUrl.pathname === "/" &&
      !userId &&
      req.nextUrl.searchParams.has("agent")
    ) {
      const secret = process.env.AGENT_AUTH_SECRET;
      if (secret) {
        const loginUrl = new URL("/api/auth/agent-login", req.url);
        loginUrl.searchParams.set("secret", secret);
        return NextResponse.redirect(loginUrl);
      }
    }

    if (req.nextUrl.pathname === "/" && userId) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    if (!isPublicRoute(req) && !userId) {
      return redirectToSignIn();
    }

    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 3 &&
      segments[0] !== "api" &&
      !KNOWN_SUB_PAGES.has(segments[2])
    ) {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname =
        "/" +
        segments[0] +
        "/" +
        segments[1] +
        "--" +
        segments[2] +
        (segments.length > 3 ? "/" + segments.slice(3).join("/") : "");
      return NextResponse.rewrite(rewriteUrl);
    }
  },
  { clockSkewInMs: 60000 },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
