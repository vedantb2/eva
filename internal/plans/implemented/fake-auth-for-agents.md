# Fake Auth for AI Agents (Next.js + Clerk)

Auto-sign in an AI agent as a Clerk user in development. Navigate to `/?agent` to trigger auto sign-in. Normal `/` still shows the regular login page.

## Prerequisites

- Next.js app with Clerk authentication
- A Clerk user ID for the agent to sign in as

## Env vars

```
AGENT_CLERK_USER_ID=user_xxxxxxxxxxxxx
```

That's it. The presence of this env var enables the feature.

## How it works

1. **Middleware** detects unauthenticated request to `/?agent` + `AGENT_CLERK_USER_ID` is set → redirects to `/api/auth/agent-login`
2. **API route** creates a short-lived Clerk sign-in token for that user → redirects to `/agent-callback?ticket=...`
3. **Callback page** uses Clerk's client-side `signIn.create({ strategy: "ticket" })` to exchange the ticket for a session → redirects to `/home`

The callback page is needed because Clerk's ticket strategy requires client-side JavaScript (`useSignIn` hook) — it can't be completed server-side.

## Files to create/modify

### 1. Env var definition

Add `AGENT_CLERK_USER_ID` to your server env schema (t3-env, or wherever you validate env vars):

```ts
AGENT_CLERK_USER_ID: z.string().optional(),
```

### 2. Middleware (modify existing)

In your Clerk middleware, add this check before any auth redirects:

```ts
if (
  req.nextUrl.pathname === "/" &&
  !userId &&
  req.nextUrl.searchParams.has("agent") &&
  serverEnv.AGENT_CLERK_USER_ID
) {
  const loginUrl = new URL("/api/auth/agent-login", req.url);
  return NextResponse.redirect(loginUrl);
}
```

Also add `/agent-callback(.*)` to your public routes so the callback page is accessible without auth.

### 3. API route — `app/api/auth/agent-login/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Agent login is only available in development" },
      { status: 403 },
    );
  }

  const AGENT_CLERK_USER_ID = process.env.AGENT_CLERK_USER_ID;

  if (!AGENT_CLERK_USER_ID) {
    return NextResponse.json(
      { error: "AGENT_CLERK_USER_ID must be configured" },
      { status: 500 },
    );
  }

  const clerk = await clerkClient();
  const { token } = await clerk.signInTokens.createSignInToken({
    userId: AGENT_CLERK_USER_ID,
    expiresInSeconds: 60,
  });

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const callbackUrl = new URL("/agent-callback", `${proto}://${host}`);
  callbackUrl.searchParams.set("ticket", token);

  return NextResponse.redirect(callbackUrl, 302);
}
```

### 4. Callback page — `app/agent-callback/page.tsx`

```tsx
import { Suspense } from "react";
import { AgentCallback } from "./AgentCallback";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Signing in...</p>
        </div>
      }
    >
      <AgentCallback />
    </Suspense>
  );
}
```

### 5. Callback client component — `app/agent-callback/AgentCallback.tsx`

```tsx
"use client";

import { useSignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AgentCallback() {
  const { signIn, setActive } = useSignIn();
  const searchParams = useSearchParams();
  const router = useRouter();
  const consumed = useRef(false);

  useEffect(() => {
    const ticket = searchParams.get("ticket");
    if (!ticket || !signIn || consumed.current) return;
    consumed.current = true;

    signIn
      .create({ strategy: "ticket", ticket })
      .then((result) => {
        if (result.createdSessionId) {
          return setActive({ session: result.createdSessionId }).then(() => {
            router.replace("/home");
          });
        }
      })
      .catch((err: Error) => {
        console.error("Agent sign-in failed:", err);
      });
  }, [signIn, setActive, searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
```

## Security

- The API route is gated to `NODE_ENV !== "development"` so it can never run in production
- The sign-in token expires after 60 seconds
- No secrets needed — `AGENT_CLERK_USER_ID` is not sensitive (it's a Clerk user ID, not a key)
