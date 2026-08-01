import { IconBrandGithub } from "@tabler/icons-react";
import {
  EVA_GITHUB_URL,
  EVA_SETUP_URL,
  LANDING_NAV_LINKS,
} from "./landingContent";

/** Hairline footer: brand line, the same anchors as the nav, and the repository. */
export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.svg"
            alt=""
            width={20}
            height={20}
            className="size-5"
          />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Eva</span> — MIT
            licensed and free to self-host.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="motion-base text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href={EVA_SETUP_URL}
            target="_blank"
            rel="noreferrer"
            className="motion-base text-sm text-muted-foreground hover:text-foreground"
          >
            Self-host
          </a>
          <a
            href={EVA_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Eva on GitHub"
            className="motion-base text-muted-foreground hover:text-foreground"
          >
            <IconBrandGithub className="size-5" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
