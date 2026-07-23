"use client";

import type { MouseEvent } from "react";
import { IconLink } from "@tabler/icons-react";
import { MENTION_CHIP_CLASS } from "./mentionChipStyles";
import { linkLabel, linkProvider } from "./linkChipUtils";
import { LinkProviderIcon } from "./linkProviderIcons";

interface LinkChipProps {
  url: string;
  /** Optional label override; defaults to the provider-derived label. */
  label?: string;
}

/**
 * Inline chip for a supported external link (Figma, GitHub, Linear, Sentry,
 * PostHog). Renders as a real anchor so clicking opens the URL in a new tab;
 * stops propagation so it never triggers a parent bubble/edit handler.
 */
export function LinkChip({ url, label }: LinkChipProps) {
  const provider = linkProvider(url);
  const stopPropagation = (e: MouseEvent<HTMLAnchorElement>) =>
    e.stopPropagation();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopPropagation}
      className={`${MENTION_CHIP_CLASS} gap-1 cursor-pointer transition-[background-color] hover:bg-primary/20`}
    >
      {provider ? (
        <LinkProviderIcon provider={provider} />
      ) : (
        <IconLink className="size-3 shrink-0" />
      )}
      {label ?? linkLabel(url)}
    </a>
  );
}
