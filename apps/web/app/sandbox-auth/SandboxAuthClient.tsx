"use client";

import { useClerk, useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

const ATTEMPT_COOKIE =
  "sandbox_auth_attempted=1; Max-Age=900; Path=/; SameSite=Lax";

function sanitizeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

function setAttemptCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ATTEMPT_COOKIE}${secure}`;
}

export function SandboxAuthClient({ ticket }: { ticket: string | null }) {
  // const { signIn, isLoaded } = useSignIn();
  // const clerk = useClerk();
  // const router = useRouter();
  // const searchParams = useSearchParams();
  // const hasRun = useRef(false);

  // const redirectTarget = useMemo(
  //   () => sanitizeRedirect(searchParams.get("redirect")),
  //   [searchParams],
  // );

  // useEffect(() => {
  //   if (hasRun.current || !isLoaded) return;
  //   hasRun.current = true;

  //   const run = async () => {
  //     try {
  //       if (ticket && signIn) {
  //         const result = await signIn.create({
  //           strategy: "ticket",
  //           ticket,
  //         });
  //         if (result.status === "complete" && result.createdSessionId) {
  //           await clerk.setActive({ session: result.createdSessionId });
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Sandbox auth exchange failed:", error);
  //     } finally {
  //       setAttemptCookie();
  //       router.replace(redirectTarget);
  //     }
  //   };

  //   void run();
  // }, [isLoaded, signIn, ticket, clerk, router, redirectTarget]);
  return null;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="ui-surface-strong w-full max-w-sm px-5 py-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Signing in to sandbox...
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          You will be redirected automatically.
        </p>
      </div>
    </main>
  );
}
