"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Input,
} from "@eva/ui";
import { IconChevronDown, IconX } from "@tabler/icons-react";

interface TaskLabelsFieldProps {
  tags: string[];
  /** Every tag used anywhere in the repo, for the pick-from-existing menu. */
  allTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

/**
 * Labels value of the task properties rail: the current chips, a borderless
 * free-text input that commits on Enter/comma/blur, and a menu of existing
 * repo tags. Clicking anywhere in the block focuses the input, so the whole
 * value area behaves like one field.
 */
export function TaskLabelsField({
  tags,
  allTags,
  onAddTag,
  onRemoveTag,
}: TaskLabelsFieldProps) {
  const [tagDraft, setTagDraft] = useState("");
  const tagDraftRef = useRef<HTMLInputElement>(null);

  const commitDraft = () => {
    if (tagDraft.trim()) {
      onAddTag(tagDraft);
      setTagDraft("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
      e.preventDefault();
      commitDraft();
    }
    if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const tagSet = new Set(tags);

  return (
    <div
      className="flex min-h-8 flex-wrap items-center gap-1 rounded-control px-1.5 transition-colors hover:bg-muted/60 cursor-text"
      onClick={() => tagDraftRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Badge key={tag} variant="quiet" className="h-5 gap-0.5 pr-0.5">
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="ml-0.5 size-4 rounded-full text-muted-foreground [&_svg]:size-3"
            aria-label={`Remove ${tag}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTag(tag);
            }}
          >
            <IconX />
          </Button>
        </Badge>
      ))}
      <Input
        ref={tagDraftRef}
        value={tagDraft}
        placeholder={tags.length === 0 ? "None" : "Add label..."}
        className="h-6 min-w-16 flex-1 border-0 bg-transparent px-0 text-2sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        onChange={(e) => setTagDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={handleTagKeyDown}
      />
      {allTags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-5 shrink-0"
              aria-label="Pick an existing label"
              onClick={(e) => e.stopPropagation()}
            >
              <IconChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-56 overflow-y-auto">
            {allTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={tagSet.has(tag)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onAddTag(tag);
                  } else {
                    onRemoveTag(tag);
                  }
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
