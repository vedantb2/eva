import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/agent-callback(.*)",
]);

export default clerkMiddleware(
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

    // Redirect authenticated users from landing page to home
    if (req.nextUrl.pathname === "/" && userId) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect non-public routes
    if (!isPublicRoute(req) && !userId) {
      return redirectToSignIn();
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
