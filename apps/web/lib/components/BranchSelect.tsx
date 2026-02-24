"use client";

import { useState } from "react";
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
}

export function BranchSelect({
  value,
  onValueChange,
  className,
}: BranchSelectProps) {
  const { repo } = useRepo();
  const { branches, isLoading } = useBranches(
    repo.owner,
    repo.name,
    repo.installationId,
  );
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-8 px-2 text-sm text-muted-foreground">
        <IconLoader2 size={14} className="animate-spin" />
        <span>Loading branches...</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className ?? "h-8 text-sm")}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <IconGitBranch
              size={14}
              className="text-muted-foreground shrink-0"
            />
            <span className="truncate">{value}</span>
          </div>
          <IconChevronDown size={14} className="ml-2 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search branches..." />
          <CommandList
            className="max-h-[300px]"
            onWheel={(e) => e.stopPropagation()}
          >
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
                  <IconGitBranch size={14} className="text-muted-foreground" />
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
