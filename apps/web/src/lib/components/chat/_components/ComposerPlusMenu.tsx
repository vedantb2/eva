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
} from "@conductor/ui";
import {
  IconFile,
  IconPhoto,
  IconSparkles,
  IconFileText,
} from "@tabler/icons-react";
import type { Doc, Id } from "@conductor/backend";
import type { ReactNode, RefObject } from "react";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import {
  IMAGE_ATTACHMENT_ACCEPT,
  chatAttachmentAccept,
  type ChatAttachmentMode,
} from "@/lib/components/chat/imageAttachments";

function docDescriptionPreview(doc: {
  description?: string;
  content: string;
}): string | undefined {
  const description = doc.description?.trim();
  if (description) return description;
  const content = doc.content.trim();
  return content || undefined;
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

interface ComposerPlusMenuProps {
  docs: Array<Doc<"docs">>;
  skills: Array<{
    _id: Id<"repoSkills">;
    title: string;
    description: string;
    available: boolean;
  }>;
  mentionRef: RefObject<MentionTextareaHandle | null>;
  attachmentMode: ChatAttachmentMode;
  /** Optional "Options" submenu (e.g. session capture/audit toggles). */
  optionsSubmenu?: ReactNode;
}

/**
 * Composer "+" action menu: optional session Options, attach/photos, and
 * Skills / Documents submenus that insert mention chips into the draft.
 */
export function ComposerPlusMenu({
  docs,
  skills,
  mentionRef,
  attachmentMode,
  optionsSubmenu,
}: ComposerPlusMenuProps) {
  const attachments = usePromptInputAttachments();
  const availableSkills = skills.filter((skill) => skill.available);
  const fileAccept = chatAttachmentAccept(attachmentMode);

  return (
    <PromptInputActionMenu>
      <PromptInputActionMenuTrigger aria-label="Add to message" />
      <PromptInputActionMenuContent className="min-w-52">
        {optionsSubmenu}
        {optionsSubmenu ? <DropdownMenuSeparator /> : null}

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            openFilePicker(fileAccept, (files) => attachments.add(files));
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
          <DropdownMenuSubContent className="min-w-48 max-h-64 overflow-y-auto">
            {availableSkills.length === 0 ? (
              <DropdownMenuItem disabled>No available skills</DropdownMenuItem>
            ) : (
              availableSkills.map((skill) => (
                <DropdownMenuItem
                  key={skill._id}
                  onSelect={() => {
                    mentionRef.current?.insertSkill({
                      id: skill._id,
                      label: skill.title,
                      description: skill.description,
                    });
                  }}
                >
                  <span className="truncate">{skill.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconFileText className="mr-2 size-4" />
            Documents
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-48 max-h-64 overflow-y-auto">
            {docs.length === 0 ? (
              <DropdownMenuItem disabled>No documents</DropdownMenuItem>
            ) : (
              docs.map((doc) => (
                <DropdownMenuItem
                  key={doc._id}
                  onSelect={() => {
                    mentionRef.current?.insertMention({
                      id: doc._id,
                      label: doc.title,
                      description: docDescriptionPreview(doc),
                    });
                  }}
                >
                  <span className="truncate">{doc.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
  );
}
