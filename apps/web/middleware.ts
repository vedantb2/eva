import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();

    // Redirect authenticated users from landing page to home
    if (req.nextUrl.pathname === "/" && userId) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect non-public routes
    if (!isPublicRoute(req) && !userId) {
      return redirectToSignIn();
    }
  },
  { clockSkewInMs: 60000 }, // Allow 60 seconds of clock skew
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
