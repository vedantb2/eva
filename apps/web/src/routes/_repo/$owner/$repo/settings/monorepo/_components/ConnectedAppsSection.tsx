"use client";

import { Button } from "@eva/ui";
import { IconEye, IconEyeOff, IconFolders } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import type { ConnectedApp } from "../../MonorepoClient";

export function ConnectedAppsSection({
  apps,
  onToggleHidden,
}: {
  apps: ReadonlyArray<ConnectedApp>;
  onToggleHidden: (repoId: Id<"githubRepos">, hidden: boolean) => void;
}) {
  return (
    <SettingsSection
      title="Connected apps"
      description="Hide apps without removing them."
      // Rows own their padding so the row divider spans the full width.
      bodyVariant="list"
    >
      <div className="divide-y divide-border">
        {apps.map((app) => (
          <div
            key={app._id}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <IconFolders
              size={18}
              className="shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {app.rootDirectory?.split("/").pop()}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {app.rootDirectory}
              </p>
            </div>
            <Button
              size="sm"
              variant={app.hidden ? "outline" : "ghost"}
              onClick={() => onToggleHidden(app._id, app.hidden !== true)}
              className="motion-press gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {app.hidden ? (
                <>
                  <IconEyeOff size={14} />
                  Hidden
                </>
              ) : (
                <>
                  <IconEye size={14} />
                  Visible
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
