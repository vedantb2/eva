"use client";

import { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@conductor/ui";
import {
  IconGitBranch,
  IconLoader2,
  IconCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useBranches } from "@/lib/hooks/useBranches";
import { cn } from "@conductor/ui";

interface BranchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Override the repo used to fetch branches (defaults to current RepoContext). */
  repoOverride?: {
    owner: string;
    name: string;
    installationId: number;
  };
}

export function BranchSelect({
  value,
  onValueChange,
  className,
  disabled,
  placeholder = "Select a branch",
  repoOverride,
}: BranchSelectProps) {
  const { repo } = useRepo();
  const effectiveOwner = repoOverride?.owner ?? repo.owner;
  const effectiveName = repoOverride?.name ?? repo.name;
  const effectiveInstallationId =
    repoOverride?.installationId ?? repo.installationId;
  const [open, setOpen] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { branches, isLoading } = useBranches(
    effectiveOwner,
    effectiveName,
    effectiveInstallationId,
    shouldFetch,
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!isLoading && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isLoading]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [searchValue]);

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          setShouldFetch(true);
        } else {
          setSearchValue("");
        }
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className ?? "h-8 text-sm")}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <IconGitBranch
              size={14}
              className="text-muted-foreground shrink-0"
            />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </div>
          <IconChevronDown size={14} className="ml-2 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(320px,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search branches..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList
            ref={listRef}
            className="max-h-[300px]"
            onWheel={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <IconLoader2 size={14} className="animate-spin" />
                <span>Loading branches...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No branch found.</CommandEmpty>
                <CommandGroup>
                  {branches.map((branch) => (
                    <CommandItem
                      key={branch.name}
                      value={branch.name}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      <IconGitBranch
                        size={14}
                        className="text-muted-foreground"
                      />
                      {branch.name}
                      <IconCheck
                        size={14}
                        className={cn(
                          "ml-auto",
                          value === branch.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
