"use client";

import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@conductor/ui";
import { EVA_GITHUB_URL, LANDING_NAV_LINKS } from "./landingContent";

/**
 * Sticky hairline nav. Section links are anchors rather than router links —
 * they scroll the marketing page, they do not navigate.
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src="/icon.svg"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Eva
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LANDING_NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="motion-base rounded-control px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
          >
            <a
              href={EVA_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Eva on GitHub"
            >
              <IconBrandGithub size={18} />
            </a>
          </Button>
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Get started</Button>
          </SignUpButton>
        </div>
      </nav>
    </header>
  );
}
