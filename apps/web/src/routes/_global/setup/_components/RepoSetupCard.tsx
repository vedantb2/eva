import { Button, StatusDot } from "@eva/ui";
import {
  IconBrandGithub,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
}

interface RepoSetupCardProps {
  repo: GitHubRepo;
  isExpanded: boolean;
  isAdded: boolean;
  onToggleExpand: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}

export function RepoSetupCard({
  repo,
  isExpanded,
  isAdded,
  onToggleExpand,
  onAdd,
  children,
}: RepoSetupCardProps) {
  return (
    <div className="overflow-hidden rounded-surface border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <IconBrandGithub
            size={18}
            className="shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="truncate text-2sm font-medium text-foreground">
              {repo.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {repo.owner}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdded ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StatusDot tone="done" size="sm" />
              <span className="hidden sm:inline">Added</span>
            </span>
          ) : (
            <Button size="sm" onClick={onAdd}>
              Add
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Hide apps" : "Show apps"}
          >
            {isExpanded ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Nested content steps to `bg-muted` and is separated by a hairline —
          previously an `mt-6` left a bare band above the panel. */}
      {isExpanded && (
        <div className="space-y-2 border-t border-border bg-muted/40 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
