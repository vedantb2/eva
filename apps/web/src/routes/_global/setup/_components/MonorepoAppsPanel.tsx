import { useState } from "react";
import { Button, Input, Spinner, StatusDot, Surface } from "@eva/ui";
import { IconFolder } from "@tabler/icons-react";

export interface MonorepoApp {
  name: string;
  path: string;
  hasDevScript: boolean;
}

interface MonorepoAppsPanelProps {
  apps: MonorepoApp[];
  isDetecting: boolean;
  addedRepos: Set<string>;
  repoFullName: string;
  onAddApp: (path: string) => void;
}

export function MonorepoAppsPanel({
  apps,
  isDetecting,
  addedRepos,
  repoFullName,
  onAddApp,
}: MonorepoAppsPanelProps) {
  const [customRootDir, setCustomRootDir] = useState("");

  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Spinner size="sm" />
        <span className="text-xs text-muted-foreground">
          Detecting workspace apps...
        </span>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        No workspace apps detected. This repo can be added as a single project.
      </p>
    );
  }

  return (
    <>
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Monorepo apps detected:
      </p>
      {apps.map((app) => {
        const key = `${repoFullName}:${app.path}`;
        return (
          <Surface
            key={app.path}
            density="none"
            className="flex items-center justify-between p-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <IconFolder size={16} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-2sm font-medium text-foreground">
                  {app.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {app.path}
                  {app.hasDevScript && " · has dev script"}
                </p>
              </div>
            </div>
            {addedRepos.has(key) ? (
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <StatusDot tone="done" size="sm" />
                Added
              </span>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => onAddApp(app.path)}
              >
                Add
              </Button>
            )}
          </Surface>
        );
      })}
      <div className="flex items-center gap-2 pt-2">
        <Input
          type="text"
          placeholder="Custom root directory..."
          value={customRootDir}
          onChange={(e) => setCustomRootDir(e.target.value)}
          className="h-8 flex-1 text-2sm"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!customRootDir.trim()}
          onClick={() => {
            onAddApp(customRootDir.trim());
            setCustomRootDir("");
          }}
        >
          Add
        </Button>
      </div>
    </>
  );
}
