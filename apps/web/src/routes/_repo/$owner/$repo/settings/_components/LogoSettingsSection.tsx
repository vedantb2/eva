"use client";

import { useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button } from "@conductor/ui";
import { IconPhoto } from "@tabler/icons-react";
import { useRepoLogoUpload } from "@/lib/hooks/useRepoLogoUpload";

/** Repo logo uploader shown on the App settings page. */
export function LogoSettingsSection({ repoId }: { repoId: Id<"githubRepos"> }) {
  const logoUrl = useQuery(api.githubRepos.getLogoUrl, { repoId });
  const { uploadLogo, removeLogo, uploading } = useRepoLogoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadLogo(repoId, file);
  };

  return (
    <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
      <div>
        <h3 className="text-sm font-medium">Logo</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Shown next to this app in the repo lists. Applies to this app only.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <IconPhoto size={20} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : logoUrl ? "Change" : "Upload"}
          </Button>
          {logoUrl && (
            <Button
              size="sm"
              variant="ghost"
              disabled={uploading}
              onClick={() => removeLogo(repoId)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoSelected}
      />
    </div>
  );
}
