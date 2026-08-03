"use client";

import { useState, type ReactNode, type RefObject } from "react";
import {
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  SearchInput,
  usePromptInputAttachments,
} from "@eva/ui";
import {
  IconFile,
  IconPhoto,
  IconSparkles,
  IconDatabase,
} from "@tabler/icons-react";
import { UserInitials } from "@eva/shared";
import type { Id } from "@eva/backend";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import type { MentionItem } from "@/lib/components/mentions";
import {
  IMAGE_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_ACCEPT,
} from "@/lib/components/chat/imageAttachments";

function previewOneLine(text: string, maxLength = 72): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1)}…`;
}

function matchesQuery(
  query: string,
  label: string,
  description?: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return true;
  if (label.toLowerCase().includes(q)) return true;
  if (description?.toLowerCase().includes(q)) return true;
  return false;
}

/** Matches MentionEditor picker rows: `/` or `@` + title, badge, description. */
function MentionMenuRow({
  prefix,
  label,
  description,
  badge,
  personUserId,
}: {
  prefix: "/" | "@";
  label: string;
  description?: string;
  badge?: string;
  personUserId?: Id<"users">;
}) {
  if (personUserId !== undefined) {
    return (
      <span className="flex w-full min-w-0 items-center gap-2">
        <UserInitials userId={personUserId} size="sm" hideLastSeen />
        <span data-pii className="min-w-0 flex-1 truncate">
          {label}
        </span>
        {badge ? (
          <span className="shrink-0 rounded-control border border-border bg-muted px-1.5 py-0.5 text-3xs font-medium leading-none text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </span>
    );
  }

  const detail = description ? previewOneLine(description) : null;
  return (
    <span className="flex min-w-0 w-full flex-col gap-0.5 overflow-hidden">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
          <span className="shrink-0 text-muted-foreground">{prefix}</span>
          <span className="truncate">{label}</span>
        </span>
        {badge ? (
          <span className="shrink-0 rounded-control border border-border bg-muted px-1.5 py-0.5 text-3xs font-medium leading-none text-muted-foreground">
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

/** Sticky search field for plus-menu sublists (keeps typing out of Radix key handling). */
function SubmenuSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-popover p-1.5">
      <SearchInput
        value={value}
        onChange={onChange}
        onClear={() => onChange("")}
        placeholder={placeholder}
        className="max-w-none"
        inputClassName="h-8"
        autoFocus
        onKeyDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
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

interface ComposerPlusMenuProps {
  dataItems: MentionItem[];
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
  const [skillsQuery, setSkillsQuery] = useState("");
  const [dataQuery, setDataQuery] = useState("");

  const filteredSkills = availableSkills.filter((skill) =>
    matchesQuery(skillsQuery, skill.title, skill.description),
  );
  const filteredData = dataItems.filter((item) =>
    matchesQuery(dataQuery, item.label, item.description),
  );

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

        <DropdownMenuSub
          onOpenChange={(open) => {
            if (!open) setSkillsQuery("");
          }}
        >
          <DropdownMenuSubTrigger>
            <IconSparkles className="mr-2 size-4" />
            Skills
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="flex max-h-72 min-w-56 max-w-72 flex-col overflow-hidden p-0">
            {availableSkills.length === 0 ? (
              <DropdownMenuItem disabled className="m-1.5">
                No available skills
              </DropdownMenuItem>
            ) : (
              <>
                <SubmenuSearch
                  value={skillsQuery}
                  onChange={setSkillsQuery}
                  placeholder="Search skills…"
                />
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {filteredSkills.length === 0 ? (
                    <DropdownMenuItem disabled>No matching skills</DropdownMenuItem>
                  ) : (
                    filteredSkills.map((skill) => (
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
                </div>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub
          onOpenChange={(open) => {
            if (!open) setDataQuery("");
          }}
        >
          <DropdownMenuSubTrigger>
            <IconDatabase className="mr-2 size-4" />
            Data
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="flex max-h-72 min-w-56 max-w-72 flex-col overflow-hidden p-0">
            {dataItems.length === 0 ? (
              <DropdownMenuItem disabled className="m-1.5">
                No data to mention
              </DropdownMenuItem>
            ) : (
              <>
                <SubmenuSearch
                  value={dataQuery}
                  onChange={setDataQuery}
                  placeholder="Search data…"
                />
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {filteredData.length === 0 ? (
                    <DropdownMenuItem disabled>No matching data</DropdownMenuItem>
                  ) : (
                    filteredData.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        className="items-start py-2"
                        onSelect={() => {
                          mentionRef.current?.insertMention({
                            id: item.id,
                            label: item.label,
                            description: item.description,
                            badge: item.badge,
                            personUserId: item.personUserId,
                          });
                        }}
                      >
                        <MentionMenuRow
                          prefix="@"
                          label={item.label}
                          description={item.description}
                          badge={item.badge}
                          personUserId={item.personUserId}
                        />
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
  );
}
