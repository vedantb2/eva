"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@conductor/ui";
import { IconFolder, IconSelector } from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { repoHref } from "@/lib/utils/repoUrl";

interface AppSwitcherProps {
  apps: Doc<"githubRepos">[];
  currentValue: string | null;
  onValueChange: (value: string) => void;
  className?: string;
}

export function AppSwitcher({
  apps,
  currentValue,
  onValueChange,
  className,
}: AppSwitcherProps) {
  const selectedApp = apps.find(
    (a) => repoHref(a.owner, a.name, a.rootDirectory) === currentValue,
  );

  const displayLabel = selectedApp
    ? (selectedApp.rootDirectory?.split("/").pop() ?? selectedApp.name)
    : "Select an app";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <IconFolder size={16} className="text-muted-foreground" />
          <span className="flex-1 truncate text-left text-sm font-medium">
            {displayLabel}
          </span>
          <IconSelector size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-auto scrollbar">
        {apps.map((app) => {
          const href = repoHref(app.owner, app.name, app.rootDirectory);
          const label = app.rootDirectory?.split("/").pop() ?? app.name;
          return (
            <DropdownMenuItem
              key={app._id}
              className={href === currentValue ? "bg-accent/80" : ""}
              onSelect={() => onValueChange(href)}
            >
              <IconFolder size={16} className="text-muted-foreground" />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
