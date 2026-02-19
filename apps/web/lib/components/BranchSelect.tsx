"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { IconGitBranch, IconLoader2 } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useBranches } from "@/lib/hooks/useBranches";

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-8 px-2 text-sm text-muted-foreground">
        <IconLoader2 size={14} className="animate-spin" />
        <span>Loading branches...</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className ?? "h-8 text-sm"}>
        <SelectValue>
          <div className="flex items-center gap-1.5">
            <IconGitBranch size={14} className="text-muted-foreground" />
            <span>{value}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64 overflow-auto scrollbar">
        {branches.map((branch) => (
          <SelectItem key={branch.name} value={branch.name}>
            <div className="flex items-center gap-1.5">
              <IconGitBranch size={14} className="text-muted-foreground" />
              {branch.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
