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
