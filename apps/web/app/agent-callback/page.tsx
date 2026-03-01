"use client";

import { useSignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface FapiSignInResponse {
  response?: {
    created_session_id?: string;
  };
  client?: {
    sessions?: Array<{
      id: string;
    }>;
  };
}

function getClerkFapiUrl(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  const encoded = key.split("_").pop();
  if (!encoded) return null;
  try {
    const decoded = atob(encoded);
    return `https://${decoded.replace(/\$$/, "")}`;
  } catch {
    return null;
  }
}

export default function AgentCallbackPage() {
  const { setActive, isLoaded } = useSignIn();
  const searchParams = useSearchParams();
  const router = useRouter();
  const consumed = useRef(false);

  useEffect(() => {
    const ticket = searchParams.get("ticket");
    if (!ticket || !isLoaded || !setActive || consumed.current) return;
    consumed.current = true;

    const fapiUrl = getClerkFapiUrl();
    if (!fapiUrl) return;

    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

    fetch(`${fapiUrl}/v1/client/sign_ins?_clerk_js_version=5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: publishableKey,
      },
      body: `strategy=ticket&ticket=${ticket}`,
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`FAPI error: ${res.status}`);
        return res.json();
      })
      .then((data: FapiSignInResponse) => {
        const sessionId =
          data.response?.created_session_id ?? data.client?.sessions?.[0]?.id;
        if (!sessionId) throw new Error("No session in FAPI response");
        return setActive({ session: sessionId });
      })
      .then(() => {
        router.replace("/home");
      })
      .catch((err: Error) => {
        console.error("Agent sign-in failed:", err);
      });
  }, [isLoaded, setActive, searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
