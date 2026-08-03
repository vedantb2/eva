"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@eva/ui";
import { IconTags } from "@tabler/icons-react";

interface ProjectTagsPopoverProps {
  tags: string[] | undefined;
  onUpdate: (tags: string[]) => void;
}

export function ProjectTagsPopover({
  tags,
  onUpdate,
}: ProjectTagsPopoverProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTags = tags ?? [];

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value || currentTags.includes(value)) return;
    onUpdate([...currentTags, value]);
  };

  const removeTag = (tag: string) => {
    onUpdate(currentTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
      e.preventDefault();
      addTag(draft);
      setDraft("");
    }
    if (e.key === "Backspace" && draft === "" && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`h-8 rounded-control gap-1.5 px-2 text-2sm shrink-0 ${currentTags.length === 0 ? "text-muted-foreground" : ""}`}
        >
          <IconTags size={14} className="text-muted-foreground shrink-0" />
          <span>
            {currentTags.length > 0
              ? `${currentTags.length} tag${currentTags.length > 1 ? "s" : ""}`
              : "Tags"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {currentTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs h-5 gap-0.5 pr-0.5"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-auto rounded-control p-0 opacity-50 hover:bg-transparent hover:opacity-100 ml-0.5 px-0.5"
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            ref={inputRef}
            value={draft}
            placeholder="Add tag..."
            className="h-7 text-2sm"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim()) {
                addTag(draft);
                setDraft("");
              }
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
