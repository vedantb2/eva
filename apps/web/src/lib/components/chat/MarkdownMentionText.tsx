"use client";

import type { MouseEvent, ReactNode } from "react";
import { Children } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Streamdown } from "streamdown";
import {
  DocMentionChip,
  SkillMentionChip,
  UserMentionChip,
  isMentionTokenDocId,
  isSkillTokenId,
  MENTION_CHIP_CLASS,
  SKILL_CHIP_CLASS,
} from "@/lib/components/mentions";
import { useDocMentionNavigate } from "@/lib/useDocMentionNavigate";
import { remarkMentionChips, MENTION_HREF_REGEX } from "./remarkMentionChips";

interface MarkdownMentionTextProps {
  text: string;
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  className?: string;
  /**
   * What an `@` mention refers to in this context: a document (descriptions,
   * chat) or a user (comments). `/` is always a skill. Defaults to `doc`.
   */
  atKind?: "doc" | "user";
}

/** Flatten a markdown link's React children back to its plain label text. */
function childrenToText(children: ReactNode): string {
  let out = "";
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      out += String(child);
    }
  });
  return out;
}

/**
 * Renders Markdown content while turning `@[Label](id)` / `/[Label](id)` mention
 * tokens into the same doc/user/skill chips used elsewhere. Markdown formatting
 * (bold, lists, code, etc.) and inline mentions both work.
 */
export function MarkdownMentionText({
  text,
  repoBasePath,
  className,
  atKind = "doc",
}: MarkdownMentionTextProps) {
  const navigate = useNavigate();
  const navigateToDocById = useDocMentionNavigate(repoBasePath);

  return (
    <Streamdown
      className={className}
      remarkPlugins={[remarkMentionChips]}
      components={{
        a: ({ href, children }) => {
          const match =
            typeof href === "string" ? href.match(MENTION_HREF_REGEX) : null;

          if (!match) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          }

          const prefix = match[1];
          const id = match[2];
          const label = childrenToText(children);

          // `/` → skill
          if (prefix === "slash") {
            const navigateToSkills = (e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              navigate({ to: `${repoBasePath}/settings/skills` });
            };
            if (isSkillTokenId(id)) {
              return (
                <SkillMentionChip
                  skillId={id}
                  label={label}
                  onClick={navigateToSkills}
                />
              );
            }
            return (
              <button
                type="button"
                onClick={navigateToSkills}
                className={`${SKILL_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
              >
                /{label}
              </button>
            );
          }

          // `@` → user (comments) or doc (descriptions/chat)
          if (atKind === "user") {
            return <UserMentionChip userId={id} label={label} />;
          }

          const navigateToDoc = (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMentionTokenDocId(id)) {
              void navigateToDocById(id);
            }
          };
          if (isMentionTokenDocId(id)) {
            return (
              <DocMentionChip
                docId={id}
                label={label}
                onClick={navigateToDoc}
              />
            );
          }
          return (
            <button
              type="button"
              onClick={navigateToDoc}
              className={`${MENTION_CHIP_CLASS} cursor-pointer transition-[background-color] hover:bg-primary/20`}
            >
              @{label}
            </button>
          );
        },
      }}
    >
      {text}
    </Streamdown>
  );
}
