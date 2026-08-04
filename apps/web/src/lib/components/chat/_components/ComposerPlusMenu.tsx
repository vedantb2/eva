"use client";

import {
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  usePromptInputAttachments,
} from "@eva/ui";
import {
  IconFile,
  IconPhoto,
  IconSparkles,
  IconDatabase,
} from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import type { ReactNode, RefObject } from "react";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import {
  IMAGE_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_ACCEPT,
} from "@/lib/components/chat/imageAttachments";

function previewOneLine(text: string, maxLength = 72): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1)}…`;
}

/** Matches MentionEditor picker rows: `/` or `@` + title, badge, description. */
function MentionMenuRow({
  prefix,
  label,
  description,
  badge,
}: {
  prefix: "/" | "@";
  label: string;
  description?: string;
  badge?: string;
}) {
  const detail = description ? previewOneLine(description) : null;
  return (
    <span className="flex min-w-0 w-full flex-col gap-0.5 overflow-hidden">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
          <span className="shrink-0 text-muted-foreground">{prefix}</span>
          <span className="truncate">{label}</span>
        </span>
        {badge ? (
          <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </span>
      {detail ? (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </span>
  );
}

function openFilePicker(accept: string, onFiles: (files: FileList) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.multiple = true;
  input.addEventListener("change", () => {
    if (input.files && input.files.length > 0) {
      onFiles(input.files);
    }
  });
  input.click();
}

interface DataMenuItem {
  id: string;
  label: string;
  badge: string;
  description?: string;
}

interface ComposerPlusMenuProps {
  dataItems: DataMenuItem[];
  skills: Array<{
    _id: Id<"repoSkills">;
    title: string;
    description: string;
    available: boolean;
  }>;
  mentionRef: RefObject<MentionTextareaHandle | null>;
  /** Optional "Options" submenu (e.g. session capture/audit toggles). */
  optionsSubmenu?: ReactNode;
}

/**
 * Composer "+" action menu: optional session Options, attach/photos, and
 * Skills / Data submenus that insert mention chips into the draft.
 */
export function ComposerPlusMenu({
  dataItems,
  skills,
  mentionRef,
  optionsSubmenu,
}: ComposerPlusMenuProps) {
  const attachments = usePromptInputAttachments();
  const availableSkills = skills.filter((skill) => skill.available);

  return (
    <PromptInputActionMenu>
      <PromptInputActionMenuTrigger aria-label="Add to message" />
      <PromptInputActionMenuContent className="min-w-52">
        {optionsSubmenu}
        {optionsSubmenu ? <DropdownMenuSeparator /> : null}

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            openFilePicker(CHAT_ATTACHMENT_ACCEPT, (files) =>
              attachments.add(files),
            );
          }}
        >
          <IconFile className="mr-2 size-4" />
          Attach files
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            openFilePicker(IMAGE_ATTACHMENT_ACCEPT, (files) =>
              attachments.add(files),
            );
          }}
        >
          <IconPhoto className="mr-2 size-4" />
          Add photos
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconSparkles className="mr-2 size-4" />
            Skills
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-56 max-w-72 max-h-64 overflow-y-auto">
            {availableSkills.length === 0 ? (
              <DropdownMenuItem disabled>No available skills</DropdownMenuItem>
            ) : (
              availableSkills.map((skill) => (
                <DropdownMenuItem
                  key={skill._id}
                  className="items-start py-2"
                  onSelect={() => {
                    mentionRef.current?.insertSkill({
                      id: skill._id,
                      label: skill.title,
                      description: skill.description,
                    });
                  }}
                >
                  <MentionMenuRow
                    prefix="/"
                    label={skill.title}
                    description={skill.description}
                  />
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconDatabase className="mr-2 size-4" />
            Data
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-56 max-w-72 max-h-64 overflow-y-auto">
            {dataItems.length === 0 ? (
              <DropdownMenuItem disabled>No data to mention</DropdownMenuItem>
            ) : (
              dataItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="items-start py-2"
                  onSelect={() => {
                    mentionRef.current?.insertMention({
                      id: item.id,
                      label: item.label,
                      description: item.description,
                      badge: item.badge,
                    });
                  }}
                >
                  <MentionMenuRow
                    prefix="@"
                    label={item.label}
                    description={item.description}
                    badge={item.badge}
                  />
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
  );
}
