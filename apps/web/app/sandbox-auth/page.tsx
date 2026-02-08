"use client";

import { Suspense } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function SandboxAuth() {
  const { signIn, setActive } = useSignIn();
  const searchParams = useSearchParams();
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !signIn || !setActive) return;
    const ticket = searchParams.get("ticket");
    const redirect = searchParams.get("redirect") || "/";
    if (!ticket) return;
    attempted.current = true;

    signIn
      .create({ strategy: "ticket", ticket })
      .then((result) => {
        if (result.status === "complete" && result.createdSessionId) {
          return setActive({ session: result.createdSessionId }).then(() => {
            router.replace(redirect);
          });
        }
      })
      .catch((err) => {
        console.error("Sandbox auth failed:", err);
      });
  }, [signIn, setActive, searchParams, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <p>Signing in...</p>
    </div>
  );
}

export default function SandboxAuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <p>Loading...</p>
        </div>
      }
    >
      <SandboxAuth />
    </Suspense>
  );
}
