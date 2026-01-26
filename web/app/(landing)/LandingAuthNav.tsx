"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";

export function LandingAuthNav() {
  return (
    <div className="flex items-center gap-3">
      <Unauthenticated>
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            Get Started
          </button>
        </SignUpButton>
      </Unauthenticated>
      <Authenticated>
        <Link
          href="/repos"
          className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Dashboard
        </Link>
        <UserButton />
      </Authenticated>
    </div>
  );
}
