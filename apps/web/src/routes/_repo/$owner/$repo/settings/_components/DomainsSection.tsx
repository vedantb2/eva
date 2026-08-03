"use client";

import { useState } from "react";
import { Input, Button } from "@eva/ui";
import type { Id } from "@eva/backend";
import { IconPlus, IconX } from "@tabler/icons-react";
import { extractHostname } from "../_utils";
import { SettingsField } from "@/lib/components/settings/SettingsField";

type UpdateRepoConfig = (args: {
  repoId: Id<"githubRepos">;
  domains?: string[];
}) => void;

export function DomainsSection({
  repoId,
  domains,
  updateConfig,
}: {
  repoId: Id<"githubRepos">;
  domains: string[];
  updateConfig: UpdateRepoConfig;
}) {
  const [newDomain, setNewDomain] = useState("");

  const addDomain = () => {
    const raw = newDomain.trim().toLowerCase();
    if (!raw) return;
    const hostname = extractHostname(raw);
    if (domains.includes(hostname)) return;
    updateConfig({ repoId, domains: [...domains, hostname] });
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    updateConfig({ repoId, domains: domains.filter((d) => d !== domain) });
  };

  return (
    <SettingsField
      label="Domains"
      description="Hostnames for this app. The Chrome extension picks this repo when you visit them."
    >
      <div className="space-y-2">
        {domains.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {domains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 rounded-control border border-border pl-2 pr-0.5 text-xs text-foreground"
              >
                {domain}
                {/* icon-xs already carries the hit-target expansion this hand-rolled `after:` hack used to provide. */}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => removeDomain(domain)}
                  aria-label={`Remove ${domain}`}
                >
                  <IconX />
                </Button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            className="h-9 flex-1"
            placeholder="myapp.com or localhost:3000"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addDomain();
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={addDomain}
            disabled={!newDomain.trim()}
          >
            <IconPlus size={14} />
            Add
          </Button>
        </div>
      </div>
    </SettingsField>
  );
}
