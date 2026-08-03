"use client";

import { Badge, Button, Spinner } from "@eva/ui";
import {
  IconAlertCircle,
  IconCheck,
  IconFolders,
  IconPlus,
  IconTerminal2,
} from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import type { DetectedApp } from "../../MonorepoClient";

export function DetectedAppsSection({
  owner,
  name,
  loading,
  error,
  detected,
  connectedPaths,
  addingPath,
  onAdd,
}: {
  owner: string;
  name: string;
  loading: boolean;
  error: string | null;
  detected: ReadonlyArray<DetectedApp>;
  connectedPaths: Set<string | undefined>;
  addingPath: string | null;
  onAdd: (path: string) => void;
}) {
  return (
    <SettingsSection
      title="Detected apps"
      description={
        <>
          Found in{" "}
          <span className="font-medium text-foreground">
            {owner}/{name}
          </span>
          . Add one as a separate codebase.
        </>
      }
      bodyVariant="list"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner size="md" />
          <p className="text-sm text-muted-foreground">
            Scanning workspace configuration...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <IconAlertCircle size={20} className="shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Detection failed
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : detected.length === 0 ? (
        <SettingsEmptyState
          icon={IconFolders}
          title="No workspace apps detected"
          description="This repository has no monorepo workspace configuration (package.json workspaces or pnpm-workspace.yaml)."
        />
      ) : (
        <div className="divide-y divide-border">
          {detected.map((app) => {
            const isConnected = connectedPaths.has(app.path);
            const isAdding = addingPath === app.path;

            return (
              <div
                key={app.path}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <IconFolders
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.name}
                    </p>
                    {app.hasDevScript && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <IconTerminal2 size={10} />
                        dev
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {app.path}
                  </p>
                </div>
                {isConnected ? (
                  <Badge variant="outline" className="gap-1">
                    <IconCheck size={12} />
                    Added
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isAdding}
                    onClick={() => onAdd(app.path)}
                    className="motion-press"
                  >
                    {isAdding ? <Spinner size="sm" /> : <IconPlus size={14} />}
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SettingsSection>
  );
}
