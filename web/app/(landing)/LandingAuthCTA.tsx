"use client";

import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { IconArrowRight } from "@tabler/icons-react";

interface LandingAuthCTAProps {
  variant: "hero" | "bottom";
}

export function LandingAuthCTA({ variant }: LandingAuthCTAProps) {
  if (variant === "hero") {
    return (
      <>
        <Unauthenticated>
          <SignUpButton mode="modal">
            <button className="w-full sm:w-auto px-6 py-3 text-base font-medium bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
              Start Free <IconArrowRight className="w-4 h-4" />
            </button>
          </SignUpButton>
        </Unauthenticated>
        <Authenticated>
          <Link
            href="/repos"
            className="w-full sm:w-auto px-6 py-3 text-base font-medium bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Go to Dashboard <IconArrowRight className="w-4 h-4" />
          </Link>
        </Authenticated>
      </>
    );
  }

  return (
    <>
      <Unauthenticated>
        <SignUpButton mode="modal">
          <button className="px-8 py-4 text-lg font-medium bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors">
            Get Started for Free
          </button>
        </SignUpButton>
      </Unauthenticated>
      <Authenticated>
        <Link
          href="/repos"
          className="inline-block px-8 py-4 text-lg font-medium bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors"
        >
          Open Dashboard
        </Link>
      </Authenticated>
    </>
  );
}
