"use client";

import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@eva/ui";
import { IconCheck, IconTag, IconX } from "@tabler/icons-react";

interface QuickTaskTagsPickerProps {
  /** Every tag already used in this repo. */
  allTags: string[];
  selectedTags: string[];
  /**
   * Search text lives in the parent so `resetForm` can clear it along with the
   * rest of the composer.
   */
  tagSearch: string;
  onTagSearchChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
}

/**
 * Tag trigger, search/create palette and the selected-tag chips for the
 * quick-task modal. Chips are quiet (border + muted text) so a task with six
 * tags does not turn the control strip into a colour field.
 */
export function QuickTaskTagsPicker({
  allTags,
  selectedTags,
  tagSearch,
  onTagSearchChange,
  onToggleTag,
  onAddCustomTag,
}: QuickTaskTagsPickerProps) {
  const selected = new Set(selectedTags);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground"
          >
            <IconTag size={14} />
            {selectedTags.length > 0 ? (
              <span className="text-foreground">
                {selectedTags.length} tag
                {selectedTags.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span>Tags</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
          <Command>
            <CommandInput
              placeholder="Search or create tag..."
              value={tagSearch}
              onValueChange={onTagSearchChange}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && tagSearch.trim()) {
                  e.preventDefault();
                  onAddCustomTag(tagSearch);
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {tagSearch.trim() ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-2 font-normal"
                    onClick={() => onAddCustomTag(tagSearch)}
                  >
                    Create &quot;{tagSearch.trim()}&quot;
                  </Button>
                ) : (
                  "No tags"
                )}
              </CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => onToggleTag(tag)}
                  >
                    <IconTag size={14} className="text-muted-foreground" />
                    {tag}
                    {selected.has(tag) && (
                      <IconCheck size={14} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="ml-1 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="quiet" className="h-5 gap-0.5 pr-0.5">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="ml-0.5 size-4 rounded-full text-muted-foreground [&_svg]:size-3"
                aria-label={`Remove ${tag}`}
                onClick={() => onToggleTag(tag)}
              >
                <IconX />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
